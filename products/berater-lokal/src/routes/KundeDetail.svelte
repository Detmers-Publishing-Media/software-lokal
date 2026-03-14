<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import {
    getKunde, deleteKunde, getKinder, getEinnahmen, getAusgaben,
    getPolicen, getVermoegen, getVerbindlichkeiten, getAltersvorsorge,
    getOrgProfile,
  } from '../lib/db.js';
  import { berechneLebensphase, berechneAlter, getLebensphaseColor } from '../lib/lebensphase.js';
  import { analysiere, countByStatus } from '../lib/analyse.js';
  import { generateBeratungsprotokoll } from '../lib/pdf.js';
  import { hasLicenseKey } from '../lib/license.js';
  import { EINNAHMEN_TYPEN, AUSGABEN_KATEGORIEN, VERMOEGEN_TYPEN, VERBINDLICHKEITEN_TYPEN, ALTERSVORSORGE_TYPEN } from '../lib/types.js';

  let { kundeId } = $props();

  let kunde = $state(null);
  let kinder = $state([]);
  let einnahmen = $state([]);
  let ausgaben = $state([]);
  let policen = $state([]);
  let vermoegenList = $state([]);
  let verbindlichkeiten = $state([]);
  let altersvorsorgeList = $state([]);
  let analyseErgebnisse = $state([]);
  let ampel = $state({ rot: 0, gelb: 0, gruen: 0 });

  let lebensphase = $state('');
  let alter = $state(null);

  let sumEinnahmen = $derived(einnahmen.filter(e => e.periode === 'monatlich').reduce((s, e) => s + (e.betrag || 0), 0));
  let sumAusgaben = $derived(ausgaben.filter(a => a.periode === 'monatlich').reduce((s, a) => s + (a.betrag || 0), 0));
  let sumPolicen = $derived(policen.reduce((s, p) => s + (p.beitrag_monatlich || 0), 0));
  let freiVerfuegbar = $derived(sumEinnahmen - sumAusgaben - sumPolicen);

  onMount(async () => {
    kunde = await getKunde(kundeId);
    kinder = await getKinder(kundeId);
    einnahmen = await getEinnahmen(kundeId);
    ausgaben = await getAusgaben(kundeId);
    policen = await getPolicen(kundeId);
    vermoegenList = await getVermoegen(kundeId);
    verbindlichkeiten = await getVerbindlichkeiten(kundeId);
    altersvorsorgeList = await getAltersvorsorge(kundeId);

    alter = berechneAlter(kunde?.geburtsdatum);
    lebensphase = berechneLebensphase(kunde, kinder, vermoegenList, verbindlichkeiten);

    analyseErgebnisse = analysiere(kunde, {
      einnahmen, ausgaben, policen,
      vermoegen: vermoegenList, verbindlichkeiten,
      altersvorsorge: altersvorsorgeList, kinder,
    });
    ampel = countByStatus(analyseErgebnisse);
  });

  async function handlePdf() {
    const orgProfile = await getOrgProfile();
    const isProbe = !hasLicenseKey();
    generateBeratungsprotokoll(kunde, {
      einnahmen, ausgaben, policen,
      vermoegen: vermoegenList, verbindlichkeiten,
      altersvorsorge: altersvorsorgeList, kinder,
      analyseErgebnisse,
    }, orgProfile, isProbe);
  }

  async function handleDelete() {
    if (!confirm(`"${kunde.vorname} ${kunde.nachname}" wirklich löschen? Alle zugehörigen Daten werden entfernt.`)) return;
    await deleteKunde(kundeId);
    currentView.set('kunden');
  }

  function fmt(n) { return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(n || 0); }
  function labelFor(options, value) { return options.find(o => o.value === value)?.label ?? value ?? '-'; }
</script>

