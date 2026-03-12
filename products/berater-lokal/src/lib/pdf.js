import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function fmt(n) {
  if (n == null || isNaN(n)) return '0,00';
  return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

function fmtInt(n) {
  if (n == null || isNaN(n)) return '0';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n);
}

function statusLabel(status) {
  const labels = { rot: 'Handlungsbedarf', gelb: 'Pruefen', gruen: 'OK' };
  return labels[status] ?? status;
}

function statusColor(status) {
  const colors = { rot: '#e53e3e', gelb: '#d69e2e', gruen: '#38a169' };
  return colors[status] ?? '#1a202c';
}

function buildLetterhead(orgProfile) {
  const content = [];
  if (orgProfile?.name) {
    content.push({ text: orgProfile.name, fontSize: 14, bold: true, margin: [0, 0, 0, 2] });
    const addressParts = [
      orgProfile.strasse,
      [orgProfile.plz, orgProfile.ort].filter(Boolean).join(' '),
    ].filter(Boolean);
    if (addressParts.length) {
      content.push({ text: addressParts.join(', '), fontSize: 9, color: '#666', margin: [0, 0, 0, 2] });
    }
    const contactParts = [orgProfile.telefon, orgProfile.email].filter(Boolean);
    if (contactParts.length) {
      content.push({ text: contactParts.join(' | '), fontSize: 8, color: '#888', margin: [0, 0, 0, 8] });
    }
  }
  return content;
}

function buildFooter(isProbe) {
  const today = new Date().toLocaleDateString('de-DE');
  return (currentPage, pageCount) => {
    const footerColumns = [
      { text: `Erstellt: ${today}`, fontSize: 7, color: '#999', margin: [40, 0, 0, 0] },
      { text: `Seite ${currentPage} / ${pageCount}`, fontSize: 7, color: '#999', alignment: 'right', margin: [0, 0, 40, 0] },
    ];
    if (isProbe) {
      return {
        stack: [
          { text: 'Erstellt mit Probe-Version — codefabrik.de', fontSize: 7, color: '#999', alignment: 'center', margin: [0, 0, 0, 4] },
          { columns: footerColumns },
        ],
        margin: [0, 10, 0, 0],
      };
    }
    return { columns: footerColumns, margin: [0, 20, 0, 0] };
  };
}

const TABLE_LAYOUT = {
  hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.25,
  vLineWidth: () => 0,
  hLineColor: () => '#cccccc',
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3,
  paddingBottom: () => 3,
};

/**
 * Generate and open a full advisory protocol PDF.
 */
