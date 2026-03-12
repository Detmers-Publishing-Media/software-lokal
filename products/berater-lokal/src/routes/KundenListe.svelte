<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { kunden, searchQuery, filteredKunden } from '../lib/stores/kunden.js';
  import { getKunden, getKinder, getVermoegen, getVerbindlichkeiten, getPolicen } from '../lib/db.js';
  import { berechneLebensphase, berechneAlter, getLebensphaseColor } from '../lib/lebensphase.js';

  let kundenMitPhase = $state([]);

  onMount(async () => {
    const liste = await getKunden();
    kunden.set(liste);

    const enriched = [];
    for (const k of liste) {
      const ki = await getKinder(k.id);
      const vm = await getVermoegen(k.id);
      const vb = await getVerbindlichkeiten(k.id);
      const po = await getPolicen(k.id);
      enriched.push({
        ...k,
        alter: berechneAlter(k.geburtsdatum),
        lebensphase: berechneLebensphase(k, ki, vm, vb),
        policenCount: po.length,
      });
    }
    kundenMitPhase = enriched;
  });

  let sortKey = $state('nachname');
  let sortDir = $state('asc');

  let sortedKunden = $derived.by(() => {
    const q = $searchQuery.toLowerCase();
    let list = kundenMitPhase;
    if (q) {
      list = list.filter(k =>
        k.vorname?.toLowerCase().includes(q) ||
        k.nachname?.toLowerCase().includes(q) ||
        k.beruf?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = String(va).localeCompare(String(vb), 'de');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  });

  function toggleSort(key) {
    if (sortKey === key) { sortDir = sortDir === 'asc' ? 'desc' : 'asc'; }
    else { sortKey = key; sortDir = 'asc'; }
  }
</script>

<div class="kunden-liste">
  <div class="header">
    <h1>Kunden ({sortedKunden.length})</h1>
    <button class="btn btn-primary" onclick={() => currentView.set('kunde-neu')}>+ Neuer Kunde</button>
  </div>

  <div class="filters">
    <input type="text" placeholder="Suchen..." bind:value={$searchQuery} class="search-input" />
  </div>

  <table>
    <thead>
      <tr>
        <th onclick={() => toggleSort('nachname')} class="sortable">
          Name {sortKey === 'nachname' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
        </th>
        <th onclick={() => toggleSort('alter')}>
          Alter {sortKey === 'alter' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
        </th>
        <th>Lebensphase</th>
        <th>Beruf</th>
        <th onclick={() => toggleSort('policenCount')}>
          Policen {sortKey === 'policenCount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
        </th>
        <th>Letzte Aenderung</th>
      </tr>
    </thead>
    <tbody>
      {#each sortedKunden as k}
        <tr onclick={() => currentView.set(`kunde:${k.id}`)}>
          <td class="name-cell">{k.nachname}, {k.vorname}</td>
          <td>{k.alter ?? '-'}</td>
          <td>
            <span class="phase-badge" style="background: {getLebensphaseColor(k.lebensphase)}">
              {k.lebensphase}
            </span>
          </td>
          <td>{k.beruf ?? '-'}</td>
          <td>{k.policenCount}</td>
          <td>{k.aktualisiert_am?.slice(0, 10) ?? '-'}</td>
        </tr>
      {:else}
        <tr><td colspan="6" class="empty-row">Keine Kunden gefunden.</td></tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .kunden-liste { display: flex; flex-direction: column; gap: 1rem; }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .filters { display: flex; gap: 0.75rem; }
  .search-input { max-width: 300px; }
  .sortable { cursor: pointer; }
  .name-cell { font-weight: 500; }
  .phase-badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 3px;
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
  }
  .empty-row { text-align: center; color: var(--color-text-muted); padding: 2rem; }
</style>
