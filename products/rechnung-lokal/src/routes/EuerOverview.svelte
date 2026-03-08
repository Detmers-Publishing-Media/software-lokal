<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { annualSummary, monthlySummary } from '@codefabrik/finanz-shared/euer';
  import { query } from '@codefabrik/app-shared/db';
  import { PageHeader, YearNavigator, SummaryCard } from '@codefabrik/ui-shared/components';

  let year = $state(new Date().getFullYear());
  let annual = $state(null);
  let months = $state([]);
  let loading = $state(true);

  const monthNames = ['Jan', 'Feb', 'Maz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  async function loadData() {
    loading = true;
    annual = await annualSummary(query, year);
    months = await monthlySummary(query, year);
    loading = false;
  }

  onMount(loadData);

  $effect(() => {
    year;
    loadData();
  });

  function formatCents(cents) {
    return (cents / 100).toFixed(2).replace('.', ',');
  }

  function formatEur(cents) {
    return formatCents(cents) + ' EUR';
  }
</script>

<div class="content">
  <PageHeader title="Einnahmen-Ausgaben-Uebersicht {year}">
    <YearNavigator {year} onchange={(y) => year = y} />
  </PageHeader>

  {#if loading}
    <p>Lade...</p>
  {:else if annual}
    <div class="summary-cards">
      <SummaryCard label="Einnahmen" value={formatEur(annual.income_cents)} variant="income" />
      <SummaryCard label="Ausgaben" value={formatEur(annual.expense_cents)} variant="expense" />
      <SummaryCard label="Gewinn / Verlust" value={formatEur(annual.profit_cents)} variant={annual.profit_cents < 0 ? 'danger' : 'profit'} />
    </div>

    <h2>Monatsuebersicht</h2>
    <table>
      <thead>
        <tr><th>Monat</th><th>Einnahmen</th><th>Ausgaben</th><th>Saldo</th></tr>
      </thead>
      <tbody>
        {#each months as m}
          <tr>
            <td>{monthNames[m.month - 1]}</td>
            <td class="amount">{formatCents(m.income_cents)}</td>
            <td class="amount">{formatCents(m.expense_cents)}</td>
            <td class="amount" class:negative={m.saldo_cents < 0}>{formatCents(m.saldo_cents)}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    {#if annual.categories.length > 0}
      <h2>Nach Kategorie</h2>
      <table>
        <thead>
          <tr><th>Code</th><th>Kategorie</th><th>Betrag</th><th>Buchungen</th></tr>
        </thead>
        <tbody>
          {#each annual.categories as cat}
            <tr>
              <td>{cat.code}</td>
              <td>{cat.name}</td>
              <td class="amount">{formatCents(cat.total_cents)}</td>
              <td>{cat.tx_count}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>
