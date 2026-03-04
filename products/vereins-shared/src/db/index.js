import Database from '@tauri-apps/plugin-sql';

let db = null;

export async function openDb() {
  if (!db) {
    db = await Database.load('sqlite:mitglieder.db');
  }
  return db;
}

export async function migrate(sqlStatements) {
  const conn = await openDb();
  for (const stmt of sqlStatements) {
    await conn.execute(stmt);
  }
}

export async function query(sql, params = []) {
  const conn = await openDb();
  return conn.select(sql, params);
}

export async function execute(sql, params = []) {
  const conn = await openDb();
  return conn.execute(sql, params);
}
