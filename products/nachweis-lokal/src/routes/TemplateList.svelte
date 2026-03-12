<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getTemplates } from '../lib/db.js';

  let { limitReached = false } = $props();
  let templates = $state([]);

  onMount(async () => {
    templates = await getTemplates();
  });
</script>

<div class="page">
  <div class="header">
    <h1>Vorlagen</h1>
    <div class="actions">
      <button
        class="btn-secondary"
        onclick={() => currentView.set('templates:library')}
      >
        Pruefungsvorlagen
      </button>
      <button
        class="btn-primary"
        disabled={limitReached}
        title={limitReached ? 'Probe-Limit erreicht (10 Vorlagen)' : ''}
        onclick={() => currentView.set('template:new')}
      >
        + Neue Vorlage
      </button>
    </div>
  </div>

  {#if templates.length === 0}
    <p class="empty">Noch keine Vorlagen angelegt.
      <button class="link-btn" onclick={() => currentView.set('templates:library')}>Fertige Pruefungsvorlagen uebernehmen</button>
      oder eine eigene Vorlage erstellen.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Kategorie</th>
          <th>Intervall</th>
          <th>Beschreibung</th>
        </tr>
      </thead>
      <tbody>
        {#each templates as t}
          <tr class="clickable" onclick={() => currentView.set(`template:${t.id}`)}>
            <td class="bold">{t.name}</td>
            <td>{t.category ?? '-'}</td>
            <td>{t.interval_days ? `${t.interval_days} Tage` : '-'}</td>
            <td class="muted">{t.description ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .page { display: flex; flex-direction: column; gap: 1rem; }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .empty { color: var(--color-text-muted); font-style: italic; padding: 2rem 0; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  th { background: var(--color-surface); font-weight: 600; font-size: 0.8125rem; }
  .clickable { cursor: pointer; }
  .clickable:hover { background: var(--color-surface); }
  .bold { font-weight: 600; }
  .muted { color: var(--color-text-muted); font-size: 0.8125rem; }
  .actions { display: flex; gap: 0.5rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-secondary { padding: 0.5rem 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.375rem; cursor: pointer; }
  .btn-secondary:hover { background: var(--color-border); }
  .link-btn { background: none; border: none; color: var(--color-primary); text-decoration: underline; cursor: pointer; font-size: inherit; padding: 0; }
</style>
