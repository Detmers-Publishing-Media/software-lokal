import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

function loadEventsJson(version) {
  const eventsPath = join(__dirname, 'fixtures', `events_v${version}.json`);
  return JSON.parse(readFileSync(eventsPath, 'utf-8'));
}

// Create empty v0.3 DB with tables but no data
function createEmptyV03Db() {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE IF NOT EXISTS fee_classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    interval TEXT NOT NULL DEFAULT 'jaehrlich'
      CHECK (interval IN ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich')),
    active INTEGER NOT NULL DEFAULT 1
  )`);
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
  db.exec(`CREATE TABLE IF NOT EXISTS club_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '', street TEXT DEFAULT '', zip TEXT DEFAULT '',
    city TEXT DEFAULT '', register_court TEXT DEFAULT '', register_number TEXT DEFAULT '',
    tax_id TEXT DEFAULT '', iban TEXT DEFAULT '', bic TEXT DEFAULT '',
    bank_name TEXT DEFAULT '', contact_email TEXT DEFAULT '', contact_phone TEXT DEFAULT '',
    chairman TEXT DEFAULT '', logo_path TEXT DEFAULT ''
  )`);
  db.exec(`INSERT OR IGNORE INTO club_profile (id) VALUES (1)`);
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
  return db;
}

// Replay a single event into the database
function replayEvent(db, event) {
  const data = JSON.parse(event.data);

  switch (event.type) {
    case 'AppGestartet':
      db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version) VALUES (1, ${data.schema_version}, '${data.version}')`);
      break;

    case 'BeitragsklasseAngelegt': {
      const existing = db.prepare('SELECT id FROM fee_classes WHERE id = ?').get(data.id);
      if (existing) {
        db.prepare('UPDATE fee_classes SET name = ?, amount_cents = ?, interval = ? WHERE id = ?')
          .run(data.name, data.amount_cents, data.interval, data.id);
      } else {
        db.prepare('INSERT INTO fee_classes (id, name, amount_cents, interval) VALUES (?, ?, ?, ?)')
          .run(data.id, data.name, data.amount_cents, data.interval);
      }
      break;
    }

    case 'BeitragsklasseGeaendert':
      db.prepare('UPDATE fee_classes SET name = ?, amount_cents = ?, interval = ?, active = ? WHERE id = ?')
        .run(data.name, data.amount_cents, data.interval, data.active ?? 1, data.id);
      break;

    case 'MitgliedAngelegt': {
      db.prepare(`
        INSERT INTO members (id, member_number, first_name, last_name, street, zip, city,
          phone, email, birth_date, entry_date, exit_date, exit_reason, status,
          fee_class_id, notes, consent_phone, consent_email, consent_photo_internal,
          consent_photo_public, consent_withdrawn_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.id, data.member_number, data.first_name, data.last_name,
        data.street ?? null, data.zip ?? null, data.city ?? null,
        data.phone ?? null, data.email ?? null, data.birth_date ?? null,
        data.entry_date, data.exit_date ?? null, data.exit_reason ?? null,
        data.status, data.fee_class_id ?? null, data.notes ?? null,
        data.consent_phone ?? null, data.consent_email ?? null,
        data.consent_photo_internal ?? null, data.consent_photo_public ?? null,
        data.consent_withdrawn_at ?? null,
        data.created_at, data.updated_at
      );
      break;
    }

    case 'MitgliedGeaendert':
      db.prepare(`
        UPDATE members SET first_name = ?, last_name = ?, street = ?, zip = ?, city = ?,
          phone = ?, email = ?, birth_date = ?, entry_date = ?, exit_date = ?,
          exit_reason = ?, status = ?, fee_class_id = ?, notes = ?,
          consent_phone = ?, consent_email = ?, consent_photo_internal = ?,
          consent_photo_public = ?, consent_withdrawn_at = ?, updated_at = ?
        WHERE id = ?
      `).run(
        data.first_name, data.last_name, data.street ?? null, data.zip ?? null, data.city ?? null,
        data.phone ?? null, data.email ?? null, data.birth_date ?? null,
        data.entry_date, data.exit_date ?? null, data.exit_reason ?? null,
        data.status, data.fee_class_id ?? null, data.notes ?? null,
        data.consent_phone ?? null, data.consent_email ?? null,
        data.consent_photo_internal ?? null, data.consent_photo_public ?? null,
        data.consent_withdrawn_at ?? null, data.updated_at ?? new Date().toISOString(),
        data.id
      );
      break;

    case 'MitgliedGeloescht':
      db.prepare('DELETE FROM members WHERE id = ?').run(data.id);
      break;

    case 'VereinsprofilGespeichert':
      db.prepare(`
        UPDATE club_profile SET name = ?, street = ?, zip = ?, city = ?,
          register_court = ?, register_number = ?, tax_id = ?,
          iban = ?, bic = ?, bank_name = ?,
          contact_email = ?, contact_phone = ?, chairman = ?, logo_path = ?
        WHERE id = 1
      `).run(
        data.name ?? '', data.street ?? '', data.zip ?? '', data.city ?? '',
        data.register_court ?? '', data.register_number ?? '', data.tax_id ?? '',
        data.iban ?? '', data.bic ?? '', data.bank_name ?? '',
        data.contact_email ?? '', data.contact_phone ?? '', data.chairman ?? '', data.logo_path ?? ''
      );
      break;

    case 'BeitragGezahlt':
      db.prepare(`
        INSERT INTO fee_payments (member_id, year, amount_cents, paid_date, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        data.member_id, data.year, data.amount_cents,
        data.paid_date, data.payment_method, data.notes ?? null
      );
      break;

    case 'BeitragGeloescht':
      db.prepare('DELETE FROM fee_payments WHERE id = ?').run(data.id);
      break;

    default:
      // Unknown event type — skip
      break;
  }
}

