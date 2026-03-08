const { Router } = require('express');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const pool = require('../db/pool');
const license = require('../services/license');
const adminAuth = require('../middleware/admin-auth');

const router = Router();

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

// In-memory download tokens (token → { productId, expiresAt })
// Short-lived (10 min), so license key never appears in URLs
const downloadTokens = new Map();
const TOKEN_TTL_MS = 10 * 60 * 1000;

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of downloadTokens) {
    if (data.expiresAt < now) downloadTokens.delete(token);
  }
}, 60_000);
const MAX_VERSIONS = 4;

/**
 * Sort version strings descending (newest first).
 * Handles vX.Y.Z format.
 */
function sortVersionsDesc(versions) {
  return versions.sort((a, b) => {
    const pa = a.replace(/^v/, '').split('.').map(Number);
    const pb = b.replace(/^v/, '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pb[i] || 0) - (pa[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

/**
 * Remove old versions beyond MAX_VERSIONS for a product.
 */
function enforceRetention(productDir) {
  if (!fs.existsSync(productDir)) return [];

  const versions = fs.readdirSync(productDir)
    .filter(f => fs.statSync(path.join(productDir, f)).isDirectory());

  const sorted = sortVersionsDesc(versions);
  const removed = [];

  while (sorted.length > MAX_VERSIONS) {
    const old = sorted.pop();
    const oldDir = path.join(productDir, old);
    fs.rmSync(oldDir, { recursive: true, force: true });
    removed.push(old);
    console.log(`Retention: ${path.basename(productDir)}/${old} geloescht (max ${MAX_VERSIONS} Versionen)`);
  }

  return removed;
}

/**
 * POST /api/releases/:product_id/:version/:platform
 * Upload a release binary. Admin-only.
 * Platform: linux, macos, windows
 * Body: raw binary (Content-Type: application/octet-stream)
 * Query: ?filename=Rechnung-Lokal-0.1.0.AppImage
 */
router.post('/api/releases/:product_id/:version/:platform', adminAuth, async (req, res) => {
  try {
    const { product_id, version, platform } = req.params;
    const filename = req.query.filename;

    if (!filename) {
      return res.status(400).json({ error: 'filename Query-Parameter fehlt' });
    }

    const validPlatforms = ['linux', 'macos', 'windows'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: `Ungueltige Plattform. Erlaubt: ${validPlatforms.join(', ')}` });
    }

    // Produkt pruefen
    const { rows } = await pool.query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Produkt nicht gefunden' });
    }

    // Verzeichnis erstellen
    const releaseDir = path.join(DOWNLOADS_DIR, product_id, version, platform);
    fs.mkdirSync(releaseDir, { recursive: true });

    // Alte Dateien im Verzeichnis loeschen (nur eine Datei pro Plattform+Version)
    const existing = fs.readdirSync(releaseDir);
    for (const f of existing) {
      fs.unlinkSync(path.join(releaseDir, f));
    }

    // Binary schreiben
    const filePath = path.join(releaseDir, filename);
    const writeStream = fs.createWriteStream(filePath);

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      const stats = fs.statSync(filePath);
      console.log(`Release uploaded: ${product_id}/${version}/${platform}/${filename} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

      // Retention-Policy: max 4 Versionen behalten
      const productDir = path.join(DOWNLOADS_DIR, product_id);
      const removed = enforceRetention(productDir);

      res.status(201).json({
        product_id,
        version,
        platform,
        filename,
        size: stats.size,
        removed_versions: removed,
      });
    });

    writeStream.on('error', (err) => {
      res.status(500).json({ error: err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/releases/:product_id
 * List available versions and platforms for a product. Public.
 */
router.get('/api/releases/:product_id', async (req, res) => {
  try {
    const productDir = path.join(DOWNLOADS_DIR, req.params.product_id);
    if (!fs.existsSync(productDir)) {
      return res.json({ product_id: req.params.product_id, versions: [] });
    }

    const versions = fs.readdirSync(productDir)
      .filter(f => fs.statSync(path.join(productDir, f)).isDirectory());

    const sorted = sortVersionsDesc(versions);

    const result = sorted.map(version => {
      const versionDir = path.join(productDir, version);
      const platforms = fs.readdirSync(versionDir)
        .filter(f => fs.statSync(path.join(versionDir, f)).isDirectory());

      return {
        version,
        platforms: platforms.map(platform => {
          const platformDir = path.join(versionDir, platform);
          const files = fs.readdirSync(platformDir);
          return {
            platform,
            filename: files[0] || null,
            size: files[0] ? fs.statSync(path.join(platformDir, files[0])).size : 0,
          };
        }),
      };
    });

    res.json({ product_id: req.params.product_id, versions: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/download-token
 * Creates a short-lived download token from a license key.
 * Key is sent in request body (not URL) for security.
 * Body: { key: "CFRL-XXXX-..." }
 * Returns: { token, productId, expiresIn }
 */
router.post('/api/download-token', async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'key fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const token = crypto.randomBytes(32).toString('hex');
    downloadTokens.set(token, {
      productId: lic.product_id,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });

    res.json({ token, productId: lic.product_id, expiresIn: TOKEN_TTL_MS / 1000 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/download/:product_id/:platform
 * Download release for a platform. Requires a valid download token.
 * Query: ?token=xxx&version=v1.0.0 (version optional, default: latest)
 */
router.get('/api/download/:product_id/:platform', async (req, res) => {
  try {
    const { product_id, platform } = req.params;
    const { token, version: requestedVersion } = req.query;

    if (!token) return res.status(400).json({ error: 'token Parameter fehlt' });

    const validPlatforms = ['linux', 'macos', 'windows'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ error: `Ungueltige Plattform. Erlaubt: ${validPlatforms.join(', ')}` });
    }

    // Token pruefen
    const tokenData = downloadTokens.get(token);
    if (!tokenData || tokenData.expiresAt < Date.now()) {
      downloadTokens.delete(token);
      return res.status(403).json({ error: 'Download-Token ungueltig oder abgelaufen' });
    }
    if (tokenData.productId !== product_id) {
      return res.status(403).json({ error: 'Token gehoert nicht zu diesem Produkt' });
    }

    // Versionen laden
    const productDir = path.join(DOWNLOADS_DIR, product_id);
    if (!fs.existsSync(productDir)) {
      return res.status(404).json({ error: 'Kein Download verfuegbar' });
    }

    const versions = fs.readdirSync(productDir)
      .filter(f => fs.statSync(path.join(productDir, f)).isDirectory());

    const sorted = sortVersionsDesc(versions);
    if (!sorted.length) {
      return res.status(404).json({ error: 'Kein Release verfuegbar' });
    }

    // Bestimmte oder neueste Version
    const searchVersions = requestedVersion
      ? sorted.filter(v => v === requestedVersion)
      : sorted;

    if (requestedVersion && !searchVersions.length) {
      return res.status(404).json({ error: `Version ${requestedVersion} nicht verfuegbar` });
    }

    for (const version of searchVersions) {
      const platformDir = path.join(productDir, version, platform);
      if (!fs.existsSync(platformDir)) continue;

      const files = fs.readdirSync(platformDir);
      if (!files.length) continue;

      const filePath = path.join(platformDir, files[0]);
      const stats = fs.statSync(filePath);

      res.setHeader('Content-Disposition', `attachment; filename="${files[0]}"`);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', 'application/octet-stream');

      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
      return;
    }

    res.status(404).json({ error: `Kein Release fuer Plattform ${platform} verfuegbar` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
