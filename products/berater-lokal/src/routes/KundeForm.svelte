<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import {
    getKunde, saveKunde, getKinder, saveKind, deleteKind,
    getEinnahmen, saveEinnahme, deleteEinnahme,
    getAusgaben, saveAusgabe, deleteAusgabe,
    getPolicen, savePolicen, deletePolice,
    getVermoegen, saveVermoegen, deleteVermoegen,
    getVerbindlichkeiten, saveVerbindlichkeit, deleteVerbindlichkeit,
    getAltersvorsorge, saveAltersvorsorge, deleteAltersvorsorge,
  } from '../lib/db.js';
  import { analysiere } from '../lib/analyse.js';
  import {
    ANREDE_OPTIONS, FAMILIENSTAND_OPTIONS, BERUF_STATUS_OPTIONS, SPARTEN,
    EINNAHMEN_TYPEN, AUSGABEN_KATEGORIEN, VERMOEGEN_TYPEN,
    VERBINDLICHKEITEN_TYPEN, ALTERSVORSORGE_TYPEN, BEWERTUNG_OPTIONS,
  } from '../lib/types.js';

  let { kundeId = null } = $props();
  let isEdit = $derived(kundeId != null);
  let activeTab = $state('persoenliches');
  let saving = $state(false);

  let form = $state({
    anrede: '', vorname: '', nachname: '', geburtsdatum: '', familienstand: 'ledig',
    beruf: '', beruf_status: 'angestellt', arbeitgeber: '', branche: '',
    raucher: false, groesse_cm: null, gewicht_kg: null,
    vorerkrankungen: '', medikamente: '', notizen: '', partner_id: null,
  });

  let kinder = $state([]);
  let einnahmen = $state([]);
  let ausgaben = $state([]);
  let policen = $state([]);
  let vermoegenList = $state([]);
  let verbindlichkeiten = $state([]);
  let altersvorsorgeList = $state([]);
  let analyseErgebnisse = $state([]);

  onMount(async () => {
    if (kundeId) {
      const k = await getKunde(kundeId);
      if (k) {
        form = { ...form, ...k, raucher: !!k.raucher };
      }
      kinder = await getKinder(kundeId);
      einnahmen = await getEinnahmen(kundeId);
      ausgaben = await getAusgaben(kundeId);
      policen = await getPolicen(kundeId);
      vermoegenList = await getVermoegen(kundeId);
      verbindlichkeiten = await getVerbindlichkeiten(kundeId);
      altersvorsorgeList = await getAltersvorsorge(kundeId);
      runAnalyse();
    }
  });

  function runAnalyse() {
    analyseErgebnisse = analysiere(form, {
      einnahmen, ausgaben, policen,
      vermoegen: vermoegenList, verbindlichkeiten,
      altersvorsorge: altersvorsorgeList, kinder,
    });
  }

  async function handleSave() {
    if (!form.vorname.trim() || !form.nachname.trim()) return;
    saving = true;
    try {
      const id = await saveKunde(kundeId ? { ...form, id: kundeId } : form);
      if (!kundeId) kundeId = id;

      for (const k of kinder) {
        if (!k.name?.trim()) continue;
        await saveKind({ ...k, kunde_id: id });
      }
      for (const e of einnahmen) {
        if (!e.betrag) continue;
        await saveEinnahme({ ...e, kunde_id: id });
      }
      for (const a of ausgaben) {
        if (!a.betrag) continue;
        await saveAusgabe({ ...a, kunde_id: id });
      }
      for (const p of policen) {
        if (!p.sparte) continue;
        await savePolicen({ ...p, kunde_id: id });
      }
      for (const v of vermoegenList) {
        if (!v.typ) continue;
        await saveVermoegen({ ...v, kunde_id: id });
      }
      for (const v of verbindlichkeiten) {
        if (!v.typ) continue;
        await saveVerbindlichkeit({ ...v, kunde_id: id });
      }
      for (const a of altersvorsorgeList) {
        if (!a.typ) continue;
        await saveAltersvorsorge({ ...a, kunde_id: id });
      }

      currentView.set(`kunde:${id}`);
    } finally {
      saving = false;
    }
  }

  function addKind() { kinder = [...kinder, { name: '', geburtsdatum: '', im_haushalt: true }]; }
  function addEinnahme() { einnahmen = [...einnahmen, { typ: 'netto', bezeichnung: '', betrag: 0, periode: 'monatlich', notiz: '' }]; }
  function addAusgabe() { ausgaben = [...ausgaben, { kategorie: 'sonstige', bezeichnung: '', betrag: 0, periode: 'monatlich', notiz: '' }]; }
  function addPolice() { policen = [...policen, { sparte: '', versicherer: '', tarifname: '', vertragsnummer: '', versicherungssumme: 0, beitrag_monatlich: 0, selbstbeteiligung: 0, vertragsbeginn: '', laufzeit_bis: '', bewertung: '', notiz: '' }]; }
  function addVermoegen() { vermoegenList = [...vermoegenList, { typ: 'tagesgeld', bezeichnung: '', aktueller_wert: 0, monatl_sparrate: 0, rendite_pa: 0, notiz: '' }]; }
  function addVerbindlichkeit() { verbindlichkeiten = [...verbindlichkeiten, { typ: 'privatkredit', bezeichnung: '', restschuld: 0, zinssatz: 0, monatl_rate: 0, laufzeit_bis: '', notiz: '' }]; }
  function addAltersvorsorge() { altersvorsorgeList = [...altersvorsorgeList, { typ: 'gesetzliche_rente', anbieter: '', monatl_beitrag: 0, aktueller_stand: 0, prognostizierte_rente: 0, rentenbeginn: '', notiz: '' }]; }

  async function removeItem(list, index, deleteFn) {
    const item = list[index];
    if (item.id) await deleteFn(item.id);
    return list.filter((_, i) => i !== index);
  }

  const tabs = [
    { id: 'persoenliches', label: 'Persoenliches' },
    { id: 'einnahmen', label: 'Einnahmen & Ausgaben' },
    { id: 'versicherungen', label: 'Versicherungen' },
    { id: 'vermoegen', label: 'Vermoegen & Schulden' },
    { id: 'altersvorsorge', label: 'Altersvorsorge' },
    { id: 'analyse', label: 'Analyse' },
  ];
