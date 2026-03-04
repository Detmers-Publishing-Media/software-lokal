const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const yamlGen = require('../services/yaml-generator');

const router = Router();

router.post('/api/ideas', async (req, res) => {
  try {
    const { license_key, title, description, category } = req.body;
    if (!license_key || !title || !description) {
      return res.status(400).json({ error: 'license_key, title und description sind Pflicht' });
    }

    const lic = await license.validateLicense(license_key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows: [{ nextval }] } = await pool.query("SELECT nextval('seq_ideas')");
    const ideaNumber = `IDEA-${String(nextval).padStart(6, '0')}`;

    const { rows: [idea] } = await pool.query(
      `INSERT INTO ideas (idea_number, license_id, product_id, title, description, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ideaNumber, lic.id, lic.product_id, title, description, category || 'new_product']
    );

    const yaml = yamlGen.generateIdeaYaml(idea, lic);
    await pool.query(
      'INSERT INTO dispatch_queue (source_type, source_id, yaml_content) VALUES ($1, $2, $3)',
      ['idea', idea.id, yaml]
    );

    res.status(201).json({ idea_number: ideaNumber, status: idea.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/ideas', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      "SELECT idea_number, title, description, category, status, votes, created_at FROM ideas WHERE product_id = $1 AND status IN ('submitted', 'accepted') ORDER BY votes DESC, created_at DESC",
      [lic.product_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/ideas/:idea_number', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT idea_number, title, description, category, status, votes, created_at FROM ideas WHERE idea_number = $1 AND product_id = $2',
      [req.params.idea_number, lic.product_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Idee nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/ideas/:idea_number/vote', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) return res.status(400).json({ error: 'license_key ist Pflicht' });

    const lic = await license.validateLicense(license_key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rowCount } = await pool.query(
      'UPDATE ideas SET votes = votes + 1, updated_at = NOW() WHERE idea_number = $1 AND product_id = $2',
      [req.params.idea_number, lic.product_id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Idee nicht gefunden' });
    res.json({ voted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
