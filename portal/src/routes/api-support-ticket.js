const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

/**
 * Validates a license_hash against the licenses table.
 * Returns the license row or null.
 */
async function validateByHash(licenseHash) {
  const { rows } = await pool.query(
    `SELECT l.*, p.name AS product_name
     FROM licenses l
     JOIN products p ON l.product_id = p.id
     WHERE l.license_hash = $1 AND l.status = 'active'
       AND (l.expires_at IS NULL OR l.expires_at > NOW())`,
    [licenseHash]
  );
  return rows[0] || null;
}

/**
 * POST /api/support/ticket
 * Creates a support ticket. Auth via HMAC license hash.
 *
 * Body: { licenseHash, productId, userDescription?, kiBundle? }
 */
router.post('/api/support/ticket', async (req, res) => {
  try {
    const { licenseHash, productId, userDescription, kiBundle } = req.body;

    if (!licenseHash) {
      return res.status(400).json({ error: 'licenseHash ist Pflicht' });
    }

    // Validate license by HMAC hash
    const lic = await validateByHash(licenseHash);
    if (!lic) {
      return res.status(403).json({ error: 'Ungueltige oder abgelaufene Lizenz' });
    }

    // Generate ticket reference: CF-YYYY-MM-DD-NNNNN
    const { rows: [{ nextval }] } = await pool.query("SELECT nextval('seq_support_tickets')");
    const today = new Date().toISOString().split('T')[0];
    const ticketRef = `CF-${today}-${String(nextval).padStart(5, '0')}`;

    // Insert ticket
    const { rows: [ticket] } = await pool.query(`
      INSERT INTO support_tickets (ticket_ref, license_hash, product_id, user_description, ki_bundle)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING ticket_ref, status, created_at
    `, [
      ticketRef,
      licenseHash,
      productId || lic.product_id,
      userDescription || null,
      kiBundle ? JSON.stringify(kiBundle) : null,
    ]);

    res.status(201).json({
      ticketRef: ticket.ticket_ref,
      status: ticket.status,
      createdAt: ticket.created_at,
    });
  } catch (err) {
    console.error('Ticket creation error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

/**
 * GET /api/support/tickets?licenseHash=<HMAC>&status=open,resolved
 * Lists tickets for a license. Auth via HMAC hash.
 */
router.get('/api/support/tickets', async (req, res) => {
  try {
    const { licenseHash, status } = req.query;

    if (!licenseHash) {
      return res.status(400).json({ error: 'licenseHash Parameter fehlt' });
    }

    // Validate license
    const lic = await validateByHash(licenseHash);
    if (!lic) {
      return res.status(403).json({ error: 'Ungueltige oder abgelaufene Lizenz' });
    }

    // Build status filter
    let statusFilter = '';
    const params = [licenseHash];
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        statusFilter = ` AND status = ANY($2)`;
        params.push(statuses);
      }
    }

    const { rows } = await pool.query(`
      SELECT ticket_ref, product_id, status, user_description,
             ki_response, escalated, created_at, resolved_at
      FROM support_tickets
      WHERE license_hash = $1${statusFilter}
      ORDER BY created_at DESC
      LIMIT 50
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('Ticket list error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

/**
 * GET /api/support/ticket/:ticketRef?licenseHash=<HMAC>
 * Get a single ticket with full details.
 */
router.get('/api/support/ticket/:ticketRef', async (req, res) => {
  try {
    const { licenseHash } = req.query;
    if (!licenseHash) {
      return res.status(400).json({ error: 'licenseHash Parameter fehlt' });
    }

    const lic = await validateByHash(licenseHash);
    if (!lic) {
      return res.status(403).json({ error: 'Ungueltige oder abgelaufene Lizenz' });
    }

    const { rows } = await pool.query(`
      SELECT ticket_ref, product_id, status, user_description,
             ki_response, escalated, created_at, resolved_at
      FROM support_tickets
      WHERE ticket_ref = $1 AND license_hash = $2
    `, [req.params.ticketRef, licenseHash]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Ticket nicht gefunden' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Ticket detail error:', err.message);
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

module.exports = router;
