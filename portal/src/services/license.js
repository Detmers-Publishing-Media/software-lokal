const pool = require('../db/pool');

async function validateLicense(licenseKey) {
  const { rows } = await pool.query(
    `SELECT l.*, p.name AS product_name, p.forgejo_repo
     FROM licenses l
     JOIN products p ON l.product_id = p.id
     WHERE l.license_key = $1 AND l.status = 'active'`,
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

module.exports = { validateLicense, createLicense };
