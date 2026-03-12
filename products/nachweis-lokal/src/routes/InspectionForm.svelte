<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getTemplates, getObjects, saveInspection, initInspectionResults } from '../lib/db.js';

  let templates = $state([]);
  let objects = $state([]);
  let form = $state({
    template_id: '',
    object_id: '',
    title: '',
    inspector: '',
    inspection_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  let saving = $state(false);

  onMount(async () => {
    templates = await getTemplates();
    objects = await getObjects();
  });

  $effect(() => {
    if (form.template_id && !form.title) {
      const t = templates.find(t => t.id === parseInt(form.template_id));
      if (t) form.title = t.name;
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.template_id || !form.title.trim() || !form.inspector.trim()) return;
    saving = true;
    const id = await saveInspection({
      template_id: parseInt(form.template_id),
      object_id: form.object_id ? parseInt(form.object_id) : null,
      title: form.title.trim(),
      inspector: form.inspector.trim(),
      inspection_date: form.inspection_date,
      status: 'offen',
      notes: form.notes.trim() || null,
    });
    await initInspectionResults(id, parseInt(form.template_id));
    saving = false;
    currentView.set(`inspection:execute:${id}`);
  }
</script>

<div class="page">
  <h1>Neue Pruefung</h1>

  <form onsubmit={handleSubmit}>
    <div class="field">
      <label for="template">Vorlage *</label>
      <select id="template" bind:value={form.template_id} required>
        <option value="">Bitte waehlen...</option>
        {#each templates as t}
          <option value={t.id}>{t.name}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="object">Objekt (optional)</label>
      <select id="object" bind:value={form.object_id}>
        <option value="">Kein Objekt</option>
        {#each objects as o}
          <option value={o.id}>{o.name}{o.location ? ` (${o.location})` : ''}</option>
        {/each}
      </select>
    </div>
    <div class="field">
      <label for="title">Titel *</label>
      <input id="title" bind:value={form.title} required />
    </div>
    <div class="row">
      <div class="field">
        <label for="inspector">Pruefer *</label>
        <input id="inspector" bind:value={form.inspector} required />
      </div>
      <div class="field">
        <label for="date">Datum</label>
        <input id="date" type="date" bind:value={form.inspection_date} />
      </div>
    </div>
    <div class="field">
      <label for="notes">Hinweise</label>
      <textarea id="notes" bind:value={form.notes} rows="3"></textarea>
    </div>

    <div class="actions">
      <button type="submit" class="btn-primary" disabled={saving}>
        {saving ? 'Erstelle...' : 'Pruefung starten'}
      </button>
      <button type="button" class="btn-secondary" onclick={() => currentView.set('inspections')}>Abbrechen</button>
    </div>
  </form>
</div>

<style>
  .page { max-width: 600px; display: flex; flex-direction: column; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; flex: 1; }
  .field label { font-weight: 600; font-size: 0.8125rem; }
  .row { display: flex; gap: 1rem; }
  input, select, textarea { width: 100%; }
  .actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
</style>