</script>

<div class="kunde-form">
  <div class="header">
    <h1>{isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde'}</h1>
    <div class="header-actions">
      <button class="btn btn-secondary" onclick={() => currentView.set(isEdit ? `kunde:${kundeId}` : 'kunden')}>Abbrechen</button>
      <button class="btn btn-primary" onclick={handleSave} disabled={saving}>
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
    </div>
  </div>

  <div class="tabs">
    {#each tabs as tab}
      <button class:active={activeTab === tab.id} onclick={() => { activeTab = tab.id; if (tab.id === 'analyse') runAnalyse(); }}>
        {tab.label}
      </button>
    {/each}
  </div>

  <div class="tab-content">
    {#if activeTab === 'persoenliches'}
      <fieldset>
        <legend>Persoenliche Daten</legend>
        <div class="form-grid">
          <label>Anrede
            <select bind:value={form.anrede}>
              <option value="">-- Bitte waehlen --</option>
              {#each ANREDE_OPTIONS as o}<option value={o.value}>{o.label}</option>{/each}
            </select>
          </label>
          <label>Vorname *<input bind:value={form.vorname} required /></label>
          <label>Nachname *<input bind:value={form.nachname} required /></label>
          <label>Geburtsdatum<input type="date" bind:value={form.geburtsdatum} /></label>
          <label>Familienstand
            <select bind:value={form.familienstand}>
              {#each FAMILIENSTAND_OPTIONS as o}<option value={o.value}>{o.label}</option>{/each}
            </select>
          </label>
          <label>Beruf<input bind:value={form.beruf} /></label>
          <label>Berufsstatus
            <select bind:value={form.beruf_status}>
              {#each BERUF_STATUS_OPTIONS as o}<option value={o.value}>{o.label}</option>{/each}
            </select>
          </label>
          <label>Arbeitgeber<input bind:value={form.arbeitgeber} /></label>
          <label>Branche<input bind:value={form.branche} /></label>
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={form.raucher} /> Raucher
          </label>
          <label>Groesse (cm)<input type="number" bind:value={form.groesse_cm} /></label>
          <label>Gewicht (kg)<input type="number" step="0.1" bind:value={form.gewicht_kg} /></label>
        </div>
        <label class="full-width">Vorerkrankungen<textarea bind:value={form.vorerkrankungen} rows="2"></textarea></label>
        <label class="full-width">Medikamente<textarea bind:value={form.medikamente} rows="2"></textarea></label>
        <label class="full-width">Notizen<textarea bind:value={form.notizen} rows="3"></textarea></label>
      </fieldset>

      <fieldset>
        <legend>Kinder</legend>
        <button class="btn btn-sm btn-secondary" onclick={addKind}>+ Kind hinzufuegen</button>
        {#each kinder as kind, i}
          <div class="inline-row">
            <input placeholder="Name" bind:value={kind.name} />
            <input type="date" bind:value={kind.geburtsdatum} />
            <label class="checkbox-label"><input type="checkbox" bind:checked={kind.im_haushalt} /> Im Haushalt</label>
            <button class="btn btn-sm btn-danger" onclick={async () => { kinder = await removeItem(kinder, i, deleteKind); }}>X</button>
          </div>
        {/each}
      </fieldset>

    {:else if activeTab === 'einnahmen'}
      <fieldset>
        <legend>Einnahmen</legend>
        <button class="btn btn-sm btn-secondary" onclick={addEinnahme}>+ Einnahme</button>
        <table>
          <thead><tr><th>Typ</th><th>Bezeichnung</th><th>Betrag (EUR)</th><th>Periode</th><th></th></tr></thead>
          <tbody>
            {#each einnahmen as e, i}
              <tr>
                <td><select bind:value={e.typ}>{#each EINNAHMEN_TYPEN as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><input bind:value={e.bezeichnung} /></td>
                <td><input type="number" step="0.01" bind:value={e.betrag} class="num-input" /></td>
                <td><select bind:value={e.periode}><option value="monatlich">Monatlich</option><option value="jaehrlich">Jaehrlich</option></select></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { einnahmen = await removeItem(einnahmen, i, deleteEinnahme); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Ausgaben</legend>
        <button class="btn btn-sm btn-secondary" onclick={addAusgabe}>+ Ausgabe</button>
        <table>
          <thead><tr><th>Kategorie</th><th>Bezeichnung</th><th>Betrag (EUR)</th><th>Periode</th><th></th></tr></thead>
          <tbody>
            {#each ausgaben as a, i}
              <tr>
                <td><select bind:value={a.kategorie}>{#each AUSGABEN_KATEGORIEN as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><input bind:value={a.bezeichnung} /></td>
                <td><input type="number" step="0.01" bind:value={a.betrag} class="num-input" /></td>
                <td><select bind:value={a.periode}><option value="monatlich">Monatlich</option><option value="jaehrlich">Jaehrlich</option></select></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { ausgaben = await removeItem(ausgaben, i, deleteAusgabe); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

    {:else if activeTab === 'versicherungen'}
      <fieldset>
        <legend>Bestehende Versicherungen</legend>
        <button class="btn btn-sm btn-secondary" onclick={addPolice}>+ Police</button>
        <table class="policen-table">
          <thead><tr><th>Sparte</th><th>Versicherer</th><th>Tarif</th><th>VS/Leistung</th><th>Beitrag/Monat</th><th>SB</th><th>Bewertung</th><th></th></tr></thead>
          <tbody>
            {#each policen as p, i}
              <tr>
                <td><select bind:value={p.sparte}><option value="">--</option>{#each SPARTEN as s}<option value={s}>{s}</option>{/each}</select></td>
                <td><input bind:value={p.versicherer} /></td>
                <td><input bind:value={p.tarifname} /></td>
                <td><input type="number" step="0.01" bind:value={p.versicherungssumme} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={p.beitrag_monatlich} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={p.selbstbeteiligung} class="num-input" /></td>
                <td><select bind:value={p.bewertung}><option value="">--</option>{#each BEWERTUNG_OPTIONS as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { policen = await removeItem(policen, i, deletePolice); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

    {:else if activeTab === 'vermoegen'}
      <fieldset>
        <legend>Vermoegenswerte</legend>
        <button class="btn btn-sm btn-secondary" onclick={addVermoegen}>+ Vermoegenswert</button>
        <table>
          <thead><tr><th>Typ</th><th>Bezeichnung</th><th>Wert (EUR)</th><th>Sparrate/Monat</th><th>Rendite %</th><th></th></tr></thead>
          <tbody>
            {#each vermoegenList as v, i}
              <tr>
                <td><select bind:value={v.typ}>{#each VERMOEGEN_TYPEN as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><input bind:value={v.bezeichnung} /></td>
                <td><input type="number" step="0.01" bind:value={v.aktueller_wert} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={v.monatl_sparrate} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={v.rendite_pa} class="num-input" /></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { vermoegenList = await removeItem(vermoegenList, i, deleteVermoegen); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

      <fieldset>
        <legend>Verbindlichkeiten</legend>
        <button class="btn btn-sm btn-secondary" onclick={addVerbindlichkeit}>+ Verbindlichkeit</button>
        <table>
          <thead><tr><th>Typ</th><th>Bezeichnung</th><th>Restschuld (EUR)</th><th>Zinssatz %</th><th>Rate/Monat</th><th>Laufzeit bis</th><th></th></tr></thead>
          <tbody>
            {#each verbindlichkeiten as v, i}
              <tr>
                <td><select bind:value={v.typ}>{#each VERBINDLICHKEITEN_TYPEN as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><input bind:value={v.bezeichnung} /></td>
                <td><input type="number" step="0.01" bind:value={v.restschuld} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={v.zinssatz} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={v.monatl_rate} class="num-input" /></td>
                <td><input type="date" bind:value={v.laufzeit_bis} /></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { verbindlichkeiten = await removeItem(verbindlichkeiten, i, deleteVerbindlichkeit); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

    {:else if activeTab === 'altersvorsorge'}
      <fieldset>
        <legend>Altersvorsorge</legend>
        <button class="btn btn-sm btn-secondary" onclick={addAltersvorsorge}>+ Altersvorsorge</button>
        <table>
          <thead><tr><th>Typ</th><th>Anbieter</th><th>Beitrag/Monat</th><th>Akt. Stand</th><th>Progn. Rente/Monat</th><th>Rentenbeginn</th><th></th></tr></thead>
          <tbody>
            {#each altersvorsorgeList as a, i}
              <tr>
                <td><select bind:value={a.typ}>{#each ALTERSVORSORGE_TYPEN as o}<option value={o.value}>{o.label}</option>{/each}</select></td>
                <td><input bind:value={a.anbieter} /></td>
                <td><input type="number" step="0.01" bind:value={a.monatl_beitrag} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={a.aktueller_stand} class="num-input" /></td>
                <td><input type="number" step="0.01" bind:value={a.prognostizierte_rente} class="num-input" /></td>
                <td><input type="date" bind:value={a.rentenbeginn} /></td>
                <td><button class="btn btn-sm btn-danger" onclick={async () => { altersvorsorgeList = await removeItem(altersvorsorgeList, i, deleteAltersvorsorge); }}>X</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </fieldset>

    {:else if activeTab === 'analyse'}
      <div class="analyse">
        <h2>Lueckenanalyse</h2>
        <p class="hint">Basierend auf den erfassten Daten. Bitte alle Tabs ausfuellen fuer eine vollstaendige Analyse.</p>
        <table class="analyse-table">
          <thead><tr><th>Risiko</th><th>IST</th><th>SOLL</th><th>Status</th></tr></thead>
          <tbody>
            {#each analyseErgebnisse as e}
              <tr>
                <td class="risiko-cell">{e.risiko}</td>
                <td>{e.ist}</td>
                <td>{e.soll}</td>
                <td>
                  <span class="status-dot status-{e.status}"></span>
                  {e.status === 'gruen' ? 'OK' : e.status === 'gelb' ? 'Pruefen' : 'Handlungsbedarf'}
                  {#if e.luecke > 0}
                    <span class="luecke-hint">Luecke: {new Intl.NumberFormat('de-DE').format(e.luecke)} EUR</span>
                  {/if}
                </td>
              </tr>
            {/each}
            {#if analyseErgebnisse.length === 0}
              <tr><td colspan="4" class="empty-row">Noch keine Daten fuer die Analyse vorhanden.</td></tr>
            {/if}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  .kunde-form { display: flex; flex-direction: column; gap: 1rem; }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .header-actions { display: flex; gap: 0.5rem; }

  .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); }
  .tabs button {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: var(--color-text-muted);
    font-weight: 500;
  }
  .tabs button:hover { color: var(--color-text); }
  .tabs button.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

  .tab-content { padding-top: 1rem; }

  fieldset { border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
  legend { font-weight: 600; padding: 0 0.5rem; color: var(--color-primary); }

  .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 0.75rem; }
  .form-grid label, .full-width { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 0.5rem; }
  .checkbox-label { flex-direction: row; align-items: center; gap: 0.5rem; }
  .checkbox-label input[type="checkbox"] { width: auto; }

  .inline-row { display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem; }
  .inline-row input { max-width: 200px; }

  .num-input { max-width: 120px; text-align: right; }

  table select, table input { font-size: 0.8125rem; padding: 0.25rem 0.5rem; }
  .policen-table { font-size: 0.8125rem; }

  .analyse-table td, .analyse-table th { padding: 0.75rem; }
  .risiko-cell { font-weight: 500; }
  .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 0.375rem; }
  .status-gruen { background: var(--color-success); }
  .status-gelb { background: var(--color-warning); }
  .status-rot { background: var(--color-danger); }
  .luecke-hint { display: block; font-size: 0.75rem; color: var(--color-danger); margin-top: 0.125rem; }
  .hint { color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
  .empty-row { text-align: center; color: var(--color-text-muted); }
</style>
