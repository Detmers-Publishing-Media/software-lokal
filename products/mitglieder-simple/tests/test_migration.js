import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, 'fixtures', 'db_v0.2.0.sqlite');

// Apply v0.3 migrations to a better-sqlite3 database
function migrateToV03(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'app',
      version INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL,
      hash TEXT NOT NULL,
      prev_hash TEXT NOT NULL
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL DEFAULT 1,
      app_version TEXT NOT NULL,
      last_migration TEXT,
      event_replay_at TEXT
    )
  `);
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')`);
}

function openFixtureCopy() {
  const tmpDir = mkdtempSync(join(tmpdir(), 'ms-test-'));
  const tmpDb = join(tmpDir, 'test.sqlite');
  copyFileSync(FIXTURE_PATH, tmpDb);
  return new Database(tmpDb);
}

describe('Migration v0.2 → v0.3', () => {
  it('Fixture laesst sich oeffnen', () => {
    const db = openFixtureCopy();
    assert.ok(db);
    db.close();
  });

  it('Alle 5 Mitglieder vorhanden', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    const members = db.prepare('SELECT * FROM members').all();
    assert.equal(members.length, 5);
    db.close();
  });

  it('DSGVO-Felder erhalten', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    const m1001 = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    assert.ok('consent_phone' in m1001, 'consent_phone column must exist');
    assert.equal(m1001.consent_phone, '2024-01-15');

    const m1004 = db.prepare("SELECT * FROM members WHERE member_number = '1004'").get();
    assert.equal(m1004.consent_phone, '2024-06-15');
    assert.equal(m1004.consent_email, '2024-06-15');
    db.close();
  });

  it('Vereinsprofil erhalten', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    assert.equal(profile.name, 'Testverein e.V.');
    assert.equal(profile.city, 'Musterstadt');
    db.close();
  });

  it('events-Tabelle existiert', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'").all();
    assert.equal(tables.length, 1);
    db.close();
  });

  it('_schema_meta hat Version 3', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 3);
    assert.equal(meta.app_version, '0.3.0');
    db.close();
  });
});

// Apply v0.4 migration to a better-sqlite3 database (expects v0.3 schema)
function migrateToV04(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fee_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      paid_date TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'ueberweisung'
        CHECK (payment_method IN ('bar', 'ueberweisung')),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_fee_payments_member_year ON fee_payments(member_id, year)');
  db.exec(`UPDATE _schema_meta SET schema_version = 4, app_version = '0.4.0' WHERE id = 1`);
}

describe('Migration v0.3 → v0.4', () => {
  it('v0.3 Fixture + Migration → fee_payments Tabelle existiert', () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'ms-test-'));
    const tmpDb = join(tmpDir, 'test.sqlite');
    copyFileSync(join(__dirname, 'fixtures', 'db_v0.3.0.sqlite'), tmpDb);
    const db = new Database(tmpDb);
    migrateToV04(db);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='fee_payments'").all();
    assert.equal(tables.length, 1);

    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 4);
    assert.equal(meta.app_version, '0.4.0');

    // Existing data intact
    const members = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(members, 5);

    db.close();
  });
});

describe('Migration v0.2 → v0.4', () => {
  it('v0.2 Fixture → v0.3 → v0.4 alle Daten intakt', () => {
    const db = openFixtureCopy();
    migrateToV03(db);
    migrateToV04(db);

    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 4);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('fee_payments'));
    assert.ok(tables.includes('events'));

    const members = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(members, 5);

    db.close();
  });
});

describe('Neuinstallation', () => {
  it('Leere DB → v0.3 funktioniert', () => {
    const db = new Database(':memory:');

    // Run all migrations from scratch (v0.1 + v0.2 + v0.3)
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

    // v0.2 DSGVO columns
    const dsgvoCols = ['consent_phone', 'consent_email', 'consent_photo_internal',
                       'consent_photo_public', 'consent_withdrawn_at'];
    for (const col of dsgvoCols) {
      try { db.exec(`ALTER TABLE members ADD COLUMN ${col} TEXT`); } catch (_) {}
    }

    // v0.2 Club profile
    db.exec(`CREATE TABLE IF NOT EXISTS club_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT '', street TEXT DEFAULT '', zip TEXT DEFAULT '',
      city TEXT DEFAULT '', register_court TEXT DEFAULT '', register_number TEXT DEFAULT '',
      tax_id TEXT DEFAULT '', iban TEXT DEFAULT '', bic TEXT DEFAULT '',
      bank_name TEXT DEFAULT '', contact_email TEXT DEFAULT '', contact_phone TEXT DEFAULT '',
      chairman TEXT DEFAULT '', logo_path TEXT DEFAULT ''
    )`);
    db.exec(`INSERT OR IGNORE INTO club_profile (id) VALUES (1)`);

    // v0.3 Event-Log + Schema meta
    migrateToV03(db);

    // Verify all tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('fee_classes'));
    assert.ok(tables.includes('members'));
    assert.ok(tables.includes('club_profile'));
    assert.ok(tables.includes('events'));
    assert.ok(tables.includes('_schema_meta'));

    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 3);

    db.close();
  });
});
