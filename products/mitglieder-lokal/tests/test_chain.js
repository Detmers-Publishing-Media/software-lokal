import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

function openFixtureCopy(version) {
  const fixturePath = join(__dirname, 'fixtures', `db_v${version}.sqlite`);
  const tmpDir = mkdtempSync(join(tmpdir(), 'ms-chain-'));
  const tmpDb = join(tmpDir, 'test.sqlite');
  copyFileSync(fixturePath, tmpDb);
  return new Database(tmpDb);
}

// Apply v0.2 migrations: DSGVO columns + club_profile
function migrateToV02(db) {
  const dsgvoCols = ['consent_phone', 'consent_email', 'consent_photo_internal',
                     'consent_photo_public', 'consent_withdrawn_at'];
  for (const col of dsgvoCols) {
    try { db.exec(`ALTER TABLE members ADD COLUMN ${col} TEXT`); } catch (_) { /* already exists */ }
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS club_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT '', street TEXT DEFAULT '', zip TEXT DEFAULT '',
      city TEXT DEFAULT '', register_court TEXT DEFAULT '', register_number TEXT DEFAULT '',
      tax_id TEXT DEFAULT '', iban TEXT DEFAULT '', bic TEXT DEFAULT '',
      bank_name TEXT DEFAULT '', contact_email TEXT DEFAULT '', contact_phone TEXT DEFAULT '',
      chairman TEXT DEFAULT '', logo_path TEXT DEFAULT ''
    )
  `);
  db.exec(`INSERT OR IGNORE INTO club_profile (id) VALUES (1)`);
}

// Apply v0.3 migrations: events + _schema_meta
function migrateToV03(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, timestamp TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'app', version INTEGER NOT NULL DEFAULT 1,
      data TEXT NOT NULL, hash TEXT NOT NULL, prev_hash TEXT NOT NULL
    )
  `);
  db.exec('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_meta (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      schema_version INTEGER NOT NULL DEFAULT 1,
      app_version TEXT NOT NULL, last_migration TEXT, event_replay_at TEXT
    )
  `);
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')`);
}

// Apply v0.4 migration: fee_payments
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

function appendEventSync(db, type, data) {
  const prev = db.prepare('SELECT id, hash FROM events ORDER BY id DESC LIMIT 1').get();
  const prevHash = prev?.hash ?? '0';
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
  const hash = computeHmacSync(message);
  db.prepare(
    'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)'
  ).run(type, timestamp, 'app', dataJson, hash, prevHash);
}

function verifyChainSync(db) {
  const events = db.prepare('SELECT * FROM events ORDER BY id').all();
  const errors = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const expectedPrev = i === 0 ? e.prev_hash : events[i - 1].hash;
    if (i > 0 && e.prev_hash !== expectedPrev) {
      errors.push({ event_id: e.id, error: 'prev_hash mismatch' });
    }
    const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
    const expectedHash = computeHmacSync(message);
    if (e.hash !== expectedHash) {
      errors.push({ event_id: e.id, error: 'hash mismatch' });
    }
  }
  return { valid: errors.length === 0, errors, checked: events.length };
}

