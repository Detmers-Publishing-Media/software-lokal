const pool = require('./db/pool');
const upcloud = require('./services/upcloud');
const forgejo = require('./services/forgejo');

const POLL_INTERVAL = 30_000;
const PROD_WAKE_TIMEOUT = 5 * 60_000;
const PROD_POLL_INTERVAL = 15_000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkProdReady() {
  try {
    const url = process.env.PROD_READY_URL;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForProdReady(timeout) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await checkProdReady()) return true;
    await sleep(PROD_POLL_INTERVAL);
  }
  return false;
}

async function handleDispatchFailure(item, message) {
  const retryCount = item.retry_count + 1;
  if (retryCount >= 3) {
    await pool.query(
      `UPDATE dispatch_queue SET status = 'failed', error_message = $1, retry_count = $2, updated_at = NOW() WHERE id = $3`,
      [message, retryCount, item.id]
    );
    console.error(`Queue item ${item.id} failed permanently: ${message}`);
  } else {
    await pool.query(
      `UPDATE dispatch_queue SET status = 'queued', error_message = $1, retry_count = $2, updated_at = NOW() WHERE id = $3`,
      [message, retryCount, item.id]
    );
    console.warn(`Queue item ${item.id} retry ${retryCount}/3: ${message}`);
  }
}

function extractObjectId(yamlContent) {
  const match = yamlContent.match(/^id:\s*(.+)$/m);
  return match ? match[1].trim().replace(/['"]/g, '') : `unknown-${Date.now()}`;
}

async function dispatchLoop() {
  console.log('Dispatcher v0.4.1 started');

  while (true) {
    try {
      const result = await pool.query(`
        UPDATE dispatch_queue
        SET status = 'dispatching', updated_at = NOW()
        WHERE id = (
          SELECT id FROM dispatch_queue
          WHERE status = 'queued'
          ORDER BY created_at ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        )
        RETURNING *
      `);

      if (!result.rows.length) {
        await sleep(POLL_INTERVAL);
        continue;
      }

      const item = result.rows[0];
      console.log(`Processing queue item ${item.id} (${item.source_type} #${item.source_id})`);

      const prodAlive = await checkProdReady();

      if (!prodAlive) {
        console.log('PROD not ready, checking UpCloud state...');
        await pool.query(
          'UPDATE dispatch_queue SET prod_was_sleeping = true, prod_started_at = NOW() WHERE id = $1',
          [item.id]
        );

        const serverState = await upcloud.getProdStatus();
        console.log(`PROD UpCloud state: ${serverState}`);

        if (serverState === 'stopped') {
          console.log('Starting PROD via UpCloud API...');
          await upcloud.startProd();
        }

        const ready = await waitForProdReady(PROD_WAKE_TIMEOUT);
        if (!ready) {
          await handleDispatchFailure(item, 'PROD nicht erreichbar nach Wake (5 Min Timeout)');
          continue;
        }

        await pool.query(
          'UPDATE dispatch_queue SET prod_ready_at = NOW() WHERE id = $1',
          [item.id]
        );
        console.log('PROD is ready');
      }

      const targetPath = item.source_type === 'idea'
        ? 'work/09-blocked/needs-po'
        : 'work/01-inbox';

      const objectId = extractObjectId(item.yaml_content);
      console.log(`Pushing ${objectId} to ${targetPath}...`);
      await forgejo.pushYaml(targetPath, objectId, item.yaml_content);

      await pool.query(
        `UPDATE dispatch_queue SET status = 'dispatched', pushed_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [item.id]
      );
      console.log(`Queue item ${item.id} dispatched successfully`);

    } catch (err) {
      console.error('Dispatcher error:', err.message);
      await sleep(POLL_INTERVAL);
    }
  }
}

dispatchLoop();
