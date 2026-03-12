#!/usr/bin/env node
/**
 * generate-templates.js
 * Erzeugt 3 Excel-Vorlagen fuer Berater Lokal:
 *   1. kundenfragebogen.xlsx
 *   2. konditionen-versicherung.xlsx
 *   3. konditionen-darlehen.xlsx
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

// ── Colors ──────────────────────────────────────────────────────────────
const C = {
  headerBg: '1e3a5f',
  headerFg: 'FFFFFF',
  subHeaderBg: '0d9488',
  subHeaderFg: 'FFFFFF',
  altRow: 'f0f9ff',
  green: '22c55e',
  red: 'ef4444',
};

const TAB_COLORS = ['1e3a5f', '0d9488', 'ea580c', '7c3aed', 'db2777'];

// ── Helpers ─────────────────────────────────────────────────────────────

function thinBorder() {
  return {
    top: { style: 'thin', color: { argb: 'FFaaaaaa' } },
    left: { style: 'thin', color: { argb: 'FFaaaaaa' } },
    bottom: { style: 'thin', color: { argb: 'FFaaaaaa' } },
    right: { style: 'thin', color: { argb: 'FFaaaaaa' } },
  };
}

function headerFill() {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.headerBg } };
}

function subHeaderFill() {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.subHeaderBg } };
}

function altFill() {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + C.altRow } };
}

function headerFont(size = 11) {
  return { bold: true, color: { argb: 'FF' + C.headerFg }, size };
}

function styleHeaderRow(row, colCount) {
  row.height = 25;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = headerFill();
    cell.font = headerFont();
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  }
}

function styleSubHeaderRow(row, colCount) {
  row.height = 22;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.fill = subHeaderFill();
    cell.font = { bold: true, color: { argb: 'FF' + C.subHeaderFg }, size: 11 };
    cell.border = thinBorder();
    cell.alignment = { vertical: 'middle', wrapText: true };
  }
}

function styleDataRows(ws, startRow, endRow, colCount) {
  for (let r = startRow; r <= endRow; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= colCount; c++) {
      const cell = row.getCell(c);
      cell.border = thinBorder();
      cell.alignment = { vertical: 'middle', wrapText: true };
    }
    if ((r - startRow) % 2 === 1) {
      for (let c = 1; c <= colCount; c++) {
        row.getCell(c).fill = altFill();
      }
    }
  }
}

function euroFormat(cell) {
  cell.numFmt = '#,##0.00 "EUR"';
}

function pctFormat(cell) {
  cell.numFmt = '0.00"%"';
}

function dateFormat(cell) {
  cell.numFmt = 'DD.MM.YYYY';
}

function addDropdown(cell, list) {
  cell.dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: [`"${list.join(',')}"`],
    showErrorMessage: true,
  };
}

function freezeAndFilter(ws, headerRowNum, colCount) {
  ws.views = [{ state: 'frozen', ySplit: headerRowNum }];
  ws.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: colCount },
  };
}

function setLandscape(ws) {
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

function styleSumRow(row, colCount) {
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { bold: true };
    cell.border = thinBorder();
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFe2e8f0' } };
  }
}

function colLetter(n) {
  let s = '';
  while (n > 0) {
    n--;
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

// ═══════════════════════════════════════════════════════════════════════
// FILE 1: kundenfragebogen.xlsx
// ═══════════════════════════════════════════════════════════════════════

async function createKundenfragebogen() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Berater Lokal';
  wb.created = new Date();

  // ── Blatt 1: Persoenliches ──────────────────────────────────────────
  const ws1 = wb.addWorksheet('Persoenliches', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[0] } } });
  ws1.getColumn(1).width = 30;
  ws1.getColumn(2).width = 40;
  setLandscape(ws1);

  // Title
  ws1.mergeCells('A1:B1');
  const title1 = ws1.getCell('A1');
  title1.value = 'Kundenfragebogen \u2014 Persoenliche Daten';
  title1.font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  title1.alignment = { vertical: 'middle', horizontal: 'center' };
  ws1.getRow(1).height = 30;

  // Header
  const hdr1 = ws1.getRow(2);
  hdr1.getCell(1).value = 'Feld';
  hdr1.getCell(2).value = 'Ihre Angabe';
  styleHeaderRow(hdr1, 2);

  const fields = [
    { label: 'Anrede', dropdown: ['Herr', 'Frau', 'Divers'] },
    { label: 'Vorname' },
    { label: 'Nachname' },
    { label: 'Geburtsdatum', date: true },
    { label: 'Strasse + Hausnummer' },
    { label: 'PLZ' },
    { label: 'Ort' },
    { label: 'Telefon' },
    { label: 'E-Mail' },
    { label: 'Familienstand', dropdown: ['ledig', 'verheiratet', 'geschieden', 'verwitwet'] },
    { label: 'Partner Vorname' },
    { label: 'Partner Nachname' },
    { label: 'Partner Geburtsdatum', date: true },
    { label: 'Anzahl Kinder' },
    { label: 'Kind 1: Name' },
    { label: 'Kind 1: Geburtsdatum', date: true },
    { label: 'Kind 2: Name' },
    { label: 'Kind 2: Geburtsdatum', date: true },
    { label: 'Kind 3: Name' },
    { label: 'Kind 3: Geburtsdatum', date: true },
    { label: 'Beruf / Taetigkeit' },
    { label: 'Berufsstatus', dropdown: ['angestellt', 'selbstaendig', 'verbeamtet', 'Student', 'Azubi', 'Rentner'] },
    { label: 'Arbeitgeber' },
    { label: 'Branche' },
    { label: 'Beschaeftigt seit', date: true },
    { label: 'Raucher?', dropdown: ['Ja', 'Nein'] },
    { label: 'Koerpergroesse (cm)' },
    { label: 'Gewicht (kg)' },
  ];

  fields.forEach((f, i) => {
    const r = i + 3;
    const row = ws1.getRow(r);
    row.getCell(1).value = f.label;
    row.getCell(1).font = { bold: true };
    row.getCell(1).border = thinBorder();
    row.getCell(2).border = thinBorder();
    if (f.dropdown) addDropdown(row.getCell(2), f.dropdown);
    if (f.date) dateFormat(row.getCell(2));
    if (i % 2 === 1) {
      row.getCell(1).fill = altFill();
      row.getCell(2).fill = altFill();
    }
  });

  const noteRow = fields.length + 4;
  ws1.mergeCells(`A${noteRow}:B${noteRow}`);
  const note = ws1.getCell(`A${noteRow}`);
  note.value = 'Alle Angaben werden vertraulich behandelt und unterliegen dem Datenschutz (DSGVO).';
  note.font = { italic: true, size: 9, color: { argb: 'FF666666' } };

  // ── Blatt 2: Einnahmen & Ausgaben ──────────────────────────────────
  const ws2 = wb.addWorksheet('Einnahmen & Ausgaben', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[1] } } });
  setLandscape(ws2);
  ws2.getColumn(1).width = 35;
  ws2.getColumn(2).width = 18;
  ws2.getColumn(3).width = 18;
  ws2.getColumn(4).width = 18;

  // Title
  ws2.mergeCells('A1:D1');
  const t2 = ws2.getCell('A1');
  t2.value = 'Monatliche Einnahmen & Ausgaben';
  t2.font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  t2.alignment = { vertical: 'middle', horizontal: 'center' };
  ws2.getRow(1).height = 30;

  // --- Einnahmen section ---
  let row = 3;
  const einSubRow = ws2.getRow(row);
  ws2.mergeCells(`A${row}:D${row}`);
  einSubRow.getCell(1).value = 'Einnahmen';
  styleSubHeaderRow(einSubRow, 4);
  row++;

  const einHdr = ws2.getRow(row);
  einHdr.values = ['Kategorie', 'Person 1 (EUR)', 'Person 2 (EUR)', 'Gemeinsam (EUR)'];
  styleHeaderRow(einHdr, 4);
  const einHdrRow = row;
  row++;

  const einnahmen = [
    'Bruttoeinkommen', 'Nettoeinkommen', 'Urlaubsgeld (jaehrlich)',
    'Weihnachtsgeld (jaehrlich)', 'Kindergeld', 'Mieteinnahmen',
    'Kapitalertraege (jaehrlich)', 'Unterhalt (Eingang)', 'Sonstige Einnahmen',
  ];
  const einStartRow = row;
  einnahmen.forEach((e, i) => {
    const r = ws2.getRow(row);
    r.getCell(1).value = e;
    r.getCell(1).font = { bold: false };
    for (let c = 2; c <= 4; c++) euroFormat(r.getCell(c));
    if (i % 2 === 1) for (let c = 1; c <= 4; c++) r.getCell(c).fill = altFill();
    for (let c = 1; c <= 4; c++) r.getCell(c).border = thinBorder();
    row++;
  });
  const einEndRow = row - 1;
  const einSumRow = ws2.getRow(row);
  einSumRow.getCell(1).value = 'Summe Einnahmen';
  for (let c = 2; c <= 4; c++) {
    const cl = colLetter(c);
    einSumRow.getCell(c).value = { formula: `SUM(${cl}${einStartRow}:${cl}${einEndRow})` };
    euroFormat(einSumRow.getCell(c));
  }
  styleSumRow(einSumRow, 4);
  const einSumRowNum = row;
  row += 2;

  // --- Ausgaben section ---
  const ausSubRow = ws2.getRow(row);
  ws2.mergeCells(`A${row}:C${row}`);
  ausSubRow.getCell(1).value = 'Ausgaben';
  styleSubHeaderRow(ausSubRow, 3);
  row++;

  const ausHdr = ws2.getRow(row);
  ausHdr.values = ['Kategorie', 'Betrag (EUR)', 'Anmerkungen'];
  styleHeaderRow(ausHdr, 3);
  ws2.getColumn(3).width = 30; // anmerkungen
  row++;

  const ausgaben = [
    'Miete ODER Kreditrate', 'Nebenkosten (Wasser, Heizung, Muell)', 'Strom',
    'Internet / Telefon / Mobilfunk', 'Lebensmittel', 'Kleidung',
    'Kinder (Kita, Schule, etc.)', 'Auto \u2014 Rate/Leasing', 'Auto \u2014 Versicherung',
    'Auto \u2014 Kraftstoff/Wartung', 'OEPNV / Mobilitaet sonstige', 'Freizeit / Hobbys',
    'Urlaub (monatl. Ruecklage)', 'Spenden / Mitgliedsbeitraege', 'Sonstige Ausgaben',
  ];
  const ausStartRow = row;
  ausgaben.forEach((a, i) => {
    const r = ws2.getRow(row);
    r.getCell(1).value = a;
    euroFormat(r.getCell(2));
    if (i % 2 === 1) for (let c = 1; c <= 3; c++) r.getCell(c).fill = altFill();
    for (let c = 1; c <= 3; c++) r.getCell(c).border = thinBorder();
    row++;
  });
  const ausEndRow = row - 1;
  const ausSumRow = ws2.getRow(row);
  ausSumRow.getCell(1).value = 'Summe Ausgaben';
  ausSumRow.getCell(2).value = { formula: `SUM(B${ausStartRow}:B${ausEndRow})` };
  euroFormat(ausSumRow.getCell(2));
  styleSumRow(ausSumRow, 3);
  const ausSumRowNum = row;
  row += 2;

  // --- Zusammenfassung ---
  const zusSubRow = ws2.getRow(row);
  ws2.mergeCells(`A${row}:B${row}`);
  zusSubRow.getCell(1).value = 'Zusammenfassung';
  styleSubHeaderRow(zusSubRow, 2);
  row++;

  const geRow = ws2.getRow(row);
  geRow.getCell(1).value = 'Gesamteinnahmen';
  geRow.getCell(1).font = { bold: true };
  geRow.getCell(2).value = { formula: `B${einSumRowNum}+C${einSumRowNum}+D${einSumRowNum}` };
  euroFormat(geRow.getCell(2));
  for (let c = 1; c <= 2; c++) geRow.getCell(c).border = thinBorder();
  const geRowNum = row;
  row++;

  const gaRow = ws2.getRow(row);
  gaRow.getCell(1).value = 'Gesamtausgaben';
  gaRow.getCell(1).font = { bold: true };
  gaRow.getCell(2).value = { formula: `B${ausSumRowNum}` };
  euroFormat(gaRow.getCell(2));
  for (let c = 1; c <= 2; c++) { gaRow.getCell(c).border = thinBorder(); gaRow.getCell(c).fill = altFill(); }
  const gaRowNum = row;
  row++;

  const fvRow = ws2.getRow(row);
  fvRow.getCell(1).value = 'Frei verfuegbar';
  fvRow.getCell(1).font = { bold: true, size: 12 };
  fvRow.getCell(2).value = { formula: `B${geRowNum}-B${gaRowNum}` };
  euroFormat(fvRow.getCell(2));
  fvRow.getCell(2).font = { bold: true, size: 12 };
  for (let c = 1; c <= 2; c++) fvRow.getCell(c).border = thinBorder();
  // Conditional formatting for Frei verfuegbar
  ws2.addConditionalFormatting({
    ref: `B${row}`,
    rules: [
      { type: 'cellIs', operator: 'greaterThan', priority: 1, formulae: ['0'], style: { font: { color: { argb: 'FF16a34a' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFdcfce7' } } } },
      { type: 'cellIs', operator: 'lessThan', priority: 2, formulae: ['0'], style: { font: { color: { argb: 'FFdc2626' } }, fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFfee2e2' } } } },
    ],
  });

  ws2.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Blatt 3: Versicherungen ────────────────────────────────────────
  const ws3 = wb.addWorksheet('Versicherungen', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[2] } } });
  setLandscape(ws3);

  ws3.mergeCells('A1:J1');
  const t3 = ws3.getCell('A1');
  t3.value = 'Bestehende Versicherungen';
  t3.font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  t3.alignment = { vertical: 'middle', horizontal: 'center' };
  ws3.getRow(1).height = 30;

  const vCols = ['Nr.', 'Sparte', 'Versicherer', 'Tarifname', 'Beitrag/Monat (EUR)', 'Versicherungssumme (EUR)', 'Selbstbeteiligung (EUR)', 'Vertragsbeginn', 'Laufzeit bis', 'Zufrieden?'];
  const vWidths = [6, 28, 22, 20, 18, 22, 20, 16, 16, 14];
  vWidths.forEach((w, i) => { ws3.getColumn(i + 1).width = w; });

  const vHdr = ws3.getRow(2);
  vHdr.values = vCols;
  styleHeaderRow(vHdr, vCols.length);
  freezeAndFilter(ws3, 2, vCols.length);

  const spartenList = ['Privathaftpflicht', 'Hausrat', 'Wohngebaeude', 'BU/Erwerbsminderung', 'Risikolebensversicherung', 'Kfz-Haftpflicht', 'Kfz-Kasko', 'Rechtsschutz', 'Unfallversicherung', 'Zahnzusatz', 'Pflegezusatz', 'Krankenversicherung (GKV)', 'Krankenversicherung (PKV)', 'KV-Zusatz', 'Tierhalterhaftpflicht', 'Gewerblich', 'Sonstige'];
  const zufriedenList = ['Ja', 'Nein', 'Unsicher'];

  for (let i = 0; i < 20; i++) {
    const r = ws3.getRow(3 + i);
    r.getCell(1).value = i + 1;
    addDropdown(r.getCell(2), spartenList);
    euroFormat(r.getCell(5));
    euroFormat(r.getCell(6));
    euroFormat(r.getCell(7));
    dateFormat(r.getCell(8));
    dateFormat(r.getCell(9));
    addDropdown(r.getCell(10), zufriedenList);
    for (let c = 1; c <= vCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= vCols.length; c++) r.getCell(c).fill = altFill();
  }

  const vSumRow = ws3.getRow(23);
  vSumRow.getCell(1).value = '';
  vSumRow.getCell(4).value = 'Summe';
  vSumRow.getCell(5).value = { formula: 'SUM(E3:E22)' };
  euroFormat(vSumRow.getCell(5));
  styleSumRow(vSumRow, vCols.length);

  // ── Blatt 4: Vermoegen & Schulden ──────────────────────────────────
  const ws4 = wb.addWorksheet('Vermoegen & Schulden', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[3] } } });
  setLandscape(ws4);

  const vmCols = ['Nr.', 'Typ', 'Bezeichnung', 'Aktueller Wert (EUR)', 'Monatl. Sparrate (EUR)', 'Zinssatz/Rendite (%)', 'Verfuegbar?'];
  const vmWidths = [6, 28, 25, 20, 20, 18, 14];
  vmWidths.forEach((w, i) => { ws4.getColumn(i + 1).width = w; });

  // Title
  ws4.mergeCells('A1:G1');
  ws4.getCell('A1').value = 'Vermoegen & Schulden';
  ws4.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  ws4.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws4.getRow(1).height = 30;

  // -- Vermoegenswerte section --
  let r4 = 3;
  const vmSubRow = ws4.getRow(r4);
  ws4.mergeCells(`A${r4}:G${r4}`);
  vmSubRow.getCell(1).value = 'Vermoegenswerte';
  styleSubHeaderRow(vmSubRow, 7);
  r4++;

  const vmHdr = ws4.getRow(r4);
  vmHdr.values = vmCols;
  styleHeaderRow(vmHdr, vmCols.length);
  const vmHdrRow = r4;
  r4++;

  const vmTypList = ['Tagesgeld', 'Festgeld', 'Girokonto', 'Depot/ETF', 'Depot/Aktien', 'Depot/Fonds', 'Bausparvertrag', 'Immobilie (selbstgenutzt)', 'Immobilie (vermietet)', 'Lebensversicherung (Rueckkaufswert)', 'Gold/Edelmetalle', 'Kryptowaehrung', 'Sonstiges'];
  const vmStartRow = r4;
  for (let i = 0; i < 15; i++) {
    const r = ws4.getRow(r4);
    r.getCell(1).value = i + 1;
    addDropdown(r.getCell(2), vmTypList);
    euroFormat(r.getCell(4));
    euroFormat(r.getCell(5));
    pctFormat(r.getCell(6));
    addDropdown(r.getCell(7), ['Ja', 'Nein']);
    for (let c = 1; c <= vmCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= vmCols.length; c++) r.getCell(c).fill = altFill();
    r4++;
  }
  const vmEndRow = r4 - 1;
  const vmSumRow = ws4.getRow(r4);
  vmSumRow.getCell(1).value = '';
  vmSumRow.getCell(3).value = 'Summe';
  vmSumRow.getCell(4).value = { formula: `SUM(D${vmStartRow}:D${vmEndRow})` };
  vmSumRow.getCell(5).value = { formula: `SUM(E${vmStartRow}:E${vmEndRow})` };
  euroFormat(vmSumRow.getCell(4));
  euroFormat(vmSumRow.getCell(5));
  styleSumRow(vmSumRow, vmCols.length);
  const vmSumRowNum = r4;
  r4 += 2;

  // -- Verbindlichkeiten section --
  const scCols = ['Nr.', 'Typ', 'Bezeichnung', 'Restschuld (EUR)', 'Zinssatz (%)', 'Zinsbindung bis', 'Monatl. Rate (EUR)', 'Sondertilgung moegl.?', 'Laufzeit bis'];
  const scWidths = [6, 22, 25, 18, 14, 16, 18, 18, 14];
  // Reuse columns — widen if needed
  scWidths.forEach((w, i) => { if (ws4.getColumn(i + 1).width < w) ws4.getColumn(i + 1).width = w; });

  const scSubRow = ws4.getRow(r4);
  ws4.mergeCells(`A${r4}:I${r4}`);
  scSubRow.getCell(1).value = 'Verbindlichkeiten / Schulden';
  styleSubHeaderRow(scSubRow, 9);
  r4++;

  const scHdr = ws4.getRow(r4);
  scHdr.values = scCols;
  styleHeaderRow(scHdr, scCols.length);
  r4++;

  const scTypList = ['Immobilienkredit', 'Autokredit', 'Privatkredit/Ratenkredit', 'Studienkredit', 'Dispositionskredit', 'Kreditkarte', 'Sonstiges'];
  const scStartRow = r4;
  for (let i = 0; i < 10; i++) {
    const r = ws4.getRow(r4);
    r.getCell(1).value = i + 1;
    addDropdown(r.getCell(2), scTypList);
    euroFormat(r.getCell(4));
    pctFormat(r.getCell(5));
    dateFormat(r.getCell(6));
    euroFormat(r.getCell(7));
    addDropdown(r.getCell(8), ['Ja', 'Nein']);
    dateFormat(r.getCell(9));
    for (let c = 1; c <= scCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= scCols.length; c++) r.getCell(c).fill = altFill();
    r4++;
  }
  const scEndRow = r4 - 1;
  const scSumRow = ws4.getRow(r4);
  scSumRow.getCell(3).value = 'Summe';
  scSumRow.getCell(4).value = { formula: `SUM(D${scStartRow}:D${scEndRow})` };
  scSumRow.getCell(7).value = { formula: `SUM(G${scStartRow}:G${scEndRow})` };
  euroFormat(scSumRow.getCell(4));
  euroFormat(scSumRow.getCell(7));
  styleSumRow(scSumRow, scCols.length);
  const scSumRowNum = r4;
  r4 += 2;

  // -- Zusammenfassung --
  const zusSubRow4 = ws4.getRow(r4);
  ws4.mergeCells(`A${r4}:B${r4}`);
  zusSubRow4.getCell(1).value = 'Zusammenfassung';
  styleSubHeaderRow(zusSubRow4, 2);
  r4++;

  const gvRow = ws4.getRow(r4);
  gvRow.getCell(1).value = 'Gesamtvermoegen';
  gvRow.getCell(1).font = { bold: true };
  gvRow.getCell(2).value = { formula: `D${vmSumRowNum}` };
  euroFormat(gvRow.getCell(2));
  for (let c = 1; c <= 2; c++) gvRow.getCell(c).border = thinBorder();
  const gvRowNum = r4;
  r4++;

  const gsRow = ws4.getRow(r4);
  gsRow.getCell(1).value = 'Gesamtschulden';
  gsRow.getCell(1).font = { bold: true };
  gsRow.getCell(2).value = { formula: `D${scSumRowNum}` };
  euroFormat(gsRow.getCell(2));
  for (let c = 1; c <= 2; c++) { gsRow.getCell(c).border = thinBorder(); gsRow.getCell(c).fill = altFill(); }
  r4++;

  const nvRow = ws4.getRow(r4);
  nvRow.getCell(1).value = 'Nettovermoegen';
  nvRow.getCell(1).font = { bold: true, size: 12 };
  nvRow.getCell(2).value = { formula: `B${gvRowNum}-B${gvRowNum + 1}` };
  euroFormat(nvRow.getCell(2));
  nvRow.getCell(2).font = { bold: true, size: 12 };
  for (let c = 1; c <= 2; c++) nvRow.getCell(c).border = thinBorder();

  ws4.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Blatt 5: Altersvorsorge ────────────────────────────────────────
  const ws5 = wb.addWorksheet('Altersvorsorge', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[4] } } });
  setLandscape(ws5);

  const avCols = ['Nr.', 'Typ', 'Anbieter', 'Monatl. Beitrag (EUR)', 'Aktueller Stand (EUR)', 'Prognostizierte Rente (EUR/Monat)', 'Rentenbeginn', 'Anmerkungen'];
  const avWidths = [6, 32, 22, 20, 20, 28, 16, 30];
  avWidths.forEach((w, i) => { ws5.getColumn(i + 1).width = w; });

  ws5.mergeCells('A1:H1');
  ws5.getCell('A1').value = 'Bestehende Altersvorsorge';
  ws5.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  ws5.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws5.getRow(1).height = 30;

  const avHdr = ws5.getRow(2);
  avHdr.values = avCols;
  styleHeaderRow(avHdr, avCols.length);
  freezeAndFilter(ws5, 2, avCols.length);

  const avTypList = ['Gesetzliche Rente', 'Riester-Rente', 'Ruerup/Basisrente', 'Betriebliche AV (Direktversicherung)', 'Betriebliche AV (Pensionskasse)', 'Betriebliche AV (Unterstuetzungskasse)', 'Betriebliche AV (Pensionsfonds)', 'Betriebliche AV (Direktzusage)', 'Private Rentenversicherung', 'Kapitallebensversicherung', 'ETF-/Fondssparplan (Altersvorsorge)', 'Sonstiges'];

  const avStartRow = 3;
  for (let i = 0; i < 10; i++) {
    const r = ws5.getRow(avStartRow + i);
    r.getCell(1).value = i + 1;
    addDropdown(r.getCell(2), avTypList);
    euroFormat(r.getCell(4));
    euroFormat(r.getCell(5));
    euroFormat(r.getCell(6));
    dateFormat(r.getCell(7));
    for (let c = 1; c <= avCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= avCols.length; c++) r.getCell(c).fill = altFill();
  }
  const avEndRow = avStartRow + 9;
  const avSumRow = ws5.getRow(avEndRow + 1);
  avSumRow.getCell(3).value = 'Summe';
  avSumRow.getCell(4).value = { formula: `SUM(D${avStartRow}:D${avEndRow})` };
  avSumRow.getCell(6).value = { formula: `SUM(F${avStartRow}:F${avEndRow})` };
  euroFormat(avSumRow.getCell(4));
  euroFormat(avSumRow.getCell(6));
  styleSumRow(avSumRow, avCols.length);
  const avSumRowNum = avEndRow + 1;

  // Rentenluecke
  const rlRow = ws5.getRow(avSumRowNum + 2);
  rlRow.getCell(1).value = 'Monatliche Rentenluecke';
  rlRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFdc2626' } };
  // 80% of Netto (B row of Nettoeinkommen in Blatt 2) - reference:
  // Nettoeinkommen is row einStartRow + 1 (second einnahmen row), Person 1 = B col
  // We reference the sheet 'Einnahmen & Ausgaben'
  const nettoRow = einStartRow + 1; // Nettoeinkommen row
  rlRow.getCell(2).value = { formula: `0.8*('Einnahmen & Ausgaben'!B${nettoRow}+'Einnahmen & Ausgaben'!C${nettoRow}+'Einnahmen & Ausgaben'!D${nettoRow})-F${avSumRowNum}` };
  euroFormat(rlRow.getCell(2));
  rlRow.getCell(2).font = { bold: true, size: 12 };
  for (let c = 1; c <= 2; c++) rlRow.getCell(c).border = thinBorder();

  await wb.xlsx.writeFile(path.join(TEMPLATES_DIR, 'kundenfragebogen.xlsx'));
  console.log('  kundenfragebogen.xlsx erstellt');
}

// ═══════════════════════════════════════════════════════════════════════
// FILE 2: konditionen-versicherung.xlsx
// ═══════════════════════════════════════════════════════════════════════

async function createKonditionenVersicherung() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Berater Lokal';
  wb.created = new Date();

  const spartenList = ['Privathaftpflicht', 'Hausrat', 'Wohngebaeude', 'BU/Erwerbsminderung', 'Risikolebensversicherung', 'Kfz-Haftpflicht', 'Kfz-Kasko', 'Rechtsschutz', 'Unfallversicherung', 'Zahnzusatz', 'Pflegezusatz', 'Krankenversicherung (GKV)', 'Krankenversicherung (PKV)', 'KV-Zusatz', 'Tierhalterhaftpflicht', 'Gewerblich', 'Sonstige'];
  const ratingList = ['FFF+', 'FFF', 'FF+', 'FF', 'F+', 'F', 'F-'];
  const jaNeinList = ['Ja', 'Nein'];

  // ── Blatt 1: Konditionen ───────────────────────────────────────────
  const ws1 = wb.addWorksheet('Konditionen', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[0] } } });
  setLandscape(ws1);

  const kCols = ['Versicherer', 'Sparte', 'Tarifname', 'Tarifgeneration', 'Gueltig ab', 'Gueltig bis', 'Alter von', 'Alter bis', 'Beitrag mtl. (EUR)', 'VS/Leistung (EUR)', 'SB (EUR)', 'Berufsgruppe', 'Rating (F&B)', 'Courtage AP', 'Courtage BP (%)', 'Zahlweise-Rabatt', 'Nachversicherung', 'Besonderheiten'];
  const kWidths = [20, 24, 18, 16, 14, 14, 10, 10, 16, 18, 12, 14, 14, 14, 16, 16, 16, 30];
  kWidths.forEach((w, i) => { ws1.getColumn(i + 1).width = w; });

  ws1.mergeCells('A1:R1');
  ws1.getCell('A1').value = 'Versicherungskonditionen \u2014 Tarifuebersicht';
  ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws1.getRow(1).height = 30;

  const kHdr = ws1.getRow(2);
  kHdr.values = kCols;
  styleHeaderRow(kHdr, kCols.length);
  freezeAndFilter(ws1, 2, kCols.length);

  // Example data
  const examples = [
    ['Alte Leipziger', 'BU/Erwerbsminderung', 'AR3i', '2026', '01.03.2026', '', 30, 35, 89.50, 2000, 0, '1+', 'FFF', '50/12', 5.0, '', 'Ja', 'Nacherweiterungsgarantie'],
    ['CosmosDirekt', 'Risikolebensversicherung', 'T1R', '2026', '01.03.2026', '', 30, 40, 12.50, 300000, 0, '-', 'FF+', '20/5', 3.0, '', 'Nein', 'Online-Tarif'],
    ['HUK-COBURG', 'Privathaftpflicht', 'PH Plus', '2026', '01.03.2026', '', '', '', 5.90, 50000000, 0, '-', 'FF', '18/5', 4.5, '', 'Nein', ''],
    ['Allianz', 'Hausrat', 'HR Smart', '2025', '01.01.2025', '', '', '', 8.20, 80000, 150, '-', 'FFF', '25/5', 6.0, '', 'Nein', 'Fahrraddiebstahl inklusive'],
    ['Alte Leipziger', 'BU/Erwerbsminderung', 'AR3i', '2026', '01.03.2026', '', 35, 40, 112.30, 2000, 0, '1+', 'FFF', '50/12', 5.0, '', 'Ja', 'Nacherweiterungsgarantie'],
  ];

  for (let i = 0; i < 50; i++) {
    const r = ws1.getRow(3 + i);
    if (i < examples.length) {
      const ex = examples[i];
      for (let c = 0; c < ex.length; c++) {
        r.getCell(c + 1).value = ex[c];
      }
    }
    addDropdown(r.getCell(2), spartenList);
    euroFormat(r.getCell(9));
    euroFormat(r.getCell(10));
    euroFormat(r.getCell(11));
    addDropdown(r.getCell(13), ratingList);
    pctFormat(r.getCell(15));
    addDropdown(r.getCell(17), jaNeinList);
    for (let c = 1; c <= kCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= kCols.length; c++) r.getCell(c).fill = altFill();
  }

  // ── Blatt 2: Versicherer-Stamm ────────────────────────────────────
  const ws2 = wb.addWorksheet('Versicherer-Stamm', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[1] } } });
  setLandscape(ws2);

  const sCols = ['Versicherer', 'Rechtsform', 'Maklerbetreuung Name', 'Maklerbetreuung Tel.', 'Maklerbetreuung E-Mail', 'BiPRO-faehig?', 'Anmerkungen'];
  const sWidths = [22, 16, 22, 20, 28, 14, 30];
  sWidths.forEach((w, i) => { ws2.getColumn(i + 1).width = w; });

  const sHdr = ws2.getRow(1);
  sHdr.values = sCols;
  styleHeaderRow(sHdr, sCols.length);
  freezeAndFilter(ws2, 1, sCols.length);

  for (let i = 0; i < 30; i++) {
    const r = ws2.getRow(2 + i);
    addDropdown(r.getCell(6), jaNeinList);
    for (let c = 1; c <= sCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= sCols.length; c++) r.getCell(c).fill = altFill();
  }

  await wb.xlsx.writeFile(path.join(TEMPLATES_DIR, 'konditionen-versicherung.xlsx'));
  console.log('  konditionen-versicherung.xlsx erstellt');
}

// ═══════════════════════════════════════════════════════════════════════
// FILE 3: konditionen-darlehen.xlsx
// ═══════════════════════════════════════════════════════════════════════

async function createKonditionenDarlehen() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Berater Lokal';
  wb.created = new Date();

  const jaNeinList = ['Ja', 'Nein'];

  // ── Blatt 1: Darlehenskonditionen ─────────────────────────────────
  const ws1 = wb.addWorksheet('Darlehenskonditionen', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[0] } } });
  setLandscape(ws1);

  const dCols = ['Kreditgeber', 'Produktname', 'Gueltig ab', 'Gueltig bis', 'Sollzins (%)', 'Effektivzins (%)', 'Zinsbindung (Jahre)', 'Sondertilgung (% p.a.)', 'Bereitstellungszinsfrei (Monate)', 'KfW-kompatibel?', 'Min. Eigenkapital (%)', 'Tilgungssatzwechsel?', 'Provision (%)', 'Anmerkungen'];
  const dWidths = [20, 24, 14, 14, 14, 16, 18, 20, 28, 16, 20, 18, 14, 30];
  dWidths.forEach((w, i) => { ws1.getColumn(i + 1).width = w; });

  ws1.mergeCells('A1:N1');
  ws1.getCell('A1').value = 'Darlehenskonditionen \u2014 Zinsuebersicht';
  ws1.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF' + C.headerBg } };
  ws1.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws1.getRow(1).height = 30;

  const dHdr = ws1.getRow(2);
  dHdr.values = dCols;
  styleHeaderRow(dHdr, dCols.length);
  freezeAndFilter(ws1, 2, dCols.length);

  const dExamples = [
    ['ING', 'Baufinanzierung Klassik', '01.03.2026', '31.03.2026', 3.45, 3.52, 10, 5, 6, 'Ja', 20, 'Ja', 0.5, ''],
    ['Commerzbank', 'Baufi Flex', '01.03.2026', '31.03.2026', 3.55, 3.61, 15, 5, 12, 'Ja', 15, 'Ja', 0.6, ''],
    ['Interhyp', 'Standardrate', '01.03.2026', '31.03.2026', 3.38, 3.44, 10, 5, 6, 'Ja', 20, 'Nein', 0.65, ''],
    ['Deutsche Bank', 'FestzinsHyp', '01.03.2026', '31.03.2026', 3.62, 3.70, 20, 5, 3, 'Ja', 25, 'Nein', 0.4, ''],
    ['Sparkasse', 'WohnBaufi', '01.03.2026', '31.03.2026', 3.50, 3.58, 15, 5, 6, 'Ja', 20, 'Ja', 0.55, ''],
  ];

  for (let i = 0; i < 30; i++) {
    const r = ws1.getRow(3 + i);
    if (i < dExamples.length) {
      const ex = dExamples[i];
      for (let c = 0; c < ex.length; c++) {
        r.getCell(c + 1).value = ex[c];
      }
    }
    pctFormat(r.getCell(5));
    pctFormat(r.getCell(6));
    pctFormat(r.getCell(8));
    addDropdown(r.getCell(10), jaNeinList);
    pctFormat(r.getCell(11));
    addDropdown(r.getCell(12), jaNeinList);
    pctFormat(r.getCell(13));
    for (let c = 1; c <= dCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= dCols.length; c++) r.getCell(c).fill = altFill();
  }

  // ── Blatt 2: Kreditgeber-Stamm ───────────────────────────────────
  const ws2 = wb.addWorksheet('Kreditgeber-Stamm', { properties: { tabColor: { argb: 'FF' + TAB_COLORS[1] } } });
  setLandscape(ws2);

  const ksCols = ['Kreditgeber', 'Ansprechpartner', 'Telefon', 'E-Mail', 'Besonderheiten'];
  const ksWidths = [22, 22, 20, 28, 35];
  ksWidths.forEach((w, i) => { ws2.getColumn(i + 1).width = w; });

  const ksHdr = ws2.getRow(1);
  ksHdr.values = ksCols;
  styleHeaderRow(ksHdr, ksCols.length);
  freezeAndFilter(ws2, 1, ksCols.length);

  for (let i = 0; i < 20; i++) {
    const r = ws2.getRow(2 + i);
    for (let c = 1; c <= ksCols.length; c++) r.getCell(c).border = thinBorder();
    if (i % 2 === 1) for (let c = 1; c <= ksCols.length; c++) r.getCell(c).fill = altFill();
  }

  await wb.xlsx.writeFile(path.join(TEMPLATES_DIR, 'konditionen-darlehen.xlsx'));
  console.log('  konditionen-darlehen.xlsx erstellt');
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  console.log('Generiere Excel-Vorlagen...\n');

  await createKundenfragebogen();
  await createKonditionenVersicherung();
  await createKonditionenDarlehen();

  console.log('\nAlle 3 Vorlagen erstellt in:', TEMPLATES_DIR);
}

main().catch((err) => {
  console.error('Fehler:', err);
  process.exit(1);
});
