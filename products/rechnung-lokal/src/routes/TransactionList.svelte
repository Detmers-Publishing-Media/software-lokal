<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, EmptyState, StatusBadge } from '@codefabrik/ui-shared/components';

  let transactions = $state([]);
  let filter = $state('all');
  let loading = $state(true);

  async function loadTransactions() {
    loading = true;
    const { transaction } = getModels();
    const filters = {};
    if (filter === 'income') filters.type = 'income';
    if (filter === 'expense') filters.type = 'expense';
    if (filter === 'cancelled') filters.include_cancelled = true;
    transactions = await transaction.getAll(filters);
    loading = false;
  }

  onMount(loadTransactions);

  $effect(() => {
    filter;
    loadTransactions();
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',') + ' €';
  }

  function formatDate(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  async function cancelTransaction(id) {
    const { transaction } = getModels();
    await transaction.cancel(id);
    await loadTransactions();
  }
</script>

<div class="content">
  <PageHeader title="Buchungen">
    <select bind:value={filter}>
      <option value="all">Alle</option>
      <option value="income">Einnahmen</option>
      <option value="expense">Ausgaben</option>
      <option value="cancelled">Inkl. storniert</option>
    </select>
    <button class="primary" onclick={() => currentView.set('transaction:new')}>
      Neue Buchung
    </button>
  </PageHeader>

  {#if loading}
    <p>Lade Buchungen...</p>
  {:else if transactions.length === 0}
    <EmptyState message="Noch keine Buchungen vorhanden." />
  {:else}
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Beschreibung</th>
          <th>Kategorie</th>
          <th>Art</th>
          <th>Betrag</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each transactions as tx}
          <tr class:cancelled={tx.cancelled}>
            <td>{formatDate(tx.date)}</td>
            <td>{tx.description}</td>
            <td>{tx.category_code ? `${tx.category_code} — ${tx.category_name}` : '—'}</td>
            <td>
              <span class="type-badge" class:income={tx.type === 'income'} class:expense={tx.type === 'expense'}>
                {tx.type === 'income' ? 'Einnahme' : 'Ausgabe'}
              </span>
            </td>
            <td class="amount" class:income={tx.type === 'income' && !tx.cancelled} class:expense={tx.type === 'expense' && !tx.cancelled}>
              {tx.type === 'expense' ? '-' : ''}{formatCents(Math.abs(tx.amount_cents))}
            </td>
            <td>
              {#if !tx.cancelled && !tx.cancel_ref}
                <button class="small danger" onclick={() => cancelTransaction(tx.id)}>Storno</button>
              {:else if tx.cancelled}
                <span class="storno-hint">storniert</span>
              {:else if tx.cancel_ref}
                <span class="storno-hint">Gegenbuchung</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .cancelled td { opacity: 0.5; text-decoration: line-through; }
  .type-badge { padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.8rem; }
  .type-badge.income { background: #d1e7dd; color: #0f5132; }
  .type-badge.expense { background: #f8d7da; color: #842029; }
  td.income { color: #0f5132; }
  td.expense { color: #842029; }
  .storno-hint { font-size: 0.8rem; color: #999; font-style: italic; }
  button.small { padding: 0.2rem 0.5rem; font-size: 0.8rem; }
</style>
