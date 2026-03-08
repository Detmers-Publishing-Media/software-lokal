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
