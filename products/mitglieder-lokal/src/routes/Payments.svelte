<script>
  import { onMount } from 'svelte';
  import { currentView } from '../lib/stores/navigation.js';
  import { getAnnualOverview, savePayment, deletePayment, getPaymentsByMember } from '../lib/db.js';
  import { annualAmountCents, PAYMENT_METHOD_OPTIONS } from '../lib/types.js';
  import { generateBeitragsuebersicht } from '../lib/pdf-lists.js';
  import { getClubProfile } from '../lib/db.js';
  import { checkMemberLimit } from '../lib/license.js';

  const currentYear = new Date().getFullYear();
  let selectedYear = $state(currentYear);
  let overview = $state([]);
  let loading = $state(true);
  let profile = $state(null);
  let isProbe = $state(false);

  // Payment form
  let showForm = $state(false);
  let formMemberId = $state(null);
  let formMemberName = $state('');
  let formAmount = $state(0);
  let formDate = $state(new Date().toISOString().split('T')[0]);
  let formMethod = $state('ueberweisung');
  let formNotes = $state('');
  let saving = $state(false);

  // Payment history for selected member
  let selectedMemberId = $state(null);
  let memberPayments = $state([]);

  onMount(async () => {
    profile = await getClubProfile();
    const limit = await checkMemberLimit();
    isProbe = !limit.allowed || limit.probe === true;
    await loadOverview();
  });

  async function loadOverview() {
    loading = true;
    overview = await getAnnualOverview(selectedYear);
    loading = false;
  }

  function expectedCents(row) {
    return annualAmountCents(row.amount_cents ?? 0, row.interval ?? 'jaehrlich');
  }

  function diffCents(row) {
    return expectedCents(row) - (row.paid_cents ?? 0);
  }

  function statusOf(row) {
    const exp = expectedCents(row);
    const paid = row.paid_cents ?? 0;
    if (exp === 0) return 'befreit';
    if (paid >= exp) return 'bezahlt';
    if (paid > 0) return 'teilweise';
    return 'offen';
  }

  function formatCents(cents) {
    return (cents / 100).toFixed(2);
  }

  async function changeYear(delta) {
    selectedYear += delta;
    await loadOverview();
    selectedMemberId = null;
    memberPayments = [];
  }

  async function selectMember(row) {
    if (selectedMemberId === row.id) {
      selectedMemberId = null;
      memberPayments = [];
      return;
    }
    selectedMemberId = row.id;
    memberPayments = await getPaymentsByMember(row.id, selectedYear);
  }

  function openPaymentForm(row) {
    formMemberId = row.id;
    formMemberName = `${row.first_name} ${row.last_name}`;
    const remaining = diffCents(row);
    formAmount = remaining > 0 ? remaining / 100 : 0;
    formDate = new Date().toISOString().split('T')[0];
    formMethod = 'ueberweisung';
    formNotes = '';
    showForm = true;
  }

  async function handleSave() {
    saving = true;
    await savePayment({
      member_id: formMemberId,
      year: selectedYear,
      amount_cents: Math.round(formAmount * 100),
      paid_date: formDate,
      payment_method: formMethod,
      notes: formNotes || null,
    });
    showForm = false;
    saving = false;
    await loadOverview();
    if (selectedMemberId === formMemberId) {
      memberPayments = await getPaymentsByMember(formMemberId, selectedYear);
    }
  }

  async function handleDeletePayment(paymentId) {
    if (!confirm('Zahlung wirklich loeschen?')) return;
    await deletePayment(paymentId);
    await loadOverview();
    if (selectedMemberId) {
      memberPayments = await getPaymentsByMember(selectedMemberId, selectedYear);
    }
  }

  function handlePrint() {
    const rows = overview.map(row => ({
      ...row,
      expected_cents: expectedCents(row),
      diff_cents: diffCents(row),
      status: statusOf(row),
    }));
    generateBeitragsuebersicht(rows, profile, selectedYear, isProbe);
  }

  // Summary
  let totalExpected = $derived(overview.reduce((sum, r) => sum + expectedCents(r), 0));
  let totalPaid = $derived(overview.reduce((sum, r) => sum + (r.paid_cents ?? 0), 0));
  let totalOpen = $derived(totalExpected - totalPaid);
</script>

