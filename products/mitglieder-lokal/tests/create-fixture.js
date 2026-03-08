#!/usr/bin/env node
// Fixture generator for MitgliederSimple test databases.
// Usage: node tests/create-fixture.js [version]
// Default version: 0.3.0

import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const version = process.argv[2] || '0.3.0';
const [major, minor, patch] = version.split('.').map(Number);
const outPath = join(__dirname, 'fixtures', `db_v${version}.sqlite`);

mkdirSync(join(__dirname, 'fixtures'), { recursive: true });

const db = new Database(outPath);
db.pragma('journal_mode = WAL');

const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

// --- Migration 001: fee_classes + members (all versions) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS fee_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'jaehrlich'
      CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
    active INTEGER NOT NULL DEFAULT 1
  )
`);
db.exec(`
  INSERT OR IGNORE INTO fee_classes (id, name, amount_cents, interval) VALUES
    (1, 'Vollmitglied', 6000, 'jaehrlich'),
    (2, 'Ermaessigt', 3000, 'jaehrlich'),
    (3, 'Ehrenmitglied', 0, 'jaehrlich'),
    (4, 'Foerdermitglied', 12000, 'jaehrlich')
`);

if (minor < 2) {
  // v0.1: members without DSGVO columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      street TEXT,
      zip TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      entry_date TEXT NOT NULL DEFAULT (date('now')),
      exit_date TEXT,
      exit_reason TEXT,
      status TEXT NOT NULL DEFAULT 'aktiv'
        CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
      fee_class_id INTEGER REFERENCES fee_classes(id),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
} else {
  // v0.2+: members with DSGVO columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_number TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      street TEXT,
      zip TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      entry_date TEXT NOT NULL DEFAULT (date('now')),
      exit_date TEXT,
      exit_reason TEXT,
      status TEXT NOT NULL DEFAULT 'aktiv'
        CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
      fee_class_id INTEGER REFERENCES fee_classes(id),
      notes TEXT,
      consent_phone TEXT,
      consent_email TEXT,
      consent_photo_internal TEXT,
      consent_photo_public TEXT,
      consent_withdrawn_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}

// --- Migration 003: Club profile (v0.2+) ---

if (minor >= 2) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS club_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT '',
      street TEXT DEFAULT '',
      zip TEXT DEFAULT '',
      city TEXT DEFAULT '',
      register_court TEXT DEFAULT '',
      register_number TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      iban TEXT DEFAULT '',
      bic TEXT DEFAULT '',
      bank_name TEXT DEFAULT '',
      contact_email TEXT DEFAULT '',
      contact_phone TEXT DEFAULT '',
      chairman TEXT DEFAULT '',
      logo_path TEXT DEFAULT ''
    )
  `);
  db.exec(`INSERT OR IGNORE INTO club_profile (id) VALUES (1)`);
}

// --- Migration 004: Event-Log + Schema meta (v0.3+) ---

if (minor >= 3) {
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
}

// --- Migration 005: fee_payments (v0.4+) ---

if (minor >= 4) {
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
}

// --- Schema meta ---

