const { Router } = require('express');
const license = require('../services/license');
const adminAuth = require('../middleware/admin-auth');
const { PRODUCT_PREFIXES, TRIAL_PREFIXES } = require('../services/license-keygen');

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

// Exposed for tests only
router._resetTrialRate = () => trialHits.clear();

module.exports = router;