<div class="payments-page">
  <div class="header">
    <h1>Beitraege {selectedYear}</h1>
    <div class="year-nav">
      <button class="btn-secondary" onclick={() => changeYear(-1)}>&larr; {selectedYear - 1}</button>
      <span class="year-display">{selectedYear}</span>
      <button class="btn-secondary" onclick={() => changeYear(1)}>{selectedYear + 1} &rarr;</button>
    </div>
  </div>

  {#if loading}
    <p class="loading">Wird geladen...</p>
  {:else}
    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Gesamt-Soll</span>
        <span class="summary-value">{formatCents(totalExpected)} EUR</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Gesamt-Ist</span>
        <span class="summary-value">{formatCents(totalPaid)} EUR</span>
      </div>
      <div class="summary-item" class:summary-warn={totalOpen > 0}>
        <span class="summary-label">Gesamt-Offen</span>
        <span class="summary-value">{formatCents(totalOpen)} EUR</span>
      </div>
    </div>

    <div class="actions-row">
      <button class="btn-primary" onclick={handlePrint}>Beitragsuebersicht drucken</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>Nr.</th>
          <th>Name</th>
          <th>Beitragsklasse</th>
          <th class="num">Soll</th>
          <th class="num">Ist</th>
          <th class="num">Differenz</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each overview as row}
          <tr class:selected={selectedMemberId === row.id} onclick={() => selectMember(row)}>
            <td>{row.member_number}</td>
            <td>{row.last_name}, {row.first_name}</td>
            <td>{row.fee_class_name ?? '-'}</td>
            <td class="num">{formatCents(expectedCents(row))}</td>
            <td class="num">{formatCents(row.paid_cents ?? 0)}</td>
            <td class="num">{formatCents(diffCents(row))}</td>
            <td>
              <span class="badge badge-{statusOf(row)}">{statusOf(row)}</span>
            </td>
            <td>
              {#if expectedCents(row) > 0 && (row.paid_cents ?? 0) < expectedCents(row)}
                <button class="btn-small" onclick={(e) => { e.stopPropagation(); openPaymentForm(row); }}>Zahlung</button>
              {/if}
            </td>
          </tr>
          {#if selectedMemberId === row.id && memberPayments.length > 0}
            <tr class="detail-row">
              <td colspan="8">
                <div class="payment-history">
                  <strong>Zahlungshistorie {selectedYear}</strong>
                  <table class="inner-table">
                    <thead>
                      <tr><th>Datum</th><th>Betrag</th><th>Art</th><th>Notiz</th><th></th></tr>
                    </thead>
                    <tbody>
                      {#each memberPayments as p}
                        <tr>
                          <td>{p.paid_date}</td>
                          <td>{formatCents(p.amount_cents)} EUR</td>
                          <td>{p.payment_method === 'bar' ? 'Bar' : 'Ueberweisung'}</td>
                          <td>{p.notes ?? ''}</td>
                          <td><button class="btn-danger-small" onclick={() => handleDeletePayment(p.id)}>X</button></td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  {/if}

  {#if showForm}
    <div class="modal-overlay" onclick={() => showForm = false}>
      <div class="modal" onclick={(e) => e.stopPropagation()}>
        <h2>Zahlung erfassen</h2>
        <p class="form-member">{formMemberName} — {selectedYear}</p>
        <form onsubmit={e => { e.preventDefault(); handleSave(); }}>
          <label>Betrag (EUR)
            <input type="number" step="0.01" min="0" bind:value={formAmount} required />
          </label>
          <label>Datum
            <input type="date" bind:value={formDate} required />
          </label>
          <label>Zahlungsart
            <select bind:value={formMethod}>
              {#each PAYMENT_METHOD_OPTIONS as opt}
                <option value={opt.value}>{opt.label}</option>
              {/each}
            </select>
          </label>
          <label>Notiz
            <input type="text" bind:value={formNotes} placeholder="Optional" />
          </label>
          <div class="form-actions">
            <button type="submit" class="btn-primary" disabled={saving}>
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
            <button type="button" class="btn-secondary" onclick={() => showForm = false}>Abbrechen</button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>

<style>
  .payments-page { max-width: 900px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .year-nav { display: flex; align-items: center; gap: 0.5rem; }
  .year-display { font-weight: 600; font-size: 1.125rem; min-width: 3rem; text-align: center; }
  .loading { color: var(--color-text-muted); }

  .summary { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
  .summary-item { display: flex; flex-direction: column; padding: 0.75rem 1rem; border: 1px solid var(--color-border); border-radius: 0.5rem; min-width: 140px; }
  .summary-label { font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase; }
  .summary-value { font-size: 1.125rem; font-weight: 600; }
  .summary-warn { border-color: var(--color-danger); }
  .summary-warn .summary-value { color: var(--color-danger); }

  .actions-row { margin-bottom: 1rem; }

  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 0.5rem; border-bottom: 1px solid var(--color-border); text-align: left; font-size: 0.875rem; }
  th { font-weight: 600; font-size: 0.75rem; text-transform: uppercase; color: var(--color-text-muted); }
  .num { text-align: right; }
  tbody tr { cursor: pointer; }
  tbody tr:hover { background: var(--color-surface); }
  tr.selected { background: var(--color-surface); }
  .detail-row { cursor: default; }
  .detail-row:hover { background: none; }

  .badge { padding: 0.125rem 0.5rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 500; }
  .badge-bezahlt { background: #c6f6d5; color: #22543d; }
  .badge-teilweise { background: #fefcbf; color: #744210; }
  .badge-offen { background: #fed7d7; color: #742a2a; }
  .badge-befreit { background: #e2e8f0; color: #718096; }

  .btn-primary { padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 0.375rem; cursor: pointer; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary { padding: 0.375rem 0.75rem; background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; cursor: pointer; font-size: 0.8125rem; }
  .btn-small { padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-primary); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }
  .btn-danger-small { padding: 0.125rem 0.375rem; font-size: 0.7rem; background: var(--color-danger); color: white; border: none; border-radius: 0.25rem; cursor: pointer; }

  .payment-history { padding: 0.75rem; background: var(--color-surface); border-radius: 0.375rem; }
  .inner-table { margin-top: 0.5rem; }
  .inner-table th, .inner-table td { font-size: 0.8125rem; padding: 0.25rem 0.5rem; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal { background: white; padding: 1.5rem; border-radius: 0.5rem; min-width: 360px; max-width: 440px; }
  .modal h2 { margin-bottom: 0.5rem; }
  .form-member { color: var(--color-text-muted); margin-bottom: 1rem; font-size: 0.875rem; }
  .modal label { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; font-size: 0.8125rem; color: var(--color-text-muted); }
  .modal input, .modal select { padding: 0.375rem 0.5rem; border: 1px solid var(--color-border); border-radius: 0.25rem; font-size: 0.875rem; }
  .form-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
</style>
