const { Router } = require('express');
const fs = require('node:fs');
const path = require('node:path');
const license = require('../services/license');
const pool = require('../db/pool');
const adminAuth = require('../middleware/admin-auth');
const { PRODUCT_PREFIXES, TRIAL_PREFIXES } = require('../services/license-keygen');

const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || '/data/downloads';

const router = Router();

// Simple in-memory rate limiter for key recovery
const recoverHits = new Map();
const RECOVER_MAX = 5;
const RECOVER_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRecoverRate(ip) {
  const now = Date.now();
  const cutoff = now - RECOVER_WINDOW_MS;
  const timestamps = (recoverHits.get(ip) || []).filter(t => t > cutoff);

  if (timestamps.length >= RECOVER_MAX) return false;

  timestamps.push(now);
  recoverHits.set(ip, timestamps);
  return true;
}

// Cleanup stale entries every hour (unref to not block process exit)
setInterval(() => {
  const cutoff = Date.now() - RECOVER_WINDOW_MS;
  for (const [ip, timestamps] of recoverHits) {
    const filtered = timestamps.filter(t => t > cutoff);
    if (filtered.length === 0) recoverHits.delete(ip);
    else recoverHits.set(ip, filtered);
  }
}, RECOVER_WINDOW_MS).unref();

/**
 * POST /api/license/validate
 * App sends license key for online validation (Stufe 2 + 3).
 * Accepts optional instanceId for device tracking.
 */
router.post('/api/license/validate', async (req, res) => {
  try {
    const { licenseKey, productId, appVersion, instanceId } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ valid: false, reason: 'missing_key' });
    }

    const result = await license.validateForApp(licenseKey, productId, instanceId || null);
    res.json(result);
  } catch (err) {
    console.error('License validation error:', err.message);
    res.status(500).json({ valid: false, reason: 'server_error' });
  }
});

/**
 * GET /api/license/recover?orderId=D123456789
 * Key recovery via Digistore24 order number. Rate-limited.
 */
router.get('/api/license/recover', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkRecoverRate(ip)) {
      return res.status(429).json({
        found: false,
        error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.',
      });
    }

    const { orderId } = req.query;
    if (!orderId || typeof orderId !== 'string' || orderId.trim().length === 0) {
      return res.status(400).json({ found: false, error: 'orderId Parameter fehlt' });
    }

    const result = await license.recoverByOrderId(orderId.trim());
    if (!result) {
      return res.json({ found: false });
    }

    res.json(result);
  } catch (err) {
    console.error('License recovery error:', err.message);
    res.status(500).json({ found: false, error: 'Interner Fehler' });
  }
});

/**
 * POST /api/admin/trial-key
 * Creates a 30-day trial license key. Admin-only (Bearer ADMIN_TOKEN).
 */
