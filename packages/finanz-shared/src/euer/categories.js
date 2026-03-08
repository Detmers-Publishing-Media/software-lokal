/**
 * Standard EUeR categories based on Anlage EUER (BMF).
 * These are seeded into the category table on first run.
 */

export const EUER_CATEGORIES = [
  // Einnahmen (Zeilen 11-22 Anlage EUER)
  { code: 'E-01', name: 'Betriebseinnahmen (brutto)', type: 'income', euer_line: '11', sort_order: 10 },
  { code: 'E-02', name: 'Sonstige Einnahmen', type: 'income', euer_line: '16', sort_order: 20 },
  { code: 'E-03', name: 'Vereinnahmte USt', type: 'income', euer_line: '17', sort_order: 30 },
  { code: 'E-04', name: 'Privatnutzung / Eigenverbrauch', type: 'income', euer_line: '19', sort_order: 40 },

  // Ausgaben (Zeilen 23-65 Anlage EUER)
  { code: 'A-01', name: 'Wareneinkauf / Material', type: 'expense', euer_line: '26', sort_order: 100 },
  { code: 'A-02', name: 'Fremdleistungen', type: 'expense', euer_line: '27', sort_order: 110 },
  { code: 'A-03', name: 'Personal / Loehne', type: 'expense', euer_line: '28', sort_order: 120 },
  { code: 'A-04', name: 'Abschreibungen', type: 'expense', euer_line: '31', sort_order: 130 },
  { code: 'A-05', name: 'Raumkosten / Miete', type: 'expense', euer_line: '38', sort_order: 140 },
  { code: 'A-06', name: 'Versicherungen', type: 'expense', euer_line: '43', sort_order: 150 },
  { code: 'A-07', name: 'Kfz-Kosten', type: 'expense', euer_line: '44', sort_order: 160 },
  { code: 'A-08', name: 'Reisekosten', type: 'expense', euer_line: '48', sort_order: 170 },
  { code: 'A-09', name: 'Bewirtung', type: 'expense', euer_line: '51', sort_order: 180 },
  { code: 'A-10', name: 'Telefon / Internet', type: 'expense', euer_line: '52', sort_order: 190 },
  { code: 'A-11', name: 'Buerokosten / Verbrauch', type: 'expense', euer_line: '53', sort_order: 200 },
  { code: 'A-12', name: 'Porto / Versand', type: 'expense', euer_line: '54', sort_order: 210 },
  { code: 'A-13', name: 'Fortbildung / Fachliteratur', type: 'expense', euer_line: '55', sort_order: 220 },
  { code: 'A-14', name: 'Software / Lizenzen', type: 'expense', euer_line: '56', sort_order: 230 },
  { code: 'A-15', name: 'Rechts- / Beratungskosten', type: 'expense', euer_line: '57', sort_order: 240 },
  { code: 'A-16', name: 'Bankgebuehren', type: 'expense', euer_line: '58', sort_order: 250 },
  { code: 'A-17', name: 'Gezahlte Vorsteuer', type: 'expense', euer_line: '59', sort_order: 260 },
  { code: 'A-18', name: 'Gezahlte USt', type: 'expense', euer_line: '60', sort_order: 270 },
  { code: 'A-19', name: 'Sonstige Ausgaben', type: 'expense', euer_line: '65', sort_order: 280 },
];

/**
 * Seed categories into the database.
 * Only inserts missing categories (by code), never overwrites existing ones.
 */
export async function seedCategories(execute, query) {
  for (const cat of EUER_CATEGORIES) {
    const existing = await query('SELECT id FROM category WHERE code = ?', [cat.code]);
    if (existing.length === 0) {
      await execute(
        'INSERT INTO category (code, name, type, euer_line, sort_order) VALUES (?, ?, ?, ?, ?)',
        [cat.code, cat.name, cat.type, cat.euer_line, cat.sort_order]
      );
    }
  }
}
