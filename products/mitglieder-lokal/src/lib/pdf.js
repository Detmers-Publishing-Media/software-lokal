import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

/**
 * Generate and open a PDF document.
 * @param {string} title - Document title
 * @param {Array<{text: string, width: number|string}>} columns - Column definitions
 * @param {Array<Array<string>>} rows - Table row data
 * @param {Object} clubProfile - Club profile for letterhead
 * @param {boolean} isProbe - Whether to show trial watermark
 */
export function generatePdf(title, columns, rows, clubProfile, isProbe) {
  const today = new Date().toLocaleDateString('de-DE');

  // Letterhead
  const headerContent = [];
  if (clubProfile?.name) {
    headerContent.push({ text: clubProfile.name, fontSize: 14, bold: true, margin: [0, 0, 0, 2] });
    const addressParts = [clubProfile.street, [clubProfile.zip, clubProfile.city].filter(Boolean).join(' ')].filter(Boolean);
    if (addressParts.length) {
      headerContent.push({ text: addressParts.join(', '), fontSize: 9, color: '#666', margin: [0, 0, 0, 8] });
    }
  }
  headerContent.push({ text: title, fontSize: 12, bold: true, margin: [0, 4, 0, 8] });

  // Table
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
