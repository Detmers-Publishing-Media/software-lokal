<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { members } from '../lib/stores/members.js';
  import { getMember, saveMember, getFeeClasses, getMembers } from '../lib/db.js';
  import { STATUS_OPTIONS } from '../lib/types.js';
  let { memberId = null } = $props();

  const today = new Date().toISOString().split('T')[0];

  let form = $state({
    first_name: '', last_name: '', street: '', zip: '', city: '',
    phone: '', email: '', birth_date: '', entry_date: today,
    exit_date: '', exit_reason: '', status: 'aktiv', fee_class_id: 1, notes: '',
    consent_phone: null, consent_email: null,
    consent_photo_internal: null, consent_photo_public: null,
    consent_withdrawn_at: null,
  });

  let feeClasses = $state([]);
  let saving = $state(false);
  let isEdit = $derived(memberId != null);

  onMount(async () => {
    feeClasses = await getFeeClasses();
    if (memberId) {
      const member = await getMember(memberId);
      if (member) {
        form = { ...form, ...member };
      }
    }
  });

  function toggleConsent(field) {
    form[field] = form[field] ? null : today;
  }

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) return;

    saving = true;
    try {
      await saveMember(memberId ? { ...form, id: memberId } : form);
      members.set(await getMembers());
      currentView.set('list');
    } finally {
      saving = false;
    }
  }
</script>

<div class="member-form">
  <div class="header">
    <h1>{isEdit ? 'Mitglied bearbeiten' : 'Neues Mitglied'}</h1>
    <button class="btn-secondary" onclick={() => currentView.set('list')}>Abbrechen</button>
  </div>

  <form onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
    <fieldset>
      <legend>Persoenliche Daten</legend>
      <div class="row">
        <label>Vorname *<input bind:value={form.first_name} required /></label>
        <label>Nachname *<input bind:value={form.last_name} required /></label>
      </div>
      <div class="row">
        <label>Strasse<input bind:value={form.street} /></label>
      </div>
      <div class="row">
        <label>PLZ<input bind:value={form.zip} maxlength="5" /></label>
        <label>Ort<input bind:value={form.city} /></label>
      </div>
      <div class="row">
        <label>Telefon<input bind:value={form.phone} type="tel" /></label>
        <label>E-Mail<input bind:value={form.email} type="email" /></label>
      </div>
      <div class="row">
        <label>Geburtsdatum<input bind:value={form.birth_date} type="date" /></label>
      </div>
    </fieldset>

    <fieldset>
      <legend>Mitgliedschaft</legend>
      <div class="row">
        <label>Eintrittsdatum *<input bind:value={form.entry_date} type="date" required /></label>
        <label>Status
          <select bind:value={form.status}>
            {#each STATUS_OPTIONS as opt}
              <option value={opt.value}>{opt.label}</option>
            {/each}
          </select>
        </label>
      </div>
      <div class="row">
        <label>Beitragsklasse
          <select bind:value={form.fee_class_id}>
            {#each feeClasses as fc}
              <option value={fc.id}>{fc.name} ({(fc.amount_cents / 100).toFixed(2)} EUR/{fc.interval})</option>
            {/each}
          </select>
        </label>
      </div>
      {#if form.status === 'ausgetreten' || form.status === 'verstorben'}
        <div class="row">
          <label>Austrittsdatum<input bind:value={form.exit_date} type="date" /></label>
          <label>Austrittsgrund<input bind:value={form.exit_reason} /></label>
        </div>
      {/if}
    </fieldset>

    <fieldset>
      <legend>DSGVO-Einwilligungen</legend>
      <div class="consent-grid">
        <div class="consent-item">
          <label class="consent-label">
            <input type="checkbox" checked={!!form.consent_phone} onchange={() => toggleConsent('consent_phone')} />
            Telefon
          </label>
          {#if form.consent_phone}
            <input type="date" bind:value={form.consent_phone} class="consent-date" />
          {/if}
        </div>
        <div class="consent-item">
          <label class="consent-label">
            <input type="checkbox" checked={!!form.consent_email} onchange={() => toggleConsent('consent_email')} />
            E-Mail
          </label>
          {#if form.consent_email}
            <input type="date" bind:value={form.consent_email} class="consent-date" />
          {/if}
        </div>
        <div class="consent-item">
          <label class="consent-label">
            <input type="checkbox" checked={!!form.consent_photo_internal} onchange={() => toggleConsent('consent_photo_internal')} />
            Foto intern
          </label>
          {#if form.consent_photo_internal}
            <input type="date" bind:value={form.consent_photo_internal} class="consent-date" />
          {/if}
        </div>
        <div class="consent-item">
          <label class="consent-label">
            <input type="checkbox" checked={!!form.consent_photo_public} onchange={() => toggleConsent('consent_photo_public')} />
            Foto oeffentlich
          </label>
          {#if form.consent_photo_public}
            <input type="date" bind:value={form.consent_photo_public} class="consent-date" />
          {/if}
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Notizen</legend>
      <textarea bind:value={form.notes} rows="3"></textarea>
    </fieldset>

    <div class="actions">
      <button type="submit" class="btn-primary" disabled={saving}>
        {saving ? 'Speichern...' : 'Speichern'}
      </button>
    </div>
  </form>
</div>

<style>
  .member-form { max-width: 700px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  fieldset { border: 1px solid var(--color-border); border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
  legend { font-weight: 600; padding: 0 0.5rem; }
  .row { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
  label { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; font-size: 0.8125rem; color: var(--color-text-muted); }
  textarea { width: 100%; }
  .actions { display: flex; gap: 0.75rem; }
  .btn-primary { padding: 0.5rem 1.5rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; font-weight: 500; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  .limit-box { background: #fff3cd; border: 1px solid #ffc107; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; }
  .limit-box strong { color: #856404; }
  .limit-box p { margin: 0.5rem 0 0; font-size: 0.875rem; color: #856404; }
  .consent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .consent-item { display: flex; flex-direction: column; gap: 0.25rem; }
  .consent-label { display: flex; flex-direction: row; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text); cursor: pointer; }
  .consent-label input[type="checkbox"] { width: auto; margin: 0; }
  .consent-date { font-size: 0.8125rem; padding: 0.25rem 0.5rem; width: auto; }
</style>
