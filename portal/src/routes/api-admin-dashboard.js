const { Router } = require('express');
const pool = require('../db/pool');
const adminAuth = require('../middleware/admin-auth');

const router = Router();

// --- Support Tickets (HMAC-based, from desktop app) ---

router.get('/api/admin/tickets', adminAuth, async (req, res) => {
  try {
    const { status, product_id } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) {
      where.push(`t.status = $${idx++}`);
      params.push(status);
    }
    if (product_id) {
      where.push(`t.product_id = $${idx++}`);
      params.push(product_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const { rows } = await pool.query(`
      SELECT t.id, t.ticket_ref, t.product_id, t.status, t.user_description,
             t.ki_bundle, t.ki_diagnosis, t.ki_response, t.escalated,
             t.created_at, t.resolved_at
      FROM support_tickets t
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 100
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/admin/tickets/:id', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM support_tickets WHERE id = $1',
      [parseInt(req.params.id, 10)]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/api/admin/tickets/:id', adminAuth, async (req, res) => {
  try {
    const { status, ki_response, escalated } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      params.push(status);
      if (status === 'resolved' || status === 'closed') {
        updates.push(`resolved_at = NOW()`);
      }
    }
    if (ki_response !== undefined) {
      updates.push(`ki_response = $${idx++}`);
      params.push(ki_response);
    }
    if (escalated !== undefined) {
      updates.push(`escalated = $${idx++}`);
      params.push(escalated);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Keine Aenderungen' });
    }

    params.push(parseInt(req.params.id, 10));
    const { rows } = await pool.query(
      `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Ticket nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Feature Requests (Ideen) ---

router.get('/api/admin/requests', adminAuth, async (req, res) => {
  try {
    const { status, product_id } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) {
      where.push(`r.status = $${idx++}`);
      params.push(status);
    }
    if (product_id) {
      where.push(`r.product_id = $${idx++}`);
      params.push(product_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const { rows } = await pool.query(`
      SELECT r.id, r.request_number, r.product_id, r.title, r.description,
             r.status, r.priority, r.votes, r.target_version,
             r.decline_reason, r.created_at, r.released_at
      FROM feature_requests r
      ${whereClause}
      ORDER BY r.votes DESC, r.created_at DESC
      LIMIT 200
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/api/admin/requests/:id', adminAuth, async (req, res) => {
  try {
    const { status, target_version, decline_reason, priority } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;

    if (status) {
      updates.push(`status = $${idx++}`);
      params.push(status);
      if (status === 'released') {
        updates.push('released_at = NOW()');
      }
    }
    if (target_version !== undefined) {
      updates.push(`target_version = $${idx++}`);
      params.push(target_version || null);
    }
    if (decline_reason !== undefined) {
      updates.push(`decline_reason = $${idx++}`);
      params.push(decline_reason || null);
    }
    if (priority) {
      updates.push(`priority = $${idx++}`);
      params.push(priority);
    }

    updates.push('updated_at = NOW()');

    if (updates.length <= 1) {
      return res.status(400).json({ error: 'Keine Aenderungen' });
    }

    params.push(parseInt(req.params.id, 10));
    const { rows } = await pool.query(
      `UPDATE feature_requests SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Request nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Licenses overview ---

router.get('/api/admin/licenses', adminAuth, async (req, res) => {
  try {
    const { status, product_id, source } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (status) {
      where.push(`l.status = $${idx++}`);
      params.push(status);
    }
    if (product_id) {
      where.push(`l.product_id = $${idx++}`);
      params.push(product_id);
    }
    if (source) {
      where.push(`l.source = $${idx++}`);
      params.push(source);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const { rows } = await pool.query(`
      SELECT l.id, l.license_key, l.product_id, l.status, l.source,
             l.issued_at, l.expires_at, l.activated_at, l.auto_renew,
             l.last_validated_at, l.validation_count, l.note,
             p.name AS product_name,
             (SELECT COUNT(*) FROM license_instances li WHERE li.license_id = l.id) AS instance_count
      FROM licenses l
      JOIN products p ON l.product_id = p.id
      ${whereClause}
      ORDER BY l.issued_at DESC
      LIMIT 200
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Dashboard stats ---

router.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [tickets, requests, licenses] = await Promise.all([
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open,
        COUNT(*) FILTER (WHERE status = 'analyzing') AS analyzing,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) AS total
        FROM support_tickets`),
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'submitted') AS submitted,
        COUNT(*) FILTER (WHERE status = 'planned') AS planned,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'released') AS released,
        COUNT(*) FILTER (WHERE status = 'declined') AS declined,
        COUNT(*) AS total
        FROM feature_requests`),
      pool.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE source = 'auto-trial' OR source = 'manual') AS trial,
        COUNT(*) FILTER (WHERE source = 'digistore') AS paid,
        COUNT(*) AS total
        FROM licenses`),
    ]);

    res.json({
      tickets: tickets.rows[0],
      requests: requests.rows[0],
      licenses: licenses.rows[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
