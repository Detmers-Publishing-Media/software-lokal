import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.vfs;

function formatCents(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

function formatDate(iso) {
  if (!iso) return '-';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

/**
 * Generate and open a professional invoice PDF.
 * @param {Object} invoice - Invoice with items
 * @param {Object} customer - Customer data
 * @param {Object} profile - Business profile
 */
export function generateInvoicePdf(invoice, customer, profile) {
  const today = new Date().toLocaleDateString('de-DE');
  const isSmallBusiness = !!profile?.is_small_business;

  // --- Sender line (small, above recipient) ---
  const senderParts = [profile?.name, profile?.street, [profile?.zip, profile?.city].filter(Boolean).join(' ')].filter(Boolean);
  const senderLine = senderParts.join(' · ');

  // --- Recipient block ---
  const recipientLines = [];
  if (customer?.company) recipientLines.push(customer.company);
  const custName = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ');
  if (custName) recipientLines.push(custName);
  if (customer?.street) recipientLines.push(customer.street);
  const custCity = [customer?.zip, customer?.city].filter(Boolean).join(' ');
  if (custCity) recipientLines.push(custCity);

  // --- Invoice meta ---
  const metaRows = [
    ['Rechnungsnummer:', invoice.invoice_number],
    ['Rechnungsdatum:', formatDate(invoice.issue_date)],
  ];
  if (invoice.due_date) {
    metaRows.push(['Faelligkeitsdatum:', formatDate(invoice.due_date)]);
  }
  if (customer?.vat_id) {
    metaRows.push(['USt-IdNr. Kunde:', customer.vat_id]);
  }

  // --- Items table ---
  const itemHeaders = [
    { text: 'Pos.', bold: true, fillColor: '#f5f5f5', alignment: 'center' },
    { text: 'Beschreibung', bold: true, fillColor: '#f5f5f5' },
    { text: 'Menge', bold: true, fillColor: '#f5f5f5', alignment: 'right' },
    { text: 'Einheit', bold: true, fillColor: '#f5f5f5' },
    { text: 'Einzelpreis', bold: true, fillColor: '#f5f5f5', alignment: 'right' },
    { text: 'Summe', bold: true, fillColor: '#f5f5f5', alignment: 'right' },
  ];

  const itemRows = (invoice.items || []).map((item, i) => [
    { text: String(item.position ?? i + 1), alignment: 'center' },
    { text: item.description || '' },
    { text: String(item.quantity ?? 1), alignment: 'right' },
    { text: item.unit || 'Stueck' },
    { text: formatCents(item.unit_price_cents) + ' EUR', alignment: 'right' },
    { text: formatCents(item.line_total_cents) + ' EUR', alignment: 'right' },
  ]);

  // --- Totals ---
  const totalsRows = [];
  totalsRows.push([
    { text: '', colSpan: 4, border: [false, false, false, false] }, {}, {}, {},
    { text: 'Netto:', alignment: 'right', border: [false, false, false, false] },
    { text: formatCents(invoice.subtotal_cents) + ' EUR', alignment: 'right', border: [false, false, false, false] },
  ]);

  if (!isSmallBusiness && invoice.tax_cents > 0) {
    totalsRows.push([
      { text: '', colSpan: 4, border: [false, false, false, false] }, {}, {}, {},
      { text: 'MwSt:', alignment: 'right', border: [false, false, false, false] },
      { text: formatCents(invoice.tax_cents) + ' EUR', alignment: 'right', border: [false, false, false, false] },
    ]);
  }

  totalsRows.push([
    { text: '', colSpan: 4, border: [false, false, false, true] }, {}, {}, {},
    { text: 'Gesamt:', bold: true, fontSize: 11, alignment: 'right', border: [false, true, false, true] },
    { text: formatCents(invoice.total_cents) + ' EUR', bold: true, fontSize: 11, alignment: 'right', border: [false, true, false, true] },
  ]);

  // --- Content ---
  const content = [];

  // Letterhead
  if (profile?.name) {
    content.push({ text: profile.name, fontSize: 16, bold: true, margin: [0, 0, 0, 2] });
    const addressLine = [profile.street, [profile.zip, profile.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    if (addressLine) {
      content.push({ text: addressLine, fontSize: 9, color: '#666', margin: [0, 0, 0, 4] });
    }
    const contactParts = [];
    if (profile.contact_email) contactParts.push(profile.contact_email);
    if (profile.contact_phone) contactParts.push(profile.contact_phone);
    if (contactParts.length) {
      content.push({ text: contactParts.join(' · '), fontSize: 8, color: '#888', margin: [0, 0, 0, 0] });
    }
    content.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }], margin: [0, 6, 0, 16] });
  }

  // Sender line + Recipient
  content.push({ text: senderLine, fontSize: 7, color: '#888', margin: [0, 0, 0, 2] });
  content.push({ text: recipientLines.join('\n'), fontSize: 10, lineHeight: 1.4, margin: [0, 0, 0, 20] });

  // Invoice title
  content.push({ text: `Rechnung ${invoice.invoice_number}`, fontSize: 14, bold: true, margin: [0, 0, 0, 8] });

  // Meta table (right-aligned)
  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        table: {
          body: metaRows.map(([label, val]) => [
            { text: label, fontSize: 9, color: '#666', border: [false, false, false, false] },
            { text: val, fontSize: 9, bold: true, border: [false, false, false, false] },
          ]),
        },
      },
    ],
    margin: [0, 0, 0, 16],
  });

  // Items table
  content.push({
    table: {
      headerRows: 1,
      widths: [30, '*', 40, 45, 70, 70],
      body: [itemHeaders, ...itemRows],
    },
    layout: {
      hLineWidth: (i, node) => (i === 0 || i === 1 || i === node.table.body.length) ? 0.5 : 0.25,
      vLineWidth: () => 0,
      hLineColor: () => '#cccccc',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
    margin: [0, 0, 0, 4],
  });

  // Totals
  content.push({
    table: {
      widths: [30, '*', 40, 45, 70, 70],
      body: totalsRows,
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0,
      hLineColor: () => '#cccccc',
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    },
    margin: [0, 0, 0, 16],
  });

  // Small business notice
  if (isSmallBusiness) {
    content.push({
      text: 'Gemaess § 19 UStG wird keine Umsatzsteuer berechnet.',
      fontSize: 9, italics: true, color: '#666', margin: [0, 0, 0, 12],
    });
  }

  // Notes
  if (invoice.notes) {
    content.push({ text: 'Bemerkungen:', fontSize: 9, bold: true, margin: [0, 0, 0, 2] });
    content.push({ text: invoice.notes, fontSize: 9, color: '#444', margin: [0, 0, 0, 12] });
  }

  // Payment terms
  if (invoice.due_date) {
    content.push({
      text: `Bitte ueberweisen Sie den Betrag bis zum ${formatDate(invoice.due_date)}.`,
      fontSize: 9, margin: [0, 0, 0, 12],
    });
  }

  // Bank details
  if (profile?.iban) {
    const bankLines = [];
    bankLines.push(`IBAN: ${profile.iban}`);
    if (profile.bic) bankLines.push(`BIC: ${profile.bic}`);
    if (profile.bank_name) bankLines.push(`Bank: ${profile.bank_name}`);

    content.push({
      table: {
        widths: ['*'],
        body: [[{
          stack: [
            { text: 'Bankverbindung', fontSize: 9, bold: true, margin: [0, 0, 0, 4] },
            { text: bankLines.join('\n'), fontSize: 9, color: '#444', lineHeight: 1.3 },
          ],
          fillColor: '#f9f9f9',
          border: [false, false, false, false],
        }]],
      },
      layout: { paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6 },
      margin: [0, 0, 0, 0],
    });
  }

  // --- Footer ---
  const footerParts = [];
  if (profile?.tax_id) footerParts.push(`Steuernr.: ${profile.tax_id}`);
  if (profile?.vat_id) footerParts.push(`USt-IdNr.: ${profile.vat_id}`);
  if (profile?.representative) footerParts.push(`Inhaber: ${profile.representative}`);
  const footerText = footerParts.join(' · ');

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 60],
    content,
    footer: (currentPage, pageCount) => ({
      stack: [
        footerText ? { text: footerText, fontSize: 7, color: '#999', alignment: 'center', margin: [40, 0, 40, 4] } : null,
        {
          columns: [
            { text: `Stand: ${today}`, fontSize: 7, color: '#999', margin: [40, 0, 0, 0] },
            { text: `Seite ${currentPage} / ${pageCount}`, fontSize: 7, color: '#999', alignment: 'right', margin: [0, 0, 40, 0] },
          ],
        },
      ].filter(Boolean),
      margin: [0, 10, 0, 0],
    }),
  };

  pdfMake.createPdf(docDefinition).open();
}
