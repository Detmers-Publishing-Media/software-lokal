/**
 * MitgliederSimple v0.4 — Demo-Video Recorder
 *
 * Playwright-Skript das alle 9 Szenen des Demo-Videos abarbeitet.
 * Steuert den Browser, fuegt Overlay-Texte ein, wartet Lesezeiten ab.
 *
 * Voraussetzungen:
 *   - Vite dev server laeuft auf http://localhost:1420 (mit demo config)
 *   - Playwright + Chromium installiert
 *
 * Aufruf:
 *   node demo/record-demo.js              # Headless (fuer Aufnahme mit ffmpeg)
 *   node demo/record-demo.js --headed     # Mit sichtbarem Browser
 *   node demo/record-demo.js --no-record  # Sichtbar, ohne ffmpeg (Debugging)
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:1420';
const HEADED = process.argv.includes('--headed') || process.argv.includes('--no-record');
const SLOW_TYPE = 40; // ms between keystrokes for visible typing

// --- Helpers ---

async function showOverlay(page, text, durationMs = 4000) {
  await page.evaluate((t) => {
    const existing = document.getElementById('demo-overlay');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'demo-overlay';
    el.style.cssText = `
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.85); color: white; padding: 14px 28px;
      border-radius: 8px; font-size: 16px; max-width: 80%; text-align: center;
      z-index: 9999; font-family: system-ui, sans-serif; line-height: 1.5;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    el.textContent = t;
    document.body.appendChild(el);
  }, text);
  await page.waitForTimeout(durationMs);
  await page.evaluate(() => document.getElementById('demo-overlay')?.remove());
}

async function showTitle(page, lines, durationMs = 3000) {
  await page.evaluate(({ lines }) => {
    const existing = document.getElementById('demo-title');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.id = 'demo-title';
    el.style.cssText = `
      position: fixed; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center; background: white;
      z-index: 10000; font-family: system-ui, sans-serif;
    `;
    el.innerHTML = lines.map((line, i) => {
      const styles = [
        'font-size: 2rem; font-weight: 700; color: #1a202c;',
        'font-size: 1.25rem; color: #4a5568; margin-top: 0.5rem; font-style: italic;',
        'font-size: 1rem; color: #718096; margin-top: 0.75rem;',
        'font-size: 0.875rem; color: #a0aec0; margin-top: 1.5rem;',
      ];
      return `<div style="${styles[i] ?? styles[3]}">${line}</div>`;
    }).join('');
    document.body.appendChild(el);
  }, { lines });
  await page.waitForTimeout(durationMs);
  await page.evaluate(() => document.getElementById('demo-title')?.remove());
}

async function typeSlowly(page, selector, text) {
  await page.click(selector);
  await page.type(selector, text, { delay: SLOW_TYPE });
}

async function clearField(page, selector) {
  await page.click(selector);
  await page.keyboard.press('Control+a');
  await page.keyboard.press('Backspace');
}

async function pause(page, ms = 1000) {
  await page.waitForTimeout(ms);
}

// --- Scenes ---

async function scene0_title(page) {
  await showTitle(page, [
    'MitgliederSimple v0.4 "Beitrag"',
    'Einfache Mitgliederverwaltung fuer Vereine',
    'Code-Fabrik — Desktop-Software fuer Ehrenamt',
  ], 4000);
}

/**
 * Szene 1: Mitgliederliste
 * Funktion: Zentrale Uebersicht aller Vereinsmitglieder mit Status,
 * Beitragsklasse und Eintrittsdatum. Suche und Filterung.
 */
async function scene1_memberList(page) {
  // Wait for member list to load
  await page.waitForSelector('table tbody tr');
  await pause(page, 1500);

  await showOverlay(page,
    'Die Mitgliederliste zeigt alle Vereinsmitglieder mit Mitgliedsnummer, ' +
    'Name, Ort, Status und Beitragsklasse. Sie koennen nach Name oder Ort ' +
    'suchen und nach Status filtern.', 5000);

  // Search for "Mueller"
  await typeSlowly(page, '.search-bar input', 'Mueller');
  await pause(page, 2000);

  // Clear search
  await page.click('.search-bar .clear');
  await pause(page, 1000);

  // Filter by status "Aktiv"
  await page.selectOption('.filters select', 'aktiv');
  await pause(page, 2000);

  // Reset filter
  await page.selectOption('.filters select', 'alle');
  await pause(page, 1000);
}

