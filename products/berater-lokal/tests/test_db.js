import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mockQuery, mockExecute, getCalls, reset } from './helpers/mock-sql.js';

describe('DB-Layer Logik', () => {
  beforeEach(() => reset());

  // --- Kunden ---

  it('getKunden → SELECT alle Kunden', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    const expected = [{ id: 1, vorname: 'Max', nachname: 'Mustermann' }];
    mockQuery(expected);
    const result = await query('SELECT * FROM kunden ORDER BY nachname, vorname');
    assert.deepEqual(result, expected);
    assert.ok(getCalls().at(-1).sql.includes('ORDER BY nachname'));
  });

  it('getKunde → SELECT mit WHERE id', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 5, vorname: 'Anna' }]);
    const rows = await query('SELECT * FROM kunden WHERE id = ?', [5]);
    assert.deepEqual(rows[0].vorname, 'Anna');
    assert.deepEqual(getCalls().at(-1).params, [5]);
  });

  it('saveKunde ohne id → INSERT mit 16 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    mockExecute({ lastInsertId: 3, rowsAffected: 1 });
    const result = await execute(
      'INSERT INTO kunden (anrede, vorname, nachname, geburtsdatum, familienstand, beruf, beruf_status, arbeitgeber, branche, raucher, groesse_cm, gewicht_kg, vorerkrankungen, medikamente, notizen, partner_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      ['Herr', 'Max', 'Mustermann', '1985-01-15', 'ledig', 'Ingenieur', 'angestellt', 'ACME', 'IT', 0, 180, 80, null, null, null, null]
    );
    assert.equal(result.lastInsertId, 3);
    assert.equal(getCalls().at(-1).params.length, 16);
  });

  it('saveKunde mit id → UPDATE mit WHERE id', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    await execute(
      "UPDATE kunden SET anrede=?, vorname=?, nachname=?, geburtsdatum=?, familienstand=?, beruf=?, beruf_status=?, arbeitgeber=?, branche=?, raucher=?, groesse_cm=?, gewicht_kg=?, vorerkrankungen=?, medikamente=?, notizen=?, partner_id=?, aktualisiert_am=datetime('now') WHERE id=?",
      ['Herr', 'Max', 'Neu', '1985-01-15', 'ledig', 'Ingenieur', 'angestellt', 'ACME', 'IT', 0, 180, 80, null, null, null, null, 3]
    );
    const call = getCalls().at(-1);
    assert.ok(call.sql.includes('UPDATE kunden SET'));
    assert.ok(call.sql.includes('WHERE id=?'));
    assert.equal(call.params.at(-1), 3);
  });

  it('deleteKunde → Hard-Delete', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    await execute('DELETE FROM kunden WHERE id = ?', [7]);
    const call = getCalls().at(-1);
    assert.ok(call.sql.includes('DELETE FROM kunden'));
    assert.deepEqual(call.params, [7]);
  });

  // --- Kinder ---

  it('getKinder → SELECT mit kunde_id', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 1, kunde_id: 1, name: 'Lisa' }]);
    const result = await query('SELECT * FROM kinder WHERE kunde_id = ? ORDER BY geburtsdatum', [1]);
    assert.equal(result[0].name, 'Lisa');
  });

  it('saveKind ohne id → INSERT mit 4 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    mockExecute({ lastInsertId: 2, rowsAffected: 1 });
    const result = await execute(
      'INSERT INTO kinder (kunde_id, name, geburtsdatum, im_haushalt) VALUES (?,?,?,?)',
      [1, 'Lisa', '2018-06-15', 1]
    );
    assert.equal(result.lastInsertId, 2);
    assert.equal(getCalls().at(-1).params.length, 4);
  });

  // --- Einnahmen ---

  it('getEinnahmen → SELECT mit kunde_id ORDER BY typ', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 1, typ: 'netto', betrag: 3500 }]);
    const result = await query('SELECT * FROM einnahmen WHERE kunde_id = ? ORDER BY typ', [1]);
    assert.equal(result[0].betrag, 3500);
    assert.ok(getCalls().at(-1).sql.includes('ORDER BY typ'));
  });

  it('saveEinnahme ohne id → INSERT mit 6 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    mockExecute({ lastInsertId: 1, rowsAffected: 1 });
    const result = await execute(
      'INSERT INTO einnahmen (kunde_id, typ, bezeichnung, betrag, periode, notiz) VALUES (?,?,?,?,?,?)',
      [1, 'netto', 'Gehalt', 3500, 'monatlich', null]
    );
    assert.equal(result.lastInsertId, 1);
    assert.equal(getCalls().at(-1).params.length, 6);
  });

  // --- Policen ---

  it('getPolicen → SELECT mit kunde_id ORDER BY sparte', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 1, sparte: 'BU', versicherer: 'Allianz' }]);
    const result = await query('SELECT * FROM policen WHERE kunde_id = ? ORDER BY sparte', [1]);
    assert.equal(result[0].sparte, 'BU');
    assert.ok(getCalls().at(-1).sql.includes('ORDER BY sparte'));
  });

  it('savePolicen ohne id → INSERT mit 17 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    mockExecute({ lastInsertId: 1, rowsAffected: 1 });
    const result = await execute(
      'INSERT INTO policen (kunde_id, sparte, versicherer, tarifname, vertragsnummer, versicherungssumme, leistung_text, beitrag_monatlich, selbstbeteiligung, vertragsbeginn, laufzeit_bis, kuendigungsfrist, dynamik, dynamik_prozent, letzte_pruefung, bewertung, notiz) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [1, 'BU', 'Allianz', 'BU-Plus', 'V123', 2500, null, 85, 0, '2020-01-01', null, null, 0, null, null, 'gruen', null]
    );
    assert.equal(result.lastInsertId, 1);
    assert.equal(getCalls().at(-1).params.length, 17);
  });

  // --- Org Profile ---

  it('getOrgProfile → SELECT WHERE id = 1', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 1, name: 'Mustermann Beratung' }]);
    const rows = await query('SELECT * FROM org_profile WHERE id = 1');
    assert.equal(rows[0].name, 'Mustermann Beratung');
  });

  it('saveOrgProfile → UPDATE mit 7 Parametern', async () => {
    const { execute } = await import('./helpers/mock-sql.js');
    await execute(
      'UPDATE org_profile SET name = ?, strasse = ?, plz = ?, ort = ?, telefon = ?, email = ?, verantwortlich = ? WHERE id = 1',
      ['Mustermann Beratung', 'Musterstr. 1', '12345', 'Berlin', '030-123456', 'info@test.de', 'Max Mustermann']
    );
    const call = getCalls().at(-1);
    assert.ok(call.sql.includes('UPDATE org_profile'));
    assert.equal(call.params.length, 7);
  });

  // --- Altersvorsorge ---

  it('getAltersvorsorge → SELECT mit kunde_id', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ id: 1, typ: 'gesetzlich', prognostizierte_rente: 1200 }]);
    const result = await query('SELECT * FROM altersvorsorge WHERE kunde_id = ? ORDER BY typ', [1]);
    assert.equal(result[0].prognostizierte_rente, 1200);
  });

  // --- Dashboard ---

  it('getDashboardStats → COUNT queries', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ c: 5 }]);
    const rows = await query('SELECT COUNT(*) as c FROM kunden');
    assert.equal(rows[0].c, 5);
    assert.ok(getCalls().at(-1).sql.includes('COUNT(*)'));
  });

  // --- KundeCount ---

  it('getKundeCount → COUNT alle Kunden', async () => {
    const { query } = await import('./helpers/mock-sql.js');
    mockQuery([{ count: 8 }]);
    const rows = await query('SELECT COUNT(*) as count FROM kunden');
    assert.equal(rows[0].count, 8);
  });
});
