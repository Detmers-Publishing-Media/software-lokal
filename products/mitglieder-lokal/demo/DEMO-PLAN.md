# MitgliederSimple v0.4 — Demo-Video Plan fuer OpenClaw

## Ziel

Automatisierte Bildschirmaufnahme der MitgliederSimple-App (Frontend-only via Vite).
Playwright steuert den Browser, ffmpeg nimmt den Xvfb-Framebuffer auf.
Ergebnis: `demo/output/demo-v0.4.mp4` (720p, ~3-4 Minuten).

---

## Voraussetzungen

```bash
# Auf OpenClaw-System:
npm install -g pnpm
apt install -y xvfb ffmpeg fonts-dejavu

# Im Projekt:
cd products/mitglieder-lokal
pnpm install
pnpm add -D playwright @playwright/test
npx playwright install chromium
```

---

## Architektur

```
Xvfb :99 (1280x720)
  ├── ffmpeg -f x11grab :99 → demo-v0.4.mp4
  └── Chromium (Playwright)
        └── http://localhost:1420 (Vite dev server)
              └── App mit Browser-DB-Mock (sql.js statt Tauri SQL)
```

### DB-Mock fuer Browser

Die App importiert `@codefabrik/app-shared/db` (Tauri SQL Plugin).
Fuer die Demo ersetzen wir das via Vite-Alias durch einen sql.js-basierten Mock,
der eine echte SQLite-DB im Browser betreibt.

**Datei: `demo/browser-db-mock.js`** — Ersetzt `@codefabrik/app-shared/db`:
- `openDb()` → sql.js WASM-DB im Memory initialisieren
- `query(sql, params)` → db.exec() mit Ergebnis-Mapping
- `execute(sql, params)` → db.run(), return { lastInsertId, rowsAffected }

**Datei: `demo/vite.config.demo.js`** — Eigene Vite-Config mit Alias:
```js
resolve: {
  alias: {
    '@codefabrik/app-shared/db': './demo/browser-db-mock.js',
    '@codefabrik/app-shared/components': './demo/mock-components.js',
  }
}
```

**Datei: `demo/mock-components.js`** — Minimale Svelte-Komponenten:
- `DataTable` — einfache HTML-Tabelle mit onclick
- `SearchBar` — Input-Feld
- `ExportButton` — Button

---

## Drehbuch (Szenen)

### Szene 0: Titelkarte (3 Sekunden)
- Weisser Hintergrund, zentriert:
  - **MitgliederSimple v0.4 "Beitrag"**
  - *Einfache Mitgliederverwaltung fuer Vereine*
  - *Code-Fabrik — Desktop-Software fuer Ehrenamt*

### Szene 1: Mitgliederliste (15 Sekunden)
**Funktion:** Zentrale Uebersicht aller Vereinsmitglieder mit Status, Beitragsklasse und Eintrittsdatum.

- App oeffnet sich, Mitgliederliste mit 5 Testmitgliedern wird angezeigt
- **Texteinblendung:** "Mitgliederliste — Alle Mitglieder auf einen Blick"
- Suchfeld demonstrieren: "Mueller" eintippen → Liste filtert auf 1 Treffer
- Suchfeld leeren
- Status-Filter auf "Aktiv" setzen → nur aktive Mitglieder
- Filter zuruecksetzen auf "Alle Status"

**Erklaerung (Untertitel/Overlay):**
> Die Mitgliederliste zeigt alle Vereinsmitglieder mit Mitgliedsnummer,
> Name, Ort, Status und Beitragsklasse. Sie koennen nach Name oder Ort
> suchen und nach Status filtern.

### Szene 2: Neues Mitglied anlegen (20 Sekunden)
**Funktion:** Vollstaendiges Mitgliederformular mit Pflichtfeldern, Beitragsklasse und DSGVO-Einwilligungen.

- Klick auf "+ Neues Mitglied"
- Formular ausfuellen:
  - Vorname: "Lisa", Nachname: "Neumann"
  - Strasse: "Birkenweg 7", PLZ: "30159", Ort: "Hannover"
  - Telefon: "0511-1234567", E-Mail: "lisa.neumann@example.de"
  - Geburtsdatum: "1992-08-22"
  - Eintrittsdatum: heute
  - Status: Aktiv, Beitragsklasse: Vollmitglied
- DSGVO: Haken bei "Telefon" und "E-Mail" setzen
- Klick "Speichern"
- Zurueck zur Liste → 6 Mitglieder sichtbar

**Erklaerung:**
> Jedes neue Mitglied bekommt automatisch eine fortlaufende Nummer.
> DSGVO-Einwilligungen werden mit Datum erfasst — so wissen Sie immer,
> welche Kontaktdaten Sie verwenden duerfen.