describe('Replay-Tests v0.3', () => {
  it('Events JSON kann geladen werden', () => {
    const events = loadEventsJson('0.3.0');
    assert.ok(Array.isArray(events));
    assert.ok(events.length > 0);
  });

  it('Hash-Kette der Events ist gueltig', () => {
    const events = loadEventsJson('0.3.0');
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
      const expectedHash = computeHmacSync(message);
      assert.equal(e.hash, expectedHash, `Event ${e.id} hash mismatch`);
      if (i > 0) {
        assert.equal(e.prev_hash, events[i - 1].hash, `Event ${e.id} prev_hash mismatch`);
      }
    }
  });

  it('Replay erzeugt identische Mitglieder wie Fixture', () => {
    const events = loadEventsJson('0.3.0');
    const db = createEmptyV03Db();

    // Replay all events
    for (const event of events) {
      replayEvent(db, event);
    }

    // Compare with fixture
    const fixtureDb = new Database(join(__dirname, 'fixtures', 'db_v0.3.0.sqlite'), { readonly: true });

    const replayMembers = db.prepare('SELECT * FROM members ORDER BY id').all();
    const fixtureMembers = fixtureDb.prepare('SELECT * FROM members ORDER BY id').all();

    assert.equal(replayMembers.length, fixtureMembers.length, 'Member count mismatch');

    for (let i = 0; i < fixtureMembers.length; i++) {
      const rm = replayMembers[i];
      const fm = fixtureMembers[i];
      assert.equal(rm.member_number, fm.member_number, `Member ${fm.member_number} number mismatch`);
      assert.equal(rm.first_name, fm.first_name, `Member ${fm.member_number} first_name mismatch`);
      assert.equal(rm.last_name, fm.last_name, `Member ${fm.member_number} last_name mismatch`);
      assert.equal(rm.status, fm.status, `Member ${fm.member_number} status mismatch`);
      assert.equal(rm.fee_class_id, fm.fee_class_id, `Member ${fm.member_number} fee_class_id mismatch`);
      assert.equal(rm.street, fm.street, `Member ${fm.member_number} street mismatch`);
      assert.equal(rm.city, fm.city, `Member ${fm.member_number} city mismatch`);
    }

    fixtureDb.close();
    db.close();
  });

  it('Replay erzeugt identische Beitragsklassen wie Fixture', () => {
    const events = loadEventsJson('0.3.0');
    const db = createEmptyV03Db();

    for (const event of events) {
      replayEvent(db, event);
    }

    const fixtureDb = new Database(join(__dirname, 'fixtures', 'db_v0.3.0.sqlite'), { readonly: true });

    const replayClasses = db.prepare('SELECT * FROM fee_classes ORDER BY id').all();
    const fixtureClasses = fixtureDb.prepare('SELECT * FROM fee_classes ORDER BY id').all();

    assert.equal(replayClasses.length, fixtureClasses.length, 'FeeClass count mismatch');

    for (let i = 0; i < fixtureClasses.length; i++) {
      assert.equal(replayClasses[i].name, fixtureClasses[i].name, `FeeClass ${fixtureClasses[i].id} name mismatch`);
      assert.equal(replayClasses[i].amount_cents, fixtureClasses[i].amount_cents, `FeeClass ${fixtureClasses[i].id} amount mismatch`);
    }

    fixtureDb.close();
    db.close();
  });

  it('Replay erzeugt identisches Vereinsprofil wie Fixture', () => {
    const events = loadEventsJson('0.3.0');
    const db = createEmptyV03Db();

    for (const event of events) {
      replayEvent(db, event);
    }

    const fixtureDb = new Database(join(__dirname, 'fixtures', 'db_v0.3.0.sqlite'), { readonly: true });

    const replayProfile = db.prepare('SELECT * FROM club_profile WHERE id = 1').get();
    const fixtureProfile = fixtureDb.prepare('SELECT * FROM club_profile WHERE id = 1').get();

    assert.equal(replayProfile.name, fixtureProfile.name);
    assert.equal(replayProfile.street, fixtureProfile.street);
    assert.equal(replayProfile.city, fixtureProfile.city);
    assert.equal(replayProfile.chairman, fixtureProfile.chairman);

    fixtureDb.close();
    db.close();
  });
});
