<script>
  import { calcRatenzuschlag } from '../lib/calculators.js';
  import { canExportPdf } from '../lib/license.js';

  let jahresPraemie = $state('');
  let ratenzuschlagProzent = $state('');
  let result = $state(null);

  function berechnen() {
    const jp = parseFloat(jahresPraemie);
    const rz = parseFloat(ratenzuschlagProzent);
    if (isNaN(jp) || isNaN(rz) || jp < 0 || rz < 0) return;
    result = calcRatenzuschlag({ jahresPraemie: jp, ratenzuschlagProzent: rz });
  }

  function exportPdf() {
    if (!canExportPdf() || !result) return;
    import('../lib/pdf.js').then(({ generateCalculatorPdf }) => {
      generateCalculatorPdf(
        'RatenzuschlagRechner',
        [
          { label: 'Jahrespraemie', value: `${jahresPraemie} EUR` },
          { label: 'Ratenzuschlag', value: `${ratenzuschlagProzent} %` },
        ],
        [
          { label: 'Monatsbeitrag', value: `${result.monatlich.toFixed(2)} EUR` },
          { label: 'Jahressumme (monatlich)', value: `${result.summeMonatlich.toFixed(2)} EUR` },
          { label: 'Mehrkosten/Jahr', value: `${result.mehrkosten.toFixed(2)} EUR` },
          { label: 'Mehrkosten', value: `${result.mehrkostenProzent.toFixed(1)} %` },
        ],
        'Differenz zwischen Jahreszahlung und Summe der Monatsbeitraege. Keine Empfehlung zur Zahlweise.',
      );
    });
  }
</script>

<div class="calculator">
  <h1>RatenzuschlagRechner</h1>
  <p class="subtitle">Vergleich Jahreszahlung vs. monatliche Zahlung</p>

  <div class="input-group">
    <label>
      Jahrespraemie (EUR)
      <input type="number" bind:value={jahresPraemie} min="0" step="0.01" placeholder="z.B. 960.00" />
    </label>
    <label>
      Ratenzuschlag (%)
      <input type="number" bind:value={ratenzuschlagProzent} min="0" step="0.1" placeholder="z.B. 5" />
    </label>
  </div>

  <button class="btn-primary" onclick={berechnen}>Berechnen</button>

  {#if result}
    <div class="result-box">
      <h2>Ergebnis</h2>
      <table class="result-table"><tbody>
        <tr><td>Monatsbeitrag</td><td class="value">{result.monatlich.toFixed(2)} EUR</td></tr>
        <tr><td>Jahressumme (monatlich)</td><td class="value">{result.summeMonatlich.toFixed(2)} EUR</td></tr>
        <tr><td>Mehrkosten pro Jahr</td><td class="value">{result.mehrkosten.toFixed(2)} EUR</td></tr>
        <tr><td>Aufschlag</td><td class="value">{result.mehrkostenProzent.toFixed(1)} %</td></tr>
      </tbody></table>
      <div class="actions">
        <button class="btn-secondary" onclick={exportPdf} disabled={!canExportPdf()}>Als PDF exportieren</button>
        {#if !canExportPdf()}<span class="hint">PDF-Export nur mit Lizenz</span>{/if}
      </div>
    </div>
  {/if}

  <div class="transparenz-box">
    <h3>Was dieser Rechner tut</h3>
    <p>Differenz zwischen Jahreszahlung und Summe der Monatsbeitraege. Keine Empfehlung zur Zahlweise.</p>
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
  .actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  .transparenz-box { margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border: 1px solid #f6e05e; border-radius: 0.5rem; font-size: 0.85rem; }
  .transparenz-box h3 { font-size: 0.9rem; margin-bottom: 0.5rem; }
</style>
