/**
 * In-memory SQLite database for testing.
 * Uses sql.js (WebAssembly SQLite) — same SQL dialect as better-sqlite3.
 */
import initSqlJs from 'sql.js';

let SQL;

export async function createTestDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  const db = new SQL.Database();

  function query(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  function execute(sql, params = []) {
    if (params.length === 0) {
      db.run(sql);
      return { lastInsertRowid: getLastInsertRowid(), changes: db.getRowsModified() };
    }
    const stmt = db.prepare(sql);
    stmt.bind(params);
    stmt.step();
    stmt.free();
    return { lastInsertRowid: getLastInsertRowid(), changes: db.getRowsModified() };
  }

  function getLastInsertRowid() {
    const result = db.exec('SELECT last_insert_rowid() as id');
    return result[0]?.values[0]?.[0] ?? 0;
  }

  function close() {
    db.close();
  }

  return { query, execute, close, raw: db };
}

/**
 * Simple HMAC replacement for tests (no crypto needed).
 */
export async function testHmac(message) {
  // Simple hash for testing — NOT cryptographically secure
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Creates an in-process audit bridge for tests (replaces window.electronAPI.audit).
 * Same logic as the old appendEvent/verifyChain but packaged as audit bridge interface.
 */
export function createTestAudit({ query, execute }) {
  return {
    async append(type, data, actor = 'app') {
      const prev = query('SELECT id, hash FROM events ORDER BY id DESC LIMIT 1');
      const prevHash = prev[0]?.hash ?? '0';
      const timestamp = new Date().toISOString();
      const dataJson = JSON.stringify(data);
      const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
      const hash = await testHmac(message);
      execute(
        'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)',
        [type, timestamp, actor, dataJson, hash, prevHash]
      );
    },
    async verify({ limit } = {}) {
      const events = query('SELECT * FROM events ORDER BY id DESC LIMIT ?', [limit ?? 100]);
      events.reverse();
      const errors = [];
      for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (i > 0 && e.prev_hash !== events[i - 1].hash) {
          errors.push({ event_id: e.id, error: 'prev_hash mismatch' });
        }
        const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
        const expectedHash = await testHmac(message);
        if (e.hash !== expectedHash) {
          errors.push({ event_id: e.id, error: 'hash mismatch' });
        }
      }
      return { valid: errors.length === 0, errors, checked: events.length };
    },
    async getEvents({ limit = 50, offset = 0, order = 'desc' } = {}) {
      const dir = order === 'asc' ? 'ASC' : 'DESC';
      return query(`SELECT * FROM events ORDER BY id ${dir} LIMIT ? OFFSET ?`, [limit, offset]);
    },
  };
}
