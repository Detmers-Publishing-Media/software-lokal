import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateCsv } from '../src/lib/csv.js';
import { MEMBERS, MEMBER_WITH_SEMICOLON, MEMBER_WITH_QUOTES } from './fixtures/members.js';

const COLUMNS = [
  { key: 'member_number', label: 'Nr.' },
  { key: 'last_name', label: 'Nachname' },
  { key: 'first_name', label: 'Vorname' },
  { key: 'city', label: 'Ort' },
  { key: 'status', label: 'Status' },
  { key: 'fee_class_name', label: 'Beitragsklasse' },
  { key: 'entry_date', label: 'Eintritt' },
];

const BOM = '\uFEFF';

describe('generateCsv', () => {
  it('leere Liste ergibt nur Header-Zeile', () => {
    const csv = generateCsv([], COLUMNS);
    const lines = csv.replace(BOM, '').split('\r\n');
    assert.equal(lines.length, 1);
    assert.equal(lines[0], 'Nr.;Nachname;Vorname;Ort;Status;Beitragsklasse;Eintritt');
  });

  it('UTF-8 BOM ist vorhanden', () => {
    const csv = generateCsv([], COLUMNS);
    assert.ok(csv.startsWith(BOM), 'CSV muss mit UTF-8 BOM beginnen');
  });

  it('einzelnes Mitglied ergibt korrekte Spalten', () => {
    const csv = generateCsv([MEMBERS[0]], COLUMNS);
    const lines = csv.replace(BOM, '').split('\r\n');
    assert.equal(lines.length, 2);
    assert.equal(lines[1], '1001;Mustermann;Max;Berlin;aktiv;Vollmitglied;2024-01-15');
  });

  it('mehrere Mitglieder erzeugen korrekte Zeilenanzahl', () => {
    const csv = generateCsv(MEMBERS, COLUMNS);
    const lines = csv.replace(BOM, '').split('\r\n');
    assert.equal(lines.length, MEMBERS.length + 1); // Header + Datenzeilen
  });

  it('Semikolon im Wert wird korrekt escaped', () => {
    const csv = generateCsv([MEMBER_WITH_SEMICOLON], COLUMNS);
    const lines = csv.replace(BOM, '').split('\r\n');
    // "Test;Fall" muss in Anfuehrungszeichen stehen
    assert.ok(lines[1].includes('"Test;Fall"'), `Erwartet escaped Semikolon, bekam: ${lines[1]}`);
    assert.ok(lines[1].includes('"Frankfurt; Main"'), `Erwartet escaped Stadt, bekam: ${lines[1]}`);
  });

  it('Anfuehrungszeichen im Wert werden verdoppelt', () => {
    const csv = generateCsv([MEMBER_WITH_QUOTES], COLUMNS);
    const lines = csv.replace(BOM, '').split('\r\n');
    assert.ok(lines[1].includes('"von ""dem"" Berg"'), `Erwartet escaped Quotes, bekam: ${lines[1]}`);
  });

  it('Umlaute (ae, oe, ue) sind korrekt in UTF-8', () => {
    const csv = generateCsv([MEMBERS[2]], COLUMNS);
    assert.ok(csv.includes('Müller-Thürgau'), 'Umlaute im Nachnamen');
    assert.ok(csv.includes('München'), 'Umlaute im Ort');
  });

  it('null/undefined Werte werden als leerer String exportiert', () => {
    const cols = [{ key: 'phone', label: 'Telefon' }, { key: 'email', label: 'E-Mail' }];
    const csv = generateCsv([MEMBERS[2]], cols);
    const lines = csv.replace(BOM, '').split('\r\n');
    assert.equal(lines[1], ';', 'Beide Felder leer → nur Semikolon-Trenner');
  });

  it('alle Status-Werte werden korrekt exportiert', () => {
    const cols = [{ key: 'status', label: 'Status' }];
    const csv = generateCsv(MEMBERS, cols);
    assert.ok(csv.includes('aktiv'));
    assert.ok(csv.includes('passiv'));
    assert.ok(csv.includes('ausgetreten'));
  });

  it('CRLF als Zeilenende (Windows-kompatibel)', () => {
    const csv = generateCsv([MEMBERS[0]], COLUMNS);
    const withoutBom = csv.replace(BOM, '');
    assert.ok(withoutBom.includes('\r\n'), 'Zeilenende muss CRLF sein');
    // Kein einzelnes \n ohne vorheriges \r
    const stripped = withoutBom.replace(/\r\n/g, '');
    assert.ok(!stripped.includes('\n'), 'Kein einzelnes LF ohne CR');
  });
});
