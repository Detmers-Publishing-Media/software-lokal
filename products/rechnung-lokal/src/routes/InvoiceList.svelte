<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { StatusBadge, PageHeader, EmptyState } from '@codefabrik/ui-shared/components';

  let invoices = $state([]);
  let filter = $state('all');
  let loading = $state(true);

  async function loadInvoices() {
    const { invoice } = getModels();
    const filters = filter === 'all' ? {} : { status: filter };
    invoices = await invoice.getAll(filters);
    loading = false;
  }

  onMount(loadInvoices);

  $effect(() => {
    // Reload when filter changes
    filter;
    loadInvoices();
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }
</script>

<div class="content">
  <PageHeader title="Rechnungen">
    <select bind:value={filter}>
      <option value="all">Alle</option>
      <option value="draft">Entwuerfe</option>
      <option value="sent">Versendet</option>
      <option value="paid">Bezahlt</option>
      <option value="overdue">Ueberfaellig</option>
      <option value="cancelled">Storniert</option>
    </select>
    <button class="primary" onclick={() => currentView.set('invoice:new')}>
      Neue Rechnung
    </button>
  </PageHeader>

  {#if loading}
    <p>Lade Rechnungen...</p>
  {:else if invoices.length === 0}
    <EmptyState message="Noch keine Rechnungen vorhanden." />
  {:else}
    <table>
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Kunde</th>
          <th>Datum</th>
          <th>Betrag</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each invoices as inv}
          <tr onclick={() => currentView.set(`invoice:${inv.id}`)}>
            <td>{inv.invoice_number}</td>
            <td>{inv.company || `${inv.first_name} ${inv.last_name}`}</td>
            <td>{formatDate(inv.issue_date)}</td>
            <td class="amount">{formatCents(inv.total_cents)}</td>
            <td><StatusBadge status={inv.status} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