describe('Ketten-Test v0.1 → v0.2 → v0.3', () => {
  let db;

  it('1. Start mit v0.1 Fixture (5 Mitglieder)', () => {
    db = openFixtureCopy('0.1.0');
    const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(count, 5);
    // No DSGVO columns, no events table
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(!tables.includes('events'));
    assert.ok(!tables.includes('club_profile'));
  });

  it('2. Migration auf v0.2 → DSGVO-Felder = NULL, Vereinsprofil existiert', () => {
    migrateToV02(db);
    const members = db.prepare('SELECT * FROM members').all();
    assert.equal(members.length, 5);
    // DSGVO fields should be NULL for all (v0.1 data)
    for (const m of members) {
      assert.equal(m.consent_phone, null);
      assert.equal(m.consent_email, null);
    }
    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    assert.ok(profile);
    assert.equal(profile.name, '');
  });

  it('3. v0.2 Nutzung: consent_phone setzen, Vereinsprofil, neues Mitglied', () => {
    // Set consent_phone for #1001
    db.prepare("UPDATE members SET consent_phone = '2026-01-15' WHERE member_number = '1001'").run();
    const m1001 = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    assert.equal(m1001.consent_phone, '2026-01-15');

    // Set club profile
    db.prepare(`UPDATE club_profile SET name = 'Testverein e.V.', city = 'Musterstadt' WHERE id = 1`).run();
    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    assert.equal(profile.name, 'Testverein e.V.');

    // Add member #1006
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1006', 'Lisa', 'Neumann', '2026-01-20', 'aktiv', 2)
    `).run();
    const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(count, 6);
  });

  it('4. Migration auf v0.3 → events + _schema_meta existieren', () => {
    migrateToV03(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('events'));
    assert.ok(tables.includes('_schema_meta'));
    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 3);
  });

  it('5. v0.3 Nutzung: Beitragsklasse aendern → Event + Hash-Kette', () => {
    // Change fee_class for #1001
    db.prepare('UPDATE members SET fee_class_id = 2 WHERE member_number = ?').run('1001');
    const m1001 = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    appendEventSync(db, 'MitgliedGeaendert', { ...m1001 });

    // Verify event exists
    const evts = db.prepare('SELECT * FROM events').all();
    assert.ok(evts.length >= 1);
    assert.equal(evts[evts.length - 1].type, 'MitgliedGeaendert');

    // Verify chain
    const result = verifyChainSync(db);
    assert.equal(result.valid, true, `Chain errors: ${JSON.stringify(result.errors)}`);
  });

  it('6. Finale Pruefung: 6 Mitglieder, alle Daten intakt', () => {
    const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(count, 6);

    // #1001 fee_class changed to 2, consent_phone set
    const m1001 = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    assert.equal(m1001.fee_class_id, 2);
    assert.equal(m1001.consent_phone, '2026-01-15');

    // #1006 exists
    const m1006 = db.prepare("SELECT * FROM members WHERE member_number = '1006'").get();
    assert.equal(m1006.first_name, 'Lisa');
    assert.equal(m1006.last_name, 'Neumann');

    // Club profile intact
    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    assert.equal(profile.name, 'Testverein e.V.');

    db.close();
  });
});

describe('Ketten-Test v0.1 → v0.2 → v0.3 → v0.4', () => {
  let db;

  it('1. Start mit v0.1, migriere bis v0.3', () => {
    db = openFixtureCopy('0.1.0');
    migrateToV02(db);
    migrateToV03(db);
    const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(count, 5);
  });

  it('2. Migration auf v0.4 → fee_payments-Tabelle existiert', () => {
    migrateToV04(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('fee_payments'));
    const meta = db.prepare('SELECT * FROM _schema_meta WHERE id = 1').get();
    assert.equal(meta.schema_version, 4);
  });

  it('3. v0.4 Nutzung: Zahlung buchen → Event pruefen', () => {
    const year = new Date().getFullYear();
    db.prepare(`
      INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method)
      VALUES (1, ?, 6000, ?, 'ueberweisung')
    `).run(year, `${year}-02-15`);

    appendEventSync(db, 'BeitragGezahlt', {
      member_id: 1, year, amount_cents: 6000,
      paid_date: `${year}-02-15`, payment_method: 'ueberweisung',
    });

    const payments = db.prepare('SELECT * FROM fee_payments WHERE member_id = 1').all();
    assert.equal(payments.length, 1);
    assert.equal(payments[0].amount_cents, 6000);

    const result = verifyChainSync(db);
    assert.equal(result.valid, true, `Chain errors: ${JSON.stringify(result.errors)}`);

    db.close();
  });
});
