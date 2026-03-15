<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getInspection, getInspectionResults, saveInspectionResults, saveInspection, getTemplate, createRecurringInspection, createDefectsFromInspection } from '../lib/db.js';
  import PhotoAttachment from '../components/PhotoAttachment.svelte';

  let { inspectionId } = $props();
  let inspection = $state(null);
  let results = $state([]);
  let saving = $state(false);
  let template = $state(null);
  let autoRecurring = $state(false);
  let completedMessage = $state(null);

  let doneCount = $derived(results.filter(r => r.result !== 'offen').length);
  let totalCount = $derived(results.length);
  let progressPercent = $derived(totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0);

  onMount(async () => {
    inspection = await getInspection(inspectionId);
    results = await getInspectionResults(inspectionId);
    if (inspection?.template_id) {
      template = await getTemplate(inspection.template_id);
      if (template?.interval_days > 0) {
        autoRecurring = true;
      }
    }
  });

  function setResult(index, value) {
    results[index] = { ...results[index], result: value };
  }

  function setRemark(index, value) {
    results[index] = { ...results[index], remark: value };
  }

  function resultClass(result) {
    if (result === 'ok') return 'result-ok';
    if (result === 'maengel') return 'result-fail';
    if (result === 'nicht_anwendbar') return 'result-na';
    return '';
  }

  async function handleSave(finalize = false) {
    saving = true;
    await saveInspectionResults(inspectionId, results);

    if (finalize) {
      const hasDefects = results.some(r => r.result === 'maengel');
      const allDone = results.every(r => r.result !== 'offen');
      if (allDone) {
        const dueDate = inspection.due_date || null;
        await saveInspection({
          ...inspection,
          status: hasDefects ? 'bemaengelt' : 'bestanden',
          due_date: dueDate,
        });

        // Auto-create defects if bemaengelt
        if (hasDefects) {
          await createDefectsFromInspection(inspectionId);
        }

        // Auto-create recurring inspection
        if (autoRecurring && template?.interval_days > 0) {
          await createRecurringInspection(inspectionId);
        }
      }
    }

    saving = false;
    if (finalize) {
      const msg = autoRecurring && template?.interval_days > 0
        ? `Prüfung abgeschlossen! Nächste Prüfung in ${template.interval_days} Tagen angelegt.`
        : 'Prüfung abgeschlossen und gespeichert!';
      completedMessage = msg;
    }
  }
</script>

{#if completedMessage}
  <div class="completed-screen">
    <div class="completed-icon">✓</div>
    <h2>{completedMessage}</h2>
    <button class="btn-primary" onclick={() => currentView.set(`inspection:${inspectionId}`)}>
      Zum Protokoll &rarr;
    </button>
  </div>
{:else if inspection}
  <div class="page">
    <h1>Prüfung durchführen</h1>
    <div class="meta">
      <span><strong>{inspection.title}</strong></span>
      <span>Prüfer: {inspection.inspector}</span>
      {#if inspection.object_name}<span>Gerät / Raum: {inspection.object_name}</span>{/if}
    </div>

    <div class="progress-section">
      <div class="progress-bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100">
        <div class="progress-fill" style="width: {progressPercent}%"></div>
      </div>
      <span class="progress-label">{doneCount} von {totalCount} Punkten bearbeitet</span>
    </div>

    <div class="checklist">
      {#each results as r, i}
        <div class="check-item" class:required={r.required}>
          <div class="check-header">
            <span class="check-num">{i + 1}.</span>
            <span class="check-label">{r.label}</span>
            {#if r.required}<span class="check-required">Pflicht</span>{/if}
          </div>
          {#if r.hint}
            <div class="check-hint">{r.hint}</div>
          {/if}
          <div class="check-buttons">
            <button class="result-btn {r.result === 'ok' ? 'active-ok' : ''}" onclick={() => setResult(i, 'ok')}>OK</button>
            <button class="result-btn {r.result === 'maengel' ? 'active-fail' : ''}" onclick={() => setResult(i, 'maengel')}>Mängel</button>
            <button class="result-btn {r.result === 'nicht_anwendbar' ? 'active-na' : ''}" onclick={() => setResult(i, 'nicht_anwendbar')}>Entfällt</button>
          </div>
          {#if r.result === 'maengel'}
            <textarea
              placeholder="Was ist das Problem?"
              value={r.remark ?? ''}
              oninput={(e) => setRemark(i, e.target.value)}
              rows="2"
            ></textarea>
          {/if}
          {#if r.id}
            <PhotoAttachment inspectionResultId={r.id} />
          {/if}
        </div>
      {/each}
    </div>

    {#if template?.interval_days > 0}
      <div class="recurring-option">
        <label>
          <input type="checkbox" bind:checked={autoRecurring} />
          Nächste Prüfung automatisch anlegen (in {template.interval_days} Tagen)
        </label>
      </div>
    {/if}

    <div class="actions">
      <button class="btn-secondary" onclick={() => handleSave(false)} disabled={saving}>Zwischenspeichern</button>
      <button class="btn-primary" onclick={() => handleSave(true)} disabled={saving}>Abschließen</button>
      <button class="btn-secondary" onclick={() => currentView.set(`inspection:${inspectionId}`)}>Zurück</button>
    </div>
  </div>
{/if}

<style>
  .page { max-width: 800px; display: flex; flex-direction: column; gap: 1rem; }
  .meta { display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--color-text-muted); flex-wrap: wrap; }
  .checklist { display: flex; flex-direction: column; gap: 0.75rem; }
  .check-item {
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    background: var(--color-surface);
  }
  .check-header { display: flex; gap: 0.5rem; align-items: center; }
  .check-num { font-weight: 700; min-width: 1.5rem; }
  .check-label { font-weight: 600; flex: 1; }
  .check-required { font-size: 0.6875rem; color: var(--color-primary); }
  .check-hint { font-size: 0.8125rem; color: var(--color-text-muted); margin: 0.25rem 0 0 2rem; }
  .check-buttons { display: flex; gap: 0.5rem; margin-top: 0.5rem; margin-left: 2rem; }
  .result-btn {
    padding: 0.375rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.25rem;
    background: white;
    font-size: 0.8125rem;
    min-height: 44px;
    min-width: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .result-btn:hover { background: var(--color-surface); }
  .active-ok { background: #c6f6d5; border-color: #38a169; color: #22543d; }
  .active-fail { background: #fed7d7; border-color: #e53e3e; color: #9b2c2c; }
  .active-na { background: #e2e8f0; border-color: #a0aec0; color: #4a5568; }
  textarea { margin-top: 0.5rem; margin-left: 2rem; width: calc(100% - 2rem); }
  .recurring-option { margin-top: 0.5rem; font-size: 0.875rem; }
  .recurring-option label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
  .recurring-option input[type="checkbox"] { width: 1rem; height: 1rem; }
  .actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }

  .progress-section { display: flex; flex-direction: column; gap: 0.25rem; }
  .progress-bar { height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.3s; }
  .progress-label { font-size: 0.8125rem; color: var(--color-text-muted); }

  .completed-screen {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 60vh; text-align: center;
  }
  .completed-icon { font-size: 4rem; color: var(--color-success); margin-bottom: 1rem; }
  .completed-screen h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
</style>
