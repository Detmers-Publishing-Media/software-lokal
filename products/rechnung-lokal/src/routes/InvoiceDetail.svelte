<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { StatusBadge, PageHeader } from '@codefabrik/ui-shared/components';
  import { generateInvoicePdf } from '../lib/pdf.js';

  let { invoiceId } = $props();

  let inv = $state(null);
  let customer = $state(null);
  let profile = $state(null);
  let loading = $state(true);

  onMount(async () => {
    const { invoice, person, profile: profileModel } = getModels();
    inv = await invoice.getWithItems(invoiceId);
    if (inv) {
      customer = await person.getById(inv.person_id);
    }
    profile = await profileModel.get();
    loading = false;
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' EUR';
  }

  function formatDate(iso) {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  async function markPaid() {
    const { invoice } = getModels();
    await invoice.markPaid(invoiceId);
    inv = await invoice.getWithItems(invoiceId);
  }

  async function cancelInvoice() {
    const { invoice } = getModels();
    await invoice.cancel(invoiceId);
    inv = await invoice.getWithItems(invoiceId);
  }

  async function duplicate() {
    const { invoice } = getModels();
    const newId = await invoice.createFromTemplate(invoiceId);
    currentView.set(`invoice:${newId}`);
  }
</script>

<div class="content">
  {#if loading}
    <p>Lade...</p>
  {:else if !inv}
    <p>Rechnung nicht gefunden.</p>
  {:else}
    <PageHeader title="Rechnung {inv.invoice_number}">
      <StatusBadge status={inv.status} />
    </PageHeader>

    <div class="detail-grid">
      <div>
        <h3>Kunde</h3>
        <p>{customer?.company || ''}</p>
        <p>{customer?.first_name} {customer?.last_name}</p>
        <p>{customer?.street}</p>
        <p>{customer?.zip} {customer?.city}</p>
      </div>
      <div>
        <h3>Rechnungsdaten</h3>
        <p>Datum: {formatDate(inv.issue_date)}</p>
        <p>Faellig: {formatDate(inv.due_date)}</p>
        {#if inv.paid_date}<p>Bezahlt: {formatDate(inv.paid_date)}</p>{/if}
      </div>
    </div>

    <h3>Positionen</h3>
    <table>
      <thead>
        <tr><th>Pos.</th><th>Beschreibung</th><th>Menge</th><th>Einheit</th><th>Einzelpreis</th><th>Summe</th></tr>
      </thead>
      <tbody>
        {#each inv.items as item}
          <tr>
            <td>{item.position}</td>
            <td>{item.description}</td>
            <td>{item.quantity}</td>
            <td>{item.unit}</td>
            <td class="amount">{formatCents(item.unit_price_cents)}</td>
            <td class="amount">{formatCents(item.line_total_cents)}</td>
          </tr>
        {/each}
      </tbody>
      <tfoot>
        <tr><td colspan="5">Netto</td><td class="amount">{formatCents(inv.subtotal_cents)}</td></tr>
        {#if inv.tax_cents > 0}
          <tr><td colspan="5">MwSt</td><td class="amount">{formatCents(inv.tax_cents)}</td></tr>
        {/if}
        <tr class="total"><td colspan="5"><strong>Gesamt</strong></td><td class="amount"><strong>{formatCents(inv.total_cents)}</strong></td></tr>
      </tfoot>
    </table>

    {#if inv.notes}<p class="notes">Bemerkungen: {inv.notes}</p>{/if}

    <div class="actions">
      <button class="primary" onclick={() => generateInvoicePdf(inv, customer, profile)}>PDF erstellen</button>
      <button onclick={() => currentView.set('invoices')}>Zurueck</button>
      {#if inv.status === 'draft' || inv.status === 'sent'}
        <button onclick={() => currentView.set(`invoice:edit:${inv.id}`)}>Bearbeiten</button>
      {/if}
      {#if inv.status === 'sent' || inv.status === 'overdue'}
        <button class="primary" onclick={markPaid}>Als bezahlt markieren</button>
      {/if}
      {#if inv.status !== 'cancelled'}
        <button class="danger" onclick={cancelInvoice}>Stornieren</button>
      {/if}
      <button onclick={duplicate}>Kopieren (neue Rechnung)</button>
    </div>
  {/if}
</div>
