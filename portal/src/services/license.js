const pool = require('../db/pool');

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

async function createLicense(productId, email, name) {
  const { rows } = await pool.query(
    'INSERT INTO licenses (product_id, customer_email, customer_name) VALUES ($1, $2, $3) RETURNING *',
    [productId, email, name || null]
  );
  return rows[0];
}

async function activateFromIPN({ order_id, license_key, product_id,
                                  buyer_email, buyer_name, payment_id }) {
  await pool.query(`
    INSERT INTO licenses (license_key, product_id, customer_email, customer_name,
                          order_id, transaction_id, source, status, activated_at, issued_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'digistore', 'active', NOW(), NOW())
    ON CONFLICT (order_id) DO UPDATE SET
      status = 'active', activated_at = NOW()
  `, [license_key, product_id, buyer_email, buyer_name, order_id, payment_id]);
}

async function revokeByOrderId(orderId) {
  const result = await pool.query(`
    UPDATE licenses SET status = 'revoked', revoked_at = NOW()
    WHERE order_id = $1 AND status = 'active'
    RETURNING license_key
  `, [orderId]);
  return result;
}

async function expireByOrderId(orderId) {
  const result = await pool.query(`
    UPDATE licenses SET expires_at = NOW()
    WHERE order_id = $1 AND status = 'active'
    RETURNING license_key
  `, [orderId]);
  return result;
}

module.exports = { validateLicense, createLicense, activateFromIPN, revokeByOrderId, expireByOrderId };
