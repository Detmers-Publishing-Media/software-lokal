<script>
  import { onMount } from 'svelte';
  import { getOrgProfile, saveOrgProfile } from '../lib/db.js';
  import { LicenseSection } from '@codefabrik/app-shared/components';

  let form = $state({ name: '', street: '', zip: '', city: '', contact_email: '', contact_phone: '', responsible: '' });
  let saving = $state(false);
  let saved = $state(false);

  onMount(async () => {
    const profile = await getOrgProfile();
    if (profile) {
      form = {
        name: profile.name ?? '',
        street: profile.street ?? '',
        zip: profile.zip ?? '',
        city: profile.city ?? '',
        contact_email: profile.contact_email ?? '',
        contact_phone: profile.contact_phone ?? '',
        responsible: profile.responsible ?? '',
      };
    }
  });

  async function handleSave() {
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
    <h2>Organisationsprofil</h2>
    <p class="hint">Wird als Briefkopf auf Pruefprotokollen und Listen angezeigt.</p>

    <form onsubmit|preventDefault={handleSave}>
      <div class="field">
        <label for="name">Organisation</label>
        <input id="name" bind:value={form.name} placeholder="Name der Organisation" />
      </div>
      <div class="row">
        <div class="field">
          <label for="street">Strasse</label>
          <input id="street" bind:value={form.street} />
        </div>
        <div class="field small">
          <label for="zip">PLZ</label>
          <input id="zip" bind:value={form.zip} />
        </div>
        <div class="field">
          <label for="city">Ort</label>
          <input id="city" bind:value={form.city} />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="email">E-Mail</label>
          <input id="email" bind:value={form.contact_email} />
        </div>
        <div class="field">
          <label for="phone">Telefon</label>
          <input id="phone" bind:value={form.contact_phone} />
        </div>
      </div>
      <div class="field">
        <label for="responsible">Verantwortliche Person</label>
        <input id="responsible" bind:value={form.responsible} placeholder="z.B. Max Mustermann, Sicherheitsbeauftragter" />
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
