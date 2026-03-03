const { Router } = require('express');
const pool = require('../db/pool');
const adminAuth = require('../middleware/admin-auth');
const upcloud = require('../services/upcloud');

const router = Router();

router.get('/api/status', async (req, res) => {
  try {
    const { rows: [prod] } = await pool.query('SELECT * FROM prod_status WHERE id = 1');
    const { rows: [queue] } = await pool.query(
      "SELECT COUNT(*) FILTER (WHERE status = 'queued') AS pending, COUNT(*) FILTER (WHERE status = 'dispatching') AS dispatching FROM dispatch_queue"
    );
    res.json({
      portal: 'ok',
      version: '0.4.1',
      prod: {
        status: prod?.status || 'unknown',
        last_check: prod?.last_ready_check,
        version: prod?.last_ready_version
      },
      queue: {
        pending: parseInt(queue.pending),
        dispatching: parseInt(queue.dispatching)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/queue', adminAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM dispatch_queue ORDER BY created_at DESC LIMIT 50'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/actions/wake-prod', adminAuth, async (req, res) => {
  try {
    const state = await upcloud.getProdStatus();
    if (state === 'started') {
      return res.json({ message: 'PROD laeuft bereits', state });
    }
    await upcloud.startProd();
    res.json({ message: 'PROD Start-Befehl gesendet', previous_state: state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/actions/check-prod', adminAuth, async (req, res) => {
  try {
    const readyUrl = process.env.PROD_READY_URL;
    let ready = false;
    let version = null;
    try {
      const r = await fetch(readyUrl, { signal: AbortSignal.timeout(10_000) });
      if (r.ok) {
        const data = await r.json();
        ready = true;
        version = data.version;
      }
    } catch {}

    const state = await upcloud.getProdStatus();
    const status = state === 'started'
      ? (ready ? 'running' : 'unreachable')
      : state === 'stopped' ? 'stopped' : 'unknown';

    await pool.query(
      `UPDATE prod_status SET
        status = $1, last_ready_check = NOW(), last_ready_result = $2,
        last_ready_version = $3, updated_at = NOW()
      WHERE id = 1`,
      [status, ready, version]
    );

    res.json({ state, status, ready, version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
