<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, FormRow } from '@codefabrik/ui-shared/components';

  let type = $state('expense');
  let date = $state(new Date().toISOString().slice(0, 10));
  let amountCents = $state(0);
  let description = $state('');
  let categoryId = $state(null);
  let categories = $state([]);
  let saving = $state(false);

  onMount(async () => {
    const { category } = getModels();
    categories = await category.getAll();
  });

  let filteredCategories = $derived(categories.filter(c => c.type === type));

  async function save() {
    if (!amountCents || !description) return;
    saving = true;
    try {
      const { transaction } = getModels();
      await transaction.save({
        type, date, amount_cents: amountCents,
        description, category_id: categoryId,
      });
      currentView.set('transactions');
    } finally {
      saving = false;
    }
  }
</script>

<div class="content">
  <PageHeader title="Buchung erfassen" />

  <form onsubmit={e => { e.preventDefault(); save(); }}>
    <FormRow>
      <label>
        Art
        <select bind:value={type}>
          <option value="income">Einnahme</option>
          <option value="expense">Ausgabe</option>
        </select>
      </label>
      <label>Datum <input type="date" bind:value={date} required /></label>
    </FormRow>

    <label>Betrag (Cent) <input type="number" bind:value={amountCents} min="1" required /></label>
    <label>Beschreibung <input type="text" bind:value={description} required placeholder="z.B. Domain-Gebühr" /></label>

    <label>
      Kategorie
      <select bind:value={categoryId}>
        <option value={null}>-- Ohne Kategorie --</option>
        {#each filteredCategories as cat}
          <option value={cat.id}>{cat.code} — {cat.name}</option>
        {/each}
      </select>
    </label>

    <div class="form-actions">
      <button type="button" onclick={() => currentView.set('euer')}>Abbrechen</button>
      <button type="submit" class="primary" disabled={saving}>Buchen</button>
    </div>
  </form>
</div>