{#if kunde}
<div class="detail">
  <div class="header">
    <div>
      <h1>{kunde.anrede} {kunde.vorname} {kunde.nachname}</h1>
      <div class="meta">
        {#if alter !== null}<span>Alter: {alter}</span>{/if}
        <span class="phase-badge" style="background: {getLebensphaseColor(lebensphase)}">{lebensphase}</span>
        <span>{kunde.beruf ?? ''} {kunde.beruf_status ? `(${kunde.beruf_status})` : ''}</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn btn-accent" onclick={handlePdf}>PDF erstellen</button>
      <button class="btn btn-primary" onclick={() => currentView.set(`kunde-edit:${kundeId}`)}>Bearbeiten</button>
      <button class="btn btn-danger" onclick={handleDelete}>Löschen</button>
      <button class="btn btn-secondary" onclick={() => currentView.set('kunden')}>Zurück</button>
    </div>
  </div>

  <!-- Ampel-Zusammenfassung -->
  <div class="ampel-bar">
    <span class="ampel-item ampel-rot">{ampel.rot} Handlungsbedarf</span>
    <span class="ampel-item ampel-gelb">{ampel.gelb} Prüfen</span>
    <span class="ampel-item ampel-gruen">{ampel.gruen} OK</span>
  </div>

  <!-- Haushaltsuebersicht -->
  <div class="cards">
    <div class="card">
      <span class="card-label">Einnahmen/Monat</span>
      <span class="card-value positive">{fmt(sumEinnahmen)} EUR</span>
    </div>
    <div class="card">
      <span class="card-label">Ausgaben/Monat</span>
      <span class="card-value negative">{fmt(sumAusgaben)} EUR</span>
    </div>
    <div class="card">
      <span class="card-label">Versicherungen/Monat</span>
      <span class="card-value negative">{fmt(sumPolicen)} EUR</span>
    </div>
    <div class="card">
      <span class="card-label">Frei verfügbar</span>
      <span class="card-value" class:positive={freiVerfuegbar >= 0} class:negative={freiVerfuegbar < 0}>{fmt(freiVerfuegbar)} EUR</span>
    </div>
  </div>

  <!-- Lueckenanalyse -->
  {#if analyseErgebnisse.length > 0}
  <section>
    <h2>Lückenanalyse</h2>
    <table class="analyse-table">
      <thead><tr><th>Risiko</th><th>IST</th><th>SOLL</th><th>Status</th></tr></thead>
      <tbody>
        {#each analyseErgebnisse as e}
          <tr>
            <td>{e.risiko}</td>
            <td>{e.ist}</td>
            <td>{e.soll}</td>
            <td><span class="dot dot-{e.status}"></span> {e.status === 'gruen' ? 'OK' : e.status === 'gelb' ? 'Prüfen' : 'Handlungsbedarf'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
  {/if}

  <!-- Policen -->
  {#if policen.length > 0}
  <section>
    <h2>Versicherungen ({policen.length})</h2>
    <table>
      <thead><tr><th>Sparte</th><th>Versicherer</th><th>VS/Leistung</th><th>Beitrag/Monat</th><th>SB</th></tr></thead>
      <tbody>
        {#each policen as p}
          <tr>
            <td>{p.sparte}</td>
            <td>{p.versicherer ?? '-'}</td>
            <td>{fmt(p.versicherungssumme)}</td>
            <td>{fmt(p.beitrag_monatlich)}</td>
            <td>{fmt(p.selbstbeteiligung)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
  {/if}

  <!-- Altersvorsorge -->
  {#if altersvorsorgeList.length > 0}
  <section>
    <h2>Altersvorsorge</h2>
    <table>
      <thead><tr><th>Typ</th><th>Anbieter</th><th>Beitrag/Monat</th><th>Akt. Stand</th><th>Progn. Rente</th></tr></thead>
      <tbody>
        {#each altersvorsorgeList as a}
          <tr>
            <td>{labelFor(ALTERSVORSORGE_TYPEN, a.typ)}</td>
            <td>{a.anbieter ?? '-'}</td>
            <td>{fmt(a.monatl_beitrag)}</td>
            <td>{fmt(a.aktueller_stand)}</td>
            <td>{fmt(a.prognostizierte_rente)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>
  {/if}
</div>
{/if}

<style>
  .detail { display: flex; flex-direction: column; gap: 1.5rem; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .meta { display: flex; gap: 0.75rem; align-items: center; margin-top: 0.25rem; font-size: 0.875rem; color: var(--color-text-muted); }
  .actions { display: flex; gap: 0.5rem; }
  .phase-badge { padding: 0.15rem 0.5rem; border-radius: 3px; color: white; font-size: 0.75rem; }

  .ampel-bar { display: flex; gap: 1rem; padding: 0.75rem 1rem; background: var(--color-surface); border-radius: 0.5rem; border: 1px solid var(--color-border); }
  .ampel-item { font-weight: 500; font-size: 0.875rem; display: flex; align-items: center; gap: 0.375rem; }
  .ampel-item::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 50%; }
  .ampel-rot::before { background: var(--color-danger); }
  .ampel-gelb::before { background: var(--color-warning); }
  .ampel-gruen::before { background: var(--color-success); }

  .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; text-align: center; }
  .card-label { display: block; font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 0.25rem; }
  .card-value { font-size: 1.25rem; font-weight: 700; }
  .positive { color: var(--color-success); }
  .negative { color: var(--color-danger); }

  section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; }
  section h2 { margin-bottom: 0.75rem; }

  .dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 0.25rem; }
  .dot-gruen { background: var(--color-success); }
  .dot-gelb { background: var(--color-warning); }
  .dot-rot { background: var(--color-danger); }
</style>
