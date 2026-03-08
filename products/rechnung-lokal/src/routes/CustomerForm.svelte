<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getModels } from '../lib/db.js';
  import { PageHeader, FormRow } from '@codefabrik/ui-shared/components';

  let { customerId = null } = $props();

  let company = $state('');
  let firstName = $state('');
  let lastName = $state('');
  let street = $state('');
  let zip = $state('');
  let city = $state('');
  let email = $state('');
  let phone = $state('');
  let vatId = $state('');
  let isB2b = $state(false);
  let notes = $state('');
  let saving = $state(false);

  onMount(async () => {
    if (customerId) {
      const { person } = getModels();
      const c = await person.getById(customerId);
      if (c) {
        company = c.company ?? '';
        firstName = c.first_name ?? '';
        lastName = c.last_name ?? '';
        street = c.street ?? '';
        zip = c.zip ?? '';
        city = c.city ?? '';
        email = c.email ?? '';
        phone = c.phone ?? '';
        vatId = c.vat_id ?? '';
        isB2b = !!c.is_b2b;
        notes = c.notes ?? '';
      }
    }
  });

  async function save() {
    saving = true;
    try {
      const { person } = getModels();
      await person.save({
        id: customerId, type: 'customer',
        company, first_name: firstName, last_name: lastName,
        street, zip, city, email, phone,
        vat_id: vatId, is_b2b: isB2b, notes,
      });
      currentView.set('customers');
    } finally {
      saving = false;
    }
  }
</script>

<div class="content">
  <PageHeader title={customerId ? 'Kunde bearbeiten' : 'Neuer Kunde'} />

  <form onsubmit={e => { e.preventDefault(); save(); }}>
    <label>Firma <input type="text" bind:value={company} placeholder="optional" /></label>
    <FormRow>
      <label>Vorname <input type="text" bind:value={firstName} /></label>
      <label>Nachname <input type="text" bind:value={lastName} required /></label>
    </FormRow>
    <label>Straße <input type="text" bind:value={street} /></label>
    <FormRow>
      <label>PLZ <input type="text" bind:value={zip} /></label>
      <label>Ort <input type="text" bind:value={city} /></label>
    </FormRow>
    <FormRow>
      <label>E-Mail <input type="email" bind:value={email} /></label>
      <label>Telefon <input type="tel" bind:value={phone} /></label>
    </FormRow>
    <FormRow>
      <label>USt-IdNr. <input type="text" bind:value={vatId} placeholder="DE..." /></label>
      <label class="checkbox"><input type="checkbox" bind:checked={isB2b} /> Geschäftskunde (B2B)</label>
    </FormRow>
    <label>Notizen <textarea bind:value={notes} rows="2"></textarea></label>

    <div class="form-actions">
      <button type="button" onclick={() => currentView.set('customers')}>Abbrechen</button>
      <button type="submit" class="primary" disabled={saving}>Speichern</button>
    </div>
  </form>
</div>
