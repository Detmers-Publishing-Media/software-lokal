<script>
  import { calcSpartenDeckung } from '../lib/calculators.js';
  import { canExportPdf } from '../lib/license.js';

  const basisSparten = [
    'Privathaftpflicht', 'Hausrat', 'Wohngebaeude', 'KFZ',
    'Rechtsschutz', 'Unfall', 'Berufsunfaehigkeit', 'Risikoleben',
  ];

  let selected = $state(new Set());
  let result = $state(null);

  function toggle(sparte) {
    const next = new Set(selected);
    if (next.has(sparte)) next.delete(sparte);
    else next.add(sparte);
    selected = next;
  }

  function berechnen() {
    result = calcSpartenDeckung({ vorhandeneSparten: [...selected] });
  }

  function exportPdf() {
    if (!canExportPdf() || !result) return;
    import('../lib/pdf.js').then(({ generateCalculatorPdf }) => {
      generateCalculatorPdf(
        'SpartenDeckungsGrad',
        [{ label: 'Ausgewaehlte Sparten', value: result.vorhanden.join(', ') || 'Keine' }],
        [
          { label: 'Deckungsgrad', value: `${result.deckungsgrad} %` },
          { label: 'Vorhanden', value: `${result.vorhanden.length} von ${result.basisSparten.length}` },
          { label: 'Fehlend', value: result.fehlend.join(', ') || 'Keine' },
        ],
        'Dieses Tool zeigt welche Sparten erfasst sind. Es bewertet weder den Bedarf noch die Notwendigkeit einer Absicherung. Bedarfsanalyse und Empfehlung obliegen dem Berater.',
      );
    });
  }
</script>

<div class="calculator">
  <h1>SpartenDeckungsGrad</h1>
  <p class="subtitle">Welche Basis-Sparten sind vorhanden?</p>

  <div class="checkbox-grid">
    {#each basisSparten as sparte}
      <label class="checkbox-item">
        <input type="checkbox" checked={selected.has(sparte)} onchange={() => toggle(sparte)} />
        {sparte}
      </label>
    {/each}
  </div>

  <button class="btn-primary" onclick={berechnen}>Auswerten</button>

  {#if result}
    <div class="result-box">
      <h2>Ergebnis</h2>

      <div class="progress-bar">
        <div class="progress-fill" style="width: {result.deckungsgrad}%"></div>
        <span class="progress-label">{result.deckungsgrad} %</span>
      </div>

      <p class="summary">{result.vorhanden.length} von {result.basisSparten.length} Basis-Sparten vorhanden</p>

      {#if result.fehlend.length > 0}
        <div class="fehlend">
          <h3>Nicht vorhanden:</h3>
          <ul>
            {#each result.fehlend as s}
              <li>{s}</li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="actions">
        <button class="btn-secondary" onclick={exportPdf} disabled={!canExportPdf()}>Als PDF exportieren</button>
        {#if !canExportPdf()}<span class="hint">PDF-Export nur mit Lizenz</span>{/if}
      </div>
    </div>
  {/if}

  <div class="transparenz-box">
    <h3>Was dieses Tool tut</h3>
    <p>Dieses Tool zeigt welche Sparten erfasst sind. Es bewertet weder den Bedarf noch die Notwendigkeit einer Absicherung. Bedarfsanalyse und Empfehlung obliegen dem Berater.</p>
  </div>
</div>

<style>
  .calculator { max-width: 600px; }
  .subtitle { color: var(--color-text-muted); margin-bottom: 1.5rem; }
  .checkbox-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; }
  .checkbox-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer; padding: 0.5rem; border: 1px solid var(--color-border); border-radius: 0.375rem; }
  .checkbox-item:hover { background: var(--color-surface); }
  .btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; font-weight: 500; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); padding: 0.5rem 1rem; border-radius: 0.375rem; }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
  .result-box { margin-top: 1.5rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; }
  .progress-bar { position: relative; height: 2rem; background: var(--color-border); border-radius: 0.5rem; margin: 0.75rem 0; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--color-primary); transition: width 0.3s ease; }
  .progress-label { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: 700; font-size: 0.875rem; }
  .summary { font-weight: 500; margin-bottom: 0.75rem; }
  .fehlend { margin-bottom: 0.75rem; }
  .fehlend h3 { font-size: 0.9rem; margin-bottom: 0.25rem; }
  .fehlend ul { list-style: disc; padding-left: 1.5rem; font-size: 0.875rem; }
  .actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  .transparenz-box { margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border: 1px solid #f6e05e; border-radius: 0.5rem; font-size: 0.85rem; }
  .transparenz-box h3 { font-size: 0.9rem; margin-bottom: 0.5rem; }
</style>
