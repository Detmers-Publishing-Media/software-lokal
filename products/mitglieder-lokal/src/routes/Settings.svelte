<script>
  import { onMount } from 'svelte';
  import { getFeeClasses, saveFeeClass, getClubProfile, saveClubProfile } from '../lib/db.js';
  import { LicenseSection } from '@codefabrik/app-shared/components';

  let feeClasses = $state([]);
  let newClass = $state({ name: '', amount_cents: 0, interval: 'jaehrlich' });
  let saving = $state(false);

  let profile = $state({
    name: '', street: '', zip: '', city: '',
    register_court: '', register_number: '', tax_id: '',
    iban: '', bic: '', bank_name: '',
    contact_email: '', contact_phone: '', chairman: '', logo_path: '',
  });
  let profileSaving = $state(false);
  let profileMsg = $state('');
  let logoPreview = $state('');

  onMount(async () => {
    feeClasses = await getFeeClasses();
    const p = await getClubProfile();
    if (p) profile = { ...profile, ...p };
    if (profile.logo_path) logoPreview = profile.logo_path;
  });

  async function handleProfileSave() {
    profileSaving = true;
    profileMsg = '';
    try {
      await saveClubProfile(profile);
      profileMsg = 'Gespeichert';
      setTimeout(() => profileMsg = '', 2000);
    } finally {
      profileSaving = false;
    }
  }

  async function handleLogoSelect() {
    try {
      const selected = await window.electronAPI.dialog.openFile({
        filters: [{ name: 'Bilder', extensions: ['png', 'jpg', 'jpeg', 'svg'] }],
      });
      if (selected) {
        const fileName = selected.split(/[/\\]/).pop();
        const dest = await window.electronAPI.fs.copyFile(selected, 'logos', fileName);
        profile.logo_path = dest;
        logoPreview = dest;
      }
    } catch (err) {
      console.error('Logo-Auswahl fehlgeschlagen:', err);
    }
  }

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
    <h2>Vereinsprofil</h2>
    <form onsubmit={e => { e.preventDefault(); handleProfileSave(); }}>
      <div class="row">
        <label>Vereinsname *<input bind:value={profile.name} placeholder="z.B. Turnverein 1880 e.V." /></label>
      </div>
      <div class="row">
        <label>Strasse<input bind:value={profile.street} /></label>
      </div>
      <div class="row">
        <label>PLZ<input bind:value={profile.zip} maxlength="5" /></label>
        <label>Ort<input bind:value={profile.city} /></label>
      </div>
      <div class="row">
        <label>Registergericht<input bind:value={profile.register_court} placeholder="Amtsgericht..." /></label>
        <label>VR-Nummer<input bind:value={profile.register_number} /></label>
      </div>
      <div class="row">
        <label>Steuer-Nr.<input bind:value={profile.tax_id} /></label>
        <label>Vorsitzende/r<input bind:value={profile.chairman} /></label>
      </div>
      <div class="row">
        <label>IBAN<input bind:value={profile.iban} /></label>
        <label>BIC<input bind:value={profile.bic} /></label>
      </div>
      <div class="row">
        <label>Bankname<input bind:value={profile.bank_name} /></label>
      </div>
      <div class="row">
        <label>E-Mail<input bind:value={profile.contact_email} type="email" /></label>
        <label>Telefon<input bind:value={profile.contact_phone} type="tel" /></label>
      </div>
      <div class="row logo-row">
        <label>Logo
          <div class="logo-upload">
            <button type="button" class="btn-secondary" onclick={handleLogoSelect}>Datei waehlen...</button>
            {#if logoPreview}
              <img src={logoPreview} alt="Logo-Vorschau" class="logo-preview" />
            {/if}
          </div>
        </label>
      </div>
      <div class="profile-actions">
        <button type="submit" class="btn-primary" disabled={profileSaving}>
          {profileSaving ? 'Speichern...' : 'Profil speichern'}
        </button>
        {#if profileMsg}
          <span class="save-msg">{profileMsg}</span>
        {/if}
      </div>
    </form>
  </section>

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

  <LicenseSection />

  <section class="about">
    <h2>Ueber Mitglieder Lokal</h2>
    <p>Version 0.5.0</p>
    <p>Detmers Publishing &amp; Media</p>
    <p>Lizenz: GPL-3.0</p>
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
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary { padding: 0.375rem 0.75rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; font-size: 0.8125rem; }
  .logo-upload { display: flex; align-items: center; gap: 0.75rem; }
  .logo-preview { max-height: 48px; max-width: 120px; object-fit: contain; border: 1px solid var(--color-border); border-radius: 0.25rem; }
  .profile-actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; }
  .save-msg { color: var(--color-success); font-size: 0.875rem; }
</style>
