/**
 * Browser-DB-Mock for demo recording.
 * Replaces @codefabrik/vereins-shared/db with sql.js (WASM SQLite in browser).
 * API-compatible: openDb(), query(sql, params), execute(sql, params), migrate(stmts).
 */

import initSqlJs from 'sql.js';

let db = null;

export async function openDb() {
  if (!db) {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });
    db = new SQL.Database();
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
  return db;
}

export async function migrate(sqlStatements) {
  await openDb();
  for (const stmt of sqlStatements) {
    db.run(stmt);
  }
}

export async function query(sql, params = []) {
  await openDb();
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } catch (err) {
    console.error('query error:', sql, params, err);
    throw err;
  }
}

export async function execute(sql, params = []) {
  await openDb();
  try {
    db.run(sql, params);
    const lastInsertId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0] ?? 0;
    const rowsAffected = db.getRowsModified();
    return { lastInsertId, rowsAffected };
  } catch (err) {
    // Swallow ALTER TABLE errors for "column already exists" (migration idempotency)
    if (err.message?.includes('duplicate column name')) {
      return { lastInsertId: 0, rowsAffected: 0 };
    }
    console.error('execute error:', sql, params, err);
    throw err;
  }
}
