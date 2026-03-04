/**
 * Browser-DB-Mock for demo recording.
 * Replaces @codefabrik/vereins-shared/db with sql.js (WASM SQLite in browser).
 * API-compatible: openDb(), query(sql, params), execute(sql, params), migrate(stmts).
 *
 * Auto-seeds demo data after initDb() completes (detected by _schema_meta + AppGestartet event).
 */

import initSqlJs from 'sql.js';

let db = null;
let _awaitingSeed = false;
let _seeded = false;

export async function openDb() {
  if (!db) {
    const SQL = await initSqlJs({
      locateFile: () => '/demo/sql-wasm.wasm',
    });
    db = new SQL.Database();
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

    // Auto-seed: detect initDb() completion
    // initDb() ends with: INSERT _schema_meta → appendEvent('AppGestartet')
    if (!_seeded && sql.includes('_schema_meta')) {
      _awaitingSeed = true;
    }
    if (_awaitingSeed && !_seeded && sql.includes('INSERT INTO events')) {
      _awaitingSeed = false;
      _seeded = true;
      const { seedDemoData } = await import('./seed-data.js');
      await seedDemoData();
    }

    return { lastInsertId, rowsAffected };
  } catch (err) {
    if (err.message?.includes('duplicate column name')) {
      return { lastInsertId: 0, rowsAffected: 0 };
    }
    console.error('execute error:', sql, params, err);
    throw err;
  }
}
