<script>
  import { getModels } from '../lib/db.js';

  let { oncomplete } = $props();

  let step = $state(1);
  const totalSteps = 3;

  let saving = $state(false);

  // Step 1: Geschaeftsprofil
  let profile = $state({
    name: '', street: '', zip: '', city: '',
    tax_id: '', representative: '',
    is_small_business: false, invoice_prefix: 'RE',
  });

  // Step 2: Bankverbindung
  let bank = $state({ iban: '', bic: '', bank_name: '' });

  // Step 3: Erster Kunde
  let customer = $state({ first_name: '', last_name: '', company: '' });

  async function handleNext() {
    const models = getModels();

    if (step === 1) {
      if (profile.name.trim()) {
        await models.profile.save(profile);
      }
      step = 2;
    } else if (step === 2) {
      if (bank.iban.trim()) {
        const current = await models.profile.get() || {};
        await models.profile.save({ ...current, ...bank });
      }
      step = 3;
    } else if (step === 3) {
      if (customer.last_name.trim() || customer.company.trim()) {
        saving = true;
        await models.person.save({
          first_name: customer.first_name.trim(),
          last_name: customer.last_name.trim(),
          company: customer.company.trim() || null,
        });
        saving = false;
      }
      oncomplete();
    }
  }

  function handleSkip() {
    if (step < totalSteps) {
      step++;
    } else {
      oncomplete();
    }
  }

  function handleSkipAll() {
    oncomplete();
  }
</script>

<div class="wizard-backdrop">
  <div class="wizard">
    <div class="wizard-header">
      <h1>Willkommen bei Rechnung Lokal</h1>
      <p class="subtitle">Richten Sie die App in wenigen Schritten ein.</p>
      <div class="progress">
        <div class="progress-bar" style="width: {(step / totalSteps) * 100}%"></div>
      </div>
      <span class="step-label">Schritt {step} von {totalSteps}</span>
    </div>

    <div class="wizard-body">
      {#if step === 1}
        <h2>Ihr Unternehmen</h2>
        <p class="hint">Diese Daten erscheinen auf Ihren Rechnungen.</p>
        <div class="fields">
          <div class="field">
            <label for="wiz-name">Firmenname / Name *</label>
            <input id="wiz-name" bind:value={profile.name} placeholder="Ihr Firmenname" />
          </div>
          <div class="row">
            <div class="field">
              <label for="wiz-street">Strasse</label>
              <input id="wiz-street" bind:value={profile.street} />
            </div>
            <div class="field small">
              <label for="wiz-zip">PLZ</label>
              <input id="wiz-zip" bind:value={profile.zip} />
            </div>
            <div class="field">
              <label for="wiz-city">Ort</label>
              <input id="wiz-city" bind:value={profile.city} />
            </div>
          </div>
          <div class="field">
            <label for="wiz-taxid">Steuernummer</label>
            <input id="wiz-taxid" bind:value={profile.tax_id} placeholder="z.B. 12/345/67890" />
          </div>
          <div class="field">
            <label for="wiz-rep">Inhaber / Vertreter</label>
            <input id="wiz-rep" bind:value={profile.representative} />
          </div>
          <label class="checkbox-label">
            <input type="checkbox" bind:checked={profile.is_small_business} />
            Kleinunternehmer nach §19 UStG
          </label>
        </div>

      {:else if step === 2}
        <h2>Bankverbindung</h2>
        <p class="hint">Erscheint auf Ihren Rechnungen fuer die Zahlungsanweisung.</p>
        <div class="fields">
          <div class="field">
            <label for="wiz-iban">IBAN</label>
            <input id="wiz-iban" bind:value={bank.iban} placeholder="DE..." />
          </div>
          <div class="row">
            <div class="field">
              <label for="wiz-bic">BIC</label>
              <input id="wiz-bic" bind:value={bank.bic} />
            </div>
            <div class="field">
              <label for="wiz-bank">Bankname</label>
              <input id="wiz-bank" bind:value={bank.bank_name} />
            </div>
          </div>
        </div>

      {:else if step === 3}
        <h2>Erster Kunde</h2>
        <p class="hint">Legen Sie Ihren ersten Kunden an. Weitere koennen Sie spaeter hinzufuegen.</p>
        <div class="fields">
          <div class="field">
            <label for="wiz-company">Firma</label>
            <input id="wiz-company" bind:value={customer.company} placeholder="optional" />
          </div>
          <div class="row">
            <div class="field">
              <label for="wiz-fname">Vorname</label>
              <input id="wiz-fname" bind:value={customer.first_name} />
            </div>
            <div class="field">
              <label for="wiz-lname">Nachname *</label>
              <input id="wiz-lname" bind:value={customer.last_name} />
            </div>
          </div>
        </div>
      {/if}
    </div>

    <div class="wizard-footer">
      <button class="btn-skip" onclick={handleSkipAll}>
        Einrichtung ueberspringen
      </button>
      <div class="footer-right">
        <button class="btn-secondary" onclick={handleSkip}>
          Ueberspringen
        </button>
        <button class="btn-primary" onclick={handleNext} disabled={saving}>
          {#if saving}
            Speichere...
          {:else if step === totalSteps}
            Fertig
          {:else}
            Weiter
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .wizard-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
  }

  .wizard {
    background: white;
    border-radius: 0.75rem;
    width: 580px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .wizard-header {
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .wizard-header h1 { margin: 0; font-size: 1.25rem; }
  .subtitle { color: #888; font-size: 0.875rem; margin: 0.25rem 0 1rem; }

  .progress { height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; }
  .progress-bar { height: 100%; background: #6366f1; border-radius: 2px; transition: width 0.3s ease; }
  .step-label { font-size: 0.75rem; color: #888; margin-top: 0.25rem; display: block; }

  .wizard-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
  .wizard-body h2 { margin: 0 0 0.25rem; font-size: 1.125rem; }
  .hint { color: #888; font-size: 0.8125rem; margin: 0 0 1rem; }

  .fields { display: flex; flex-direction: column; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; flex: 1; }
  .field.small { max-width: 100px; }
  .field label { font-weight: 600; font-size: 0.8125rem; }
  .row { display: flex; gap: 1rem; }

  input[type="text"], input[type="email"], input[type="tel"] {
    width: 100%; padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db; border-radius: 0.375rem; font-size: 0.875rem;
  }
  input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }

  .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-top: 0.5rem; }

  .wizard-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-right { display: flex; gap: 0.5rem; }

  .btn-primary {
    padding: 0.5rem 1.25rem; background: #6366f1; color: white;
    border: none; border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer;
  }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    padding: 0.5rem 1rem; background: none; border: 1px solid #d1d5db;
    border-radius: 0.375rem; font-size: 0.875rem; cursor: pointer;
  }
  .btn-secondary:hover { background: #f5f5f5; }

  .btn-skip {
    padding: 0.5rem 0; background: none; border: none;
    color: #888; font-size: 0.8125rem; cursor: pointer;
  }
  .btn-skip:hover { color: #333; }
</style>
