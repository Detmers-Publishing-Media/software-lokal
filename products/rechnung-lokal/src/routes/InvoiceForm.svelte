<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, FormRow } from '@codefabrik/ui-shared/components';

  let { invoiceId = null } = $props();

  let customers = $state([]);
  let selectedCustomer = $state(null);
  let issueDate = $state(new Date().toISOString().slice(0, 10));
  let dueDate = $state('');
  let notes = $state('');
  let items = $state([{ description: '', quantity: 1, unit: 'Stück', unit_price_cents: 0, tax_rate: 1900 }]);
  let saving = $state(false);

  const { person, invoice, profile: profileModel } = getModels();
  let isSmallBusiness = $state(false);
  let invoicePrefix = $state('RE');
  let numberMode = $state('yearly');
  let nextNumber = $state('');

  onMount(async () => {
    customers = await person.getAll();
    const prof = await profileModel.get();
    isSmallBusiness = !!prof?.is_small_business;
    invoicePrefix = prof?.invoice_prefix ?? 'RE';
    numberMode = prof?.invoice_number_mode ?? 'yearly';

    if (!invoiceId) {
      nextNumber = await invoice.nextNumber(invoicePrefix, new Date().getFullYear(), numberMode);
    }

    if (invoiceId) {
      const inv = await invoice.getWithItems(invoiceId);
      if (inv) {
        selectedCustomer = inv.person_id;
        issueDate = inv.issue_date;
        dueDate = inv.due_date ?? '';
        notes = inv.notes ?? '';
        items = inv.items.map(it => ({
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unit_price_cents: it.unit_price_cents,
          tax_rate: it.tax_rate,
        }));
      }
    }
  });

  function addItem() {
    items = [...items, { description: '', quantity: 1, unit: 'Stück', unit_price_cents: 0, tax_rate: 1900 }];
  }

  function removeItem(index) {
    items = items.filter((_, i) => i !== index);
  }

  let totals = $derived.by(() => {
    return invoice.calculateTotals(items, isSmallBusiness);
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',');
  }

  async function save() {
    if (!selectedCustomer || items.length === 0) return;
    saving = true;
    try {
      await invoice.save(
        { id: invoiceId, person_id: selectedCustomer, issue_date: issueDate, due_date: dueDate || null, notes, prefix: invoicePrefix, number_mode: numberMode },
        items,
        isSmallBusiness,
      );
      currentView.set('invoices');
    } finally {
      saving = false;
    }
  }
</script>

<div class="content">
  <PageHeader title={invoiceId ? 'Rechnung bearbeiten' : 'Neue Rechnung'}>
    <button onclick={() => currentView.set('invoices')}>Zurück</button>
  </PageHeader>

  <form onsubmit={e => { e.preventDefault(); save(); }}>
    <FormRow>
      <label>
        Kunde
        <select bind:value={selectedCustomer} required>
          <option value={null}>-- Kunde wählen --</option>
          {#each customers as c}
            <option value={c.id}>{c.company || `${c.first_name} ${c.last_name}`} ({c.person_number})</option>
          {/each}
        </select>
      </label>
      <button type="button" onclick={() => currentView.set('customer:new')}>Neuer Kunde</button>
    </FormRow>

    {#if nextNumber}
      <p class="hint">Nächste Rechnungsnummer: <strong>{nextNumber}</strong></p>
    {/if}

    <FormRow>
      <label>Rechnungsdatum <input type="date" bind:value={issueDate} required /></label>
      <label>Fällig am <input type="date" bind:value={dueDate} /></label>
    </FormRow>

    <h3>Positionen</h3>
    <table class="items-table">
      <thead>
        <tr>
          <th>Beschreibung</th>
          <th>Menge</th>
          <th>Einheit</th>
          <th>Einzelpreis</th>
          {#if !isSmallBusiness}<th>MwSt %</th>{/if}
          <th>Summe</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each items as item, i}
          <tr>
            <td><input type="text" bind:value={item.description} required placeholder="Leistungsbeschreibung" /></td>
            <td><input type="number" bind:value={item.quantity} min="0.01" step="0.01" required /></td>
            <td><input type="text" bind:value={item.unit} /></td>
            <td><input type="number" bind:value={item.unit_price_cents} min="0" step="1" required placeholder="Cent" /></td>
            {#if !isSmallBusiness}
              <td><input type="number" bind:value={item.tax_rate} min="0" step="100" /></td>
            {/if}
            <td class="amount">{formatCents(Math.round(item.quantity * item.unit_price_cents))}</td>
            <td><button type="button" onclick={() => removeItem(i)} disabled={items.length <= 1}>X</button></td>
          </tr>
        {/each}
      </tbody>
    </table>
    <button type="button" onclick={addItem}>Position hinzufügen</button>

    <div class="totals">
      <p>Netto: {formatCents(totals.subtotal_cents)} EUR</p>
      {#if !isSmallBusiness}
        <p>MwSt: {formatCents(totals.tax_cents)} EUR</p>
      {/if}
      <p class="total"><strong>Gesamt: {formatCents(totals.total_cents)} EUR</strong></p>
    </div>

    <label>Bemerkungen <textarea bind:value={notes} rows="3"></textarea></label>

    <div class="form-actions">
      <button type="button" onclick={() => currentView.set('invoices')}>Abbrechen</button>
      <button type="submit" class="primary" disabled={saving}>
        {saving ? 'Speichern...' : 'Rechnung speichern'}
      </button>
    </div>
  </form>
</div>
