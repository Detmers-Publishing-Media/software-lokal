import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createHmac } from 'node:crypto';

const APP_SECRET = 'codefabrik-vereins-v1';

function computeHmacSync(message) {
  return createHmac('sha256', APP_SECRET).update(message).digest('hex');
}

// Run full schema on in-memory DB
function initFullDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`CREATE TABLE IF NOT EXISTS org_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '', strasse TEXT DEFAULT '', plz TEXT DEFAULT '',
    ort TEXT DEFAULT '', telefon TEXT DEFAULT '', email TEXT DEFAULT '',
    verantwortlich TEXT DEFAULT ''
  )`);
  db.exec(`INSERT OR IGNORE INTO org_profile (id) VALUES (1)`);

  db.exec(`CREATE TABLE IF NOT EXISTS kunden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anrede TEXT, vorname TEXT NOT NULL, nachname TEXT NOT NULL,
    geburtsdatum TEXT,
    familienstand TEXT CHECK(familienstand IN ('ledig','verheiratet','geschieden','verwitwet')),
    beruf TEXT,
    beruf_status TEXT CHECK(beruf_status IN ('angestellt','selbstaendig','verbeamtet','student','azubi','rentner')),
    arbeitgeber TEXT, branche TEXT, raucher INTEGER DEFAULT 0,
    groesse_cm INTEGER, gewicht_kg REAL, vorerkrankungen TEXT, medikamente TEXT,
    notizen TEXT, partner_id INTEGER REFERENCES kunden(id),
    erstellt_am TEXT DEFAULT (datetime('now')),
    aktualisiert_am TEXT DEFAULT (datetime('now'))
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS kinder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    name TEXT NOT NULL, geburtsdatum TEXT, im_haushalt INTEGER DEFAULT 1
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS einnahmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL, bezeichnung TEXT, betrag REAL NOT NULL,
    periode TEXT DEFAULT 'monatlich', notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS ausgaben (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    kategorie TEXT NOT NULL, bezeichnung TEXT, betrag REAL NOT NULL,
    periode TEXT DEFAULT 'monatlich', notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS policen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    sparte TEXT NOT NULL, versicherer TEXT, tarifname TEXT, vertragsnummer TEXT,
    versicherungssumme REAL, leistung_text TEXT, beitrag_monatlich REAL,
    selbstbeteiligung REAL DEFAULT 0, vertragsbeginn TEXT, laufzeit_bis TEXT,
    kuendigungsfrist TEXT, dynamik INTEGER DEFAULT 0, dynamik_prozent REAL,
    letzte_pruefung TEXT,
    bewertung TEXT CHECK(bewertung IN ('gruen','gelb','rot')),
    notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS vermoegen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL, bezeichnung TEXT, aktueller_wert REAL,
    monatl_sparrate REAL DEFAULT 0, rendite_pa REAL, verfuegbarkeit TEXT, notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS verbindlichkeiten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL, bezeichnung TEXT, restschuld REAL, zinssatz REAL,
    zinsbindung_bis TEXT, monatl_rate REAL,
    sondertilgung_moeglich INTEGER DEFAULT 0, sondertilgung_prozent REAL,
    laufzeit_bis TEXT, notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS altersvorsorge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL, anbieter TEXT, monatl_beitrag REAL,
    aktueller_stand REAL, prognostizierte_rente REAL, rentenbeginn TEXT, notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS konditionen_versicherung (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    versicherer TEXT NOT NULL, sparte TEXT NOT NULL, tarifname TEXT,
    gueltig_ab TEXT, gueltig_bis TEXT, alter_von INTEGER, alter_bis INTEGER,
    beitrag_monatlich REAL, versicherungssumme REAL, leistung_text TEXT,
    selbstbeteiligung REAL, berufsgruppe TEXT, rating TEXT,
    courtage_ap TEXT, courtage_bp TEXT, notiz TEXT
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS konditionen_darlehen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kreditgeber TEXT NOT NULL, produktname TEXT, gueltig_ab TEXT, gueltig_bis TEXT,
    sollzins REAL, effektivzins REAL, zinsbindung_jahre INTEGER,
    sondertilgung_prozent REAL, bereitstellungszinsfrei_monate INTEGER,
    kfw_kompatibel INTEGER DEFAULT 0, min_eigenkapital_prozent REAL,
    provision TEXT, notiz TEXT
  )`);

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
  db.exec(`INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version, last_migration) VALUES (1, 1, '0.2.0', datetime('now'))`);

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
    appendEventSync(db, 'AppGestartet', { version: '0.2.0', schema_version: 1 });
  });

  it('DB initialisiert fehlerfrei (alle Tabellen vorhanden)', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all().map(r => r.name).sort();
    assert.ok(tables.includes('kunden'));
    assert.ok(tables.includes('kinder'));
    assert.ok(tables.includes('einnahmen'));
    assert.ok(tables.includes('ausgaben'));
    assert.ok(tables.includes('policen'));
    assert.ok(tables.includes('vermoegen'));
    assert.ok(tables.includes('verbindlichkeiten'));
    assert.ok(tables.includes('altersvorsorge'));
    assert.ok(tables.includes('konditionen_versicherung'));
    assert.ok(tables.includes('konditionen_darlehen'));
    assert.ok(tables.includes('org_profile'));
    assert.ok(tables.includes('events'));
    assert.ok(tables.includes('_schema_meta'));
  });

  it('Kunde anlegen → in DB vorhanden', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname, beruf_status) VALUES ('Max', 'Mustermann', 'angestellt')").run();
    appendEventSync(db, 'KundeAngelegt', { id: 1, vorname: 'Max', nachname: 'Mustermann' });

    const k = db.prepare("SELECT * FROM kunden WHERE vorname = 'Max'").get();
    assert.ok(k);
    assert.equal(k.nachname, 'Mustermann');
    assert.equal(k.beruf_status, 'angestellt');
  });

  it('Kunde mit Kindern + Einnahmen + Ausgaben', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Anna', 'Muster')").run();
    db.prepare("INSERT INTO kinder (kunde_id, name, geburtsdatum, im_haushalt) VALUES (1, 'Lisa', '2018-06-15', 1)").run();
    db.prepare("INSERT INTO einnahmen (kunde_id, typ, betrag, periode) VALUES (1, 'netto', 3500, 'monatlich')").run();
    db.prepare("INSERT INTO ausgaben (kunde_id, kategorie, betrag, periode) VALUES (1, 'miete', 1200, 'monatlich')").run();

    const kinder = db.prepare('SELECT * FROM kinder WHERE kunde_id = 1').all();
    assert.equal(kinder.length, 1);
    assert.equal(kinder[0].name, 'Lisa');

    const einnahmen = db.prepare('SELECT * FROM einnahmen WHERE kunde_id = 1').all();
    assert.equal(einnahmen[0].betrag, 3500);

    const ausgaben = db.prepare('SELECT * FROM ausgaben WHERE kunde_id = 1').all();
    assert.equal(ausgaben[0].betrag, 1200);
  });

  it('Kunde loeschen → CASCADE loescht Kinder', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Test', 'Loesch')").run();
    db.prepare("INSERT INTO kinder (kunde_id, name) VALUES (1, 'Kind1')").run();
    appendEventSync(db, 'KundeAngelegt', { id: 1 });

    db.prepare('DELETE FROM kunden WHERE id = 1').run();
    appendEventSync(db, 'KundeGeloescht', { id: 1 });

    assert.equal(db.prepare('SELECT COUNT(*) as c FROM kunden').get().c, 0);
    assert.equal(db.prepare('SELECT COUNT(*) as c FROM kinder').get().c, 0);
  });

  it('Police anlegen und abfragen', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Max', 'Muster')").run();
    db.prepare("INSERT INTO policen (kunde_id, sparte, versicherer, versicherungssumme, beitrag_monatlich) VALUES (1, 'BU', 'Allianz', 2500, 85)").run();
    appendEventSync(db, 'PoliceAngelegt', { id: 1, sparte: 'BU' });

    const p = db.prepare('SELECT * FROM policen WHERE kunde_id = 1').get();
    assert.equal(p.sparte, 'BU');
    assert.equal(p.beitrag_monatlich, 85);
  });

  it('Vermoegen + Verbindlichkeiten', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Max', 'Muster')").run();
    db.prepare("INSERT INTO vermoegen (kunde_id, typ, aktueller_wert) VALUES (1, 'tagesgeld', 15000)").run();
    db.prepare("INSERT INTO verbindlichkeiten (kunde_id, typ, restschuld, monatl_rate) VALUES (1, 'immobilienkredit', 250000, 1200)").run();

    const v = db.prepare('SELECT * FROM vermoegen WHERE kunde_id = 1').get();
    assert.equal(v.aktueller_wert, 15000);

    const vb = db.prepare('SELECT * FROM verbindlichkeiten WHERE kunde_id = 1').get();
    assert.equal(vb.restschuld, 250000);
  });

  it('Altersvorsorge', () => {
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Max', 'Muster')").run();
    db.prepare("INSERT INTO altersvorsorge (kunde_id, typ, anbieter, prognostizierte_rente) VALUES (1, 'gesetzlich', 'DRV', 1400)").run();
    db.prepare("INSERT INTO altersvorsorge (kunde_id, typ, anbieter, monatl_beitrag, aktueller_stand) VALUES (1, 'riester', 'DWS', 162, 8500)").run();

    const av = db.prepare('SELECT * FROM altersvorsorge WHERE kunde_id = 1 ORDER BY typ').all();
    assert.equal(av.length, 2);
    assert.equal(av[0].typ, 'gesetzlich');
    assert.equal(av[0].prognostizierte_rente, 1400);
  });

  it('Organisationsprofil speichern + laden', () => {
    db.prepare("UPDATE org_profile SET name = 'Mustermann Beratung', ort = 'Berlin', verantwortlich = 'Max' WHERE id = 1").run();
    appendEventSync(db, 'ProfilGespeichert', { name: 'Mustermann Beratung' });

    const profile = db.prepare('SELECT * FROM org_profile WHERE id = 1').get();
    assert.equal(profile.name, 'Mustermann Beratung');
    assert.equal(profile.ort, 'Berlin');
    assert.equal(profile.verantwortlich, 'Max');
  });

  it('Probe-Limit: 10 Kunden', () => {
    for (let i = 1; i <= 10; i++) {
      db.prepare(`INSERT INTO kunden (vorname, nachname) VALUES ('K${i}', 'Test')`).run();
    }
    const count = db.prepare('SELECT COUNT(*) as c FROM kunden').get().c;
    assert.equal(count, 10);
  });

  it('Event-Kette nach allen Operationen gueltig', () => {
    // Kunde + Kind + Einnahme + Ausgabe + Police + Vermoegen
    db.prepare("INSERT INTO kunden (vorname, nachname) VALUES ('Max', 'Muster')").run();
    appendEventSync(db, 'KundeAngelegt', { id: 1, vorname: 'Max' });

    db.prepare("INSERT INTO kinder (kunde_id, name) VALUES (1, 'Lisa')").run();
    appendEventSync(db, 'KindAngelegt', { id: 1, kunde_id: 1 });

    db.prepare("INSERT INTO einnahmen (kunde_id, typ, betrag) VALUES (1, 'netto', 3500)").run();
    appendEventSync(db, 'EinnahmeAngelegt', { id: 1, betrag: 3500 });

    db.prepare("INSERT INTO ausgaben (kunde_id, kategorie, betrag) VALUES (1, 'miete', 1200)").run();
    appendEventSync(db, 'AusgabeAngelegt', { id: 1, betrag: 1200 });

    db.prepare("INSERT INTO policen (kunde_id, sparte, beitrag_monatlich) VALUES (1, 'BU', 85)").run();
    appendEventSync(db, 'PoliceAngelegt', { id: 1, sparte: 'BU' });

    db.prepare("INSERT INTO vermoegen (kunde_id, typ, aktueller_wert) VALUES (1, 'tagesgeld', 15000)").run();
    appendEventSync(db, 'VermoegenAngelegt', { id: 1, typ: 'tagesgeld' });

    db.prepare("INSERT INTO verbindlichkeiten (kunde_id, typ, restschuld) VALUES (1, 'immobilienkredit', 250000)").run();
    appendEventSync(db, 'VerbindlichkeitAngelegt', { id: 1, typ: 'immobilienkredit' });

    db.prepare("INSERT INTO altersvorsorge (kunde_id, typ, prognostizierte_rente) VALUES (1, 'gesetzlich', 1400)").run();
    appendEventSync(db, 'AltersvorsorgeAngelegt', { id: 1, typ: 'gesetzlich' });

    // Profil
    db.prepare("UPDATE org_profile SET name = 'Test Beratung' WHERE id = 1").run();
    appendEventSync(db, 'ProfilGespeichert', { name: 'Test Beratung' });

    // Verify chain
    const result = verifyChainSync(db);
    assert.equal(result.valid, true, `Chain errors: ${JSON.stringify(result.errors)}`);
    assert.ok(result.checked >= 10); // AppGestartet + 9 operations
  });

  // PDF tests skipped — pdfMake requires DOM.
  // Full PDF smoke tests via Electron/Windows.
});
