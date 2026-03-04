<script>
  import { onMount } from 'svelte';
  import { DataTable, SearchBar } from '@codefabrik/vereins-shared/components';
  import { members, searchQuery, statusFilter, filteredMembers } from '../lib/stores/members.js';
  import { currentView } from '../lib/stores/navigation.js';
  import { getMembers } from '../lib/db.js';

  const columns = [
    { key: 'member_number', label: 'Nr.' },
    { key: 'last_name', label: 'Nachname' },
    { key: 'first_name', label: 'Vorname' },
    { key: 'city', label: 'Ort' },
    { key: 'status', label: 'Status' },
    { key: 'fee_class_name', label: 'Beitragsklasse' },
    { key: 'entry_date', label: 'Eintritt' },
  ];

  let sortKey = $state('last_name');
  let sortDir = $state('asc');

  let sortedMembers = $derived.by(() => {
    const list = [...$filteredMembers];
    if (sortKey) {
      list.sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = String(va).localeCompare(String(vb), 'de');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  onMount(async () => {
    members.set(await getMembers());
  });
</script>

<div class="member-list">
  <div class="header">
    <h1>Mitglieder ({$filteredMembers.length})</h1>
    <button class="btn-primary" onclick={() => currentView.set('add')}>+ Neues Mitglied</button>
  </div>

  <div class="filters">
    <SearchBar bind:value={$searchQuery} placeholder="Name, Nr. oder Ort suchen..." />
    <select bind:value={$statusFilter}>
      <option value="alle">Alle Status</option>
      <option value="aktiv">Aktiv</option>
      <option value="passiv">Passiv</option>
      <option value="ausgetreten">Ausgetreten</option>
      <option value="verstorben">Verstorben</option>
    </select>
  </div>

  <DataTable
    {columns}
    rows={sortedMembers}
    bind:sortKey
    bind:sortDir
    onRowClick={(row) => currentView.set(`detail:${row.id}`)}
  />
</div>

<style>
  .member-list { display: flex; flex-direction: column; gap: 1rem; }
  .header { display: flex; justify-content: space-between; align-items: center; }
  .filters { display: flex; gap: 0.75rem; align-items: center; }
  .btn-primary {
    padding: 0.5rem 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 0.375rem; font-weight: 500;
  }
  .btn-primary:hover { background: var(--color-primary-hover); }
  select { padding: 0.5rem; border-radius: 0.375rem; border: 1px solid var(--color-border); }
</style>
