<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getDashboardStats } from '../lib/db.js';

  let stats = $state({ kunden: 0, policen: 0, konditionenVersicherung: 0, konditionenDarlehen: 0, recentKunden: [] });

  onMount(async () => {
    stats = await getDashboardStats();
  });
</script>

<div class="dashboard">
  <h1>Dashboard</h1>

  <div class="stats-grid">
    <button class="stat-card" onclick={() => currentView.set('kunden')}>
      <span class="stat-number">{stats.kunden}</span>
      <span class="stat-label">Kunden</span>
    </button>
    <div class="stat-card">
      <span class="stat-number">{stats.policen}</span>
      <span class="stat-label">Policen erfasst</span>
    </div>
    <button class="stat-card" onclick={() => currentView.set('konditionen')}>
      <span class="stat-number">{stats.konditionenVersicherung}</span>
      <span class="stat-label">Versicherungskonditionen</span>
    </button>
    <button class="stat-card" onclick={() => currentView.set('konditionen')}>
      <span class="stat-number">{stats.konditionenDarlehen}</span>
      <span class="stat-label">Darlehenskonditionen</span>
    </button>
  </div>

  <div class="sections">
    <section>
      <h2>Zuletzt bearbeitet</h2>
      {#if stats.recentKunden.length === 0}
        <p class="empty">Noch keine Kunden angelegt.</p>
      {:else}
        <table>
          <thead>
            <tr><th>Name</th><th>Zuletzt aktualisiert</th></tr>
          </thead>
          <tbody>
            {#each stats.recentKunden as k}
              <tr onclick={() => currentView.set(`kunde:${k.id}`)}>
                <td>{k.nachname}, {k.vorname}</td>
                <td>{k.aktualisiert_am?.slice(0, 10) ?? '-'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>

    <section>
      <h2>Schnellzugriff</h2>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick={() => currentView.set('kunde-neu')}>Neuer Kunde</button>
        <button class="btn btn-accent" onclick={() => currentView.set('import')}>Excel importieren</button>
        <button class="btn btn-secondary" onclick={() => currentView.set('konditionen')}>Konditionen verwalten</button>
      </div>
    </section>
  </div>
</div>

<style>
  .dashboard { display: flex; flex-direction: column; gap: 1.5rem; }

  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .stat-card {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .stat-card:hover { border-color: var(--color-primary); }
  .stat-number { font-size: 2rem; font-weight: 700; color: var(--color-primary); }
  .stat-label { font-size: 0.8125rem; color: var(--color-text-muted); }

  .sections { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  section { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.25rem; }
  section h2 { margin-bottom: 0.75rem; }
  .empty { color: var(--color-text-muted); font-style: italic; }
  .quick-actions { display: flex; flex-direction: column; gap: 0.5rem; }
</style>
