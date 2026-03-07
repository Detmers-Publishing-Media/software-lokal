import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.vfs;

/**
 * Generate a calculator result PDF and open it.
 *
 * @param {string} title — Calculator name (e.g. "BeitragsAnpassungsRechner")
 * @param {Array<{label: string, value: string}>} inputs — Input summary
 * @param {Array<{label: string, value: string}>} results — Result rows
 * @param {string} transparenzText — Disclaimer text
 */
export function generateCalculatorPdf(title, inputs, results, transparenzText) {
  const now = new Date().toLocaleDateString('de-DE');

  const inputRows = inputs.map(r => [r.label, r.value]);
  const resultRows = results.map(r => [
    { text: r.label, margin: [0, 2, 0, 2] },
    { text: r.value, alignment: 'right', bold: true, margin: [0, 2, 0, 2] },
  ]);

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content: [
      { text: title, style: 'header' },
      { text: `Erstellt am ${now}`, style: 'date' },
      { text: ' ', margin: [0, 10, 0, 0] },

      { text: 'Eingaben', style: 'subheader' },
      {
        table: {
          widths: ['*', 'auto'],
          body: inputRows,
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 15],
      },

      { text: 'Ergebnis', style: 'subheader' },
      {
        table: {
          widths: ['*', 'auto'],
          body: resultRows,
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 1 : 0.5),
          hLineColor: () => '#e2e8f0',
          vLineWidth: () => 0,
        },
        margin: [0, 0, 0, 20],
      },

      {
        table: {
          widths: ['*'],
          body: [[
            {
              stack: [
                { text: 'Transparenz-Hinweis', bold: true, fontSize: 9, margin: [0, 0, 0, 4] },
                { text: transparenzText, fontSize: 8, color: '#555555' },
              ],
              margin: [8, 8, 8, 8],
            },
          ]],
        },
        layout: {
          hLineColor: () => '#f6e05e',
          vLineColor: () => '#f6e05e',
          fillColor: () => '#fffbeb',
        },
      },
    ],
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Erstellt mit FinanzRechner Lokal — detmers-publish.de', fontSize: 7, color: '#999999', margin: [40, 0, 0, 0] },
        { text: `Seite ${currentPage} / ${pageCount}`, fontSize: 7, color: '#999999', alignment: 'right', margin: [0, 0, 40, 0] },
      ],
    }),
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 4] },
      date: { fontSize: 9, color: '#718096', margin: [0, 0, 0, 0] },
      subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 6] },
    },
  };

  pdfMake.createPdf(docDefinition).open();
}
