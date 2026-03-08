/**
 * Event-Log with HMAC-SHA256 hash chain.
 * Append-only audit trail for all write operations.
 */

export function createEventLog({ query, execute, computeHmac }) {
  async function append(type, data, actor = 'app') {
    const prev = await query('SELECT id, hash FROM events ORDER BY id DESC LIMIT 1');
    const prevHash = prev[0]?.hash ?? '0';
    const timestamp = new Date().toISOString();
    const dataJson = JSON.stringify(data);
    const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
    const hash = await computeHmac(message);

    await execute(
      'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)',
      [type, timestamp, actor, dataJson, hash, prevHash]
    );
  }

  async function verifyChain(limit = 100) {
    const events = await query('SELECT * FROM events ORDER BY id DESC LIMIT ?', [limit]);
    events.reverse();
    const errors = [];
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      if (i > 0 && e.prev_hash !== events[i - 1].hash) {
        errors.push({ event_id: e.id, error: 'prev_hash mismatch' });
      }
      const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
      const expectedHash = await computeHmac(message);
      if (e.hash !== expectedHash) {
        errors.push({ event_id: e.id, error: 'hash mismatch' });
      }
    }
    return { valid: errors.length === 0, errors, checked: events.length };
  }

  async function getEvents(limit = 50, offset = 0) {
    return query('SELECT * FROM events ORDER BY id DESC LIMIT ? OFFSET ?', [limit, offset]);
  }

  return { append, verifyChain, getEvents };
}