/**
 * Szene 2: Neues Mitglied anlegen
 * Funktion: Vollstaendiges Mitgliederformular mit Pflichtfeldern,
 * Beitragsklasse und DSGVO-Einwilligungen.
 */
async function scene2_newMember(page) {
  await showOverlay(page,
    'Jedes neue Mitglied bekommt automatisch eine fortlaufende Nummer. ' +
    'DSGVO-Einwilligungen werden mit Datum erfasst — so wissen Sie immer, ' +
    'welche Kontaktdaten Sie verwenden duerfen.', 4000);

  // Click "+ Neues Mitglied"
  await page.click('.btn-primary:has-text("Neues Mitglied")');
  await page.waitForSelector('.member-form');
  await pause(page, 1000);

  // Fill form
  await typeSlowly(page, 'input[bind\\:value="form.first_name"], fieldset:first-of-type .row:first-child label:first-child input', 'Lisa');
  // Use more robust selectors — target by position
  const inputs = await page.$$('fieldset:first-of-type input');
  if (inputs.length >= 2) {
    await inputs[0].fill('Lisa');   // Vorname
    await pause(page, 300);
    await inputs[1].fill('Neumann'); // Nachname
    await pause(page, 300);
  }

  // Street, PLZ, Ort
  const allInputs = await page.$$('.member-form fieldset:first-of-type input');
  if (allInputs.length >= 7) {
    await allInputs[2].fill('Birkenweg 7');    // Strasse
    await pause(page, 200);
    await allInputs[3].fill('30159');           // PLZ
    await pause(page, 200);
    await allInputs[4].fill('Hannover');        // Ort
    await pause(page, 200);
    await allInputs[5].fill('0511-1234567');    // Telefon
    await pause(page, 200);
    await allInputs[6].fill('lisa.neumann@example.de'); // Email
    await pause(page, 200);
  }

  // Birth date
  const dateInputs = await page.$$('.member-form fieldset:first-of-type input[type="date"]');
  if (dateInputs.length >= 1) {
    await dateInputs[0].fill('1992-08-22');
    await pause(page, 300);
  }

  // DSGVO: Check "Telefon" and "E-Mail"
  const consentCheckboxes = await page.$$('.consent-grid input[type="checkbox"]');
  if (consentCheckboxes.length >= 2) {
    await consentCheckboxes[0].click(); // Telefon
    await pause(page, 500);
    await consentCheckboxes[1].click(); // E-Mail
    await pause(page, 500);
  }

  await pause(page, 1000);

  // Click "Speichern"
  await page.click('button[type="submit"]:has-text("Speichern")');
  await page.waitForSelector('.member-list');
  await pause(page, 1500);
}

/**
 * Szene 3: Mitglied-Detailansicht
 * Funktion: Vollstaendige Mitgliederdaten mit DSGVO-Status und Zahlungshistorie.
 */
async function scene3_memberDetail(page) {
  await showOverlay(page,
    'Die Detailansicht zeigt alle gespeicherten Daten eines Mitglieds. ' +
    'DSGVO-Einwilligungen sind als farbige Badges dargestellt — ' +
    'Gruen heisst erteilt, Grau heisst nicht erteilt.', 4000);

  // Click on "Mueller, Hans" in the table
  const rows = await page.$$('table tbody tr');
  for (const row of rows) {
    const text = await row.textContent();
    if (text.includes('Mueller')) {
      await row.click();
      break;
    }
  }

  await page.waitForSelector('.detail');
  await pause(page, 3000);
}

/**
 * Szene 4: Mitglied bearbeiten
 * Funktion: Alle Felder nachtraeglich aenderbar, Statuswechsel mit Austrittsdatum.
 */
