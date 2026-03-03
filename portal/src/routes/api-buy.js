const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const forgejo = require('../services/forgejo');

const router = Router();

router.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, description, price_cents, status FROM products WHERE status = 'active' ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Produkt nicht gefunden' });
    const product = rows[0];
    let latestVersion = null;
    if (product.forgejo_repo) {
      const release = await forgejo.getLatestRelease(product.forgejo_repo);
      if (release) latestVersion = release.tag_name;
    }
    res.json({ ...product, latest_version: latestVersion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/buy', async (req, res) => {
  try {
    const { product_id, customer_email, customer_name } = req.body;
    if (!product_id || !customer_email) {
      return res.status(400).json({ error: 'product_id und customer_email sind Pflicht' });
    }
    const { rows: products } = await pool.query(
      "SELECT * FROM products WHERE id = $1 AND status = 'active'", [product_id]
    );
    if (!products.length) return res.status(404).json({ error: 'Produkt nicht gefunden oder nicht aktiv' });

    const product = products[0];
    const lic = await license.createLicense(product_id, customer_email, customer_name);
    const downloadUrl = product.forgejo_repo
      ? `/api/download/${product_id}?key=${lic.license_key}`
      : null;

    res.status(201).json({
      license_key: lic.license_key,
      product: { id: product.id, name: product.name },
      download_url: downloadUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/download/:product_id', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });
    if (lic.product_id !== req.params.product_id) {
      return res.status(403).json({ error: 'Lizenzkey gehoert nicht zu diesem Produkt' });
    }

    const { rows: products } = await pool.query(
      'SELECT * FROM products WHERE id = $1', [req.params.product_id]
    );
    if (!products.length || !products[0].forgejo_repo) {
      return res.status(404).json({ error: 'Kein Download verfuegbar' });
    }

    const release = await forgejo.getLatestRelease(products[0].forgejo_repo);
    if (!release) return res.status(404).json({ error: 'Kein Release gefunden' });

    const releaseUrl = `${process.env.FORGEJO_URL}/${products[0].forgejo_repo}/releases/tag/${release.tag_name}`;
    res.redirect(302, releaseUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
