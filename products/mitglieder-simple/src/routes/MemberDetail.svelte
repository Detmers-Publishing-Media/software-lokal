<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { members } from '../lib/stores/members.js';
  import { getMember, deleteMember, getMembers, getPaymentsByMember, savePayment, deletePayment } from '../lib/db.js';
  import { PAYMENT_METHOD_OPTIONS } from '../lib/types.js';

  let { memberId } = $props();
  let member = $state(null);
  let payments = $state([]);
  let showPayForm = $state(false);
  let payAmount = $state(0);
  let payDate = $state(new Date().toISOString().split('T')[0]);
  let payMethod = $state('ueberweisung');
  let payNotes = $state('');
  let payYear = $state(new Date().getFullYear());
  let paySaving = $state(false);

  const consentFields = [
    { key: 'consent_phone', label: 'Telefon' },
    { key: 'consent_email', label: 'E-Mail' },
    { key: 'consent_photo_internal', label: 'Foto intern' },
    { key: 'consent_photo_public', label: 'Foto oeffentl.' },
  ];

  onMount(async () => {
    member = await getMember(memberId);
    payments = await getPaymentsByMember(memberId);
  });

  async function handleDelete() {
    if (!confirm(`Mitglied ${member.first_name} ${member.last_name} wirklich loeschen? (DSGVO)`)) return;
    await deleteMember(memberId);
    members.set(await getMembers());
    currentView.set('list');
  }

  async function handlePaySave() {
    paySaving = true;
    await savePayment({
      member_id: memberId,
      year: payYear,
      amount_cents: Math.round(payAmount * 100),
      paid_date: payDate,
      payment_method: payMethod,
      notes: payNotes || null,
    });
    payments = await getPaymentsByMember(memberId);
    showPayForm = false;
    paySaving = false;
  }

  async function handlePayDelete(paymentId) {
    if (!confirm('Zahlung wirklich loeschen?')) return;
    await deletePayment(paymentId);
    payments = await getPaymentsByMember(memberId);
  }

  function formatCents(cents) {
    return (cents / 100).toFixed(2);
  }
</script>

