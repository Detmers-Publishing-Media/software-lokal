<script>
  import { onMount } from 'svelte';
  import { DataTable, SearchBar, ExportButton } from '@codefabrik/app-shared/components';
  import { members, searchQuery, statusFilter, filteredMembers } from '../lib/stores/members.js';
  import { currentView } from '../lib/stores/navigation.js';
  import { getMembers, getClubProfile } from '../lib/db.js';
  import { generateCsv, downloadCsv } from '@codefabrik/shared/csv';
  import { checkMemberLimit, hasLicenseKey } from '../lib/license.js';
  import { generateMitgliederliste, generateTelefonliste, generateGeburtstagsliste, generateJubilarliste } from '../lib/pdf-lists.js';

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
  let limitInfo = $state(null);
  let showPrintMenu = $state(false);

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
    limitInfo = await checkMemberLimit();
  });

  async function handlePrint(type) {
    showPrintMenu = false;
    const allMembers = $members;
    const profile = await getClubProfile() ?? {};
    const isProbe = !hasLicenseKey();
    const year = new Date().getFullYear();

    if (type === 'mitglieder') generateMitgliederliste(allMembers, profile, isProbe);
    else if (type === 'telefon') generateTelefonliste(allMembers, profile, isProbe);
    else if (type === 'geburtstag') generateGeburtstagsliste(allMembers, profile, isProbe);
    else if (type === 'jubilare') generateJubilarliste(allMembers, profile, year, isProbe);
  }
</script>

<div class="member-list">
  <div class="header">
    <h1>Mitglieder ({$filteredMembers.length})</h1>
    <div class="header-actions">
      <div class="print-wrapper">
        <button class="btn-secondary" onclick={() => showPrintMenu = !showPrintMenu}>Drucken</button>
        {#if showPrintMenu}
          <div class="print-menu">
            <button onclick={() => handlePrint('mitglieder')}>Mitgliederliste</button>
            <button onclick={() => handlePrint('telefon')}>Telefonliste</button>
            <button onclick={() => handlePrint('geburtstag')}>Geburtstagsliste</button>
            <button onclick={() => handlePrint('jubilare')}>Jubilarliste</button>
          </div>
        {/if}
      </div>
      <ExportButton onclick={() => {
        const csv = generateCsv(sortedMembers, columns);
        downloadCsv(csv, `mitglieder-${new Date().toISOString().slice(0,10)}.csv`);
      }} />
      <button class="btn-primary" onclick={() => currentView.set('add')}>+ Neues Mitglied</button>
    </div>
  </div>

  {#if limitInfo && !hasLicenseKey() && limitInfo.count >= 25}
    <div class="trial-banner">
      Probe-Version: {limitInfo.limit - limitInfo.count} von {limitInfo.limit} Plaetzen verbleibend
    </div>
  {/if}

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
  .header-actions { display: flex; gap: 0.5rem; align-items: center; }
  .filters { display: flex; gap: 0.75rem; align-items: center; }
  .btn-primary {
    padding: 0.5rem 1rem; background: var(--color-primary); color: white;
    border: none; border-radius: 0.375rem; font-weight: 500;
  }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  select { padding: 0.5rem; border-radius: 0.375rem; border: 1px solid var(--color-border); }
  .trial-banner {
    background: #fff3cd; border: 1px solid #ffc107; border-radius: 0.375rem;
    padding: 0.5rem 1rem; font-size: 0.875rem; color: #856404;
  }
  .print-wrapper { position: relative; }
  .print-menu {
    position: absolute; top: 100%; left: 0; z-index: 10;
    background: white; border: 1px solid var(--color-border); border-radius: 0.375rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 180px; margin-top: 0.25rem;
  }
  .print-menu button {
    display: block; width: 100%; text-align: left; padding: 0.5rem 1rem;
    background: none; border: none; font-size: 0.875rem; cursor: pointer;
  }
  .print-menu button:hover { background: var(--color-surface); }
</style>