### Szene 3: Mitglied-Detailansicht (10 Sekunden)
**Funktion:** Vollstaendige Mitgliederdaten mit DSGVO-Status und Zahlungshistorie.

- Klick auf "Mueller, Hans" in der Liste
- Detailansicht zeigt alle Felder:
  - Persoenliche Daten, Adresse, Kontakt
  - DSGVO-Badges (Telefon: gruen, Rest: grau)
  - Beitraege-Bereich (Zahlungshistorie)

**Erklaerung:**
> Die Detailansicht zeigt alle gespeicherten Daten eines Mitglieds.
> DSGVO-Einwilligungen sind als farbige Badges dargestellt —
> Gruen heisst erteilt, Grau heisst nicht erteilt.

### Szene 4: Mitglied bearbeiten (10 Sekunden)
**Funktion:** Alle Felder nachtraeglich aenderbar, Statuswechsel mit Austrittsdatum.

- Klick "Bearbeiten"
- Status aendern auf "Passiv"
- Notiz hinzufuegen: "Beurlaubt bis 2027"
- Klick "Speichern"
- Zurueck zur Liste → Status-Badge zeigt "passiv"

**Erklaerung:**
> Alle Mitgliederdaten koennen jederzeit bearbeitet werden.
> Bei Statuswechsel zu "Ausgetreten" erscheint automatisch
> ein Feld fuer Austrittsdatum und -grund.

### Szene 5: Beitragsuebersicht (20 Sekunden)
**Funktion:** Jahresuebersicht aller Beitraege mit Soll/Ist-Vergleich und Statusanzeige.

- Klick auf "Beitraege" in der Sidebar
- Jahresuebersicht 2026 wird angezeigt:
  - Zusammenfassung oben: Gesamt-Soll / Gesamt-Ist / Gesamt-Offen
  - Tabelle: Jedes Mitglied mit Soll, Ist, Differenz, Status
  - Badges: bezahlt (gruen), teilweise (gelb), offen (rot), befreit (grau)
- Jahr auf 2025 wechseln → leere Tabelle (keine Zahlungen)
- Zurueck auf 2026

**Erklaerung:**
> Die Beitragsuebersicht zeigt fuer jedes Jahr, wer seinen Beitrag
> bezahlt hat. Soll-Betraege werden automatisch aus der Beitragsklasse
> berechnet. Ehrenmitglieder sind als "befreit" markiert.

### Szene 6: Zahlung erfassen (15 Sekunden)
**Funktion:** Beitragszahlungen mit Betrag, Datum und Zahlungsart erfassen.

- In der Beitragstabelle: Klick auf "Zahlung" bei einem offenen Mitglied
- Modal oeffnet sich:
  - Betrag vorausgefuellt (offener Restbetrag)
  - Datum: heute
  - Zahlungsart: Ueberweisung
  - Notiz: "Jahresbeitrag 2026"
- Klick "Speichern"
- Status wechselt von "offen" auf "bezahlt"
- Klick auf Zeile → Zahlungshistorie klappt auf

**Erklaerung:**
> Zahlungen koennen direkt aus der Uebersicht erfasst werden.
> Der offene Betrag wird automatisch vorgeschlagen. Teilzahlungen
> sind moeglich — der Status aktualisiert sich automatisch.

### Szene 7: Einstellungen (15 Sekunden)
**Funktion:** Vereinsprofil und Beitragsklassen konfigurieren.

- Klick auf "Einstellungen"
- Vereinsprofil sichtbar:
  - Name, Adresse, Registergericht, Bankverbindung
  - Logo-Upload-Button
- Beitragsklassen-Tabelle:
  - 4 Standard-Klassen + Jugend
  - Neue Beitragsklasse anlegen: "Familienmitglied", 45.00 EUR, jaehrlich
  - Klick "Hinzufuegen"
- Versionsnummer unten: "Version 0.4.0"

**Erklaerung:**
> Im Vereinsprofil hinterlegen Sie Name, Adresse und Bankverbindung.
> Diese Daten erscheinen auf gedruckten Listen und Mahnbriefen.
> Beitragsklassen definieren die Beitragshoehe pro Mitgliedstyp.

### Szene 8: Export & Drucken (10 Sekunden)
**Funktion:** CSV-Export und PDF-Listen (Mitglieder, Telefon, Geburtstage, Jubilare, Beitragsuebersicht).

- Zurueck zur Mitgliederliste
- Klick "Drucken" → Dropdown:
  - Mitgliederliste, Telefonliste, Geburtstagsliste, Jubilarliste
