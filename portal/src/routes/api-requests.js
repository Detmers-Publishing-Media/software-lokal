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

// Public list: all open requests for the product (no description for privacy)
// MUST be before :request_number to avoid Express matching "public" as a param
router.get('/api/requests/public', async (req, res) => {
  try {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'key Parameter fehlt' });

    const lic = await license.validateLicense(key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      `SELECT fr.request_number, fr.title, fr.status, fr.votes, fr.created_at, fr.license_id,
              (SELECT 1 FROM feature_request_votes v WHERE v.request_id = fr.id AND v.license_id = $2 LIMIT 1) AS has_voted
       FROM feature_requests fr
       WHERE fr.product_id = $1 AND fr.status NOT IN ('declined')
       ORDER BY fr.votes DESC, fr.created_at DESC`,
      [lic.product_id, lic.id]
    );

    res.json(rows.map(r => ({
      request_number: r.request_number,
      title: r.title,
      status: r.status,
      votes: r.votes || 0,
      created_at: r.created_at,
      is_own: r.license_id === lic.id,
      has_voted: !!r.has_voted,
    })));
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
      decline_reason: r.decline_reason || null,
      votes: r.votes || 0,
      created_at: r.created_at,
      released_at: r.released_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote for a feature request (one vote per license)
router.post('/api/requests/:request_number/vote', async (req, res) => {
  try {
    const { license_key } = req.body;
    if (!license_key) return res.status(400).json({ error: 'license_key ist Pflicht' });

    const lic = await license.validateLicense(license_key);
    if (!lic) return res.status(403).json({ error: 'Ungueltiger Lizenzkey' });

    const { rows } = await pool.query(
      'SELECT id FROM feature_requests WHERE request_number = $1 AND product_id = $2',
      [req.params.request_number, lic.product_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Request nicht gefunden' });

    const requestId = rows[0].id;

    // Insert vote (unique constraint prevents duplicates)
    try {
      await pool.query(
        'INSERT INTO feature_request_votes (request_id, license_id) VALUES ($1, $2)',
        [requestId, lic.id]
      );
      await pool.query(
        'UPDATE feature_requests SET votes = COALESCE(votes, 0) + 1 WHERE id = $1',
        [requestId]
      );
    } catch (voteErr) {
      if (voteErr.code === '23505') { // unique_violation
        return res.status(409).json({ error: 'Bereits abgestimmt' });
      }
      throw voteErr;
    }

    res.json({ ok: true });
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
      `SELECT request_number, title, status, priority, votes,
              CASE WHEN status = 'declined' THEN decline_reason ELSE NULL END AS decline_reason,
              created_at
       FROM feature_requests WHERE license_id = $1 ORDER BY created_at DESC`,
      [lic.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
