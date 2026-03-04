const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

// POST /api/test-reports — CI-Pipeline pusht Testergebnisse (Admin-Token auth)
router.post('/api/test-reports', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
      return res.status(401).json({ error: 'Nicht autorisiert' });
    }

    const { product_id, platform, version, total_tests, passed_tests, failed_tests, test_details } = req.body;
    if (!product_id || !platform || total_tests == null) {
      return res.status(400).json({ error: 'product_id, platform und total_tests sind Pflicht' });
    }

    const { rows: [report] } = await pool.query(
      `INSERT INTO test_reports (product_id, platform, version, total_tests, passed_tests, failed_tests, test_details)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [product_id, platform, version || null, total_tests, passed_tests || 0, failed_tests || 0, JSON.stringify(test_details || [])]
    );

    res.status(201).json({ id: report.id, created_at: report.created_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/test-reports/:product_id — Oeffentlich: letzte Testergebnisse
router.get('/api/test-reports/:product_id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT platform, version, total_tests, passed_tests, failed_tests, test_details, created_at
       FROM test_reports
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.params.product_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
