import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';
import { generateCsv } from '@codefabrik/shared/csv';

const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

// Run all migrations v0.1–v0.3 on an in-memory DB
function initFullDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // v0.1
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
    consent_phone TEXT, consent_email TEXT, consent_photo_internal TEXT,
    consent_photo_public TEXT, consent_withdrawn_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  // v0.2
  db.exec(`CREATE TABLE IF NOT EXISTS club_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '', street TEXT DEFAULT '', zip TEXT DEFAULT '',
    city TEXT DEFAULT '', register_court TEXT DEFAULT '', register_number TEXT DEFAULT '',
    tax_id TEXT DEFAULT '', iban TEXT DEFAULT '', bic TEXT DEFAULT '',
    bank_name TEXT DEFAULT '', contact_email TEXT DEFAULT '', contact_phone TEXT DEFAULT '',
    chairman TEXT DEFAULT '', logo_path TEXT DEFAULT ''
  )`);
  db.exec(`INSERT OR IGNORE INTO club_profile (id) VALUES (1)`);

  // v0.3
  db.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, timestamp TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'app', version INTEGER NOT NULL DEFAULT 1,
    data TEXT NOT NULL, hash TEXT NOT NULL, prev_hash TEXT NOT NULL
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)');
  db.exec(`CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL, last_migration TEXT, event_replay_at TEXT
  )`);
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 3, '0.3.0')`);

  return db;
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
    if (i > 0 && e.prev_hash !== events[i - 1].hash) {
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

describe('Smoke-Tests (Node.js)', () => {
  let db;

  beforeEach(() => {
    db = initFullDb();
    appendEventSync(db, 'AppGestartet', { version: '0.3.0', schema_version: 3 });
  });

  it('DB initialisiert fehlerfrei (alle Tabellen vorhanden)', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
    assert.ok(tables.includes('fee_classes'));
    assert.ok(tables.includes('members'));
    assert.ok(tables.includes('club_profile'));
    assert.ok(tables.includes('events'));
    assert.ok(tables.includes('_schema_meta'));
  });

  it('Mitglied anlegen → in DB vorhanden', () => {
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1001', 'Hans', 'Mueller', '2024-01-15', 'aktiv', 1)
    `).run();
    appendEventSync(db, 'MitgliedAngelegt', {
      id: 1, member_number: '1001', first_name: 'Hans', last_name: 'Mueller',
      entry_date: '2024-01-15', status: 'aktiv', fee_class_id: 1,
    });

    const member = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    assert.ok(member);
    assert.equal(member.first_name, 'Hans');
    assert.equal(member.last_name, 'Mueller');
  });

  it('Mitglied bearbeiten → Aenderung persistiert', () => {
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1001', 'Hans', 'Mueller', '2024-01-15', 'aktiv', 1)
    `).run();

    db.prepare("UPDATE members SET city = 'Berlin' WHERE member_number = '1001'").run();
    const m = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    appendEventSync(db, 'MitgliedGeaendert', { ...m });

    assert.equal(m.city, 'Berlin');
  });

  it('Mitglied loeschen → entfernt', () => {
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1001', 'Hans', 'Mueller', '2024-01-15', 'aktiv', 1)
    `).run();
    appendEventSync(db, 'MitgliedAngelegt', { id: 1, member_number: '1001' });

    db.prepare("DELETE FROM members WHERE member_number = '1001'").run();
    appendEventSync(db, 'MitgliedGeloescht', { id: 1, member_number: '1001' });

    const count = db.prepare('SELECT COUNT(*) as c FROM members').get().c;
    assert.equal(count, 0);
  });

  it('CSV-Export erzeugt gueltigen Output', () => {
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1001', 'Hans', 'Mueller', '2024-01-15', 'aktiv', 1)
    `).run();
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1002', 'Anna', 'Schmidt', '2024-03-01', 'passiv', 2)
    `).run();

    const members = db.prepare(`
      SELECT m.*, fc.name as fee_class_name
      FROM members m LEFT JOIN fee_classes fc ON m.fee_class_id = fc.id
      ORDER BY m.last_name, m.first_name
    `).all();

    const columns = [
      { key: 'member_number', label: 'Nr.' },
      { key: 'last_name', label: 'Nachname' },
      { key: 'first_name', label: 'Vorname' },
      { key: 'status', label: 'Status' },
    ];
    const csv = generateCsv(members, columns);

    assert.ok(csv.startsWith('\uFEFF'), 'BOM missing');
    const lines = csv.replace('\uFEFF', '').split('\r\n');
    assert.equal(lines[0], 'Nr.;Nachname;Vorname;Status');
    assert.equal(lines.length, 3); // header + 2 rows
  });

  it('Vereinsprofil speichern + laden', () => {
    db.prepare(`UPDATE club_profile SET name = 'Testverein e.V.', city = 'Musterstadt' WHERE id = 1`).run();
    appendEventSync(db, 'VereinsprofilGespeichert', { name: 'Testverein e.V.', city: 'Musterstadt' });

    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    assert.equal(profile.name, 'Testverein e.V.');
    assert.equal(profile.city, 'Musterstadt');
  });

  it('Beitragsklasse CRUD', () => {
    // Read defaults
    const classes = db.prepare('SELECT * FROM fee_classes WHERE active = 1 ORDER BY name').all();
    assert.ok(classes.length >= 4);

    // Create
    db.prepare("INSERT INTO fee_classes (name, amount_cents, interval) VALUES ('Jugend', 1500, 'jaehrlich')").run();
    appendEventSync(db, 'BeitragsklasseAngelegt', { id: 5, name: 'Jugend', amount_cents: 1500, interval: 'jaehrlich' });
    const jugend = db.prepare("SELECT * FROM fee_classes WHERE name = 'Jugend'").get();
    assert.ok(jugend);
    assert.equal(jugend.amount_cents, 1500);

    // Update
    db.prepare("UPDATE fee_classes SET amount_cents = 2000 WHERE name = 'Jugend'").run();
    appendEventSync(db, 'BeitragsklasseGeaendert', { id: jugend.id, name: 'Jugend', amount_cents: 2000 });
    const updated = db.prepare("SELECT * FROM fee_classes WHERE name = 'Jugend'").get();
    assert.equal(updated.amount_cents, 2000);
  });

  it('Event-Kette nach allen Operationen gueltig', () => {
    // Perform multiple operations
    db.prepare(`
      INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
      VALUES ('1001', 'Hans', 'Mueller', '2024-01-15', 'aktiv', 1)
    `).run();
    appendEventSync(db, 'MitgliedAngelegt', { id: 1, member_number: '1001' });

    db.prepare("UPDATE members SET city = 'Berlin' WHERE member_number = '1001'").run();
    const m = db.prepare("SELECT * FROM members WHERE member_number = '1001'").get();
    appendEventSync(db, 'MitgliedGeaendert', { ...m });

    db.prepare(`UPDATE club_profile SET name = 'Testverein e.V.' WHERE id = 1`).run();
    appendEventSync(db, 'VereinsprofilGespeichert', { name: 'Testverein e.V.' });

    db.prepare("INSERT INTO fee_classes (name, amount_cents, interval) VALUES ('Jugend', 1500, 'jaehrlich')").run();
    appendEventSync(db, 'BeitragsklasseAngelegt', { name: 'Jugend', amount_cents: 1500 });

    // Verify chain
    const result = verifyChainSync(db);
    assert.equal(result.valid, true, `Chain errors: ${JSON.stringify(result.errors)}`);
    assert.ok(result.checked >= 5); // AppGestartet + 4 operations
  });

  // PDF tests skipped — pdfMake requires DOM.
  // Full PDF smoke tests via Tauri/Windows.
});
