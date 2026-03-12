import { query, execute } from '@codefabrik/app-shared/db';
import { computeHmac } from '@codefabrik/shared/crypto';

// --- Schema v1 ---

const SCHEMA_SQL = [
  // Organisationsprofil (Singleton fuer Briefkopf)
  `CREATE TABLE IF NOT EXISTS org_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL DEFAULT '',
    strasse TEXT DEFAULT '',
    plz TEXT DEFAULT '',
    ort TEXT DEFAULT '',
    telefon TEXT DEFAULT '',
    email TEXT DEFAULT '',
    verantwortlich TEXT DEFAULT ''
  )`,
  `INSERT OR IGNORE INTO org_profile (id) VALUES (1)`,

  // Kunden
  `CREATE TABLE IF NOT EXISTS kunden (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anrede TEXT,
    vorname TEXT NOT NULL,
    nachname TEXT NOT NULL,
    geburtsdatum TEXT,
    familienstand TEXT CHECK(familienstand IN ('ledig','verheiratet','geschieden','verwitwet')),
    beruf TEXT,
    beruf_status TEXT CHECK(beruf_status IN ('angestellt','selbstaendig','verbeamtet','student','azubi','rentner')),
    arbeitgeber TEXT,
    branche TEXT,
    raucher INTEGER DEFAULT 0,
    groesse_cm INTEGER,
    gewicht_kg REAL,
    vorerkrankungen TEXT,
    medikamente TEXT,
    notizen TEXT,
    partner_id INTEGER REFERENCES kunden(id),
    erstellt_am TEXT DEFAULT (datetime('now')),
    aktualisiert_am TEXT DEFAULT (datetime('now'))
  )`,

  // Kinder
  `CREATE TABLE IF NOT EXISTS kinder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    geburtsdatum TEXT,
    im_haushalt INTEGER DEFAULT 1
  )`,

  // Einnahmen
  `CREATE TABLE IF NOT EXISTS einnahmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL,
    bezeichnung TEXT,
    betrag REAL NOT NULL,
    periode TEXT DEFAULT 'monatlich',
    notiz TEXT
  )`,

  // Ausgaben
  `CREATE TABLE IF NOT EXISTS ausgaben (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    kategorie TEXT NOT NULL,
    bezeichnung TEXT,
    betrag REAL NOT NULL,
    periode TEXT DEFAULT 'monatlich',
    notiz TEXT
  )`,

  // Policen
  `CREATE TABLE IF NOT EXISTS policen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    sparte TEXT NOT NULL,
    versicherer TEXT,
    tarifname TEXT,
    vertragsnummer TEXT,
    versicherungssumme REAL,
    leistung_text TEXT,
    beitrag_monatlich REAL,
    selbstbeteiligung REAL DEFAULT 0,
    vertragsbeginn TEXT,
    laufzeit_bis TEXT,
    kuendigungsfrist TEXT,
    dynamik INTEGER DEFAULT 0,
    dynamik_prozent REAL,
    letzte_pruefung TEXT,
    bewertung TEXT CHECK(bewertung IN ('gruen','gelb','rot')),
    notiz TEXT
  )`,

  // Vermoegen
  `CREATE TABLE IF NOT EXISTS vermoegen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL,
    bezeichnung TEXT,
    aktueller_wert REAL,
    monatl_sparrate REAL DEFAULT 0,
    rendite_pa REAL,
    verfuegbarkeit TEXT,
    notiz TEXT
  )`,

  // Verbindlichkeiten
  `CREATE TABLE IF NOT EXISTS verbindlichkeiten (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL,
    bezeichnung TEXT,
    restschuld REAL,
    zinssatz REAL,
    zinsbindung_bis TEXT,
    monatl_rate REAL,
    sondertilgung_moeglich INTEGER DEFAULT 0,
    sondertilgung_prozent REAL,
    laufzeit_bis TEXT,
    notiz TEXT
  )`,

  // Altersvorsorge
  `CREATE TABLE IF NOT EXISTS altersvorsorge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kunde_id INTEGER NOT NULL REFERENCES kunden(id) ON DELETE CASCADE,
    typ TEXT NOT NULL,
    anbieter TEXT,
    monatl_beitrag REAL,
    aktueller_stand REAL,
    prognostizierte_rente REAL,
    rentenbeginn TEXT,
    notiz TEXT
  )`,

  // Konditionen Versicherung
  `CREATE TABLE IF NOT EXISTS konditionen_versicherung (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    versicherer TEXT NOT NULL,
    sparte TEXT NOT NULL,
    tarifname TEXT,
    gueltig_ab TEXT,
    gueltig_bis TEXT,
    alter_von INTEGER,
    alter_bis INTEGER,
    beitrag_monatlich REAL,
    versicherungssumme REAL,
    leistung_text TEXT,
    selbstbeteiligung REAL,
    berufsgruppe TEXT,
    rating TEXT,
    courtage_ap TEXT,
    courtage_bp TEXT,
    notiz TEXT
  )`,

  // Konditionen Darlehen
  `CREATE TABLE IF NOT EXISTS konditionen_darlehen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kreditgeber TEXT NOT NULL,
    produktname TEXT,
    gueltig_ab TEXT,
    gueltig_bis TEXT,
    sollzins REAL,
    effektivzins REAL,
    zinsbindung_jahre INTEGER,
    sondertilgung_prozent REAL,
    bereitstellungszinsfrei_monate INTEGER,
    kfw_kompatibel INTEGER DEFAULT 0,
    min_eigenkapital_prozent REAL,
    provision TEXT,
    notiz TEXT
  )`,

  // Event-Log (HMAC-SHA256 Hash-Kette)
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT 'app',
    version INTEGER NOT NULL DEFAULT 1,
    data TEXT NOT NULL,
    hash TEXT NOT NULL,
    prev_hash TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events_type ON events(type)`,

  // Schema-Meta
  `CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL,
    last_migration TEXT,
    event_replay_at TEXT
  )`,
];

// --- Init ---

export async function initDb() {
  for (const sql of SCHEMA_SQL) {
    await execute(sql);
  }

  const meta = await query('SELECT schema_version FROM _schema_meta WHERE id = 1');
  const currentVersion = meta[0]?.schema_version ?? 0;

  if (currentVersion < 1) {
    await execute(
      `INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version, last_migration) VALUES (1, 1, '0.2.0', datetime('now'))`
    );
  } else {
    await execute(
      `INSERT OR REPLACE INTO _schema_meta (id, schema_version, app_version, last_migration) VALUES (1, 1, '0.2.0', datetime('now'))`
    );
  }

  await appendEvent('AppGestartet', { version: '0.2.0', schema_version: 1 });
}

// --- Org Profile ---

export async function getOrgProfile() {
  const rows = await query('SELECT * FROM org_profile WHERE id = 1');
  return rows[0] ?? null;
}

export async function saveOrgProfile(profile) {
  await execute(`
    UPDATE org_profile SET
      name = ?, strasse = ?, plz = ?, ort = ?,
      telefon = ?, email = ?, verantwortlich = ?
    WHERE id = 1
  `, [
    profile.name, profile.strasse, profile.plz, profile.ort,
    profile.telefon, profile.email, profile.verantwortlich,
  ]);
  await appendEvent('ProfilGespeichert', { ...profile });
}

// --- Kunden ---

export async function getKunden() {
  return query('SELECT * FROM kunden ORDER BY nachname, vorname');
}

export async function getKunde(id) {
  const rows = await query('SELECT * FROM kunden WHERE id = ?', [id]);
  return rows[0] ?? null;
}

export async function getKundeCount() {
  const rows = await query('SELECT COUNT(*) as count FROM kunden');
  return rows[0]?.count ?? 0;
}

export async function saveKunde(data) {
  if (data.id) {
    await execute(
      `UPDATE kunden SET anrede=?, vorname=?, nachname=?, geburtsdatum=?, familienstand=?,
       beruf=?, beruf_status=?, arbeitgeber=?, branche=?, raucher=?, groesse_cm=?, gewicht_kg=?,
       vorerkrankungen=?, medikamente=?, notizen=?, partner_id=?, aktualisiert_am=datetime('now')
       WHERE id=?`,
      [data.anrede, data.vorname, data.nachname, data.geburtsdatum, data.familienstand,
       data.beruf, data.beruf_status, data.arbeitgeber, data.branche, data.raucher ? 1 : 0,
       data.groesse_cm, data.gewicht_kg, data.vorerkrankungen, data.medikamente,
       data.notizen, data.partner_id, data.id]
    );
    await appendEvent('KundeGeaendert', { id: data.id, vorname: data.vorname, nachname: data.nachname });
    return data.id;
  }
  const result = await execute(
    `INSERT INTO kunden (anrede, vorname, nachname, geburtsdatum, familienstand, beruf,
     beruf_status, arbeitgeber, branche, raucher, groesse_cm, gewicht_kg,
     vorerkrankungen, medikamente, notizen, partner_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.anrede, data.vorname, data.nachname, data.geburtsdatum, data.familienstand,
     data.beruf, data.beruf_status, data.arbeitgeber, data.branche, data.raucher ? 1 : 0,
     data.groesse_cm, data.gewicht_kg, data.vorerkrankungen, data.medikamente,
     data.notizen, data.partner_id]
  );
  await appendEvent('KundeAngelegt', { id: result.lastInsertId, vorname: data.vorname, nachname: data.nachname });
  return result.lastInsertId;
}

