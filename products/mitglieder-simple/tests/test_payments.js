import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';
import { annualAmountCents } from '../src/lib/types.js';

const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

function initFullDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // v0.1
  db.exec(`CREATE TABLE IF NOT EXISTS fee_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, amount_cents INTEGER NOT NULL DEFAULT 0,
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
    member_number TEXT UNIQUE NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
    street TEXT, zip TEXT, city TEXT, phone TEXT, email TEXT,
    birth_date TEXT, entry_date TEXT NOT NULL DEFAULT (date('now')),
    exit_date TEXT, exit_reason TEXT,
    status TEXT NOT NULL DEFAULT 'aktiv'
      CHECK (status IN ('aktiv', 'passiv', 'ausgetreten', 'verstorben')),
    fee_class_id INTEGER REFERENCES fee_classes(id),
    notes TEXT, consent_phone TEXT, consent_email TEXT, consent_photo_internal TEXT,
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
  db.exec('INSERT OR IGNORE INTO club_profile (id) VALUES (1)');

  // v0.3
  db.exec(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, timestamp TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'app', version INTEGER NOT NULL DEFAULT 1,
    data TEXT NOT NULL, hash TEXT NOT NULL, prev_hash TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL, last_migration TEXT, event_replay_at TEXT
  )`);

  // v0.4
  db.exec(`CREATE TABLE IF NOT EXISTS fee_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    paid_date TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'ueberweisung'
      CHECK (payment_method IN ('bar', 'ueberweisung')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_fee_payments_member_year ON fee_payments(member_id, year)');
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 4, '0.4.0')`);

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

function insertTestMember(db, number, firstName, lastName, feeClassId, status = 'aktiv') {
  db.prepare(`
    INSERT INTO members (member_number, first_name, last_name, entry_date, status, fee_class_id)
    VALUES (?, ?, ?, '2024-01-15', ?, ?)
  `).run(number, firstName, lastName, status, feeClassId);
}

describe('annualAmountCents', () => {
  it('jaehrlich → 1x', () => {
    assert.equal(annualAmountCents(6000, 'jaehrlich'), 6000);
  });
  it('halbjaehrlich → 2x', () => {
    assert.equal(annualAmountCents(3000, 'halbjaehrlich'), 6000);
  });
  it('vierteljaehrlich → 4x', () => {
    assert.equal(annualAmountCents(1500, 'vierteljaehrlich'), 6000);
  });
  it('monatlich → 12x', () => {
    assert.equal(annualAmountCents(500, 'monatlich'), 6000);
  });
});

describe('Payment CRUD', () => {
  let db;
  const year = 2026;

  beforeEach(() => {
    db = initFullDb();
    insertTestMember(db, '1001', 'Hans', 'Mueller', 1);
    insertTestMember(db, '1002', 'Anna', 'Schmidt', 2);
    insertTestMember(db, '1005', 'Thomas', 'Bauer', 3); // Ehrenmitglied
  });

  it('Zahlung anlegen', () => {
    db.prepare(`
      INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method)
      VALUES (1, ?, 6000, '2026-02-15', 'ueberweisung')
    `).run(year);

    const payments = db.prepare('SELECT * FROM fee_payments WHERE member_id = 1').all();
    assert.equal(payments.length, 1);
    assert.equal(payments[0].amount_cents, 6000);
    assert.equal(payments[0].payment_method, 'ueberweisung');
  });

  it('Zahlung loeschen', () => {
    const info = db.prepare(`
      INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method)
      VALUES (1, ?, 6000, '2026-02-15', 'ueberweisung')
    `).run(year);

    db.prepare('DELETE FROM fee_payments WHERE id = ?').run(info.lastInsertRowid);
    const count = db.prepare('SELECT COUNT(*) as c FROM fee_payments').get().c;
    assert.equal(count, 0);
  });

  it('Teilzahlung moeglich', () => {
    db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date) VALUES (2, ?, 1500, '2026-03-01')`).run(year);
    db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date) VALUES (2, ?, 1500, '2026-06-01')`).run(year);

    const total = db.prepare('SELECT SUM(amount_cents) as total FROM fee_payments WHERE member_id = 2 AND year = ?').get(year);
    assert.equal(total.total, 3000);
  });

  it('Zahlungsart CHECK constraint', () => {
    assert.throws(() => {
      db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method) VALUES (1, ?, 100, '2026-01-01', 'kreditkarte')`).run(year);
    });
  });

  it('CASCADE: Mitglied loeschen → Zahlungen geloescht', () => {
    db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date) VALUES (1, ?, 6000, '2026-02-15')`).run(year);
    db.prepare('DELETE FROM members WHERE id = 1').run();

    const count = db.prepare('SELECT COUNT(*) as c FROM fee_payments WHERE member_id = 1').get().c;
    assert.equal(count, 0);
  });

  it('Jahresuebersicht: expected vs paid', () => {
    db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date) VALUES (1, ?, 6000, '2026-02-15')`).run(year);
    db.prepare(`INSERT INTO fee_payments (member_id, year, amount_cents, paid_date) VALUES (2, ?, 1500, '2026-03-01')`).run(year);

    const overview = db.prepare(`
      SELECT m.id, m.member_number, m.first_name, m.last_name, m.status,
        fc.name as fee_class_name, fc.amount_cents, fc.interval,
        COALESCE(p.paid_cents, 0) as paid_cents
      FROM members m
      LEFT JOIN fee_classes fc ON m.fee_class_id = fc.id
      LEFT JOIN (
        SELECT member_id, SUM(amount_cents) as paid_cents
        FROM fee_payments WHERE year = ?
        GROUP BY member_id
      ) p ON m.id = p.member_id
      WHERE m.status IN ('aktiv', 'passiv')
      ORDER BY m.last_name, m.first_name
    `).all(year);

    assert.equal(overview.length, 3);

    // Mueller: Vollmitglied (6000), paid 6000
    const mueller = overview.find(m => m.member_number === '1001');
    assert.equal(mueller.amount_cents, 6000);
    assert.equal(mueller.paid_cents, 6000);

    // Schmidt: Ermaessigt (3000), paid 1500
    const schmidt = overview.find(m => m.member_number === '1002');
    assert.equal(schmidt.amount_cents, 3000);
    assert.equal(schmidt.paid_cents, 1500);

    // Bauer: Ehrenmitglied (0), paid 0
    const bauer = overview.find(m => m.member_number === '1005');
    assert.equal(bauer.amount_cents, 0);
    assert.equal(bauer.paid_cents, 0);
  });

  it('Events fuer Zahlungen werden korrekt erzeugt', () => {
    appendEventSync(db, 'BeitragGezahlt', {
      member_id: 1, year, amount_cents: 6000,
      paid_date: '2026-02-15', payment_method: 'ueberweisung',
    });

    const events = db.prepare("SELECT * FROM events WHERE type = 'BeitragGezahlt'").all();
    assert.equal(events.length, 1);
    const data = JSON.parse(events[0].data);
    assert.equal(data.member_id, 1);
    assert.equal(data.amount_cents, 6000);
  });
});