if (minor >= 3) {
  const schemaVersion = minor >= 4 ? 4 : 3;
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version, last_migration) VALUES (1, ${schemaVersion}, '${version}', datetime('now'))`);
}

// --- Event helper ---

const events = [];
function appendEventSync(type, data) {
  const prevHash = events.length > 0 ? events[events.length - 1].hash : '0';
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
  const hash = computeHmacSync(message);

  db.prepare(
    'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)'
  ).run(type, timestamp, 'app', dataJson, hash, prevHash);

  events.push({ type, timestamp, data: dataJson, hash, prev_hash: prevHash });
}

// --- Event: AppGestartet (v0.3+) ---

if (minor >= 3) {
  const schemaVersion = minor >= 4 ? 4 : 3;
  appendEventSync('AppGestartet', { version, schema_version: schemaVersion });
}

// --- Custom fee class: Jugend ---

db.exec(`INSERT INTO fee_classes (name, amount_cents, interval) VALUES ('Jugend', 1500, 'jaehrlich')`);
if (minor >= 3) {
  const jugendId = db.prepare('SELECT last_insert_rowid() as id').get().id;
  appendEventSync('BeitragsklasseAngelegt', { id: jugendId, name: 'Jugend', amount_cents: 1500, interval: 'jaehrlich' });
}

// --- Events for default fee classes (v0.3+) ---

if (minor >= 3) {
  const defaultClasses = [
    { id: 1, name: 'Vollmitglied', amount_cents: 6000, interval: 'jaehrlich' },
    { id: 2, name: 'Ermaessigt', amount_cents: 3000, interval: 'jaehrlich' },
    { id: 3, name: 'Ehrenmitglied', amount_cents: 0, interval: 'jaehrlich' },
    { id: 4, name: 'Foerdermitglied', amount_cents: 12000, interval: 'jaehrlich' },
  ];
  for (const fc of defaultClasses) {
    appendEventSync('BeitragsklasseAngelegt', fc);
  }
}

// --- Standard test data set ---

const testMembers = [
  {
    number: '1001', first: 'Hans', last: 'Mueller',
    street: 'Hauptstr. 1', zip: '10115', city: 'Berlin',
    phone: '030-1234567', email: 'hans.mueller@example.de',
    birth_date: '1975-03-15', entry_date: '2024-01-15',
    exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 1,
    notes: null,
    consent_phone: '2024-01-15', consent_email: null,
    consent_photo_internal: null, consent_photo_public: null, consent_withdrawn_at: null,
    created_at: '2024-01-15T10:00:00', updated_at: '2024-01-15T10:00:00',
  },
  {
    number: '1002', first: 'Anna', last: 'Schmidt',
    street: null, zip: null, city: null,
    phone: null, email: null,
    birth_date: null, entry_date: '2024-03-01',
    exit_date: null, exit_reason: null, status: 'passiv', fee_class_id: 2,
    notes: null,
    consent_phone: null, consent_email: null,
    consent_photo_internal: null, consent_photo_public: null, consent_withdrawn_at: null,
    created_at: '2024-03-01T08:00:00', updated_at: '2024-03-01T08:00:00',
  },
  {
    number: '1003', first: 'Karl', last: 'Weber',
    street: 'Gartenweg 5', zip: '80331', city: 'Muenchen',
    phone: null, email: 'karl.weber@example.de',
    birth_date: '1960-11-20', entry_date: '2022-06-01',
    exit_date: '2025-12-31', exit_reason: 'Umzug', status: 'ausgetreten', fee_class_id: 1,
    notes: null,
    consent_phone: null, consent_email: null,
    consent_photo_internal: null, consent_photo_public: null, consent_withdrawn_at: null,
    created_at: '2022-06-01T12:00:00', updated_at: '2025-12-31T00:00:00',
  },
  {
    number: '1004', first: 'Maria', last: 'Fischer',
    street: 'Am Ring 12', zip: '50667', city: 'Koeln',
    phone: '0221-9876543', email: 'maria.fischer@example.de',
    birth_date: '1988-07-04', entry_date: '2024-06-15',
    exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 1,
    notes: null,
    consent_phone: '2024-06-15', consent_email: '2024-06-15',
    consent_photo_internal: null, consent_photo_public: null, consent_withdrawn_at: null,
    created_at: '2024-06-15T14:00:00', updated_at: '2024-06-15T14:00:00',
  },
  {
    number: '1005', first: 'Thomas', last: 'Bauer',
    street: 'Schlossallee 1', zip: '20095', city: 'Hamburg',
    phone: '040-5555555', email: 'thomas.bauer@example.de',
    birth_date: '1950-01-01', entry_date: '2020-01-01',
    exit_date: null, exit_reason: null, status: 'aktiv', fee_class_id: 3,
    notes: 'Gruendungsmitglied',
    consent_phone: null, consent_email: null,
    consent_photo_internal: null, consent_photo_public: null, consent_withdrawn_at: null,
    created_at: '2020-01-01T00:00:00', updated_at: '2020-01-01T00:00:00',
  },
];

if (minor < 2) {
  // v0.1: no DSGVO columns
  const insertMember = db.prepare(`
    INSERT INTO members (member_number, first_name, last_name, street, zip, city,
      phone, email, birth_date, entry_date, exit_date, exit_reason, status,
      fee_class_id, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of testMembers) {
    insertMember.run(
      m.number, m.first, m.last, m.street, m.zip, m.city,
      m.phone, m.email, m.birth_date, m.entry_date, m.exit_date, m.exit_reason,
      m.status, m.fee_class_id, m.notes, m.created_at, m.updated_at
    );
  }
} else {
  // v0.2+: with DSGVO columns
  const insertMember = db.prepare(`
    INSERT INTO members (member_number, first_name, last_name, street, zip, city,
      phone, email, birth_date, entry_date, exit_date, exit_reason, status,
      fee_class_id, notes, consent_phone, consent_email, consent_photo_internal,
      consent_photo_public, consent_withdrawn_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const m of testMembers) {
    insertMember.run(
      m.number, m.first, m.last, m.street, m.zip, m.city,
      m.phone, m.email, m.birth_date, m.entry_date, m.exit_date, m.exit_reason,
      m.status, m.fee_class_id, m.notes,
      m.consent_phone, m.consent_email, m.consent_photo_internal,
      m.consent_photo_public, m.consent_withdrawn_at,
      m.created_at, m.updated_at
    );
  }
}

// --- Events for members (v0.3+) ---

if (minor >= 3) {
  const allMembers = db.prepare('SELECT * FROM members').all();
  for (const m of allMembers) {
    appendEventSync('MitgliedAngelegt', { ...m });
  }
}

// --- Club profile data (v0.2+) ---

if (minor >= 2) {
  db.exec(`
    UPDATE club_profile SET
      name = 'Testverein e.V.',
      street = 'Vereinsstr. 42',
      zip = '12345',
      city = 'Musterstadt',
      chairman = 'Hans Mueller'
    WHERE id = 1
  `);
  if (minor >= 3) {
    const profile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    appendEventSync('VereinsprofilGespeichert', { ...profile });
  }
}

// --- Fee payments (v0.4+) ---

if (minor >= 4) {
  const currentYear = new Date().getFullYear();
  const paymentData = [
    // #1001 Mueller: 60.00 EUR paid (Vollmitglied, complete)
    { member_id: 1, year: currentYear, amount_cents: 6000, paid_date: `${currentYear}-02-15`, payment_method: 'ueberweisung', notes: null },
    // #1002 Schmidt: 15.00 EUR (Ermaessigt=30, partial)
    { member_id: 2, year: currentYear, amount_cents: 1500, paid_date: `${currentYear}-03-01`, payment_method: 'bar', notes: 'Teilzahlung' },
    // #1004 Fischer: 0 EUR (open) — no payment record
    // #1005 Bauer: no payment needed (Ehrenmitglied, exempt)
  ];

  const insertPayment = db.prepare(`
    INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const p of paymentData) {
    insertPayment.run(p.member_id, p.year, p.amount_cents, p.paid_date, p.payment_method, p.notes);
    appendEventSync('BeitragGezahlt', {
      member_id: p.member_id,
      year: p.year,
      amount_cents: p.amount_cents,
      paid_date: p.paid_date,
      payment_method: p.payment_method,
    });
  }
}

// --- Export events JSON (v0.3+) ---

if (minor >= 3) {
  const allEvents = db.prepare('SELECT * FROM events ORDER BY id').all();
  const eventsPath = join(__dirname, 'fixtures', `events_v${version}.json`);
  writeFileSync(eventsPath, JSON.stringify(allEvents, null, 2));
  console.log(`Events exported: ${eventsPath}`);
}

db.close();
console.log(`Fixture created: ${outPath}`);