- Klick auf "Mitgliederliste" → PDF oeffnet sich
- CSV-Export-Button klicken → Datei-Download

**Erklaerung:**
> Alle Listen koennen als PDF gedruckt werden — mit Vereinskopf
> und Seitenzahlen. Der CSV-Export ist Excel-kompatibel (Semikolon,
> UTF-8 BOM) fuer die Weiterverarbeitung in Tabellenprogrammen.

### Szene 9: Abspann (5 Sekunden)
- **MitgliederSimple v0.4 "Beitrag"**
- Funktionen: Mitgliederverwaltung | Beitragsabgleich | DSGVO | PDF-Listen | CSV-Export
- *Offline-Desktop-App — Ihre Daten bleiben auf Ihrem Rechner*
- *codefabrik.de*

---

## Technische Umsetzung

### Schritt 1: Mock-Dateien erstellen

`demo/browser-db-mock.js` — sql.js-basierter DB-Ersatz
`demo/mock-components.js` — Minimale Shared-Components
`demo/vite.config.demo.js` — Vite-Config mit Aliases
`demo/seed-data.js` — Testdaten fuer die Demo-DB (importiert von mock)

### Schritt 2: Playwright-Skript

`demo/record-demo.js`:

```js
// Pseudocode
const { chromium } = require('playwright');

// 1. Xvfb + ffmpeg starten
// 2. Vite dev server starten (mit demo config)
// 3. Browser oeffnen
// 4. Szenen abarbeiten:
//    - Klicks, Eingaben, Wartezeiten
//    - Overlay-Texte via page.evaluate() als DOM-Element einblenden
// 5. ffmpeg stoppen → MP4
```

Jede Szene ist eine async-Funktion mit:
- `await page.click(selector)`
- `await page.fill(selector, text)` (mit Verzoegerung fuer sichtbares Tippen)
- `await page.waitForTimeout(ms)` (Lesepausen)
- Overlay-Einblendungen per injiziertem CSS/HTML

### Schritt 3: Aufnahme-Skript

`demo/run-demo.sh`:

```bash
#!/bin/bash
set -e

# Xvfb starten
Xvfb :99 -screen 0 1280x720x24 &
export DISPLAY=:99

# Vite dev server
pnpm vite --config demo/vite.config.demo.js &
sleep 3

# ffmpeg Aufnahme starten
ffmpeg -f x11grab -video_size 1280x720 -i :99 \
  -c:v libx264 -preset fast -crf 23 \
  demo/output/demo-v0.4.mp4 &
FFMPEG_PID=$!

# Playwright Demo ausfuehren
node demo/record-demo.js

# Aufnahme stoppen
kill $FFMPEG_PID
wait $FFMPEG_PID 2>/dev/null

echo "Demo fertig: demo/output/demo-v0.4.mp4"
```

---

## Overlay-Texte (Untertitel)

Werden per Playwright als fixiertes DOM-Element eingeblendet:

```js
async function showOverlay(page, text, durationMs = 4000) {
  await page.evaluate((t) => {
    const el = document.createElement('div');
    el.id = 'demo-overlay';
    el.style.cssText = `
      position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.8); color: white; padding: 12px 24px;
      border-radius: 8px; font-size: 16px; max-width: 80%; text-align: center;
      z-index: 9999; font-family: system-ui;
    `;
    el.textContent = t;
    document.body.appendChild(el);
  }, text);
  await page.waitForTimeout(durationMs);
  await page.evaluate(() => document.getElementById('demo-overlay')?.remove());
}
```

---

## Dateien die OpenClaw erstellen muss

| Datei | Zweck |
|-------|-------|
| `demo/browser-db-mock.js` | sql.js DB-Mock (query/execute/openDb) |
| `demo/mock-components.js` | DataTable, SearchBar, ExportButton Svelte-Komponenten |
| `demo/seed-data.js` | 5 Testmitglieder + Vereinsprofil + Zahlungen |
| `demo/vite.config.demo.js` | Vite-Config mit Alias-Overrides |
| `demo/record-demo.js` | Playwright-Skript (Szenen 0-9) |
| `demo/run-demo.sh` | Shell-Wrapper: Xvfb + ffmpeg + Playwright |
| `demo/output/` | Ausgabeverzeichnis (gitignored) |

---

## Abhaengigkeiten

```bash
pnpm add -D playwright sql.js
npx playwright install chromium --with-deps
```

---

## Verifikation

```bash
# Ohne Aufnahme testen (sichtbar, wenn Display vorhanden):
DISPLAY=:0 node demo/record-demo.js --no-record

# Mit Aufnahme:
bash demo/run-demo.sh
ls -la demo/output/demo-v0.4.mp4
```
