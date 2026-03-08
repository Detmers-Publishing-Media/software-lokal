<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, EmptyState } from '@codefabrik/ui-shared/components';

  let customers = $state([]);
  let searchTerm = $state('');
  let loading = $state(true);

  async function loadCustomers() {
    const { person } = getModels();
    customers = searchTerm
      ? await person.search(searchTerm)
      : await person.getAll();
    loading = false;
  }

  onMount(loadCustomers);

  $effect(() => {
    searchTerm;
    loadCustomers();
  });
</script>

<div class="content">
  <PageHeader title="Kunden">
    <input type="search" bind:value={searchTerm} placeholder="Suchen..." />
    <button class="primary" onclick={() => currentView.set('customer:new')}>
      Neuer Kunde
    </button>
  </PageHeader>

  {#if loading}
    <p>Lade Kunden...</p>
  {:else if customers.length === 0}
    <EmptyState message={searchTerm ? 'Keine Treffer.' : 'Noch keine Kunden angelegt.'} />
  {:else}
    <table>
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Firma / Name</th>
          <th>Ort</th>
          <th>B2B</th>
        </tr>
      </thead>
      <tbody>
        {#each customers as c}
          <tr onclick={() => currentView.set(`customer:${c.id}`)}>
            <td>{c.person_number}</td>
            <td>{c.company || `${c.first_name} ${c.last_name}`}</td>
            <td>{c.zip} {c.city}</td>
            <td>{c.is_b2b ? 'Ja' : 'Nein'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
