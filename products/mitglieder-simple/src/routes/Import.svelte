<script>
  import { members } from '../lib/stores/members.js';
  import { currentView } from '../lib/stores/navigation.js';
  import { saveMember, getMembers } from '../lib/db.js';

  let csvText = $state('');
  let preview = $state([]);
  let importing = $state(false);
  let result = $state(null);

  function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = lines[i].split(';').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = vals[idx] ?? ''; });
      rows.push(row);
    }
    return rows;
  }

  const FIELD_MAP = {
    vorname: 'first_name', nachname: 'last_name', strasse: 'street',
    plz: 'zip', ort: 'city', telefon: 'phone', 'e-mail': 'email', email: 'email',
    geburtsdatum: 'birth_date', eintrittsdatum: 'entry_date', status: 'status',
  };

  function mapRow(raw) {
    const mapped = { status: 'aktiv', entry_date: new Date().toISOString().split('T')[0] };
    for (const [key, val] of Object.entries(raw)) {
      const target = FIELD_MAP[key];
      if (target && val) mapped[target] = val;
    }
    return mapped;
  }

  function handlePreview() {
    const rows = parseCSV(csvText);
    preview = rows.map(mapRow);
  }

  async function handleImport() {
    importing = true;
    let imported = 0, errors = 0;
    for (const row of preview) {
      try {
        if (row.first_name && row.last_name) {
          await saveMember(row);
          imported++;
        }
      } catch { errors++; }
    }
    result = { imported, errors };
    members.set(await getMembers());
    importing = false;
  }
</script>

<div class="import-page">
  <h1>CSV-Import</h1>
  <p class="hint">CSV-Datei mit Semikolon-Trennung einfuegen (Kopie aus Excel). Erwartete Spalten: Vorname, Nachname, Strasse, PLZ, Ort, Telefon, E-Mail, Geburtsdatum, Eintrittsdatum, Status</p>

  <textarea bind:value={csvText} rows="10" placeholder="Vorname;Nachname;Strasse;PLZ;Ort;Telefon;E-Mail&#10;Max;Mustermann;Musterstr. 1;12345;Musterstadt;0123/456789;max@example.de"></textarea>

  <div class="actions">
    <button class="btn-secondary" onclick={handlePreview} disabled={!csvText.trim()}>Vorschau</button>
    {#if preview.length > 0}
      <button class="btn-primary" onclick={handleImport} disabled={importing}>
        {importing ? 'Importiere...' : `${preview.length} Mitglieder importieren`}
      </button>
    {/if}
  </div>

  {#if result}
    <div class="result">
      Importiert: {result.imported}, Fehler: {result.errors}
      <button class="btn-secondary" onclick={() => currentView.set('list')}>Zur Liste</button>
    </div>
  {/if}

  {#if preview.length > 0 && !result}
    <table>
      <thead>
        <tr><th>Vorname</th><th>Nachname</th><th>Ort</th><th>Status</th></tr>
      </thead>
      <tbody>
        {#each preview as row}
          <tr><td>{row.first_name}</td><td>{row.last_name}</td><td>{row.city ?? '-'}</td><td>{row.status}</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .import-page { max-width: 800px; display: flex; flex-direction: column; gap: 1rem; }
  .hint { color: var(--color-text-muted); font-size: 0.8125rem; }
  textarea { width: 100%; font-family: monospace; font-size: 0.8125rem; }
  .actions { display: flex; gap: 0.75rem; }
  .result { padding: 1rem; background: #c6f6d5; border-radius: 0.375rem; display: flex; justify-content: space-between; align-items: center; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  th { background: var(--color-surface); font-weight: 600; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
</style>
