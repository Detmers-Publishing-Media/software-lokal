<script>
  import { currentView } from '../lib/stores/navigation.js';
  import { bulkImportKonditionenVersicherung, bulkImportKonditionenDarlehen } from '../lib/db.js';

  let importType = $state('konditionen-versicherung');
  let filePath = $state('');
  let sheets = $state([]);
  let selectedSheet = $state(0);
  let importing = $state(false);
  let result = $state(null);
  let error = $state(null);

  async function selectFile() {
    const path = await window.electronAPI.dialog.openFile({
      filters: [{ name: 'Excel-Dateien', extensions: ['xlsx', 'xls'] }],
    });
    if (!path) return;
    filePath = path;
    error = null;
    result = null;

    const parsed = await window.electronAPI.excel.parse(path);
    if (parsed.error) {
      error = parsed.error;
      return;
    }
    sheets = parsed;
    selectedSheet = 0;
  }

  async function runImport() {
    if (!sheets.length) return;
    importing = true;
    error = null;
    result = null;

    try {
      const sheet = sheets[selectedSheet];
      const rows = sheet.rows.filter(r => Object.values(r).some(v => v != null && v !== ''));

      let count = 0;

      if (importType === 'konditionen-versicherung') {
        const mapped = rows.map(r => ({
          versicherer: r['Versicherer'] ?? r['versicherer'] ?? '',
          sparte: r['Sparte'] ?? r['sparte'] ?? '',
          tarifname: r['Tarifname'] ?? r['Tarif'] ?? r['tarifname'] ?? '',
          gueltig_ab: normalizeDate(r['Gueltig ab'] ?? r['Gültig ab'] ?? r['gueltig_ab']),
          gueltig_bis: normalizeDate(r['Gueltig bis'] ?? r['Gültig bis'] ?? r['gueltig_bis']),
          alter_von: num(r['Alter von'] ?? r['alter_von']),
          alter_bis: num(r['Alter bis'] ?? r['alter_bis']),
          beitrag_monatlich: num(r['Beitrag mtl. (€)'] ?? r['Beitrag mtl.'] ?? r['beitrag_monatlich'] ?? r['Beitrag/Monat']),
          versicherungssumme: num(r['VS/Leistung (€)'] ?? r['VS/Leistung'] ?? r['versicherungssumme']),
          selbstbeteiligung: num(r['SB (€)'] ?? r['SB'] ?? r['selbstbeteiligung']),
          berufsgruppe: r['Berufsgruppe'] ?? r['berufsgruppe'] ?? '',
          rating: r['Rating (F&B)'] ?? r['Rating'] ?? r['rating'] ?? '',
          courtage_ap: r['Courtage AP'] ?? r['courtage_ap'] ?? '',
          courtage_bp: r['Courtage BP (%)'] ?? r['Courtage BP'] ?? r['courtage_bp'] ?? '',
          notiz: r['Besonderheiten'] ?? r['notiz'] ?? '',
        })).filter(r => r.versicherer);

        count = await bulkImportKonditionenVersicherung(mapped);

      } else if (importType === 'konditionen-darlehen') {
        const mapped = rows.map(r => ({
          kreditgeber: r['Kreditgeber'] ?? r['kreditgeber'] ?? '',
          produktname: r['Produktname'] ?? r['Produkt'] ?? r['produktname'] ?? '',
          gueltig_ab: normalizeDate(r['Gueltig ab'] ?? r['Gültig ab'] ?? r['gueltig_ab']),
          gueltig_bis: normalizeDate(r['Gueltig bis'] ?? r['Gültig bis'] ?? r['gueltig_bis']),
          sollzins: num(r['Sollzins (%)'] ?? r['Sollzins'] ?? r['sollzins']),
          effektivzins: num(r['Effektivzins (%)'] ?? r['Effektivzins'] ?? r['effektivzins']),
          zinsbindung_jahre: num(r['Zinsbindung (Jahre)'] ?? r['Zinsbindung'] ?? r['zinsbindung_jahre']),
          sondertilgung_prozent: num(r['Sondertilgung (% p.a.)'] ?? r['Sondertilgung'] ?? r['sondertilgung_prozent']),
          bereitstellungszinsfrei_monate: num(r['Bereitstellungszinsfrei (Monate)'] ?? r['bereitstellungszinsfrei_monate']),
          kfw_kompatibel: (r['KfW-kompatibel?'] ?? r['kfw_kompatibel'] ?? '') === 'Ja' ? 1 : 0,
          min_eigenkapital_prozent: num(r['Min. Eigenkapital (%)'] ?? r['min_eigenkapital_prozent']),
          provision: r['Provision (%)'] ?? r['Provision'] ?? r['provision'] ?? '',
          notiz: r['Anmerkungen'] ?? r['notiz'] ?? '',
        })).filter(r => r.kreditgeber);

        count = await bulkImportKonditionenDarlehen(mapped);
      }

      result = { count };
    } catch (err) {
      error = err.message;
    } finally {
      importing = false;
    }
  }

  function num(v) {
    if (v == null || v === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  }

  function normalizeDate(v) {
    if (v == null || v === '') return null;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    const str = String(v);
    const match = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    return str.slice(0, 10);
  }
</script>

<div class="import-page">
  <h1>Excel Import / Export</h1>

  <section>
    <h2>Konditionen importieren</h2>
    <p class="hint">Importieren Sie Versicherungs- oder Darlehenskonditionen aus einer Excel-Datei. Nutzen Sie die Vorlagen aus dem <code>templates/</code>-Ordner als Grundlage.</p>

    <div class="import-controls">
      <label>Import-Typ
        <select bind:value={importType}>
          <option value="konditionen-versicherung">Versicherungskonditionen</option>
          <option value="konditionen-darlehen">Darlehenskonditionen</option>
        </select>
      </label>

      <button class="btn btn-secondary" onclick={selectFile}>Datei auswählen...</button>
      {#if filePath}
        <span class="file-path">{filePath.split('/').pop()}</span>
      {/if}
    </div>

    {#if sheets.length > 0}
      <div class="preview">
        <div class="sheet-selector">
          <label>Blatt:
            <select bind:value={selectedSheet}>
              {#each sheets as sheet, i}
                <option value={i}>{sheet.name} ({sheet.rows.length} Zeilen)</option>
              {/each}
            </select>
          </label>
        </div>

        <div class="preview-table">
          <table>
            <thead>
              <tr>
                {#each sheets[selectedSheet].headers as h}
                  <th>{h}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each sheets[selectedSheet].rows.slice(0, 10) as row}
                <tr>
                  {#each sheets[selectedSheet].headers as h}
                    <td>{row[h] ?? ''}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
          {#if sheets[selectedSheet].rows.length > 10}
            <p class="hint">... und {sheets[selectedSheet].rows.length - 10} weitere Zeilen</p>
          {/if}
        </div>

        <button class="btn btn-accent" onclick={runImport} disabled={importing}>
          {importing ? 'Importiere...' : `${sheets[selectedSheet].rows.length} Zeilen importieren`}
        </button>
      </div>
    {/if}

    {#if result}
      <div class="success-msg">{result.count} Einträge erfolgreich importiert.</div>
    {/if}
    {#if error}
      <div class="error-msg">Fehler: {error}</div>
    {/if}
  </section>

  <section>
    <h2>Excel-Vorlagen</h2>
    <p class="hint">Die Vorlagen finden Sie im Ordner <code>templates/</code> des Installationsverzeichnisses:</p>
    <ul>
      <li><strong>kundenfragebogen.xlsx</strong> — Fragebogen zum Versand an Kunden vor dem Termin</li>
      <li><strong>konditionen-versicherung.xlsx</strong> — Vorlage für Versicherungskonditionen</li>
      <li><strong>konditionen-darlehen.xlsx</strong> — Vorlage für Darlehenskonditionen</li>
    </ul>
  </section>
</div>

<style>
  .import-page { display: flex; flex-direction: column; gap: 1.5rem; }
  section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.25rem; }
  section h2 { margin-bottom: 0.5rem; }
  .hint { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 0.75rem; }
  code { background: var(--color-border); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.85rem; }

  .import-controls { display: flex; gap: 1rem; align-items: flex-end; margin-bottom: 1rem; }
  .import-controls label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); }
  .import-controls select { max-width: 250px; }
  .file-path { font-size: 0.85rem; color: var(--color-accent); font-weight: 500; }

  .preview { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .sheet-selector { margin-bottom: 0.5rem; }
  .sheet-selector label { font-size: 0.8125rem; color: var(--color-text-muted); }
  .preview-table { overflow-x: auto; max-height: 400px; overflow-y: auto; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  .preview-table table { font-size: 0.8125rem; }
  .preview-table th { position: sticky; top: 0; }

  .success-msg { background: var(--color-success-bg); color: #0f5132; padding: 0.75rem 1rem; border-radius: 0.375rem; font-weight: 500; }
  .error-msg { background: var(--color-danger-bg); color: #842029; padding: 0.75rem 1rem; border-radius: 0.375rem; }

  ul { padding-left: 1.5rem; }
  li { margin-bottom: 0.375rem; }
</style>