{#if member}
  <div class="detail">
    <div class="header">
      <h1>{member.first_name} {member.last_name}</h1>
      <div class="actions">
        <button class="btn-secondary" onclick={() => currentView.set(`edit:${memberId}`)}>Bearbeiten</button>
        <button class="btn-danger" onclick={handleDelete}>Loeschen</button>
        <button class="btn-secondary" onclick={() => currentView.set('list')}>Zurueck</button>
      </div>
    </div>

    <div class="info-grid">
      <div class="field"><span class="label">Mitgliedsnr.</span><span>{member.member_number}</span></div>
      <div class="field"><span class="label">Status</span><span class="badge badge-{member.status}">{member.status}</span></div>
      <div class="field"><span class="label">Eintritt</span><span>{member.entry_date}</span></div>
      {#if member.exit_date}
        <div class="field"><span class="label">Austritt</span><span>{member.exit_date}</span></div>
        <div class="field"><span class="label">Austrittsgrund</span><span>{member.exit_reason ?? '-'}</span></div>
      {/if}
      <div class="field"><span class="label">Strasse</span><span>{member.street ?? '-'}</span></div>
      <div class="field"><span class="label">PLZ / Ort</span><span>{member.zip ?? ''} {member.city ?? '-'}</span></div>
      <div class="field"><span class="label">Telefon</span><span>{member.phone ?? '-'}</span></div>
      <div class="field"><span class="label">E-Mail</span><span>{member.email ?? '-'}</span></div>
      <div class="field"><span class="label">Geburtsdatum</span><span>{member.birth_date ?? '-'}</span></div>
      {#if member.notes}
        <div class="field full"><span class="label">Notizen</span><span>{member.notes}</span></div>
      {/if}
    </div>

    <div class="consent-section">
      <span class="label">DSGVO-Einwilligungen</span>
      <div class="consent-badges">
        {#each consentFields as cf}
          <span class="consent-badge" class:consent-yes={!!member[cf.key]} class:consent-no={!member[cf.key]}
            title={member[cf.key] ? `Erteilt am ${member[cf.key]}` : 'Nicht erteilt'}>
            {cf.label}
          </span>
        {/each}
      </div>
    </div>

    <div class="payments-section">
      <div class="section-header">
        <span class="label">Beitraege</span>
        <button class="btn-small" onclick={() => { showPayForm = !showPayForm; payAmount = 0; payNotes = ''; }}>
          {showPayForm ? 'Abbrechen' : 'Zahlung erfassen'}
        </button>
      </div>
      {#if showPayForm}
        <form class="pay-form" onsubmit={e => { e.preventDefault(); handlePaySave(); }}>
          <div class="pay-row">
            <label>Jahr <input type="number" bind:value={payYear} min="2020" max="2099" /></label>
            <label>Betrag (EUR) <input type="number" step="0.01" min="0" bind:value={payAmount} required /></label>
          </div>
          <div class="pay-row">
            <label>Datum <input type="date" bind:value={payDate} required /></label>
            <label>Art
              <select bind:value={payMethod}>
                {#each PAYMENT_METHOD_OPTIONS as opt}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            </label>
          </div>
          <label>Notiz <input type="text" bind:value={payNotes} placeholder="Optional" /></label>
          <button type="submit" class="btn-primary" disabled={paySaving}>{paySaving ? 'Speichern...' : 'Speichern'}</button>
        </form>
      {/if}
      {#if payments.length > 0}
        <table class="pay-table">
          <thead>
            <tr><th>Jahr</th><th>Betrag</th><th>Datum</th><th>Art</th><th></th></tr>
          </thead>
          <tbody>
            {#each payments as p}
              <tr>
                <td>{p.year}</td>
                <td>{formatCents(p.amount_cents)} EUR</td>
                <td>{p.paid_date}</td>
                <td>{p.payment_method === 'bar' ? 'Bar' : 'Ueberweisung'}</td>
                <td><button class="btn-danger-small" onclick={() => handlePayDelete(p.id)}>Loeschen</button></td>
              </tr>
            {/each}
          </tbody>
        </table>
      {:else}
        <p class="no-payments">Keine Zahlungen erfasst.</p>
      {/if}
    </div>
  </div>
{:else}
  <p>Mitglied wird geladen...</p>
{/if}

<style>
  .detail { max-width: 700px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .actions { display: flex; gap: 0.5rem; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.25rem; }
  .field.full { grid-column: span 2; }
  .label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .badge { padding: 0.125rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; }
  .badge-aktiv { background: #c6f6d5; color: #22543d; }
  .badge-passiv { background: #fefcbf; color: #744210; }
  .badge-ausgetreten { background: #fed7d7; color: #742a2a; }
  .badge-verstorben { background: #e2e8f0; color: #4a5568; }
  .btn-secondary { padding: 0.5rem 1rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  .btn-danger { padding: 0.5rem 1rem; background: var(--color-danger); color: white; border: none; border-radius: 0.375rem; }
  .btn-danger:hover { opacity: 0.9; }
  .consent-section { margin-top: 1.5rem; }
  .consent-badges { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; }
  .consent-badge { padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 500; }
  .consent-yes { background: #c6f6d5; color: #22543d; }
  .consent-no { background: #e2e8f0; color: #718096; }
  .payments-section { margin-top: 1.5rem; border-top: 1px solid var(--color-border); padding-top: 1rem; }
  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-primary); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-danger-small { padding: 0.125rem 0.375rem; font-size: 0.7rem; background: var(--color-danger); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
  .pay-form { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .pay-form label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8125rem; color: var(--color-text-muted); flex: 1; }
  .pay-form input, .pay-form select { padding: 0.375rem 0.5rem; border: 1px solid var(--color-border); border-radius: 0.25rem; }
  .pay-row { display: flex; gap: 0.75rem; }
  .pay-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
  .pay-table th, .pay-table td { padding: 0.375rem 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; font-size: 0.8125rem; }
  .pay-table th { font-weight: 600; font-size: 0.75rem; color: var(--color-text-muted); }
  .no-payments { color: var(--color-text-muted); font-size: 0.8125rem; }
</style>