async function scene4_editMember(page) {
  await showOverlay(page,
    'Alle Mitgliederdaten koennen jederzeit bearbeitet werden. ' +
    'Bei Statuswechsel zu "Ausgetreten" erscheint automatisch ' +
    'ein Feld fuer Austrittsdatum und -grund.', 4000);

  // Click "Bearbeiten"
  await page.click('button:has-text("Bearbeiten")');
  await page.waitForSelector('.member-form');
  await pause(page, 1000);

  // Change status to "Passiv"
  await page.selectOption('.member-form select', { label: 'Passiv' });
  await pause(page, 1000);

  // Add a note
  const textarea = await page.$('.member-form textarea');
  if (textarea) {
    await textarea.fill('Beurlaubt bis 2027');
    await pause(page, 500);
  }

  // Click "Speichern"
  await page.click('button[type="submit"]:has-text("Speichern")');
  await page.waitForSelector('.member-list');
  await pause(page, 1500);
}

/**
 * Szene 5: Beitragsuebersicht
 * Funktion: Jahresuebersicht aller Beitraege mit Soll/Ist-Vergleich und Statusanzeige.
 */
async function scene5_payments(page) {
  await showOverlay(page,
    'Die Beitragsuebersicht zeigt fuer jedes Jahr, wer seinen Beitrag ' +
    'bezahlt hat. Soll-Betraege werden automatisch aus der Beitragsklasse ' +
    'berechnet. Ehrenmitglieder sind als "befreit" markiert.', 5000);

  // Click "Beitraege" in sidebar
  await page.click('.sidebar button:has-text("Beitraege")');
  await page.waitForSelector('.payments-page');
  await pause(page, 2000);

  // Show the overview
  await pause(page, 2000);

  // Switch to previous year
  const prevBtn = await page.$('.year-nav button:first-child');
  if (prevBtn) {
    await prevBtn.click();
    await pause(page, 2000);
  }

  // Switch back to current year
  const nextBtn = await page.$('.year-nav button:last-child');
  if (nextBtn) {
    await nextBtn.click();
    await pause(page, 1500);
  }
}

/**
 * Szene 6: Zahlung erfassen
 * Funktion: Beitragszahlungen mit Betrag, Datum und Zahlungsart erfassen.
 * Teilzahlungen moeglich — Status aktualisiert sich automatisch.
 */
async function scene6_recordPayment(page) {
  await showOverlay(page,
    'Zahlungen koennen direkt aus der Uebersicht erfasst werden. ' +
    'Der offene Betrag wird automatisch vorgeschlagen. Teilzahlungen ' +
    'sind moeglich — der Status aktualisiert sich automatisch.', 4000);

  // Click "Zahlung" button on an open member (Fischer or Bauer)
  const payButtons = await page.$$('button:has-text("Zahlung")');
  if (payButtons.length > 0) {
    await payButtons[0].click();
    await page.waitForSelector('.modal');
    await pause(page, 1500);

    // Fill the form — amount should be pre-filled
    // Change payment method to Ueberweisung (should already be default)
    // Add note
    const noteInput = await page.$('.modal input[type="text"]');
    if (noteInput) {
      await noteInput.fill('Jahresbeitrag 2026');
      await pause(page, 500);
    }

    // Click "Speichern"
    await page.click('.modal button[type="submit"]');
    await pause(page, 2000);

    // Click on the row to show payment history
    const rows = await page.$$('.payments-page table tbody tr');
    for (const row of rows) {
      const text = await row.textContent();
      if (text.includes('bezahlt') || text.includes('Fischer')) {
        await row.click();
        await pause(page, 2000);
        break;
      }
    }
  }
}

/**
 * Szene 7: Einstellungen
 * Funktion: Vereinsprofil und Beitragsklassen konfigurieren.
 * Daten erscheinen auf gedruckten Listen und Mahnbriefen.
 */
