<script>
  import { onMount } from 'svelte';
  import { getModels } from '../lib/db.js';
  import { PageHeader, FormSection, FormRow } from '@codefabrik/ui-shared/components';

  let name = $state('');
  let street = $state('');
  let zip = $state('');
  let city = $state('');
  let taxId = $state('');
  let vatId = $state('');
  let iban = $state('');
  let bic = $state('');
  let bankName = $state('');
  let contactEmail = $state('');
  let contactPhone = $state('');
  let representative = $state('');
  let isSmallBusiness = $state(false);
  let defaultTaxRate = $state(1900);
  let invoicePrefix = $state('RE');
  let numberMode = $state('yearly');
  let saved = $state(false);
  let saving = $state(false);

  onMount(async () => {
    const { profile } = getModels();
    const p = await profile.get();
    if (p) {
      name = p.name ?? '';
      street = p.street ?? '';
      zip = p.zip ?? '';
      city = p.city ?? '';
      taxId = p.tax_id ?? '';
      vatId = p.vat_id ?? '';
      iban = p.iban ?? '';
      bic = p.bic ?? '';
      bankName = p.bank_name ?? '';
      contactEmail = p.contact_email ?? '';
      contactPhone = p.contact_phone ?? '';
      representative = p.representative ?? '';
      isSmallBusiness = !!p.is_small_business;
      defaultTaxRate = p.default_tax_rate ?? 1900;
      invoicePrefix = p.invoice_prefix ?? 'RE';
      numberMode = p.invoice_number_mode ?? 'yearly';
    }
  });

  async function save() {
    saving = true;
    try {
      const { profile } = getModels();
      await profile.save({
        name, street, zip, city, tax_id: taxId, vat_id: vatId,
        iban, bic, bank_name: bankName,
        contact_email: contactEmail, contact_phone: contactPhone,
        representative,
        is_small_business: isSmallBusiness, default_tax_rate: defaultTaxRate,
        invoice_prefix: invoicePrefix,
        invoice_number_mode: numberMode,
      });
      saved = true;
      setTimeout(() => saved = false, 2000);
    } finally {
      saving = false;
    }
  }
</script>

<div class="content">
  <PageHeader title="Geschaeftsprofil" />
  <p class="hint">Diese Daten erscheinen auf Ihren Rechnungen.</p>

  <form onsubmit={e => { e.preventDefault(); save(); }}>
    <FormSection title="Unternehmen">
      <label>Firmenname / Name <input type="text" bind:value={name} required /></label>
      <label>Strasse <input type="text" bind:value={street} /></label>
      <FormRow>
        <label>PLZ <input type="text" bind:value={zip} /></label>
        <label>Ort <input type="text" bind:value={city} /></label>
      </FormRow>
      <label>Inhaber / Vertreter <input type="text" bind:value={representative} /></label>
    </FormSection>

    <FormSection title="Steuer">
      <label>Steuernummer <input type="text" bind:value={taxId} placeholder="z.B. 12/345/67890" /></label>
      <label>USt-IdNr. <input type="text" bind:value={vatId} placeholder="DE..." /></label>
      <label class="checkbox"><input type="checkbox" bind:checked={isSmallBusiness} /> Kleinunternehmer nach §19 UStG</label>
      {#if !isSmallBusiness}
        <label>Standard-Steuersatz (in 1/100 %)
          <select bind:value={defaultTaxRate}>
            <option value={1900}>19 %</option>
            <option value={700}>7 %</option>
            <option value={0}>0 %</option>
          </select>
        </label>
      {/if}
    </FormSection>

    <FormSection title="Bankverbindung">
      <label>IBAN <input type="text" bind:value={iban} /></label>
      <FormRow>
        <label>BIC <input type="text" bind:value={bic} /></label>
        <label>Bankname <input type="text" bind:value={bankName} /></label>
      </FormRow>
    </FormSection>

    <FormSection title="Kontakt">
      <FormRow>
        <label>E-Mail <input type="email" bind:value={contactEmail} /></label>
        <label>Telefon <input type="tel" bind:value={contactPhone} /></label>
      </FormRow>
    </FormSection>

    <FormSection title="Rechnungsnummern">
      <FormRow>
        <label>Prefix <input type="text" bind:value={invoicePrefix} placeholder="RE" /></label>
        <label>Nummerierung
          <select bind:value={numberMode}>
            <option value="yearly">Jaehrlich neu (RE-2026-0001)</option>
            <option value="continuous">Fortlaufend (RE-2026-0042)</option>
          </select>
        </label>
      </FormRow>
    </FormSection>

    <div class="form-actions">
      <button type="submit" class="primary" disabled={saving}>Speichern</button>
      {#if saved}<span class="saved-hint">Gespeichert</span>{/if}
    </div>
  </form>
</div>
