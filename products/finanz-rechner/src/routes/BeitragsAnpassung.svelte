<script>
  import { calcBeitragsAnpassung } from '../lib/calculators.js';
  import { canExportPdf } from '../lib/license.js';

  let oldPremium = $state('');
  let newPremium = $state('');
  let result = $state(null);

  function berechnen() {
    const old = parseFloat(oldPremium);
    const neu = parseFloat(newPremium);
    if (isNaN(old) || isNaN(neu) || old < 0 || neu < 0) return;
    result = calcBeitragsAnpassung({ oldPremium: old, newPremium: neu });
  }

  function exportPdf() {
    if (!canExportPdf() || !result) return;
    import('../lib/pdf.js').then(({ generateCalculatorPdf }) => {
      generateCalculatorPdf(
        'BeitragsAnpassungsRechner',
        [
          { label: 'Alter Beitrag', value: `${oldPremium} EUR/Jahr` },
          { label: 'Neuer Beitrag', value: `${newPremium} EUR/Jahr` },
        ],
        [
          { label: 'Differenz', value: `${result.diffAbsolute.toFixed(2)} EUR/Jahr` },
          { label: 'Erhoehung', value: `${result.diffPercent.toFixed(1)} %` },
          { label: 'Mehrkosten 5 Jahre', value: `${result.fiveYearCost.toFixed(2)} EUR` },
          { label: 'Sonderkuendigungsrecht', value: result.sonderkuendigung ? 'Ja (> 10%)' : 'Nein' },
        ],
        'Dieser Rechner addiert Beitragsunterschiede. Er empfiehlt keine Handlung. Die Entscheidung ob ein Wechsel sinnvoll ist liegt beim Berater.',
      );
    });
  }
</script>

<div class="calculator">
  <h1>BeitragsAnpassungsRechner</h1>
  <p class="subtitle">Praemienvergleich bei Beitragsanpassung</p>

  <div class="input-group">
    <label>
      Alter Beitrag (EUR/Jahr)
      <input type="number" bind:value={oldPremium} min="0" step="0.01" placeholder="z.B. 480.00" />
    </label>
    <label>
      Neuer Beitrag (EUR/Jahr)
      <input type="number" bind:value={newPremium} min="0" step="0.01" placeholder="z.B. 540.00" />
    </label>
  </div>

  <button class="btn-primary" onclick={berechnen}>Berechnen</button>

  {#if result}
    <div class="result-box">
      <h2>Ergebnis</h2>
      <table class="result-table"><tbody>
        <tr><td>Differenz</td><td class="value">{result.diffAbsolute.toFixed(2)} EUR/Jahr</td></tr>
        <tr><td>Erhoehung</td><td class="value">{result.diffPercent.toFixed(1)} %</td></tr>
        <tr><td>Mehrkosten ueber 5 Jahre</td><td class="value">{result.fiveYearCost.toFixed(2)} EUR</td></tr>
        <tr>
          <td>Sonderkuendigungsrecht</td>
          <td class="value" class:highlight={result.sonderkuendigung}>
            {result.sonderkuendigung ? 'Ja (Erhoehung > 10%)' : 'Nein'}
          </td>
        </tr>
      </tbody></table>
      <div class="actions">
        <button class="btn-secondary" onclick={exportPdf} disabled={!canExportPdf()}>Als PDF exportieren</button>
        {#if !canExportPdf()}<span class="hint">PDF-Export nur mit Lizenz</span>{/if}
      </div>
    </div>
  {/if}

  <div class="transparenz-box">
    <h3>Was dieser Rechner tut</h3>
    <p>Dieser Rechner addiert Beitragsunterschiede. Er empfiehlt keine Handlung. Die Entscheidung ob ein Wechsel sinnvoll ist liegt beim Berater.</p>
  </div>
</div>

<style>
  .calculator { max-width: 600px; }
  .subtitle { color: var(--color-text-muted); margin-bottom: 1.5rem; }
  .input-group { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
  .input-group label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; font-weight: 500; }
  .btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; font-weight: 500; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); padding: 0.5rem 1rem; border-radius: 0.375rem; }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
  .result-box { margin-top: 1.5rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; }
  .result-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
  .result-table td { padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); }
  .result-table .value { text-align: right; font-weight: 600; }
  .highlight { color: var(--color-danger); }
  .actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  .transparenz-box { margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border: 1px solid #f6e05e; border-radius: 0.5rem; font-size: 0.85rem; }
  .transparenz-box h3 { font-size: 0.9rem; margin-bottom: 0.5rem; }
</style>
