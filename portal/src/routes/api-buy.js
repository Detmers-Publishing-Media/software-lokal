const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const forgejo = require('../services/forgejo');
const adminAuth = require('../middleware/admin-auth');
const digistoreApi = require('../services/digistore-api');

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

router.get('/api/license/:key', async (req, res) => {
  try {
    const lic = await license.validateLicense(req.params.key);
    if (!lic) return res.status(403).json({ error: 'Lizenzkey ungueltig oder abgelaufen' });

    const { rows } = await pool.query('SELECT description FROM products WHERE id = $1', [lic.product_id]);
    let latestVersion = null;
    if (lic.forgejo_repo) {
      const release = await forgejo.getLatestRelease(lic.forgejo_repo);
      if (release) latestVersion = release.tag_name;
    }

    res.json({
      license_key: lic.license_key,
      status: 'active',
      product: {
        id: lic.product_id,
        name: lic.product_name,
        description: rows[0]?.description || ''
      },
      latest_version: latestVersion,
      download_url: lic.forgejo_repo
        ? `/api/download/${lic.product_id}?key=${lic.license_key}`
        : null,
      issued_at: lic.issued_at,
      expires_at: lic.expires_at
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

router.post('/api/products', adminAuth, async (req, res) => {
  try {
    const { id, name, description, price_cents, forgejo_repo } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'id und name sind Pflicht' });
    }

    // Duplikat pruefen
    const { rows: existing } = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (existing.length) {
      return res.status(409).json({ error: 'Produkt-ID existiert bereits' });
    }

    // In Portal-DB anlegen
    const { rows: [product] } = await pool.query(
      `INSERT INTO products (id, name, description, price_cents, forgejo_repo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, name, description || null, price_cents || 0, forgejo_repo || null]
    );

    // Digistore24 Sync
    let digistoreProductId = null;
    try {
      digistoreProductId = await digistoreApi.createProduct({ name, description });
      await pool.query(
        'UPDATE products SET digistore_product_id = $1, updated_at = NOW() WHERE id = $2',
        [digistoreProductId, id]
      );
      product.digistore_product_id = digistoreProductId;
    } catch (syncErr) {
      console.error(`Digistore24 Sync fehlgeschlagen fuer ${id}:`, syncErr.message);
      product.digistore_sync_error = syncErr.message;
    }

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
