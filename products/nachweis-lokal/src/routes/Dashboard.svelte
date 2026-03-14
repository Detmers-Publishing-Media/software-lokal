<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getDueInspections, getInspectionStats, getOpenDefectCount } from '../lib/db.js';

  let stats = $state({ total: 0, offen: 0, bestanden: 0, bemaengelt: 0 });
  let dueItems = $state([]);
  let openDefects = $state(0);

  let overdueCount = $derived(dueItems.filter(d => d.urgency === 'ueberfaellig').length);
  let soonDueCount = $derived(dueItems.filter(d => d.urgency === 'bald_faellig').length);

  onMount(async () => {
    stats = await getInspectionStats();
    dueItems = await getDueInspections();
    openDefects = await getOpenDefectCount();
  });

  function urgencyClass(urgency) {
    if (urgency === 'ueberfaellig') return 'badge-danger';
    if (urgency === 'bald_faellig') return 'badge-warning';
    return 'badge-success';
  }

  function urgencyLabel(urgency) {
    if (urgency === 'ueberfaellig') return 'Ueberfaellig';
    if (urgency === 'bald_faellig') return 'Bald faellig';
    return 'OK';
  }

  function formatDate(iso) {
    if (!iso) return 'Nie';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
</script>

<div class="dashboard">
  <h1>Dashboard</h1>

  {#if overdueCount > 0 || soonDueCount > 0}
    <div class="reminders">
      {#if overdueCount > 0}
        <div class="reminder reminder-danger">
          <strong>{overdueCount} {overdueCount === 1 ? 'Pruefung' : 'Pruefungen'} ueberfaellig!</strong>
          Bitte zeitnah durchfuehren.
        </div>
      {/if}
      {#if soonDueCount > 0}
        <div class="reminder reminder-warning">
          <strong>{soonDueCount} {soonDueCount === 1 ? 'Pruefung' : 'Pruefungen'} bald faellig</strong>
          (innerhalb 14 Tage).
        </div>
      {/if}
    </div>
  {/if}

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value">{stats.total}</div>
      <div class="stat-label">Pruefungen gesamt</div>
    </div>
    <div class="stat-card">
      <div class="stat-value open">{stats.offen}</div>
      <div class="stat-label">Offen</div>
    </div>
    <div class="stat-card">
      <div class="stat-value success">{stats.bestanden}</div>
      <div class="stat-label">Bestanden</div>
    </div>
    <div class="stat-card">
      <div class="stat-value danger">{stats.bemaengelt}</div>
      <div class="stat-label">Bemaengelt</div>
    </div>
    <div class="stat-card clickable" onclick={() => currentView.set('defects')}>
      <div class="stat-value" class:danger={openDefects > 0}>{openDefects}</div>
      <div class="stat-label">Offene Maengel</div>
    </div>
  </div>

  <h2>Faelligkeiten</h2>
  {#if dueItems.length === 0}
    <p class="empty">Keine wiederkehrenden Pruefungen konfiguriert.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Vorlage</th>
          <th>Objekt</th>
          <th>Letzte Pruefung</th>
          <th>Naechste faellig</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each dueItems as item}
          <tr>
            <td>{item.template_name}</td>
            <td>{item.object_name ?? '-'}</td>
            <td>{formatDate(item.last_inspection)}</td>
            <td>{formatDate(item.next_due)}</td>
            <td><span class="badge {urgencyClass(item.urgency)}">{urgencyLabel(item.urgency)}</span></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <div class="actions">
    <button class="btn-primary" onclick={() => currentView.set('inspection:new')}>Neue Pruefung</button>
    <button class="btn-secondary" onclick={() => currentView.set('inspections')}>Alle Pruefungen</button>
  </div>
</div>

<style>
  .dashboard { display: flex; flex-direction: column; gap: 1.5rem; }
  .reminders { display: flex; flex-direction: column; gap: 0.5rem; }
  .reminder {
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }
  .reminder-danger {
    background: #fed7d7;
    color: #9b2c2c;
    border-left: 4px solid #e53e3e;
  }
  .reminder-warning {
    background: #fefcbf;
    color: #744210;
    border-left: 4px solid #ecc94b;
  }
  .stats { display: flex; gap: 1rem; }
  .stat-card {
    flex: 1;
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    text-align: center;
  }
  .stat-value { font-size: 2rem; font-weight: 700; }
  .stat-value.open { color: var(--color-text-muted); }
  .stat-value.success { color: var(--color-success); }
  .stat-value.danger { color: var(--color-danger); }
  .stat-card.clickable { cursor: pointer; }
  .stat-card.clickable:hover { border-color: var(--color-primary); }
  .stat-label { font-size: 0.8125rem; color: var(--color-text-muted); }
  .empty { color: var(--color-text-muted); font-style: italic; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  th { background: var(--color-surface); font-weight: 600; font-size: 0.8125rem; }
  td { font-size: 0.875rem; }
  .badge { padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; }
  .badge-success { background: #c6f6d5; color: #22543d; }
  .badge-warning { background: #fefcbf; color: #744210; }
  .badge-danger { background: #fed7d7; color: #9b2c2c; }
  .actions { display: flex; gap: 0.75rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
</style>
