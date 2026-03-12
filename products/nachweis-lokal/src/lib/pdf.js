import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

/**
 * Generate and open a PDF list document.
 * @param {string} title - Document title
 * @param {Array<{text: string, width: number|string}>} columns - Column definitions
 * @param {Array<Array<string>>} rows - Table row data
 * @param {Object} orgProfile - Organization profile for letterhead
 * @param {boolean} isProbe - Whether to show trial watermark
 */
export function generateListPdf(title, columns, rows, orgProfile, isProbe) {
  const today = new Date().toLocaleDateString('de-DE');

  const headerContent = [];
  if (orgProfile?.name) {
    headerContent.push({ text: orgProfile.name, fontSize: 14, bold: true, margin: [0, 0, 0, 2] });
    const addressParts = [orgProfile.street, [orgProfile.zip, orgProfile.city].filter(Boolean).join(' ')].filter(Boolean);
    if (addressParts.length) {
      headerContent.push({ text: addressParts.join(', '), fontSize: 9, color: '#666', margin: [0, 0, 0, 8] });
    }
  }
  headerContent.push({ text: title, fontSize: 12, bold: true, margin: [0, 4, 0, 8] });

  const colWidths = columns.map(c => c.width ?? '*');
  const tableHeader = columns.map(c => ({ text: c.text, bold: true, fontSize: 8, fillColor: '#f0f0f0' }));
  const tableBody = [tableHeader, ...rows.map(row =>
    row.map(cell => ({ text: cell ?? '', fontSize: 8 }))
  )];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content: [
      ...headerContent,
      {
        table: {
          headerRows: 1,
          widths: colWidths,
          body: tableBody,
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.25,
          vLineWidth: () => 0,
          hLineColor: () => '#cccccc',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      },
    ],
    footer: (currentPage, pageCount) => {
      const footerColumns = [
        { text: `Stand: ${today}`, fontSize: 7, color: '#999', margin: [40, 0, 0, 0] },
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
    },
  };

  pdfMake.createPdf(docDefinition).open();
}

/**
 * Generate a single inspection protocol PDF.
 * @param {Object} inspection - Inspection data
 * @param {Array<Object>} results - Inspection results with labels
 * @param {Object} orgProfile - Organization profile for letterhead
 * @param {boolean} isProbe - Whether to show trial watermark
 */
export function generateProtocolPdf(inspection, results, orgProfile, isProbe) {
  const today = new Date().toLocaleDateString('de-DE');

  const headerContent = [];
  if (orgProfile?.name) {
    headerContent.push({ text: orgProfile.name, fontSize: 14, bold: true, margin: [0, 0, 0, 2] });
    const addressParts = [orgProfile.street, [orgProfile.zip, orgProfile.city].filter(Boolean).join(' ')].filter(Boolean);
    if (addressParts.length) {
      headerContent.push({ text: addressParts.join(', '), fontSize: 9, color: '#666', margin: [0, 0, 0, 8] });
    }
  }

  // Protocol header
  headerContent.push({ text: 'Pruefprotokoll', fontSize: 14, bold: true, margin: [0, 8, 0, 4] });
  headerContent.push({ text: inspection.title, fontSize: 12, margin: [0, 0, 0, 8] });

  // Meta table
  const metaRows = [
    ['Vorlage:', inspection.template_name ?? '-'],
    ['Objekt:', inspection.object_name ?? '-'],
    ['Pruefer:', inspection.inspector],
    ['Datum:', formatDate(inspection.inspection_date)],
    ['Status:', statusLabel(inspection.status)],
  ];
  if (inspection.due_date) {
    metaRows.push(['Naechste Pruefung:', formatDate(inspection.due_date)]);
  }

  // Results table
  const resultHeader = [
    { text: 'Nr.', bold: true, fontSize: 8, fillColor: '#f0f0f0', width: 30 },
    { text: 'Pruefpunkt', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
    { text: 'Ergebnis', bold: true, fontSize: 8, fillColor: '#f0f0f0', width: 70 },
    { text: 'Bemerkung', bold: true, fontSize: 8, fillColor: '#f0f0f0' },
  ];
  const resultRows = results.map((r, i) => [
    { text: String(i + 1), fontSize: 8 },
    { text: r.label, fontSize: 8 },
    { text: resultLabel(r.result), fontSize: 8, color: resultColor(r.result) },
    { text: r.remark ?? '', fontSize: 8, color: '#666' },
  ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content: [
      ...headerContent,
      {
        table: {
          widths: [80, '*'],
          body: metaRows.map(([label, value]) => [
            { text: label, fontSize: 9, bold: true },
            { text: value, fontSize: 9 },
          ]),
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 12],
      },
      { text: 'Pruefergebnisse', fontSize: 11, bold: true, margin: [0, 8, 0, 6] },
      {
        table: {
          headerRows: 1,
          widths: [30, '*', 70, '*'],
          body: [resultHeader, ...resultRows],
        },
        layout: {
          hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.25,
          vLineWidth: () => 0,
          hLineColor: () => '#cccccc',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 3,
          paddingBottom: () => 3,
        },
      },
      ...(inspection.notes ? [
        { text: 'Hinweise', fontSize: 11, bold: true, margin: [0, 12, 0, 4] },
        { text: inspection.notes, fontSize: 9, color: '#333' },
      ] : []),
    ],
    footer: (currentPage, pageCount) => {
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
    },
  };

  pdfMake.createPdf(docDefinition).open();
}

/**
 * Generate a deficiency report PDF (only items with maengel).
 */
export function generateDeficiencyPdf(inspection, results, orgProfile, isProbe) {
  const deficiencies = results.filter(r => r.result === 'maengel');
  if (deficiencies.length === 0) return;

  const columns = [
    { text: 'Nr.', width: 30 },
    { text: 'Pruefpunkt', width: '*' },
    { text: 'Bemerkung', width: '*' },
  ];
  const rows = deficiencies.map((r, i) => [
    String(i + 1),
    r.label,
    r.remark ?? '-',
  ]);

  const title = `Maengelbericht — ${inspection.title} (${formatDate(inspection.inspection_date)})`;
  generateListPdf(title, columns, rows, orgProfile, isProbe);
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function statusLabel(status) {
  const labels = { offen: 'Offen', bestanden: 'Bestanden', bemaengelt: 'Bemaengelt', abgebrochen: 'Abgebrochen' };
  return labels[status] ?? status;
}

function resultLabel(result) {
  const labels = { offen: 'Offen', ok: 'OK', maengel: 'Maengel', nicht_anwendbar: 'N/A' };
  return labels[result] ?? result;
}

function resultColor(result) {
  const colors = { ok: '#38a169', maengel: '#e53e3e', offen: '#718096', nicht_anwendbar: '#a0aec0' };
  return colors[result] ?? '#1a202c';
}
