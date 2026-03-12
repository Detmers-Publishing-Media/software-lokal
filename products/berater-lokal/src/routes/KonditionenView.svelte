<script>
  import { onMount } from 'svelte';
  import { getKonditionenVersicherung, getKonditionenDarlehen, saveKonditionVersicherung, saveKonditionDarlehen } from '../lib/db.js';

  let activeTab = $state('versicherung');
  let kondVers = $state([]);
  let kondDarl = $state([]);

  let showFormVers = $state(false);
  let showFormDarl = $state(false);
  let formVers = $state({ versicherer: '', sparte: '', tarifname: '', beitrag_monatlich: 0, versicherungssumme: 0, rating: '', courtage_ap: '', courtage_bp: '' });
  let formDarl = $state({ kreditgeber: '', produktname: '', sollzins: 0, effektivzins: 0, zinsbindung_jahre: 10, sondertilgung_prozent: 5, provision: '' });

  onMount(async () => {
    kondVers = await getKonditionenVersicherung();
    kondDarl = await getKonditionenDarlehen();
  });

  async function saveVers() {
    if (!formVers.versicherer.trim()) return;
    await saveKonditionVersicherung(formVers);
    kondVers = await getKonditionenVersicherung();
    showFormVers = false;
    formVers = { versicherer: '', sparte: '', tarifname: '', beitrag_monatlich: 0, versicherungssumme: 0, rating: '', courtage_ap: '', courtage_bp: '' };
  }

  async function saveDarl() {
    if (!formDarl.kreditgeber.trim()) return;
    await saveKonditionDarlehen(formDarl);
    kondDarl = await getKonditionenDarlehen();
    showFormDarl = false;
    formDarl = { kreditgeber: '', produktname: '', sollzins: 0, effektivzins: 0, zinsbindung_jahre: 10, sondertilgung_prozent: 5, provision: '' };
  }

  function fmtPct(n) { return n != null ? n.toFixed(2) + ' %' : '-'; }
  function fmtEur(n) { return n != null ? new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2 }).format(n) + ' EUR' : '-'; }
</script>

<div class="konditionen">
  <h1>Konditions-Datenbank</h1>

  <div class="tabs">
    <button class:active={activeTab === 'versicherung'} onclick={() => activeTab = 'versicherung'}>Versicherungskonditionen ({kondVers.length})</button>
    <button class:active={activeTab === 'darlehen'} onclick={() => activeTab = 'darlehen'}>Darlehenskonditionen ({kondDarl.length})</button>
  </div>

  {#if activeTab === 'versicherung'}
    <div class="tab-header">
      <button class="btn btn-primary" onclick={() => showFormVers = !showFormVers}>
        {showFormVers ? 'Abbrechen' : '+ Neue Kondition'}
      </button>
    </div>

    {#if showFormVers}
      <div class="inline-form">
        <input placeholder="Versicherer *" bind:value={formVers.versicherer} />
        <input placeholder="Sparte" bind:value={formVers.sparte} />
        <input placeholder="Tarifname" bind:value={formVers.tarifname} />
        <input placeholder="Beitrag/Monat" type="number" step="0.01" bind:value={formVers.beitrag_monatlich} />
        <input placeholder="VS/Leistung" type="number" step="0.01" bind:value={formVers.versicherungssumme} />
        <input placeholder="Rating" bind:value={formVers.rating} />
        <input placeholder="Courtage AP" bind:value={formVers.courtage_ap} />
        <input placeholder="Courtage BP %" bind:value={formVers.courtage_bp} />
        <button class="btn btn-accent" onclick={saveVers}>Speichern</button>
      </div>
    {/if}

    <table>
      <thead><tr><th>Versicherer</th><th>Sparte</th><th>Tarif</th><th>Beitrag/Monat</th><th>VS/Leistung</th><th>Rating</th><th>Courtage AP</th><th>Courtage BP</th></tr></thead>
      <tbody>
        {#each kondVers as k}
          <tr>
            <td>{k.versicherer}</td>
            <td>{k.sparte}</td>
            <td>{k.tarifname ?? '-'}</td>
            <td>{fmtEur(k.beitrag_monatlich)}</td>
            <td>{fmtEur(k.versicherungssumme)}</td>
            <td>{k.rating ?? '-'}</td>
            <td>{k.courtage_ap ?? '-'}</td>
            <td>{k.courtage_bp ?? '-'}</td>
          </tr>
        {:else}
          <tr><td colspan="8" class="empty">Noch keine Konditionen. Importieren Sie eine Excel-Datei oder legen Sie manuell an.</td></tr>
        {/each}
      </tbody>
    </table>

  {:else}
    <div class="tab-header">
      <button class="btn btn-primary" onclick={() => showFormDarl = !showFormDarl}>
        {showFormDarl ? 'Abbrechen' : '+ Neue Kondition'}
      </button>
    </div>

    {#if showFormDarl}
      <div class="inline-form">
        <input placeholder="Kreditgeber *" bind:value={formDarl.kreditgeber} />
        <input placeholder="Produktname" bind:value={formDarl.produktname} />
        <input placeholder="Sollzins %" type="number" step="0.01" bind:value={formDarl.sollzins} />
        <input placeholder="Effektivzins %" type="number" step="0.01" bind:value={formDarl.effektivzins} />
        <input placeholder="Zinsbindung (Jahre)" type="number" bind:value={formDarl.zinsbindung_jahre} />
        <input placeholder="Sondertilgung %" type="number" step="0.1" bind:value={formDarl.sondertilgung_prozent} />
        <input placeholder="Provision %" bind:value={formDarl.provision} />
        <button class="btn btn-accent" onclick={saveDarl}>Speichern</button>
      </div>
    {/if}

    <table>
      <thead><tr><th>Kreditgeber</th><th>Produkt</th><th>Sollzins</th><th>Effektivzins</th><th>Zinsbindung</th><th>Sondertilg.</th><th>Provision</th></tr></thead>
      <tbody>
        {#each kondDarl as k}
          <tr>
            <td>{k.kreditgeber}</td>
            <td>{k.produktname ?? '-'}</td>
            <td>{fmtPct(k.sollzins)}</td>
            <td>{fmtPct(k.effektivzins)}</td>
            <td>{k.zinsbindung_jahre ? k.zinsbindung_jahre + ' Jahre' : '-'}</td>
            <td>{k.sondertilgung_prozent ? k.sondertilgung_prozent + ' %' : '-'}</td>
            <td>{k.provision ?? '-'}</td>
          </tr>
        {:else}
          <tr><td colspan="7" class="empty">Noch keine Konditionen. Importieren Sie eine Excel-Datei oder legen Sie manuell an.</td></tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .konditionen { display: flex; flex-direction: column; gap: 1rem; }
  .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); margin-bottom: 0.5rem; }
  .tabs button { padding: 0.5rem 1rem; background: none; border: none; border-bottom: 2px solid transparent; margin-bottom: -2px; color: var(--color-text-muted); font-weight: 500; }
  .tabs button:hover { color: var(--color-text); }
  .tabs button.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
  .tab-header { display: flex; justify-content: flex-end; margin-bottom: 0.5rem; }
  .inline-form { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; margin-bottom: 0.5rem; align-items: flex-end; }
  .inline-form input { max-width: 180px; }
  .empty { text-align: center; color: var(--color-text-muted); padding: 2rem; }
</style>
