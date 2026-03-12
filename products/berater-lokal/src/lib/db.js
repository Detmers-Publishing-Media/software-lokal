async function query(sql, params = []) {
  return window.electronAPI.db.query(sql, params);
}

async function execute(sql, params = []) {
  return window.electronAPI.db.execute(sql, params);
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
  return result.lastInsertRowid;
}

export async function deleteKunde(id) {
  await execute('DELETE FROM kunden WHERE id = ?', [id]);
}

// --- Kinder ---

export async function getKinder(kundeId) {
  return query('SELECT * FROM kinder WHERE kunde_id = ? ORDER BY geburtsdatum', [kundeId]);
}

export async function saveKind(data) {
  if (data.id) {
    await execute('UPDATE kinder SET name=?, geburtsdatum=?, im_haushalt=? WHERE id=?',
      [data.name, data.geburtsdatum, data.im_haushalt ? 1 : 0, data.id]);
    return data.id;
  }
  const result = await execute(
    'INSERT INTO kinder (kunde_id, name, geburtsdatum, im_haushalt) VALUES (?,?,?,?)',
    [data.kunde_id, data.name, data.geburtsdatum, data.im_haushalt ? 1 : 0]);
  return result.lastInsertRowid;
}

export async function deleteKind(id) {
  await execute('DELETE FROM kinder WHERE id = ?', [id]);
}

// --- Einnahmen ---

export async function getEinnahmen(kundeId) {
  return query('SELECT * FROM einnahmen WHERE kunde_id = ? ORDER BY typ', [kundeId]);
}

export async function saveEinnahme(data) {
  if (data.id) {
    await execute('UPDATE einnahmen SET typ=?, bezeichnung=?, betrag=?, periode=?, notiz=? WHERE id=?',
      [data.typ, data.bezeichnung, data.betrag, data.periode, data.notiz, data.id]);
    return data.id;
  }
  const result = await execute(
    'INSERT INTO einnahmen (kunde_id, typ, bezeichnung, betrag, periode, notiz) VALUES (?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.bezeichnung, data.betrag, data.periode, data.notiz]);
  return result.lastInsertRowid;
}

export async function deleteEinnahme(id) {
  await execute('DELETE FROM einnahmen WHERE id = ?', [id]);
}

// --- Ausgaben ---

export async function getAusgaben(kundeId) {
  return query('SELECT * FROM ausgaben WHERE kunde_id = ? ORDER BY kategorie', [kundeId]);
}

export async function saveAusgabe(data) {
  if (data.id) {
    await execute('UPDATE ausgaben SET kategorie=?, bezeichnung=?, betrag=?, periode=?, notiz=? WHERE id=?',
      [data.kategorie, data.bezeichnung, data.betrag, data.periode, data.notiz, data.id]);
    return data.id;
  }
  const result = await execute(
    'INSERT INTO ausgaben (kunde_id, kategorie, bezeichnung, betrag, periode, notiz) VALUES (?,?,?,?,?,?)',
    [data.kunde_id, data.kategorie, data.bezeichnung, data.betrag, data.periode, data.notiz]);
  return result.lastInsertRowid;
}

export async function deleteAusgabe(id) {
  await execute('DELETE FROM ausgaben WHERE id = ?', [id]);
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
  return result.lastInsertRowid;
}

export async function deletePolice(id) {
  await execute('DELETE FROM policen WHERE id = ?', [id]);
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
    return data.id;
  }
  const result = await execute(
    'INSERT INTO vermoegen (kunde_id, typ, bezeichnung, aktueller_wert, monatl_sparrate, rendite_pa, verfuegbarkeit, notiz) VALUES (?,?,?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.bezeichnung, data.aktueller_wert, data.monatl_sparrate, data.rendite_pa, data.verfuegbarkeit, data.notiz]);
  return result.lastInsertRowid;
}

export async function deleteVermoegen(id) {
  await execute('DELETE FROM vermoegen WHERE id = ?', [id]);
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
    return data.id;
  }
  const result = await execute(
    `INSERT INTO verbindlichkeiten (kunde_id, typ, bezeichnung, restschuld, zinssatz, zinsbindung_bis,
     monatl_rate, sondertilgung_moeglich, sondertilgung_prozent, laufzeit_bis, notiz)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [data.kunde_id, data.typ, data.bezeichnung, data.restschuld, data.zinssatz, data.zinsbindung_bis,
     data.monatl_rate, data.sondertilgung_moeglich ? 1 : 0, data.sondertilgung_prozent,
     data.laufzeit_bis, data.notiz]);
  return result.lastInsertRowid;
}

export async function deleteVerbindlichkeit(id) {
  await execute('DELETE FROM verbindlichkeiten WHERE id = ?', [id]);
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
    return data.id;
  }
  const result = await execute(
    'INSERT INTO altersvorsorge (kunde_id, typ, anbieter, monatl_beitrag, aktueller_stand, prognostizierte_rente, rentenbeginn, notiz) VALUES (?,?,?,?,?,?,?,?)',
    [data.kunde_id, data.typ, data.anbieter, data.monatl_beitrag, data.aktueller_stand, data.prognostizierte_rente, data.rentenbeginn, data.notiz]);
  return result.lastInsertRowid;
}

export async function deleteAltersvorsorge(id) {
  await execute('DELETE FROM altersvorsorge WHERE id = ?', [id]);
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
  return result.lastInsertRowid;
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
  return result.lastInsertRowid;
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
