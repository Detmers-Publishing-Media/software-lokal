<script>
  import { calcStornoHaftung } from '../lib/calculators.js';
  import { canExportPdf } from '../lib/license.js';

  let courtage = $state('');
  let haftungsMonate = $state('');
  let vertragsBeginn = $state('');
  let result = $state(null);

  function berechnen() {
    const c = parseFloat(courtage);
    const hm = parseInt(haftungsMonate);
    if (isNaN(c) || isNaN(hm) || c < 0 || hm < 0 || !vertragsBeginn) return;
    result = calcStornoHaftung({ courtage: c, haftungsMonate: hm, vertragsBeginn });
  }

  function exportPdf() {
    if (!canExportPdf() || !result) return;
    import('../lib/pdf.js').then(({ generateCalculatorPdf }) => {
      const entwicklung = result.monatlicheEntwicklung
        .filter((_, i) => i % 3 === 0)
        .map(e => ({ label: `+ ${e.monat} Monate`, value: `${e.betrag.toFixed(2)} EUR` }));
      generateCalculatorPdf(
        'StornoHaftungsRechner',
        [
          { label: 'Abschluss-Courtage', value: `${courtage} EUR` },
          { label: 'Haftungszeit', value: `${haftungsMonate} Monate` },
          { label: 'Vertragsbeginn', value: vertragsBeginn },
        ],
        [
          { label: 'Rueckzahlung heute', value: `${result.rueckzahlungHeute.toFixed(2)} EUR` },
          { label: 'Verbleibende Haftung', value: `${result.restMonate} Monate` },
          ...entwicklung,
        ],
        'Formel: Courtage x (RestMonate / GesamtMonate). Dieser Rechner zeigt eine rechnerische Schaetzung. Massgeblich ist die tatsaechliche Courtagevereinbarung mit dem Versicherer.',
      );
    });
  }
</script>

<div class="calculator">
  <h1>StornoHaftungsRechner</h1>
  <p class="subtitle">Rueckzahlungsrisiko bei Vertragsstorno</p>

  <div class="input-group">
    <label>
      Abschluss-Courtage (EUR)
      <input type="number" bind:value={courtage} min="0" step="0.01" placeholder="z.B. 3100.00" />
    </label>
    <label>
      Haftungszeit (Monate)
      <input type="number" bind:value={haftungsMonate} min="0" step="1" placeholder="z.B. 40" />
    </label>
    <label>
      Vertragsbeginn
      <input type="date" bind:value={vertragsBeginn} />
    </label>
  </div>

  <button class="btn-primary" onclick={berechnen}>Berechnen</button>

  {#if result}
    <div class="result-box">
      <h2>Ergebnis</h2>
      <table class="result-table"><tbody>
        <tr>
          <td>Rueckzahlung heute</td>
          <td class="value highlight">{result.rueckzahlungHeute.toFixed(2)} EUR</td>
        </tr>
        <tr>
          <td>Verbleibende Haftung</td>
          <td class="value">{result.restMonate} Monate</td>
        </tr>
      </tbody></table>

      <h3>Monatliche Entwicklung</h3>
      <table class="result-table"><tbody>
        {#each result.monatlicheEntwicklung as entry}
          <tr>
            <td>+ {entry.monat} Monate</td>
            <td class="value">{entry.betrag.toFixed(2)} EUR</td>
          </tr>
        {/each}
      </tbody></table>

      <div class="actions">
        <button class="btn-secondary" onclick={exportPdf} disabled={!canExportPdf()}>Als PDF exportieren</button>
        {#if !canExportPdf()}<span class="hint">PDF-Export nur mit Lizenz</span>{/if}
      </div>
    </div>
  {/if}

  <div class="transparenz-box">
    <h3>Formel</h3>
    <p>Courtage x (RestMonate / GesamtMonate). Dieser Rechner zeigt eine rechnerische Schaetzung. Massgeblich ist die tatsaechliche Courtagevereinbarung mit dem Versicherer.</p>
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
