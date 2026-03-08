<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, StatusBadge, EmptyState } from '@codefabrik/ui-shared/components';

  let { customerId } = $props();

  let customer = $state(null);
  let invoices = $state([]);
  let loading = $state(true);

  onMount(async () => {
    const { person, invoice } = getModels();
    customer = await person.getById(customerId);
    if (customer) {
      invoices = await invoice.getAll({ person_id: customerId });
    }
    loading = false;
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  let totalRevenue = $derived(
    invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total_cents, 0)
  );

  let openAmount = $derived(
    invoices
      .filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((sum, i) => sum + i.total_cents, 0)
  );
</script>

<div class="content">
  {#if loading}
    <p>Lade...</p>
  {:else if !customer}
    <p>Kunde nicht gefunden.</p>
  {:else}
    <PageHeader title={customer.company || `${customer.first_name} ${customer.last_name}`}>
      <span class="customer-number">{customer.person_number}</span>
    </PageHeader>

    <div class="detail-grid">
      <div class="card">
        <h3>Kontaktdaten</h3>
        {#if customer.company}<p><strong>{customer.company}</strong></p>{/if}
        {#if customer.first_name || customer.last_name}
          <p>{customer.first_name} {customer.last_name}</p>
        {/if}
        {#if customer.street}<p>{customer.street}</p>{/if}
        {#if customer.zip || customer.city}<p>{customer.zip} {customer.city}</p>{/if}
        {#if customer.email}<p>E-Mail: {customer.email}</p>{/if}
        {#if customer.phone}<p>Tel.: {customer.phone}</p>{/if}
        {#if customer.vat_id}<p>USt-IdNr.: {customer.vat_id}</p>{/if}
        <p>{customer.is_b2b ? 'Geschäftskunde (B2B)' : 'Privatkunde (B2C)'}</p>
      </div>

      <div class="card">
        <h3>Kennzahlen</h3>
        <p>Rechnungen: <strong>{invoices.length}</strong></p>
        <p>Umsatz (bezahlt): <strong class="income">{formatCents(totalRevenue)}</strong></p>
        <p>Offen: <strong class="expense">{formatCents(openAmount)}</strong></p>
      </div>
    </div>

    {#if customer.notes}
      <p class="notes"><strong>Notizen:</strong> {customer.notes}</p>
    {/if}

    <div class="actions">
      <button onclick={() => currentView.set('customers')}>Zurück</button>
      <button onclick={() => currentView.set(`customer:edit:${customer.id}`)}>Bearbeiten</button>
      <button class="primary" onclick={() => currentView.set('invoice:new')}>Neue Rechnung</button>
    </div>

    <h2>Rechnungshistorie</h2>
    {#if invoices.length === 0}
      <EmptyState message="Noch keine Rechnungen für diesen Kunden." />
    {:else}
      <table>
        <thead>
          <tr>
            <th>Nr.</th>
            <th>Datum</th>
            <th>Betrag</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {#each invoices as inv}
            <tr onclick={() => currentView.set(`invoice:${inv.id}`)}>
              <td>{inv.invoice_number}</td>
              <td>{formatDate(inv.issue_date)}</td>
              <td class="amount">{formatCents(inv.total_cents)}</td>
              <td><StatusBadge status={inv.status} /></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>

<style>
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
  .card { padding: 1rem; background: white; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card h3 { margin: 0 0 0.8rem; color: #555; font-size: 0.9rem; }
  .card p { margin: 0.3rem 0; font-size: 0.95rem; }
  .customer-number { color: #888; font-size: 0.9rem; }
  .income { color: #0f5132; }
  .expense { color: #842029; }
  .notes { margin-bottom: 1rem; color: #666; font-style: italic; }
  .actions { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
</style>
