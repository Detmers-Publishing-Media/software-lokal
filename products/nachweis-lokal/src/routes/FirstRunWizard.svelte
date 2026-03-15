<script>
  import { currentView } from '../lib/stores/navigation.js';
  import {
    saveOrgProfile, saveObject,
    importLibraryTemplate, getTemplates
  } from '../lib/db.js';
  import libraryData from '../assets/template-library.json';
  import Glossar from '../components/Glossar.svelte';

  let { oncomplete } = $props();

  let step = $state(1);
  const totalSteps = 4;

  // Step 1: Willkommen (kein State noetig)

  // Step 2: KI-Assistent + Checklisten
  let selectedTemplates = $state(new Set());
  let selectedBranch = $state('alle');
  let betriebText = $state('');
  let classifierDone = $state(false);
  let showManualSelect = $state(false);
  let listening = $state(false);
  let speechSupported = $state(typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window));

  const branchLabels = [
    { key: 'alle', label: 'Alle' },
    { key: 'gastro', label: 'Gastronomie' },
    { key: 'buero', label: 'Büro' },
    { key: 'kita', label: 'Kita' },
    { key: 'handwerk', label: 'Handwerk' },
    { key: 'einzelhandel', label: 'Einzelhandel' },
    { key: 'hausverwaltung', label: 'Hausverwaltung' },
    { key: 'verein', label: 'Verein' },
  ];

  const keywords = {
    gastro: ['restaurant', 'imbiss', 'café', 'cafe', 'küche', 'kochen', 'gastronomie', 'speisen', 'essen', 'bar', 'kneipe', 'zapf', 'bier', 'fritteuse', 'grill', 'lebensmittel', 'hygiene', 'catering', 'kantine', 'bäckerei', 'metzgerei', 'kiosk'],
    buero: ['büro', 'office', 'schreibtisch', 'bildschirm', 'computer', 'arbeitsplatz', 'praxis', 'kanzlei', 'agentur', 'beratung', 'verwaltung', 'server'],
    kita: ['kita', 'kindergarten', 'krippe', 'hort', 'schule', 'kinder', 'spielplatz', 'spielgeräte', 'turnhalle', 'betreuung', 'außengelände'],
    handwerk: ['werkstatt', 'handwerk', 'maschine', 'werkzeug', 'elektro', 'elektriker', 'installation', 'montage', 'baustelle', 'leiter', 'lager', 'regal', 'produktion', 'schweißen', 'schreinerei'],
    einzelhandel: ['laden', 'geschäft', 'shop', 'verkauf', 'kasse', 'regal', 'einzelhandel', 'supermarkt', 'boutique'],
    hausverwaltung: ['gebäude', 'haus', 'wohnung', 'vermieter', 'hausverwaltung', 'aufzug', 'heizung', 'keller', 'tiefgarage', 'treppe'],
    verein: ['verein', 'sport', 'fußball', 'tennis', 'schwimmbad', 'turnhalle', 'sportplatz', 'minigolf', 'clubhaus'],
  };

  function classifyBetrieb() {
    if (!betriebText.trim()) return;
    const lower = betriebText.toLowerCase();
    const scores = {};
    for (const [branch, kws] of Object.entries(keywords)) {
      scores[branch] = 0;
      for (const kw of kws) {
        if (lower.includes(kw)) scores[branch] += 2;
      }
    }
    const matched = Object.entries(scores).filter(([_, s]) => s > 0).sort((a, b) => b[1] - a[1]).map(([b]) => b);
    if (matched.length > 0) {
      selectedBranch = matched[0];
      // Auto-select matching templates
      const matchedTemplates = libraryData.filter(t =>
        t.branches && (t.branches.includes('alle') || t.branches.some(b => matched.includes(b)))
      );
      selectedTemplates = new Set(matchedTemplates.map(t => t.id));
    }
    classifierDone = true;
  }

  function startSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;
    listening = true;
    recognition.onresult = (event) => {
      betriebText = event.results[0][0].transcript;
      listening = false;
      classifyBetrieb();
    };
    recognition.onerror = () => { listening = false; };
    recognition.onend = () => { listening = false; };
    recognition.start();
  }

  let filteredLibrary = $derived.by(() => {
    if (selectedBranch === 'alle') return libraryData;
    return libraryData.filter(t =>
      t.branches && (t.branches.includes(selectedBranch) || t.branches.includes('alle'))
    );
  });

  // Step 3: Erstes Geraet / Raum
  let object = $state({ name: '', location: '', category: '' });

  // Step 4: Organisation (optional)
  let org = $state({ name: '', street: '', zip: '', city: '', responsible: '' });

  let saving = $state(false);

  function toggleTemplate(id) {
    const next = new Set(selectedTemplates);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedTemplates = next;
  }

  async function handleNext() {
    if (step === 1) {
      // Willkommen — nichts zu speichern
      step = 2;
    } else if (step === 2) {
      // Checklisten importieren
      saving = true;
      for (const t of libraryData) {
        if (selectedTemplates.has(t.id)) {
          await importLibraryTemplate(t);
        }
      }
      saving = false;
      step = 3;
    } else if (step === 3) {
      // Erstes Geraet / Raum
      if (object.name.trim()) {
        await saveObject({
          name: object.name.trim(),
          location: object.location.trim() || null,
          category: object.category.trim() || null,
          identifier: null,
          notes: null,
        });
      }
      step = 4;
    } else if (step === 4) {
      // Organisation
      if (org.name.trim()) {
        await saveOrgProfile(org);
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
      <h1>Willkommen bei Nachweis Lokal</h1>
      <p class="subtitle">Richten Sie die App in wenigen Schritten ein.</p>
      <div class="progress">
        <div class="progress-bar" style="width: {(step / totalSteps) * 100}%"></div>
      </div>
      <span class="step-label">Schritt {step} von {totalSteps}</span>
    </div>

    <div class="wizard-body">
      {#if step === 1}
        <h2>Prüfungen dokumentieren — einfach und sicher</h2>
        <div class="welcome">
          <p>Nachweis Lokal hilft Ihnen, wiederkehrende Prüfungen zu dokumentieren — <strong>rechtssicher, ohne Cloud, direkt auf Ihrem Rechner.</strong></p>
          <div class="welcome-steps">
            <div class="welcome-step">
              <span class="welcome-num">1</span>
              <span><strong>Checkliste wählen</strong> — fertige Vorlagen oder eigene erstellen</span>
            </div>
            <div class="welcome-step">
              <span class="welcome-num">2</span>
              <span><strong>Gerät oder Raum zuordnen</strong> — was wird geprüft?</span>
            </div>
            <div class="welcome-step">
              <span class="welcome-num">3</span>
              <span><strong>Prüfung durchführen</strong> — Punkte abhaken, Fotos machen, fertig</span>
            </div>
          </div>
          <p class="welcome-hint">Das Dashboard erinnert Sie automatisch an fällige Prüfungen.</p>
          <div class="info-box info-box-warning">
            <strong>Warum ist das wichtig?</strong> Als Unternehmer müssen Sie bestimmte Dinge regelmäßig prüfen — zum Beispiel Feuerlöscher, elektrische Geräte oder Fluchtwege. Wenn etwas passiert und Sie keine Prüfung nachweisen können, haften Sie persönlich. Auch Ihre Versicherung kann die Zahlung verweigern.
          </div>
        </div>

      {:else if step === 2}
        <h2>Beschreiben Sie Ihren Betrieb</h2>

        {#if !classifierDone}
          <p class="hint">Was für ein Betrieb ist das? Wir finden die passenden Checklisten für Sie.</p>
          <div class="assistant-input">
            <input
              type="text"
              bind:value={betriebText}
              placeholder="z.B. Imbiss mit Fritteuse und Zapfanlage"
              onkeydown={(e) => { if (e.key === 'Enter') classifyBetrieb(); }}
            />
            <button class="btn-classify" onclick={classifyBetrieb} disabled={!betriebText.trim()}>
              Finden
            </button>
            {#if speechSupported}
              <button class="btn-mic" onclick={startSpeech} disabled={listening} title="Sprechen">
                {listening ? '⏺' : '🎤'}
              </button>
            {/if}
          </div>
          <p class="skip-link">
            <button class="link-btn" onclick={() => { showManualSelect = true; classifierDone = true; }}>
              Ich möchte selbst auswählen
            </button>
          </p>
        {:else}
          {#if selectedTemplates.size > 0 && !showManualSelect}
            <div class="classifier-result">
              <p><strong>{selectedTemplates.size} Checklisten</strong> passen zu Ihrem Betrieb. Sie können die Auswahl unten anpassen.</p>
            </div>
          {/if}
          <div class="info-box">
            Diese Checklisten helfen beim Start — sie sind keine amtliche Vorschrift. Fragen Sie Ihre <Glossar term="BG">Berufsgenossenschaft (BG)</Glossar> für eine vollständige Liste.
          </div>
          <div class="branch-filter">
            {#each branchLabels as b}
              <button
                class="branch-btn"
                class:active={selectedBranch === b.key}
                onclick={() => selectedBranch = b.key}
              >{b.label}</button>
            {/each}
          </div>
        {/if}

        {#if classifierDone}
        <div class="template-grid">
          {#each filteredLibrary as t}
            <button
              class="template-card"
              class:selected={selectedTemplates.has(t.id)}
              onclick={() => toggleTemplate(t.id)}
            >
              <div class="card-top">
                <span class="card-name">{t.name}</span>
                <span class="card-badge">{t.category}</span>
              </div>
              <span class="card-meta">{t.items.length} Prüfpunkte</span>
              {#if selectedTemplates.has(t.id)}
                <span class="card-check">&#10003;</span>
              {/if}
            </button>
          {/each}
        </div>
        {#if selectedTemplates.size > 0}
          <p class="selection-count">{selectedTemplates.size} {selectedTemplates.size === 1 ? 'Checkliste' : 'Checklisten'} ausgewählt</p>
        {/if}
        {/if}

      {:else if step === 3}
        <h2>Wo prüfen Sie?</h2>
        <p class="hint">Geben Sie Ihr erstes Gerät, Ihren ersten Raum oder Ihre erste Anlage ein. Weitere können Sie jederzeit hinzufügen.</p>
        <div class="fields">
          <div class="field">
            <label for="wiz-obj-name">Bezeichnung *</label>
            <input id="wiz-obj-name" bind:value={object.name} placeholder="z.B. Feuerlöscher EG-01" />
          </div>
          <div class="row">
            <div class="field">
              <label for="wiz-obj-loc">Standort</label>
              <input id="wiz-obj-loc" bind:value={object.location} placeholder="z.B. Erdgeschoss, Flur" />
            </div>
            <div class="field">
              <label for="wiz-obj-cat">Kategorie</label>
              <input id="wiz-obj-cat" bind:value={object.category} placeholder="z.B. Brandschutz" />
            </div>
          </div>
        </div>

      {:else if step === 4}
        <h2>Ihre Daten (optional)</h2>
        <p class="hint">Erscheint als Briefkopf auf Ihren Prüfprotokollen. Sie können das auch später unter Einstellungen ergänzen.</p>
        <div class="fields">
          <div class="field">
            <label for="wiz-org">Organisation</label>
            <input id="wiz-org" bind:value={org.name} placeholder="Name der Organisation" />
          </div>
          <div class="row">
            <div class="field">
              <label for="wiz-street">Straße</label>
              <input id="wiz-street" bind:value={org.street} />
            </div>
            <div class="field small">
              <label for="wiz-zip">PLZ</label>
              <input id="wiz-zip" bind:value={org.zip} />
            </div>
            <div class="field">
              <label for="wiz-city">Ort</label>
              <input id="wiz-city" bind:value={org.city} />
            </div>
          </div>
          <div class="field">
            <label for="wiz-responsible">Verantwortliche Person</label>
            <input id="wiz-responsible" bind:value={org.responsible} placeholder="z.B. Max Mustermann, Sicherheitsbeauftragter" />
          </div>
        </div>
      {/if}
    </div>

    <div class="wizard-footer">
      <button class="btn-skip" onclick={handleSkipAll}>
        Einrichtung überspringen
      </button>
      <div class="footer-right">
        {#if step > 1}
          <button class="btn-secondary" onclick={handleSkip}>
            Überspringen
          </button>
        {/if}
        <button class="btn-primary" onclick={handleNext} disabled={saving}>
          {#if saving}
            Importiere...
          {:else if step === 1}
            Los geht's
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
    width: 640px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .wizard-header {
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid var(--color-border);
  }

  .wizard-header h1 {
    margin: 0;
    font-size: 1.25rem;
  }

  .subtitle {
    color: var(--color-text-muted);
    font-size: 0.875rem;
    margin: 0.25rem 0 1rem;
  }

  .progress {
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: var(--color-primary);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .step-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
    display: block;
  }

  .wizard-body {
    padding: 1.5rem;
    overflow-y: auto;
    flex: 1;
  }

  .wizard-body h2 {
    margin: 0 0 0.25rem;
    font-size: 1.125rem;
  }

  .hint {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    margin: 0 0 1rem;
  }

  .assistant-input { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
  .assistant-input input {
    flex: 1; padding: 0.75rem; border: 2px solid var(--color-border);
    border-radius: 0.5rem; font-size: 1rem;
  }
  .assistant-input input:focus { outline: none; border-color: var(--color-primary); }
  .btn-classify {
    padding: 0.75rem 1.25rem; background: var(--color-primary); color: white;
    border: none; border-radius: 0.5rem; font-size: 0.9375rem; font-weight: 600; cursor: pointer;
  }
  .btn-classify:disabled { opacity: 0.5; }
  .btn-mic {
    padding: 0.75rem; background: none; border: 2px solid var(--color-border);
    border-radius: 0.5rem; font-size: 1.25rem; cursor: pointer; min-width: 48px;
  }
  .btn-mic:disabled { opacity: 0.5; }
  .skip-link { margin-top: 0.75rem; }
  .link-btn {
    background: none; border: none; color: var(--color-primary);
    text-decoration: underline; cursor: pointer; font-size: 0.875rem;
  }
  .classifier-result {
    background: #f0fff4; border-left: 3px solid #38a169;
    border-radius: 0.375rem; padding: 0.75rem 1rem;
    font-size: 0.875rem; margin-bottom: 0.75rem;
  }
  .classifier-result p { margin: 0; }

  .info-box {
    padding: 0.75rem 1rem;
    background: #eff6ff;
    border-left: 3px solid #3b82f6;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: #1e40af;
    line-height: 1.5;
    margin-bottom: 1rem;
  }

  .info-box-warning {
    background: #fffbeb;
    border-left-color: #f59e0b;
    color: #92400e;
  }

  .welcome p { font-size: 0.9375rem; line-height: 1.5; margin: 0 0 1rem; }
  .welcome-steps { display: flex; flex-direction: column; gap: 0.75rem; margin: 1.25rem 0; }
  .welcome-step {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .welcome-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 50%;
    background: var(--color-primary);
    color: white;
    font-weight: 700;
    font-size: 0.8125rem;
    flex-shrink: 0;
  }
  .welcome-hint { color: var(--color-text-muted); font-size: 0.8125rem; margin: 0; }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
    flex: 1;
  }

  .field.small { max-width: 100px; }

  .field label {
    font-weight: 600;
    font-size: 0.8125rem;
  }

  .row { display: flex; gap: 1rem; }

  input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-size: 0.875rem;
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(43, 108, 176, 0.15);
  }

  .branch-filter { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-bottom: 0.75rem; }
  .branch-btn {
    padding: 0.25rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    background: none;
    font-size: 0.75rem;
    cursor: pointer;
    color: var(--color-text);
  }
  .branch-btn:hover { border-color: var(--color-primary); }
  .branch-btn.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.5rem;
  }

  .template-card {
    position: relative;
    padding: 0.75rem;
    border: 2px solid var(--color-border);
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: border-color 0.15s;
  }

  .template-card:hover { border-color: var(--color-primary); }

  .template-card.selected {
    border-color: var(--color-primary);
    background: #ebf4ff;
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .card-name { font-weight: 600; font-size: 0.8125rem; }
  .card-badge {
    padding: 0.0625rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    background: #e2e8f0;
    color: #4a5568;
    white-space: nowrap;
  }
  .card-meta { font-size: 0.75rem; color: var(--color-text-muted); }

  .card-check {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    color: var(--color-primary);
    font-size: 1rem;
    font-weight: 700;
  }

  .selection-count {
    font-size: 0.8125rem;
    color: var(--color-primary);
    font-weight: 600;
    margin: 0.5rem 0 0;
  }

  .wizard-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-right {
    display: flex;
    gap: 0.5rem;
  }

  .btn-primary {
    padding: 0.5rem 1.25rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-secondary {
    padding: 0.5rem 1rem;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
  }
  .btn-secondary:hover { background: var(--color-surface); }

  .btn-skip {
    padding: 0.5rem 0;
    background: none;
    border: none;
    color: var(--color-text-muted);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  .btn-skip:hover { color: var(--color-text); }
</style>
