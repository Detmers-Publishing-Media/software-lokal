<script>
  import { calcCourtagenBarwert } from '../lib/calculators.js';
  import { canExportPdf } from '../lib/license.js';

  let sparten = $state([{ name: '', jahresCourtage: '' }]);
  let faktor = $state(3);
  let result = $state(null);

  function addSparte() {
    sparten = [...sparten, { name: '', jahresCourtage: '' }];
  }

  function removeSparte(index) {
    sparten = sparten.filter((_, i) => i !== index);
  }

  function berechnen() {
    const valid = sparten
      .filter(s => s.name && !isNaN(parseFloat(s.jahresCourtage)))
      .map(s => ({ name: s.name, jahresCourtage: parseFloat(s.jahresCourtage) }));
    if (valid.length === 0) return;
    result = calcCourtagenBarwert({ sparten: valid, faktor: parseFloat(faktor) });
  }

  function exportPdf() {
    if (!canExportPdf() || !result) return;
    import('../lib/pdf.js').then(({ generateCalculatorPdf }) => {
      const spartenInput = result.spartenWerte.map(s => ({
        label: s.name, value: `${s.barwert.toFixed(2)} EUR`,
      }));
      generateCalculatorPdf(
        'CourtagenBarwertRechner',
        [{ label: 'Bewertungsfaktor', value: `${faktor}` }],
        [...spartenInput, { label: 'Gesamt-Barwert', value: `${result.gesamtBarwert.toFixed(2)} EUR` }],
        'Formel: Jahrescourtage x Faktor. Der Faktor ist marktueblich aber nicht normiert. Dieser Rechner liefert eine Orientierungsgroesse, keine verbindliche Unternehmensbewertung.',
      );
    });
  }
</script>

<div class="calculator">
  <h1>CourtagenBarwertRechner</h1>
  <p class="subtitle">Bestandsbewertung nach Spartencourtage</p>

  <div class="sparten-list">
    {#each sparten as sparte, i}
      <div class="sparte-row">
        <input type="text" bind:value={sparte.name} placeholder="Sparte (z.B. KFZ)" class="sparte-name" />
        <input type="number" bind:value={sparte.jahresCourtage} min="0" step="0.01" placeholder="Courtage/Jahr" class="sparte-value" />
        {#if sparten.length > 1}
          <button class="btn-remove" onclick={() => removeSparte(i)}>x</button>
        {/if}
      </div>
    {/each}
    <button class="btn-add" onclick={addSparte}>+ Sparte hinzufuegen</button>
  </div>

  <div class="slider-group">
    <label>
      Bewertungsfaktor: {faktor}
      <input type="range" bind:value={faktor} min="2" max="4" step="0.1" />
      <span class="range-labels"><span>2.0</span><span>4.0</span></span>
    </label>
  </div>

  <button class="btn-primary" onclick={berechnen}>Berechnen</button>

  {#if result}
    <div class="result-box">
      <h2>Ergebnis</h2>
      <table class="result-table"><tbody>
        {#each result.spartenWerte as s}
          <tr><td>{s.name}</td><td class="value">{s.barwert.toFixed(2)} EUR</td></tr>
        {/each}
        <tr class="total">
          <td>Gesamt-Barwert</td>
          <td class="value">{result.gesamtBarwert.toFixed(2)} EUR</td>
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
    <p>Formel: Jahrescourtage x Faktor. Der Faktor ist marktueblich aber nicht normiert. Dieser Rechner liefert eine Orientierungsgroesse, keine verbindliche Unternehmensbewertung.</p>
  </div>
</div>

<style>
  .calculator { max-width: 600px; }
  .subtitle { color: var(--color-text-muted); margin-bottom: 1.5rem; }
  .sparten-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
  .sparte-row { display: flex; gap: 0.5rem; align-items: center; }
  .sparte-name { flex: 1; }
  .sparte-value { width: 140px; }
  .btn-remove { background: none; border: 1px solid var(--color-border); border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: var(--color-danger); }
  .btn-add { background: none; border: 1px dashed var(--color-border); border-radius: 0.375rem; padding: 0.5rem; color: var(--color-text-muted); }
  .slider-group { margin-bottom: 1.5rem; }
  .slider-group label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem; font-weight: 500; }
  .slider-group input[type="range"] { width: 100%; }
  .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted); }
  .btn-primary { background: var(--color-primary); color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; font-weight: 500; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary { background: var(--color-surface); border: 1px solid var(--color-border); padding: 0.5rem 1rem; border-radius: 0.375rem; }
  .btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
  .result-box { margin-top: 1.5rem; padding: 1rem; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 0.5rem; }
  .result-table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
  .result-table td { padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); }
  .result-table .value { text-align: right; font-weight: 600; }
  .result-table .total td { font-weight: 700; border-top: 2px solid var(--color-text); }
  .actions { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.75rem; }
  .hint { font-size: 0.8rem; color: var(--color-text-muted); }
  .transparenz-box { margin-top: 1.5rem; padding: 1rem; background: #fffbeb; border: 1px solid #f6e05e; border-radius: 0.5rem; font-size: 0.85rem; }
  .transparenz-box h3 { font-size: 0.9rem; margin-bottom: 0.5rem; }
</style>
