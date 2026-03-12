<script>
  import { onMount } from 'svelte';
  import { getOrgProfile, saveOrgProfile } from '../lib/db.js';
  import { LicenseSection } from '@codefabrik/app-shared/components';

  let form = $state({ name: '', strasse: '', plz: '', ort: '', telefon: '', email: '', verantwortlich: '' });
  let saving = $state(false);
  let saved = $state(false);

  onMount(async () => {
    const profile = await getOrgProfile();
    if (profile) {
      form = {
        name: profile.name ?? '',
        strasse: profile.strasse ?? '',
        plz: profile.plz ?? '',
        ort: profile.ort ?? '',
        telefon: profile.telefon ?? '',
        email: profile.email ?? '',
        verantwortlich: profile.verantwortlich ?? '',
      };
    }
  });

  async function handleSave(e) {
    e.preventDefault();
    saving = true;
    await saveOrgProfile(form);
    saving = false;
    saved = true;
    setTimeout(() => saved = false, 2000);
  }
</script>

<div class="page">
  <h1>Einstellungen</h1>

  <section>
    <h2>Beraterprofil</h2>
    <p class="hint">Wird als Briefkopf auf Beratungsprotokollen angezeigt.</p>

    <form onsubmit={handleSave}>
      <div class="field">
        <label for="name">Buero / Firma</label>
        <input id="name" bind:value={form.name} placeholder="z.B. Mustermann Finanzberatung" />
      </div>
      <div class="row">
        <div class="field">
          <label for="strasse">Strasse</label>
          <input id="strasse" bind:value={form.strasse} />
        </div>
        <div class="field small">
          <label for="plz">PLZ</label>
          <input id="plz" bind:value={form.plz} />
        </div>
        <div class="field">
          <label for="ort">Ort</label>
          <input id="ort" bind:value={form.ort} />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="telefon">Telefon</label>
          <input id="telefon" bind:value={form.telefon} />
        </div>
        <div class="field">
          <label for="email">E-Mail</label>
          <input id="email" bind:value={form.email} />
        </div>
      </div>
      <div class="field">
        <label for="verantwortlich">Berater / Verantwortlich</label>
        <input id="verantwortlich" bind:value={form.verantwortlich} placeholder="z.B. Max Mustermann, Versicherungsmakler" />
      </div>

      <div class="actions">
        <button type="submit" class="btn-primary" disabled={saving}>
          {saving ? 'Speichere...' : 'Profil speichern'}
        </button>
        {#if saved}
          <span class="saved">Gespeichert</span>
        {/if}
      </div>
    </form>
  </section>

  <section>
    <h2>Supportvertrag</h2>
    <LicenseSection />
  </section>
</div>

<style>
  .page { max-width: 700px; display: flex; flex-direction: column; gap: 2rem; }
  section { display: flex; flex-direction: column; gap: 0.75rem; }
  .hint { color: var(--color-text-muted); font-size: 0.8125rem; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; flex: 1; }
  .field.small { max-width: 100px; }
  .field label { font-weight: 600; font-size: 0.8125rem; }
  .row { display: flex; gap: 1rem; }
  input { width: 100%; }
  .actions { display: flex; gap: 0.75rem; align-items: center; }
  .saved { color: var(--color-success); font-size: 0.875rem; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
</style>
