const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const yamlGen = require('../services/yaml-generator');

const router = Router();

router.post('/api/support', async (req, res) => {
  try {
    const { license_key, title, description, category } = req.body;
    if (!license_key || !title || !description) {
      return res.status(400).json({ error: 'license_key, title und description sind Pflicht' });
    }

    const lic = await license.validateLicense(license_key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows: [{ nextval }] } = await pool.query("SELECT nextval('seq_support_cases')");
    const caseNumber = `SUP-${String(nextval).padStart(6, '0')}`;

    const { rows: [supportCase] } = await pool.query(
      `INSERT INTO support_cases (case_number, license_id, product_id, title, description, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [caseNumber, lic.id, lic.product_id, title, description, category || 'bug']
    );

    const yaml = yamlGen.generateSupportYaml(supportCase, lic);
    await pool.query(
      'INSERT INTO dispatch_queue (source_type, source_id, yaml_content) VALUES ($1, $2, $3)',
      ['support_case', supportCase.id, yaml]
    );

    res.status(201).json({ case_number: caseNumber, status: supportCase.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/support/:case_number', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT * FROM support_cases WHERE case_number = $1 AND license_id = $2',
      [req.params.case_number, lic.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Case nicht gefunden' });

    const c = rows[0];
    res.json({
      case_number: c.case_number,
      title: c.title,
      status: c.status,
      category: c.category,
      priority: c.priority,
      pipeline_object_id: c.pipeline_object_id,
      created_at: c.created_at,
      resolved_at: c.resolved_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/support', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT case_number, title, status, category, priority, created_at FROM support_cases WHERE license_id = $1 ORDER BY created_at DESC',
      [lic.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