export async function deleteKunde(id) {
  const kunde = await getKunde(id);
  await execute('DELETE FROM kunden WHERE id = ?', [id]);
  await appendEvent('KundeGeloescht', { id, vorname: kunde?.vorname, nachname: kunde?.nachname });
}

// --- Kinder ---

export async function getKinder(kundeId) {
  return query('SELECT * FROM kinder WHERE kunde_id = ? ORDER BY geburtsdatum', [kundeId]);
}

export async function saveKind(data) {
  if (data.id) {
    await execute('UPDATE kinder SET name=?, geburtsdatum=?, im_haushalt=? WHERE id=?',
      [data.name, data.geburtsdatum, data.im_haushalt ? 1 : 0, data.id]);
    await appendEvent('KindGeaendert', { id: data.id, kunde_id: data.kunde_id, name: data.name });
    return data.id;
  }
  const result = await execute(
    'INSERT INTO kinder (kunde_id, name, geburtsdatum, im_haushalt) VALUES (?,?,?,?)',
    [data.kunde_id, data.name, data.geburtsdatum, data.im_haushalt ? 1 : 0]);
  await appendEvent('KindAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, name: data.name });
  return result.lastInsertId;
}

export async function deleteKind(id) {
  await execute('DELETE FROM kinder WHERE id = ?', [id]);
  await appendEvent('KindGeloescht', { id });
}

// --- Einnahmen ---

export async function getEinnahmen(kundeId) {
  return query('SELECT * FROM einnahmen WHERE kunde_id = ? ORDER BY typ', [kundeId]);
}

export async function saveEinnahme(data) {
  if (data.id) {
    await execute('UPDATE einnahmen SET typ=?, bezeichnung=?, betrag=?, periode=?, notiz=? WHERE id=?',
      [data.typ, data.bezeichnung, data.betrag, data.periode, data.notiz, data.id]);
    await appendEvent('EinnahmeGeaendert', { id: data.id, kunde_id: data.kunde_id, typ: data.typ, betrag: data.betrag });
    return data.id;
  }
  const result = await execute(
    'INSERT INTO einnahmen (kunde_id, typ, bezeichnung, betrag, periode, notiz) VALUES (?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.bezeichnung, data.betrag, data.periode, data.notiz]);
  await appendEvent('EinnahmeAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, typ: data.typ, betrag: data.betrag });
  return result.lastInsertId;
}

export async function deleteEinnahme(id) {
  await execute('DELETE FROM einnahmen WHERE id = ?', [id]);
  await appendEvent('EinnahmeGeloescht', { id });
}

// --- Ausgaben ---

export async function getAusgaben(kundeId) {
  return query('SELECT * FROM ausgaben WHERE kunde_id = ? ORDER BY kategorie', [kundeId]);
}

export async function saveAusgabe(data) {
  if (data.id) {
    await execute('UPDATE ausgaben SET kategorie=?, bezeichnung=?, betrag=?, periode=?, notiz=? WHERE id=?',
      [data.kategorie, data.bezeichnung, data.betrag, data.periode, data.notiz, data.id]);
    await appendEvent('AusgabeGeaendert', { id: data.id, kunde_id: data.kunde_id, kategorie: data.kategorie, betrag: data.betrag });
    return data.id;
  }
  const result = await execute(
    'INSERT INTO ausgaben (kunde_id, kategorie, bezeichnung, betrag, periode, notiz) VALUES (?,?,?,?,?,?)',
    [data.kunde_id, data.kategorie, data.bezeichnung, data.betrag, data.periode, data.notiz]);
  await appendEvent('AusgabeAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, kategorie: data.kategorie, betrag: data.betrag });
  return result.lastInsertId;
}

export async function deleteAusgabe(id) {
  await execute('DELETE FROM ausgaben WHERE id = ?', [id]);
  await appendEvent('AusgabeGeloescht', { id });
}

// --- Policen ---

export async function getPolicen(kundeId) {
  return query('SELECT * FROM policen WHERE kunde_id = ? ORDER BY sparte', [kundeId]);
}

export async function savePolicen(data) {
  if (data.id) {
    await execute(
      `UPDATE policen SET sparte=?, versicherer=?, tarifname=?, vertragsnummer=?,
       versicherungssumme=?, leistung_text=?, beitrag_monatlich=?, selbstbeteiligung=?,
       vertragsbeginn=?, laufzeit_bis=?, kuendigungsfrist=?, dynamik=?, dynamik_prozent=?,
       letzte_pruefung=?, bewertung=?, notiz=? WHERE id=?`,
      [data.sparte, data.versicherer, data.tarifname, data.vertragsnummer,
       data.versicherungssumme, data.leistung_text, data.beitrag_monatlich,
       data.selbstbeteiligung, data.vertragsbeginn, data.laufzeit_bis,
       data.kuendigungsfrist, data.dynamik ? 1 : 0, data.dynamik_prozent,
       data.letzte_pruefung, data.bewertung, data.notiz, data.id]);
    await appendEvent('PoliceGeaendert', { id: data.id, kunde_id: data.kunde_id, sparte: data.sparte });
    return data.id;
  }
  const result = await execute(
    `INSERT INTO policen (kunde_id, sparte, versicherer, tarifname, vertragsnummer,
     versicherungssumme, leistung_text, beitrag_monatlich, selbstbeteiligung,
     vertragsbeginn, laufzeit_bis, kuendigungsfrist, dynamik, dynamik_prozent,
     letzte_pruefung, bewertung, notiz) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.kunde_id, data.sparte, data.versicherer, data.tarifname, data.vertragsnummer,
     data.versicherungssumme, data.leistung_text, data.beitrag_monatlich,
     data.selbstbeteiligung, data.vertragsbeginn, data.laufzeit_bis,
     data.kuendigungsfrist, data.dynamik ? 1 : 0, data.dynamik_prozent,
     data.letzte_pruefung, data.bewertung, data.notiz]);
  await appendEvent('PoliceAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, sparte: data.sparte });
  return result.lastInsertId;
}

export async function deletePolice(id) {
  await execute('DELETE FROM policen WHERE id = ?', [id]);
  await appendEvent('PoliceGeloescht', { id });
}

// --- Vermoegen ---

export async function getVermoegen(kundeId) {
  return query('SELECT * FROM vermoegen WHERE kunde_id = ? ORDER BY typ', [kundeId]);
}

export async function saveVermoegen(data) {
  if (data.id) {
    await execute(
      'UPDATE vermoegen SET typ=?, bezeichnung=?, aktueller_wert=?, monatl_sparrate=?, rendite_pa=?, verfuegbarkeit=?, notiz=? WHERE id=?',
      [data.typ, data.bezeichnung, data.aktueller_wert, data.monatl_sparrate, data.rendite_pa, data.verfuegbarkeit, data.notiz, data.id]);
    await appendEvent('VermoegenGeaendert', { id: data.id, kunde_id: data.kunde_id, typ: data.typ });
    return data.id;
  }
  const result = await execute(
    'INSERT INTO vermoegen (kunde_id, typ, bezeichnung, aktueller_wert, monatl_sparrate, rendite_pa, verfuegbarkeit, notiz) VALUES (?,?,?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.bezeichnung, data.aktueller_wert, data.monatl_sparrate, data.rendite_pa, data.verfuegbarkeit, data.notiz]);
  await appendEvent('VermoegenAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, typ: data.typ });
  return result.lastInsertId;
}

export async function deleteVermoegen(id) {
  await execute('DELETE FROM vermoegen WHERE id = ?', [id]);
  await appendEvent('VermoegenGeloescht', { id });
}

// --- Verbindlichkeiten ---

export async function getVerbindlichkeiten(kundeId) {
  return query('SELECT * FROM verbindlichkeiten WHERE kunde_id = ? ORDER BY typ', [kundeId]);
}

export async function saveVerbindlichkeit(data) {
  if (data.id) {
    await execute(
      `UPDATE verbindlichkeiten SET typ=?, bezeichnung=?, restschuld=?, zinssatz=?, zinsbindung_bis=?,
       monatl_rate=?, sondertilgung_moeglich=?, sondertilgung_prozent=?, laufzeit_bis=?, notiz=? WHERE id=?`,
      [data.typ, data.bezeichnung, data.restschuld, data.zinssatz, data.zinsbindung_bis,
       data.monatl_rate, data.sondertilgung_moeglich ? 1 : 0, data.sondertilgung_prozent,
       data.laufzeit_bis, data.notiz, data.id]);
    await appendEvent('VerbindlichkeitGeaendert', { id: data.id, kunde_id: data.kunde_id, typ: data.typ });
    return data.id;
  }
  const result = await execute(
    `INSERT INTO verbindlichkeiten (kunde_id, typ, bezeichnung, restschuld, zinssatz, zinsbindung_bis,
     monatl_rate, sondertilgung_moeglich, sondertilgung_prozent, laufzeit_bis, notiz)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [data.kunde_id, data.typ, data.bezeichnung, data.restschuld, data.zinssatz, data.zinsbindung_bis,
     data.monatl_rate, data.sondertilgung_moeglich ? 1 : 0, data.sondertilgung_prozent,
     data.laufzeit_bis, data.notiz]);
  await appendEvent('VerbindlichkeitAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, typ: data.typ });
  return result.lastInsertId;
}

export async function deleteVerbindlichkeit(id) {
  await execute('DELETE FROM verbindlichkeiten WHERE id = ?', [id]);
  await appendEvent('VerbindlichkeitGeloescht', { id });
}

// --- Altersvorsorge ---

export async function getAltersvorsorge(kundeId) {
  return query('SELECT * FROM altersvorsorge WHERE kunde_id = ? ORDER BY typ', [kundeId]);
}

export async function saveAltersvorsorge(data) {
  if (data.id) {
    await execute(
      'UPDATE altersvorsorge SET typ=?, anbieter=?, monatl_beitrag=?, aktueller_stand=?, prognostizierte_rente=?, rentenbeginn=?, notiz=? WHERE id=?',
      [data.typ, data.anbieter, data.monatl_beitrag, data.aktueller_stand, data.prognostizierte_rente, data.rentenbeginn, data.notiz, data.id]);
    await appendEvent('AltersvorsorgeGeaendert', { id: data.id, kunde_id: data.kunde_id, typ: data.typ });
    return data.id;
  }
  const result = await execute(
    'INSERT INTO altersvorsorge (kunde_id, typ, anbieter, monatl_beitrag, aktueller_stand, prognostizierte_rente, rentenbeginn, notiz) VALUES (?,?,?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.anbieter, data.monatl_beitrag, data.aktueller_stand, data.prognostizierte_rente, data.rentenbeginn, data.notiz]);
  await appendEvent('AltersvorsorgeAngelegt', { id: result.lastInsertId, kunde_id: data.kunde_id, typ: data.typ });
  return result.lastInsertId;
}

export async function deleteAltersvorsorge(id) {
  await execute('DELETE FROM altersvorsorge WHERE id = ?', [id]);
  await appendEvent('AltersvorsorgeGeloescht', { id });
}

// --- Konditionen Versicherung ---

export async function getKonditionenVersicherung() {
  return query('SELECT * FROM konditionen_versicherung ORDER BY versicherer, sparte');
}

export async function saveKonditionVersicherung(data) {
  if (data.id) {
    await execute(
      `UPDATE konditionen_versicherung SET versicherer=?, sparte=?, tarifname=?, gueltig_ab=?, gueltig_bis=?,
       alter_von=?, alter_bis=?, beitrag_monatlich=?, versicherungssumme=?, leistung_text=?,
       selbstbeteiligung=?, berufsgruppe=?, rating=?, courtage_ap=?, courtage_bp=?, notiz=? WHERE id=?`,
      [data.versicherer, data.sparte, data.tarifname, data.gueltig_ab, data.gueltig_bis,
       data.alter_von, data.alter_bis, data.beitrag_monatlich, data.versicherungssumme,
       data.leistung_text, data.selbstbeteiligung, data.berufsgruppe, data.rating,
       data.courtage_ap, data.courtage_bp, data.notiz, data.id]);
    return data.id;
  }
  const result = await execute(
    `INSERT INTO konditionen_versicherung (versicherer, sparte, tarifname, gueltig_ab, gueltig_bis,
     alter_von, alter_bis, beitrag_monatlich, versicherungssumme, leistung_text,
     selbstbeteiligung, berufsgruppe, rating, courtage_ap, courtage_bp, notiz)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.versicherer, data.sparte, data.tarifname, data.gueltig_ab, data.gueltig_bis,
     data.alter_von, data.alter_bis, data.beitrag_monatlich, data.versicherungssumme,
     data.leistung_text, data.selbstbeteiligung, data.berufsgruppe, data.rating,
     data.courtage_ap, data.courtage_bp, data.notiz]);
  return result.lastInsertId;
}

export async function bulkImportKonditionenVersicherung(rows) {
  let count = 0;
  for (const row of rows) {
    await saveKonditionVersicherung(row);
    count++;
  }
  return count;
}

// --- Konditionen Darlehen ---

export async function getKonditionenDarlehen() {
  return query('SELECT * FROM konditionen_darlehen ORDER BY kreditgeber');
}

export async function saveKonditionDarlehen(data) {
  if (data.id) {
    await execute(
      `UPDATE konditionen_darlehen SET kreditgeber=?, produktname=?, gueltig_ab=?, gueltig_bis=?,
       sollzins=?, effektivzins=?, zinsbindung_jahre=?, sondertilgung_prozent=?,
       bereitstellungszinsfrei_monate=?, kfw_kompatibel=?, min_eigenkapital_prozent=?,
       provision=?, notiz=? WHERE id=?`,
      [data.kreditgeber, data.produktname, data.gueltig_ab, data.gueltig_bis,
       data.sollzins, data.effektivzins, data.zinsbindung_jahre, data.sondertilgung_prozent,
       data.bereitstellungszinsfrei_monate, data.kfw_kompatibel ? 1 : 0,
       data.min_eigenkapital_prozent, data.provision, data.notiz, data.id]);
    return data.id;
  }
  const result = await execute(
    `INSERT INTO konditionen_darlehen (kreditgeber, produktname, gueltig_ab, gueltig_bis,
     sollzins, effektivzins, zinsbindung_jahre, sondertilgung_prozent,
     bereitstellungszinsfrei_monate, kfw_kompatibel, min_eigenkapital_prozent, provision, notiz)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [data.kreditgeber, data.produktname, data.gueltig_ab, data.gueltig_bis,
     data.sollzins, data.effektivzins, data.zinsbindung_jahre, data.sondertilgung_prozent,
     data.bereitstellungszinsfrei_monate, data.kfw_kompatibel ? 1 : 0,
     data.min_eigenkapital_prozent, data.provision, data.notiz]);
  return result.lastInsertId;
}

export async function bulkImportKonditionenDarlehen(rows) {
  let count = 0;
  for (const row of rows) {
    await saveKonditionDarlehen(row);
    count++;
  }
  return count;
}

// --- Dashboard Stats ---

export async function getDashboardStats() {
  const kundenCount = await query('SELECT COUNT(*) as c FROM kunden');
  const policenCount = await query('SELECT COUNT(*) as c FROM policen');
  const kondVersCount = await query('SELECT COUNT(*) as c FROM konditionen_versicherung');
  const kondDarlCount = await query('SELECT COUNT(*) as c FROM konditionen_darlehen');
  const recentKunden = await query(
    'SELECT id, vorname, nachname, aktualisiert_am FROM kunden ORDER BY aktualisiert_am DESC LIMIT 5'
  );

  return {
    kunden: kundenCount[0]?.c ?? 0,
    policen: policenCount[0]?.c ?? 0,
    konditionenVersicherung: kondVersCount[0]?.c ?? 0,
    konditionenDarlehen: kondDarlCount[0]?.c ?? 0,
    recentKunden,
  };
}

// --- Event-Log ---

export async function appendEvent(type, data, actor = 'app') {
  const prev = await query('SELECT id, hash FROM events ORDER BY id DESC LIMIT 1');
  const prevHash = prev[0]?.hash ?? '0';
  const timestamp = new Date().toISOString();
  const dataJson = JSON.stringify(data);
  const message = `${type}|${timestamp}|${dataJson}|${prevHash}`;
  const hash = await computeHmac(message);

  await execute(
    'INSERT INTO events (type, timestamp, actor, version, data, hash, prev_hash) VALUES (?, ?, ?, 1, ?, ?, ?)',
    [type, timestamp, actor, dataJson, hash, prevHash]
  );
}

export async function verifyChain(limit = 100) {
  const events = await query('SELECT * FROM events ORDER BY id DESC LIMIT ?', [limit]);
  events.reverse();
  const errors = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const expectedPrev = i === 0 ? e.prev_hash : events[i - 1].hash;
    if (i > 0 && e.prev_hash !== expectedPrev) {
      errors.push({ event_id: e.id, error: 'prev_hash mismatch' });
    }
    const message = `${e.type}|${e.timestamp}|${e.data}|${e.prev_hash}`;
    const expectedHash = await computeHmac(message);
    if (e.hash !== expectedHash) {
      errors.push({ event_id: e.id, error: 'hash mismatch' });
    }
  }
  return { valid: errors.length === 0, errors, checked: events.length };
}

export async function getEvents(limit = 50) {
  return query('SELECT * FROM events ORDER BY id DESC LIMIT ?', [limit]);
}
