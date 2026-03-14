<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { importLibraryTemplate, getTemplates } from '../lib/db.js';
  import libraryData from '../assets/template-library.json';

  let { embedded = false } = $props();

  let templates = $state([]);
  let existingNames = $state([]);
  let importing = $state(null);
  let importedIds = $state(new Set());

  onMount(async () => {
    templates = libraryData;
    const existing = await getTemplates();
    existingNames = existing.map(t => t.name);
  });

  function alreadyExists(name) {
    return existingNames.includes(name) || importedIds.has(name);
  }

  async function handleImport(template) {
    importing = template.id;
    const id = await importLibraryTemplate(template);
    importedIds = new Set([...importedIds, template.name]);
    existingNames = [...existingNames, template.name];
    importing = null;
    currentView.set(`template:${id}`);
  }
</script>

<div class="page">
  {#if !embedded}
    <h1>Checklisten-Bibliothek</h1>
  {/if}
  <p class="description">Fertige Checklisten zum direkten Übernehmen. Die Checklisten können nach dem Import angepasst werden.</p>

  <div class="library-grid">
    {#each templates as t}
      <div class="library-card">
        <div class="card-header">
          <h3>{t.name}</h3>
          <span class="badge">{t.category}</span>
        </div>
        <p class="card-desc">{t.description}</p>
        <div class="card-meta">
          <span>{t.items.length} Prüfpunkte</span>
          {#if t.interval_days}
            <span>Intervall: {t.interval_days} Tage</span>
          {/if}
        </div>
        <details class="items-preview">
          <summary>Prüfpunkte anzeigen</summary>
          <ul>
            {#each t.items as item, i}
              <li>
                <span class="item-num">{i + 1}.</span>
                {item.label}
                {#if item.required}<span class="item-required">Pflicht</span>{/if}
              </li>
            {/each}
          </ul>
        </details>
        <div class="card-actions">
          {#if alreadyExists(t.name)}
            <button class="btn-secondary" disabled>Bereits vorhanden</button>
          {:else}
            <button class="btn-primary" onclick={() => handleImport(t)} disabled={importing === t.id}>
              {importing === t.id ? 'Wird importiert...' : 'Checkliste übernehmen'}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if !embedded}
    <button class="btn-secondary" onclick={() => currentView.set('templates')}>Zurück zu Checklisten</button>
  {/if}
</div>

<style>
  .page { display: flex; flex-direction: column; gap: 1rem; }
  .description { color: var(--color-text-muted); font-size: 0.875rem; }
  .library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1rem; }
  .library-card {
    padding: 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
  .card-header h3 { margin: 0; font-size: 1rem; }
  .badge { padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.6875rem; font-weight: 600; background: #e2e8f0; color: #4a5568; white-space: nowrap; }
  .card-desc { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0; }
  .card-meta { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--color-text-muted); }
  .items-preview { font-size: 0.8125rem; }
  .items-preview summary { cursor: pointer; color: var(--color-primary); }
  .items-preview ul { margin: 0.5rem 0 0; padding-left: 0; list-style: none; }
  .items-preview li { padding: 0.125rem 0; display: flex; gap: 0.25rem; align-items: baseline; }
  .item-num { font-weight: 700; min-width: 1.25rem; }
  .item-required { font-size: 0.625rem; color: var(--color-primary); }
  .card-actions { margin-top: auto; padding-top: 0.5rem; }
  .btn-primary { padding: 0.375rem 0.75rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; font-size: 0.8125rem; }
  .btn-secondary { padding: 0.375rem 0.75rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; font-size: 0.8125rem; }
  .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
