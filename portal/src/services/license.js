const pool = require('../db/pool');
const keygen = require('./license-keygen');

async function validateLicense(licenseKey) {
  const { rows } = await pool.query(
    `SELECT l.*, p.name AS product_name, p.forgejo_repo
     FROM licenses l
     JOIN products p ON l.product_id = p.id
     WHERE l.license_key = $1 AND l.status = 'active'
       AND (l.expires_at IS NULL OR l.expires_at > NOW())`,
    [licenseKey]
  );
  return rows[0] || null;
}

async function createLicense(productId) {
  const licenseKey = keygen.generateKey(productId);
  const licenseHash = keygen.computeLicenseHash(licenseKey);
  const { rows } = await pool.query(
    `INSERT INTO licenses (license_key, license_hash, product_id)
     VALUES ($1, $2, $3) RETURNING *`,
    [licenseKey, licenseHash, productId]
  );
  return rows[0];
}

/**
 * Resolves a Digistore product_id to our internal product_id.
 * Tries direct match first, then digistore_product_id mapping.
 */
async function resolveProductId(digistoreProductId) {
  const direct = await pool.query('SELECT id FROM products WHERE id = $1', [digistoreProductId]);
  if (direct.rows.length) return direct.rows[0].id;

  const mapped = await pool.query(
    'SELECT id FROM products WHERE digistore_product_id = $1', [digistoreProductId]);
  if (mapped.rows.length) return mapped.rows[0].id;

  return null;
}

/**
 * Activates a license from a Digistore24 IPN payment event.
 * - New order: generates key in CFML format, sets expires_at +1 year
 * - Existing order (rebill): extends expires_at by 1 year
 */
async function activateFromIPN({ order_id, product_id, payment_id }) {
  // Check for existing license (recurring payment)
  const { rows: existing } = await pool.query(
    'SELECT id, license_key FROM licenses WHERE order_id = $1', [order_id]);

  if (existing.length > 0) {
    await pool.query(`
      UPDATE licenses SET status = 'active', auto_renew = true,
        expires_at = GREATEST(expires_at, NOW()) + INTERVAL '1 year',
        activated_at = NOW()
      WHERE order_id = $1
    `, [order_id]);
    return { existing: true, licenseKey: existing[0].license_key };
  }

  // New license
  const licenseKey = keygen.generateKey(product_id);
  const licenseHash = keygen.computeLicenseHash(licenseKey);

  await pool.query(`
    INSERT INTO licenses (license_key, license_hash, product_id,
                          order_id, transaction_id, source, status, activated_at, issued_at,
                          expires_at, auto_renew)
    VALUES ($1, $2, $3, $4, $5, 'digistore', 'active', NOW(), NOW(),
            NOW() + INTERVAL '1 year', true)
  `, [licenseKey, licenseHash, product_id, order_id, payment_id]);

  return { existing: false, licenseKey };
}

async function revokeByOrderId(orderId) {
  const result = await pool.query(`
    UPDATE licenses SET status = 'revoked', revoked_at = NOW()
    WHERE order_id = $1 AND status = 'active'
    RETURNING license_key
  `, [orderId]);
  return result;
}

/**
 * Marks a license as cancelled (auto_renew = false).
 * Does NOT expire immediately — runs until existing expires_at.
 */
async function cancelByOrderId(orderId) {
  const result = await pool.query(`
    UPDATE licenses SET auto_renew = false
    WHERE order_id = $1 AND status = 'active'
    RETURNING license_key
  `, [orderId]);
  return result;
}

/**
 * Extends expires_at by 1 year (for on_rebill_resumed).
 */
async function resumeByOrderId(orderId) {
  const result = await pool.query(`
    UPDATE licenses SET status = 'active', auto_renew = true,
      expires_at = GREATEST(expires_at, NOW()) + INTERVAL '1 year'
    WHERE order_id = $1
    RETURNING license_key
  `, [orderId]);
  return result;
}

/**
 * Validates a license key for the desktop app (POST /api/license/validate).
 * Updates validation tracking.
 *
 * @returns {{ valid, status, expiresAt, productId, features } | { valid, reason }}
 */
async function validateForApp(licenseKey, productId) {
  const { rows } = await pool.query(`
    SELECT l.*, p.name AS product_name
    FROM licenses l
    JOIN products p ON l.product_id = p.id
    WHERE l.license_key = $1
  `, [licenseKey]);

  if (!rows.length) {
    return { valid: false, reason: 'unknown' };
  }

  const lic = rows[0];

  // Product mismatch
  if (productId && lic.product_id !== productId) {
    return { valid: false, reason: 'wrong_product' };
  }

  // Status checks
  if (lic.status === 'revoked') {
    return { valid: false, reason: 'revoked' };
  }

  if (lic.status === 'expired' || (lic.expires_at && new Date(lic.expires_at) < new Date())) {
    return { valid: false, reason: 'expired', expiresAt: lic.expires_at };
  }

  // Update validation tracking
  await pool.query(`
    UPDATE licenses SET last_validated_at = NOW(), validation_count = COALESCE(validation_count, 0) + 1
    WHERE id = $1
  `, [lic.id]);

  return {
    valid: true,
    status: 'active',
    expiresAt: lic.expires_at,
    productId: lic.product_id,
    features: ['support', 'updates'],
  };
}

/**
 * Recovers a license key by Digistore24 order ID.
 * Returns masked key + metadata, or null if not found.
 */
async function recoverByOrderId(orderId) {
  const { rows } = await pool.query(`
    SELECT license_key, product_id, status, expires_at
    FROM licenses WHERE order_id = $1
  `, [orderId]);

  if (!rows.length) return null;

  const lic = rows[0];
  // Mask key: show only last 4 chars
  const masked = lic.license_key.replace(/^(.{4}-)(.{4})-(.{4})-(.{4}-)(.{2})(.{2})$/,
    '$1****-****-****-$5$6');

  return {
    found: true,
    licenseKey: masked,
    licenseKeyFull: lic.license_key,
    productId: lic.product_id,
    status: lic.status,
    expiresAt: lic.expires_at,
  };
}

/**
 * Creates a 30-day trial license for manual distribution (Pilotkunden, Testing).
 * Uses CFTM/CFTR prefix to distinguish from Digistore keys.
 *
 * @param {string} productId - Internal product ID
 * @param {string} [note] - Optional note (e.g. "Pilotkunde Mueller")
 * @returns {Object} Created license row
 */
async function createTrialLicense(productId, note) {
  const licenseKey = keygen.generateTrialKey(productId);
  const licenseHash = keygen.computeLicenseHash(licenseKey);

  const { rows } = await pool.query(`
    INSERT INTO licenses (license_key, license_hash, product_id, source, status,
                          activated_at, issued_at, expires_at, auto_renew, note)
    VALUES ($1, $2, $3, 'manual', 'active', NOW(), NOW(),
            NOW() + INTERVAL '30 days', false, $4)
    RETURNING *
  `, [licenseKey, licenseHash, productId, note || null]);

  return rows[0];
}

module.exports = {
  validateLicense,
  createLicense,
  resolveProductId,
  activateFromIPN,
  revokeByOrderId,
  cancelByOrderId,
  resumeByOrderId,
  validateForApp,
  recoverByOrderId,
  createTrialLicense,
};