async function scene7_settings(page) {
  await showOverlay(page,
    'Im Vereinsprofil hinterlegen Sie Name, Adresse und Bankverbindung. ' +
    'Diese Daten erscheinen auf gedruckten Listen und Mahnbriefen. ' +
    'Beitragsklassen definieren die Beitragshoehe pro Mitgliedstyp.', 5000);

  // Click "Einstellungen" in sidebar
  await page.click('.sidebar button:has-text("Einstellungen")');
  await page.waitForSelector('.settings-page');
  await pause(page, 3000);

  // Scroll down to fee classes
  await page.evaluate(() => {
    document.querySelector('.settings-page').scrollTo({ top: 400, behavior: 'smooth' });
  });
  await pause(page, 2000);

  // Add new fee class "Familienmitglied"
  const addInputs = await page.$$('.add-form input');
  if (addInputs.length >= 2) {
    await addInputs[0].fill('Familienmitglied');
    await pause(page, 300);
    await addInputs[1].fill('45');
    await pause(page, 300);
  }

  await page.click('.add-form button:has-text("Hinzufuegen")');
  await pause(page, 1500);

  // Scroll to bottom to show version
  await page.evaluate(() => {
    document.querySelector('.settings-page').scrollTo({ top: 9999, behavior: 'smooth' });
  });
  await pause(page, 2000);
}

/**
 * Szene 8: Export & Drucken
 * Funktion: CSV-Export und PDF-Listen (Mitglieder, Telefon, Geburtstage,
 * Jubilare, Beitragsuebersicht). PDF-Listen mit Vereinskopf und Seitenzahlen.
 */
async function scene8_export(page) {
  await showOverlay(page,
    'Alle Listen koennen als PDF gedruckt werden — mit Vereinskopf ' +
    'und Seitenzahlen. Der CSV-Export ist Excel-kompatibel (Semikolon, ' +
    'UTF-8 BOM) fuer die Weiterverarbeitung in Tabellenprogrammen.', 5000);

  // Go to member list
  await page.click('.sidebar button:has-text("Mitglieder")');
  await page.waitForSelector('.member-list');
  await pause(page, 1000);

  // Click "Drucken" to open dropdown
  await page.click('button:has-text("Drucken")');
  await pause(page, 1500);

  // Click "Mitgliederliste" — PDF opens (pdfmake opens in new tab/download)
  // In demo we just show the menu, then close it
  await page.click('button:has-text("Drucken")');
  await pause(page, 1000);

  // CSV export click
  const exportBtn = await page.$('.export-btn, button:has-text("Exportieren")');
  if (exportBtn) {
    await exportBtn.click();
    await pause(page, 1500);
  }
}

async function scene9_credits(page) {
  await showTitle(page, [
    'MitgliederSimple v0.4 "Beitrag"',
    'Mitgliederverwaltung | Beitragsabgleich | DSGVO | PDF-Listen | CSV-Export',
    'Offline-Desktop-App — Ihre Daten bleiben auf Ihrem Rechner',
    'codefabrik.de',
  ], 5000);
}

// --- Main ---

async function main() {
  console.log('Starting demo recording...');

  const browser = await chromium.launch({
    headless: !HEADED,
    args: ['--window-size=1280,720', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    locale: 'de-DE',
  });

  const page = await context.newPage();

  // Navigate to demo app
  await page.goto(BASE_URL + '/demo/index.html');

  // Wait for app to load (sidebar visible)
  await page.waitForSelector('.sidebar', { timeout: 15000 });
  await page.waitForTimeout(1000);

  console.log('App loaded. Running scenes...');

  try {
    await scene0_title(page);
    console.log('  Scene 0: Title — done');

    await scene1_memberList(page);
    console.log('  Scene 1: Member list — done');

    await scene2_newMember(page);
    console.log('  Scene 2: New member — done');

    await scene3_memberDetail(page);
    console.log('  Scene 3: Member detail — done');

    await scene4_editMember(page);
    console.log('  Scene 4: Edit member — done');

    await scene5_payments(page);
    console.log('  Scene 5: Payments overview — done');

    await scene6_recordPayment(page);
    console.log('  Scene 6: Record payment — done');

    await scene7_settings(page);
    console.log('  Scene 7: Settings — done');

    await scene8_export(page);
    console.log('  Scene 8: Export & Print — done');

    await scene9_credits(page);
    console.log('  Scene 9: Credits — done');

  } catch (err) {
    console.error('Scene error:', err.message);
    // Take screenshot for debugging
    await page.screenshot({ path: 'demo/output/error-screenshot.png' });
    console.error('Error screenshot saved to demo/output/error-screenshot.png');
  }

  await browser.close();
  console.log('Demo recording complete.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
