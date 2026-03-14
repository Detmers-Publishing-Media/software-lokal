<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getOrgProfile, saveOrgProfile, getInspectors, saveInspector, deleteInspector } from '../lib/db.js';
  import { LicenseSection } from '@codefabrik/app-shared/components';
  import Integrity from './Integrity.svelte';

  let activeTab = $state('profile');
  let form = $state({ name: '', street: '', zip: '', city: '', contact_email: '', contact_phone: '', responsible: '' });
  let saving = $state(false);
  let saved = $state(false);

  // Inspector management
  let inspectorList = $state([]);
  let newInspector = $state({ name: '', role: '', qualification: '' });
  let savingInspector = $state(false);

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
    inspectorList = await getInspectors();

    // Wenn von aussen auf Integritaet navigiert wurde
    if ($currentView === 'integrity') activeTab = 'integrity';
  });

  $effect(() => {
    if ($currentView === 'integrity') activeTab = 'integrity';
    else if ($currentView === 'settings') activeTab = 'profile';
  });

  async function handleSave(e) {
    e.preventDefault();
    saving = true;
    await saveOrgProfile(form);
    saving = false;
    saved = true;
    setTimeout(() => saved = false, 2000);
  }

  async function handleAddInspector(e) {
    e.preventDefault();
    if (!newInspector.name.trim()) return;
    savingInspector = true;
    await saveInspector({
      name: newInspector.name.trim(),
      role: newInspector.role.trim(),
      qualification: newInspector.qualification.trim(),
    });
    inspectorList = await getInspectors();
    newInspector = { name: '', role: '', qualification: '' };
    savingInspector = false;
  }

  async function handleDeleteInspector(id) {
    await deleteInspector(id);
    inspectorList = await getInspectors();
  }
</script>

<div class="page">
  <h1>Einstellungen</h1>

  <div class="tabs">
    <button class="tab" class:active={activeTab === 'profile'} onclick={() => activeTab = 'profile'}>
      Profil & Pruefer
    </button>
    <button class="tab" class:active={activeTab === 'integrity'} onclick={() => activeTab = 'integrity'}>
      Integritaet
    </button>
  </div>

  {#if activeTab === 'profile'}
    <section>
      <h2>Organisationsprofil</h2>
      <p class="hint">Wird als Briefkopf auf Pruefprotokollen und Listen angezeigt.</p>

      <form onsubmit={handleSave}>
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
      <h2>Pruefer verwalten</h2>
      <p class="hint">Bekannte Pruefer erscheinen als Vorschlaege beim Anlegen neuer Pruefungen.</p>

      {#if inspectorList.length > 0}
        <table>
          <thead>
            <tr><th>Name</th><th>Rolle</th><th>Qualifikation</th><th></th></tr>
          </thead>
          <tbody>
            {#each inspectorList as insp}
              <tr>
                <td class="bold">{insp.name}</td>
                <td class="muted">{insp.role || '-'}</td>
                <td class="muted">{insp.qualification || '-'}</td>
                <td>
                  <button class="btn-small btn-danger" onclick={() => handleDeleteInspector(insp.id)}>Entfernen</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="empty">Noch keine Pruefer angelegt. Pruefer werden auch automatisch aus vorhandenen Pruefungen uebernommen.</p>
      {/if}

      <form class="inline-form" onsubmit={handleAddInspector}>
        <input bind:value={newInspector.name} placeholder="Name *" required />
        <input bind:value={newInspector.role} placeholder="Rolle (optional)" />
        <input bind:value={newInspector.qualification} placeholder="Qualifikation (optional)" />
        <button type="submit" class="btn-primary" disabled={savingInspector}>Hinzufuegen</button>
      </form>
    </section>

    <section>
      <h2>Supportvertrag</h2>
      <LicenseSection />
    </section>
  {:else if activeTab === 'integrity'}
    <Integrity embedded={true} />
  {/if}
</div>

<style>
  .page { max-width: 700px; display: flex; flex-direction: column; gap: 1.5rem; }

  .tabs {
    display: flex;
    gap: 0;
    border-bottom: 2px solid var(--color-border);
  }

  .tab {
    padding: 0.5rem 1rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    color: var(--color-text-muted);
    font-size: 0.875rem;
    cursor: pointer;
  }

  .tab:hover { color: var(--color-text); }
  .tab.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    font-weight: 600;
  }

  section { display: flex; flex-direction: column; gap: 0.75rem; }
  .hint { color: var(--color-text-muted); font-size: 0.8125rem; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; flex: 1; }
  .field.small { max-width: 100px; }
  .field label { font-weight: 600; font-size: 0.8125rem; }
  .row { display: flex; gap: 1rem; }
  input { width: 100%; }
  .actions { display: flex; gap: 0.75rem; align-items: center; }
  .saved { color: var(--color-success); font-size: 0.875rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; }
  th { background: var(--color-surface); font-weight: 600; font-size: 0.8125rem; }
  .bold { font-weight: 600; }
  .muted { color: var(--color-text-muted); font-size: 0.8125rem; }
  .empty { color: var(--color-text-muted); font-style: italic; font-size: 0.875rem; }
  .inline-form { display: flex; gap: 0.5rem; align-items: center; }
  .inline-form input { flex: 1; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; }
  .btn-danger { background: var(--color-danger); color: white; border: none; }
</style>
