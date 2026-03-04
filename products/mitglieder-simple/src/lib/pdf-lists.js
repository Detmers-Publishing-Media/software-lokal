import { generatePdf } from './pdf.js';

/**
 * Mitgliederliste — all active members.
 */
export function generateMitgliederliste(members, profile, isProbe) {
  const active = members.filter(m => m.status === 'aktiv' || m.status === 'passiv');
  const columns = [
    { text: 'Nr.', width: 40 },
    { text: 'Name', width: '*' },
    { text: 'Adresse', width: '*' },
    { text: 'Status', width: 50 },
    { text: 'Eintritt', width: 60 },
  ];
  const rows = active.map(m => [
    m.member_number,
    `${m.last_name}, ${m.first_name}`,
    [m.street, [m.zip, m.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    m.status,
    m.entry_date ?? '',
  ]);
  generatePdf('Mitgliederliste', columns, rows, profile, isProbe);
}

/**
 * Telefonliste — only members with consent_phone.
 */
export function generateTelefonliste(members, profile, isProbe) {
  const filtered = members.filter(m =>
    m.consent_phone && (m.status === 'aktiv' || m.status === 'passiv')
  );
  const columns = [
    { text: 'Nr.', width: 40 },
    { text: 'Name', width: '*' },
    { text: 'Telefon', width: 120 },
  ];
  const rows = filtered.map(m => [
    m.member_number,
    `${m.last_name}, ${m.first_name}`,
    m.phone ?? '',
  ]);
  generatePdf('Telefonliste', columns, rows, profile, isProbe);
}

/**
 * Geburtstagsliste — all members with birth_date, sorted by month/day.
 */
export function generateGeburtstagsliste(members, profile, isProbe) {
  const withBirthday = members
    .filter(m => m.birth_date && (m.status === 'aktiv' || m.status === 'passiv'))
    .sort((a, b) => {
      const [, am, ad] = a.birth_date.split('-');
      const [, bm, bd] = b.birth_date.split('-');
      return (am + ad).localeCompare(bm + bd);
    });
  const columns = [
    { text: 'Nr.', width: 40 },
    { text: 'Name', width: '*' },
    { text: 'Geburtsdatum', width: 80 },
    { text: 'Alter', width: 40 },
  ];
  const now = new Date();
  const rows = withBirthday.map(m => {
    const [y] = m.birth_date.split('-');
    const age = now.getFullYear() - parseInt(y, 10);
    return [
      m.member_number,
      `${m.last_name}, ${m.first_name}`,
      formatDate(m.birth_date),
      String(age),
    ];
  });
  generatePdf('Geburtstagsliste', columns, rows, profile, isProbe);
}

/**
 * Jubilarliste — members with 10/15/20/25/30/... years membership in given year.
 */
export function generateJubilarliste(members, profile, year, isProbe) {
  const jubilees = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
  const jubilare = members
    .filter(m => {
      if (!m.entry_date || (m.status !== 'aktiv' && m.status !== 'passiv')) return false;
      const entryYear = parseInt(m.entry_date.split('-')[0], 10);
      const years = year - entryYear;
      return jubilees.includes(years);
    })
    .sort((a, b) => {
      const ya = year - parseInt(a.entry_date.split('-')[0], 10);
      const yb = year - parseInt(b.entry_date.split('-')[0], 10);
      return yb - ya; // longest first
    });
  const columns = [
    { text: 'Nr.', width: 40 },
    { text: 'Name', width: '*' },
    { text: 'Eintritt', width: 70 },
    { text: 'Jahre', width: 40 },
  ];
  const rows = jubilare.map(m => {
    const entryYear = parseInt(m.entry_date.split('-')[0], 10);
    return [
      m.member_number,
      `${m.last_name}, ${m.first_name}`,
      formatDate(m.entry_date),
      String(year - entryYear),
    ];
  });
  generatePdf(`Jubilarliste ${year}`, columns, rows, profile, isProbe);
}

/**
 * Beitragsuebersicht — annual fee overview with expected vs paid amounts.
 */
export function generateBeitragsuebersicht(overview, profile, year, isProbe) {
  const columns = [
    { text: 'Nr.', width: 40 },
    { text: 'Name', width: '*' },
    { text: 'Beitragsklasse', width: 90 },
    { text: 'Soll', width: 55 },
    { text: 'Gezahlt', width: 55 },
    { text: 'Offen', width: 55 },
    { text: 'Status', width: 55 },
  ];
  const rows = overview.map(m => [
    m.member_number,
    `${m.last_name}, ${m.first_name}`,
    m.fee_class_name ?? '-',
    formatCents(m.expected_cents),
    formatCents(m.paid_cents ?? 0),
    formatCents(m.diff_cents),
    m.status,
  ]);

  // Summary row
  const totalExpected = overview.reduce((s, m) => s + (m.expected_cents ?? 0), 0);
  const totalPaid = overview.reduce((s, m) => s + (m.paid_cents ?? 0), 0);
  const totalOpen = totalExpected - totalPaid;
  rows.push([
    '', 'Gesamt', '',
    formatCents(totalExpected),
    formatCents(totalPaid),
    formatCents(totalOpen),
    '',
  ]);

  generatePdf(`Beitragsuebersicht ${year}`, columns, rows, profile, isProbe);
}

function formatCents(cents) {
  return `${(cents / 100).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}
