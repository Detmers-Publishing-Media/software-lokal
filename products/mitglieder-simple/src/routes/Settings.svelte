<script>
  import { onMount } from 'svelte';
  import { getFeeClasses, saveFeeClass } from '../lib/db.js';

  let feeClasses = $state([]);
  let newClass = $state({ name: '', amount_cents: 0, interval: 'jaehrlich' });
  let saving = $state(false);

  onMount(async () => {
    feeClasses = await getFeeClasses();
  });

  async function handleAdd() {
    if (!newClass.name.trim()) return;
    saving = true;
    await saveFeeClass({ ...newClass, amount_cents: Math.round(newClass.amount_cents * 100) });
    feeClasses = await getFeeClasses();
    newClass = { name: '', amount_cents: 0, interval: 'jaehrlich' };
    saving = false;
  }
</script>

<div class="settings-page">
  <h1>Einstellungen</h1>

  <section>
    <h2>Beitragsklassen</h2>
    <table>
      <thead>
        <tr><th>Name</th><th>Betrag</th><th>Intervall</th></tr>
      </thead>
      <tbody>
        {#each feeClasses as fc}
          <tr>
            <td>{fc.name}</td>
            <td>{(fc.amount_cents / 100).toFixed(2)} EUR</td>
            <td>{fc.interval}</td>
          </tr>
        {/each}
      </tbody>
    </table>

    <div class="add-form">
      <h3>Neue Beitragsklasse</h3>
      <div class="row">
        <label>Name<input bind:value={newClass.name} placeholder="z.B. Jugendmitglied" /></label>
        <label>Betrag (EUR)<input bind:value={newClass.amount_cents} type="number" step="0.01" min="0" /></label>
        <label>Intervall
          <select bind:value={newClass.interval}>
            <option value="monatlich">Monatlich</option>
            <option value="vierteljaehrlich">Vierteljaehrlich</option>
            <option value="halbjaehrlich">Halbjaehrlich</option>
            <option value="jaehrlich">Jaehrlich</option>
          </select>
        </label>
      </div>
      <button class="btn-primary" onclick={handleAdd} disabled={saving}>Hinzufuegen</button>
    </div>
  </section>

  <section class="about">
    <h2>Ueber MitgliederSimple</h2>
    <p>Version 0.1.0</p>
    <p>B-05 Verein & Ehrenamt Digital</p>
    <p>Lizenz: MIT</p>
  </section>
</div>

<style>
  .settings-page { max-width: 700px; display: flex; flex-direction: column; gap: 2rem; }
  section { border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1.5rem; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  th { font-weight: 600; }
  .add-form { border-top: 1px solid var(--color-border); padding-top: 1rem; }
  .row { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; font-size: 0.8125rem; color: var(--color-text-muted); }
  .about p { color: var(--color-text-muted); font-size: 0.875rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
</style>