export function generateBeratungsprotokoll(kunde, daten, orgProfile, isProbe) {
  const { einnahmen, ausgaben, policen, vermoegen, verbindlichkeiten, altersvorsorge, kinder, analyseErgebnisse } = daten;
  const today = new Date().toLocaleDateString('de-DE');

  const content = [];

  // 1. Briefkopf
  content.push(...buildLetterhead(orgProfile));

  // 2. Titel
  content.push({ text: 'Beratungsprotokoll', fontSize: 16, bold: true, margin: [0, 8, 0, 4] });
  content.push({ text: `${kunde.vorname} ${kunde.nachname} — ${today}`, fontSize: 11, color: '#333', margin: [0, 0, 0, 12] });

  // 3. Kundenstammdaten
  content.push({ text: 'Kundenstammdaten', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
  const metaRows = [
    ['Name:', `${kunde.anrede ?? ''} ${kunde.vorname} ${kunde.nachname}`.trim()],
    ['Geburtsdatum:', formatDate(kunde.geburtsdatum) || '-'],
    ['Beruf:', [kunde.beruf, kunde.beruf_status ? `(${kunde.beruf_status})` : ''].filter(Boolean).join(' ') || '-'],
    ['Familienstand:', kunde.familienstand ?? '-'],
  ];
  if (kinder && kinder.length > 0) {
    metaRows.push(['Kinder:', kinder.map(k => k.name).join(', ')]);
  }
  content.push({
    table: {
      widths: [100, '*'],
      body: metaRows.map(([label, value]) => [
        { text: label, fontSize: 9, bold: true },
        { text: value, fontSize: 9 },
      ]),
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 12],
  });

  // 4. Haushaltsuebersicht
  const sumEinnahmen = (einnahmen ?? []).filter(e => e.periode === 'monatlich').reduce((s, e) => s + (e.betrag || 0), 0);
  const sumAusgaben = (ausgaben ?? []).filter(a => a.periode === 'monatlich').reduce((s, a) => s + (a.betrag || 0), 0);
  const sumPolicen = (policen ?? []).reduce((s, p) => s + (p.beitrag_monatlich || 0), 0);
  const freiVerfuegbar = sumEinnahmen - sumAusgaben - sumPolicen;

  content.push({ text: 'Haushaltsuebersicht (monatlich)', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
  content.push({
    table: {
      widths: ['*', '*', '*', '*'],
      body: [
        [
          { text: 'Einnahmen', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
          { text: 'Ausgaben', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
          { text: 'Versicherungen', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
          { text: 'Frei verfuegbar', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
        ],
        [
          { text: `${fmt(sumEinnahmen)} EUR`, fontSize: 9, color: '#38a169' },
          { text: `${fmt(sumAusgaben)} EUR`, fontSize: 9, color: '#e53e3e' },
          { text: `${fmt(sumPolicen)} EUR`, fontSize: 9, color: '#e53e3e' },
          { text: `${fmt(freiVerfuegbar)} EUR`, fontSize: 9, color: freiVerfuegbar >= 0 ? '#38a169' : '#e53e3e' },
        ],
      ],
    },
    layout: TABLE_LAYOUT,
    margin: [0, 0, 0, 12],
  });

  // 5. Versicherungsuebersicht
  if (policen && policen.length > 0) {
    content.push({ text: `Versicherungen (${policen.length})`, fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
    const policeHeader = ['Sparte', 'Versicherer', 'VS/Leistung', 'Beitrag/Mon.', 'SB'].map(t =>
      ({ text: t, bold: true, fontSize: 8, fillColor: '#f0f0f0' })
    );
    const policeRows = policen.map(p => [
      { text: p.sparte, fontSize: 8 },
      { text: p.versicherer ?? '-', fontSize: 8 },
      { text: `${fmt(p.versicherungssumme)} EUR`, fontSize: 8 },
      { text: `${fmt(p.beitrag_monatlich)} EUR`, fontSize: 8 },
      { text: `${fmt(p.selbstbeteiligung)} EUR`, fontSize: 8 },
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', '*', 70, 70, 50], body: [policeHeader, ...policeRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 12],
    });
  }

  // 6. Vermoegen
  if (vermoegen && vermoegen.length > 0) {
    content.push({ text: 'Vermoegen', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
    const vHeader = ['Typ', 'Bezeichnung', 'Akt. Wert', 'Sparrate/Mon.'].map(t =>
      ({ text: t, bold: true, fontSize: 8, fillColor: '#f0f0f0' })
    );
    const vRows = vermoegen.map(v => [
      { text: v.typ, fontSize: 8 },
      { text: v.bezeichnung ?? '-', fontSize: 8 },
      { text: `${fmt(v.aktueller_wert)} EUR`, fontSize: 8 },
      { text: `${fmt(v.monatl_sparrate)} EUR`, fontSize: 8 },
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', '*', 80, 80], body: [vHeader, ...vRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 12],
    });
  }

  // 6b. Verbindlichkeiten
  if (verbindlichkeiten && verbindlichkeiten.length > 0) {
    content.push({ text: 'Verbindlichkeiten', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
    const vbHeader = ['Typ', 'Bezeichnung', 'Restschuld', 'Rate/Mon.', 'Zins'].map(t =>
      ({ text: t, bold: true, fontSize: 8, fillColor: '#f0f0f0' })
    );
    const vbRows = verbindlichkeiten.map(v => [
      { text: v.typ, fontSize: 8 },
      { text: v.bezeichnung ?? '-', fontSize: 8 },
      { text: `${fmt(v.restschuld)} EUR`, fontSize: 8 },
      { text: `${fmt(v.monatl_rate)} EUR`, fontSize: 8 },
      { text: v.zinssatz != null ? `${v.zinssatz} %` : '-', fontSize: 8 },
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', '*', 80, 70, 40], body: [vbHeader, ...vbRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 12],
    });
  }

  // 7. Altersvorsorge + Rentenluecke
  if (altersvorsorge && altersvorsorge.length > 0) {
    content.push({ text: 'Altersvorsorge', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
    const avHeader = ['Typ', 'Anbieter', 'Beitrag/Mon.', 'Akt. Stand', 'Progn. Rente'].map(t =>
      ({ text: t, bold: true, fontSize: 8, fillColor: '#f0f0f0' })
    );
    const avRows = altersvorsorge.map(a => [
      { text: a.typ, fontSize: 8 },
      { text: a.anbieter ?? '-', fontSize: 8 },
      { text: `${fmt(a.monatl_beitrag)} EUR`, fontSize: 8 },
      { text: `${fmt(a.aktueller_stand)} EUR`, fontSize: 8 },
      { text: `${fmt(a.prognostizierte_rente)} EUR`, fontSize: 8 },
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', '*', 70, 70, 70], body: [avHeader, ...avRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 12],
    });
  }

  // 8. Lueckenanalyse (Ampel-Tabelle)
  if (analyseErgebnisse && analyseErgebnisse.length > 0) {
    content.push({ text: 'Lueckenanalyse', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
    const analyseHeader = ['Risiko', 'IST', 'SOLL', 'Status'].map(t =>
      ({ text: t, bold: true, fontSize: 8, fillColor: '#f0f0f0' })
    );
    const analyseRows = analyseErgebnisse.map(e => [
      { text: e.risiko, fontSize: 8 },
      { text: e.ist, fontSize: 8 },
      { text: e.soll, fontSize: 8 },
      { text: statusLabel(e.status), fontSize: 8, color: statusColor(e.status), bold: true },
    ]);
    content.push({
      table: { headerRows: 1, widths: ['*', 90, 90, 80], body: [analyseHeader, ...analyseRows] },
      layout: TABLE_LAYOUT,
      margin: [0, 0, 0, 12],
    });

    // 9. Handlungsempfehlungen
    const handlungsbedarf = analyseErgebnisse.filter(e => e.status === 'rot' || e.status === 'gelb');
    if (handlungsbedarf.length > 0) {
      content.push({ text: 'Handlungsempfehlungen', fontSize: 12, bold: true, margin: [0, 8, 0, 6] });
      const empfehlungen = handlungsbedarf.map(e => {
        const prioritaet = e.status === 'rot' ? 'Dringend' : 'Empfohlen';
        return {
          text: [
            { text: `${prioritaet}: `, bold: true, fontSize: 9, color: statusColor(e.status) },
            { text: `${e.risiko} — IST: ${e.ist}, SOLL: ${e.soll}`, fontSize: 9 },
          ],
          margin: [0, 0, 0, 4],
        };
      });
      content.push(...empfehlungen);
    }
  }

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content,
    footer: buildFooter(isProbe),
  };

  pdfMake.createPdf(docDefinition).open();
}