router.post('/api/admin/trial-key', adminAuth, async (req, res) => {
  try {
    const { productId, note } = req.body;

    if (!productId || !TRIAL_PREFIXES[productId]) {
      return res.status(400).json({
        error: 'Ungueltiges Produkt',
        validProducts: Object.keys(TRIAL_PREFIXES),
      });
    }

    const row = await license.createTrialLicense(productId, note);

    res.status(201).json({
      licenseKey: row.license_key,
      productId: row.product_id,
      expiresAt: row.expires_at,
      source: row.source,
      note: row.note,
    });
  } catch (err) {
    console.error('Trial key creation error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

// --- Public trial key endpoint ---

// Rate limiter: max 3 trial keys per IP per day
const trialHits = new Map();
const TRIAL_MAX = 3;
const TRIAL_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function checkTrialRate(ip) {
  const now = Date.now();
  const cutoff = now - TRIAL_WINDOW_MS;
  const timestamps = (trialHits.get(ip) || []).filter(t => t > cutoff);

  if (timestamps.length >= TRIAL_MAX) return false;

  timestamps.push(now);
  trialHits.set(ip, timestamps);
  return true;
}

// Cleanup stale trial rate entries every hour
setInterval(() => {
  const cutoff = Date.now() - TRIAL_WINDOW_MS;
  for (const [ip, timestamps] of trialHits) {
    const filtered = timestamps.filter(t => t > cutoff);
    if (filtered.length === 0) trialHits.delete(ip);
    else trialHits.set(ip, filtered);
  }
}, 60 * 60 * 1000).unref();

/**
 * POST /api/license/trial
 * Creates a 30-day trial license key. Public endpoint (no auth).
 * Rate-limited: max 3 per IP per 24h.
 *
 * Body: { productId }
 * Returns: { licenseKey, productId, expiresAt }
 */
router.post('/api/license/trial', async (req, res) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    if (!checkTrialRate(ip)) {
      return res.status(429).json({
        error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.',
      });
    }

    const { productId } = req.body;

    if (!productId || !TRIAL_PREFIXES[productId]) {
      return res.status(400).json({
        error: 'Ungueltiges Produkt',
        validProducts: Object.keys(TRIAL_PREFIXES),
      });
    }

    const row = await license.createAutoTrialLicense(productId);

    res.status(201).json({
      licenseKey: row.license_key,
      productId: row.product_id,
      expiresAt: row.expires_at,
    });
  } catch (err) {
    console.error('Auto-trial key creation error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

// --- Admin instance management ---

/**
 * GET /api/admin/license/:id/instances
 * Lists all instances for a license.
 */
router.get('/api/admin/license/:id/instances', adminAuth, async (req, res) => {
  try {
    const instances = await license.getInstances(parseInt(req.params.id, 10));
    res.json(instances);
  } catch (err) {
    console.error('Instance list error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

/**
 * DELETE /api/admin/license/:id/instances/:instanceId
 * Removes a specific instance from a license.
 */
router.delete('/api/admin/license/:id/instances/:instanceId', adminAuth, async (req, res) => {
  try {
    const result = await license.removeInstance(
      parseInt(req.params.id, 10),
      req.params.instanceId
    );
    res.json(result);
  } catch (err) {
    console.error('Instance removal error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

// --- Download validation ---

/**
 * Sort version strings descending (newest first).
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
 * POST /api/license/validate-download
 * Validates a license key and returns product info with download URLs.
 * Used by the download page to check a key and show available downloads.
 *
 * Body: { licenseKey }
 * Returns: { valid, productId, productName, version, downloads: { linux, macos, windows } }
 */
router.post('/api/license/validate-download', async (req, res) => {
  try {
    const { licenseKey } = req.body;
    if (!licenseKey) {
      return res.status(400).json({ valid: false, reason: 'missing_key' });
    }

    // Validate the license key (without instance tracking)
    const result = await license.validateForApp(licenseKey, null, null);
    if (!result.valid) {
      const messages = {
        unknown: 'Unbekannter Lizenzkey. Bitte ueberpruefen Sie Ihre Eingabe.',
        expired: 'Ihr Lizenzkey ist abgelaufen.',
        revoked: 'Ihr Lizenzkey wurde widerrufen.',
        wrong_product: 'Der Lizenzkey gehoert zu einem anderen Produkt.',
      };
      return res.json({
        valid: false,
        reason: result.reason,
        error: messages[result.reason] || 'Lizenzkey ungueltig.',
      });
    }

    const productId = result.productId;

    // Load product name
    const { rows: productRows } = await pool.query(
      'SELECT name FROM products WHERE id = $1', [productId]);
    const productName = productRows.length ? productRows[0].name : productId;

    // Find latest version from download directory
    const productDir = path.join(DOWNLOADS_DIR, productId);
    let version = null;
    const downloads = {};

    if (fs.existsSync(productDir)) {
      const versions = fs.readdirSync(productDir)
        .filter(f => {
          try { return fs.statSync(path.join(productDir, f)).isDirectory(); }
          catch { return false; }
        });

      const sorted = sortVersionsDesc(versions);
      if (sorted.length > 0) {
        version = sorted[0];
        const versionDir = path.join(productDir, version);
        const platforms = ['linux', 'macos', 'windows'];

        for (const platform of platforms) {
          const platformDir = path.join(versionDir, platform);
          if (fs.existsSync(platformDir)) {
            const files = fs.readdirSync(platformDir);
            if (files.length > 0) {
              downloads[platform] = `/api/download/${encodeURIComponent(productId)}/${platform}?version=${encodeURIComponent(version)}`;
            }
          }
        }
      }
    }

    res.json({
      valid: true,
      productId,
      productName,
      version,
      expiresAt: result.expiresAt,
      downloads,
    });
  } catch (err) {
    console.error('Download validation error:', err.message);
    res.status(500).json({ valid: false, reason: 'server_error' });
  }
});

// --- Digistore24 license delivery (GET) ---

/**
 * GET /api/license/deliver
 * Digistore24 calls this after purchase to retrieve the license key
 * for display on the thank-you page ("Liefern" tab).
 *
 * Query: ?order_id=XXX&product_id=YYY
 * Returns: { license_key } or creates one if IPN hasn't arrived yet.
 */
router.get('/api/license/deliver', async (req, res) => {
  try {
    const { order_id, product_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id Parameter fehlt' });
    }

    // Look up existing license by order_id
    const { rows } = await pool.query(
      'SELECT license_key FROM licenses WHERE order_id = $1', [order_id]);

    if (rows.length > 0) {
      return res.json({ license_key: rows[0].license_key });
    }

    // No license yet — IPN might not have arrived. Generate key now if product_id is provided.
    if (!product_id) {
      return res.status(404).json({
        error: 'Lizenz noch nicht erstellt. Bitte versuchen Sie es in wenigen Sekunden erneut.',
      });
    }

    const resolvedProductId = await license.resolveProductId(product_id) || product_id;

    const result = await license.activateFromIPN({
      order_id,
      product_id: resolvedProductId,
      payment_id: null,
    });

    res.json({ license_key: result.licenseKey });
  } catch (err) {
    console.error('License delivery error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

// Exposed for tests only
router._resetTrialRate = () => trialHits.clear();

module.exports = router;
