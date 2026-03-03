const pool = require('./db/pool');
const upcloud = require('./services/upcloud');

async function runCheck() {
  const readyUrl = process.env.PROD_READY_URL;
  let ready = false;
  let version = null;

  try {
    const res = await fetch(readyUrl, { signal: AbortSignal.timeout(15_000) });
    if (res.ok) {
      const data = await res.json();
      ready = true;
      version = data.version || null;
    }
  } catch {}

  let serverState = 'unknown';
  try {
    serverState = await upcloud.getProdStatus();
  } catch {}

  let status;
  if (ready) {
    status = 'running';
  } else if (serverState === 'stopped') {
    status = 'stopped';
  } else if (serverState === 'started') {
    status = 'unreachable';
  } else {
    status = 'unknown';
  }

  await pool.query(
    `UPDATE prod_status SET
      status = $1, last_ready_check = NOW(), last_ready_result = $2,
      last_ready_version = $3, updated_at = NOW()
    WHERE id = 1`,
    [status, ready, version]
  );

  console.log(`Watchdog: PROD status=${status}, ready=${ready}, version=${version}, upcloud=${serverState}`);

  await pool.end();
}

runCheck().catch(err => {
  console.error('Watchdog error:', err.message);
  process.exit(1);
});
