const { Router } = require('express');
const yaml = require('js-yaml');
const pool = require('../db/pool');
const adminAuth = require('../middleware/admin-auth');
const textGen = require('../services/text-generator');

const router = Router();

router.get('/api/products/:id/texts', async (req, res) => {
  try {
    const texts = await textGen.getTexts(req.params.id);
    res.json(texts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/products/:id/texts/:type', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT text_type, content, version, updated_at FROM product_texts WHERE product_id = $1 AND text_type = $2 AND locale = $3',
      [req.params.id, req.params.type, req.query.locale || 'de']
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Text nicht gefunden' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/products/:id/generate-texts', adminAuth, async (req, res) => {
  try {
    const { spec_yaml } = req.body;
    if (!spec_yaml) {
      return res.status(400).json({ error: 'spec_yaml ist erforderlich' });
    }
    const spec = yaml.load(spec_yaml);
    if (!spec || !spec.product_id) {
      return res.status(400).json({ error: 'Ungueltige spec_yaml: product_id fehlt' });
    }
    if (spec.product_id !== req.params.id) {
      return res.status(400).json({ error: 'product_id in spec stimmt nicht mit URL ueberein' });
    }
    await textGen.generateAllTexts(spec, req.query.locale || 'de');
    const texts = await textGen.getTexts(spec.product_id, req.query.locale || 'de');
    res.json({ generated: Object.keys(texts).length, texts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
