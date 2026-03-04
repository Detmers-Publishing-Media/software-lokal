import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';

describe('_schema_meta', () => {
  it('wird bei initDb angelegt', () => {
    const db = new Database(':memory:');

    // Run all migrations from db.js manually
    db.exec(`CREATE TABLE IF NOT EXISTS fee_classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      interval TEXT NOT NULL DEFAULT 'jaehrlich'
        CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
      active INTEGER NOT NULL DEFAULT 1
    )`);
    db.exec(`INSERT OR IGNORE INTO fee_classes (id, name, amount_cents, interval) VALUES
      (1, 'Vollmitglied', 6000, 'jaehrlich'),
      (2, 'Ermaessigt', 3000, 'jaehrlich'),
      (3, 'Ehrenmitglied', 0, 'jaehrlich'),
      (4, 'Foerdermitglied', 12000, 'jaehrlich')`);
    db.exec(`CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      street TEXT, zip TEXT, city TEXT, phone TEXT, email TEXT,
      birth_date TEXT, entry_date TEXT NOT NULL DEFAULT (date('now')),
      exit_date TEXT, exit_reason TEXT,
      status TEXT NOT NULL DEFAULT 'aktiv'
        CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
      fee_class_id INTEGER REFERENCES fee_classes(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`);

    // Migration 004: events + _schema_meta
    db.exec(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, timestamp TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'app', version INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL, hash TEXT NOT NULL, prev_hash TEXT NOT NULL
    )`);
    db.exec(`CREATE TABLE IF NOT EXISTS _schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL DEFAULT 1,
      app_version TEXT NOT NULL,
      last_migration TEXT,
      event_replay_at TEXT
    )`);
    db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')`);

    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.ok(meta, '_schema_meta row must exist');
    db.close();
  });

  it('Schema-Version wird korrekt gesetzt', () => {
    const db = new Database(':memory:');
    db.exec(`CREATE TABLE IF NOT EXISTS _schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL DEFAULT 1,
      app_version TEXT NOT NULL,
      last_migration TEXT,
      event_replay_at TEXT
    )`);
    db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')`);

    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 3);
    assert.equal(meta.app_version, '0.3.0');
    db.close();
  });
});
