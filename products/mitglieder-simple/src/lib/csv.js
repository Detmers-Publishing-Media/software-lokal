/**
 * CSV-Export fuer Mitgliederdaten.
 * Semikolon-getrennt (deutsche Konvention), UTF-8 BOM fuer Excel-Kompatibilitaet.
 */

const BOM = '\uFEFF';

function escapeValue(val) {
  if (val == null) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Erzeugt einen CSV-String aus Zeilen und Spaltendefinitionen.
 * @param {Array<Object>} rows - Datenzeilen
 * @param {Array<{key: string, label: string}>} columns - Spaltendefinitionen
 * @returns {string} CSV-String mit BOM
 */
export function generateCsv(rows, columns) {
  const header = columns.map(c => escapeValue(c.label)).join(';');
  const lines = rows.map(row =>
    columns.map(c => escapeValue(row[c.key])).join(';')
  );
  return BOM + [header, ...lines].join('\r\n');
}

/**
 * Loedt den CSV-String als Datei herunter (Browser-Download).
 * @param {string} csvString - CSV-Inhalt
 * @param {string} filename - Dateiname (z.B. "mitglieder-2026-03-04.csv")
 */
export function downloadCsv(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
