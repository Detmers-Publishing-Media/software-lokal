const { Router } = require('express');
const pool = require('../db/pool');
const license = require('../services/license');
const yamlGen = require('../services/yaml-generator');

const router = Router();

router.post('/api/requests', async (req, res) => {
  try {
    const { license_key, title, description, priority } = req.body;
    if (!license_key || !title || !description) {
      return res.status(400).json({ error: 'license_key, title und description sind Pflicht' });
    }

    const lic = await license.validateLicense(license_key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows: [{ nextval }] } = await pool.query("SELECT nextval('seq_feature_requests')");
    const requestNumber = `REQ-${String(nextval).padStart(6, '0')}`;

    const { rows: [request] } = await pool.query(
      `INSERT INTO feature_requests (request_number, license_id, product_id, title, description, priority)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [requestNumber, lic.id, lic.product_id, title, description, priority || 'normal']
    );

    const yaml = yamlGen.generateRequestYaml(request, lic);
    await pool.query(
      'INSERT INTO dispatch_queue (source_type, source_id, yaml_content) VALUES ($1, $2, $3)',
      ['feature_request', request.id, yaml]
    );

    res.status(201).json({ request_number: requestNumber, status: request.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/requests/:request_number', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT * FROM feature_requests WHERE request_number = $1 AND license_id = $2',
      [req.params.request_number, lic.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Request nicht gefunden' });

    const r = rows[0];
    res.json({
      request_number: r.request_number,
      title: r.title,
      status: r.status,
      priority: r.priority,
      pipeline_object_id: r.pipeline_object_id,
      target_version: r.target_version,
      created_at: r.created_at,
      released_at: r.released_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/requests', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT request_number, title, status, priority, created_at FROM feature_requests WHERE license_id = $1 ORDER BY created_at DESC',
      [lic.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
