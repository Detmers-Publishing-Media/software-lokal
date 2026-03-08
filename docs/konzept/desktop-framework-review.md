# Code-Fabrik — Desktop-Framework-Entscheidung: Review-Anfrage

*Stand: 2026-03-06*
*Zweck: Externer Review zur Framework-Wahl fuer Desktop-Apps*

---

## Kontext: Was ist Code-Fabrik?

Code-Fabrik ist eine Ein-Personen-Software-Manufaktur die fokussierte Desktop-Tools fuer Nischenzielgruppen im DACH-Raum baut. Aktuell zwei Produktlinien:

1. **MitgliederSimple** — Vereinsverwaltung (Mitglieder-CRUD, Beitraege, PDF-Listen, DSGVO, CSV-Export)
2. **Finanz-Rechner** — 5 Makler-Rechner als Toolbox (Beitragsanpassung, Stornohaftung, etc.)

Langfristig sind ~20 Produkte geplant, alle mit derselben Basis-Architektur.

### Geschaeftsmodell

- **GPL 3.0 Open Source** — alle lokalen Features frei, kein Limit, kein Nag-Screen
- **Support-Abo (29 EUR/Jahr)** — fertige Installer, Updates, Support, Templates
- Vertrieb ueber Digistore24, keine Kundendaten bei Code-Fabrik (nur Lizenzkey)
- Zielgruppe: Nicht-technische Endanwender (Vereinsvorstaende, Versicherungsmakler)

### Technische Prinzipien

- **Lokal-first:** Alle Daten auf dem Rechner des Nutzers (SQLite), keine Cloud-Abhaengigkeit
- **Strict no-email:** Tools versenden keine E-Mails
- **Kein Account noetig:** Lizenzkey als einzige Identitaet
- **Event-Log mit Hash-Kette:** Jede Schreiboperation erzeugt ein HMAC-verkettetes Event (Audit-Trail)

---

## Aktuelle Architektur (Tauri v2)

### Stack

```
Frontend:    Svelte 5 (Runes: $state, $props, $derived, $effect)
Backend:     Rust (Tauri v2)
Datenbank:   SQLite via @tauri-apps/plugin-sql
PDF:         pdfmake (JS, laeuft im Frontend)
CSV:         Eigene JS-Implementierung
Dialoge:     @tauri-apps/plugin-dialog
Dateisystem: @tauri-apps/plugin-fs
Build:       Vite + Cargo (Rust)
Tests:       Node.js native test module + better-sqlite3 (nur in Tests)
CI/CD:       GitHub Actions (Linux-Tests + Windows-Build)
```

### Projektstruktur MitgliederSimple

```
src/
  App.svelte                 Root-Komponente, Navigation, DB-Init
  lib/
    db.js                    CRUD, Payments, Events, Migrations (370 Zeilen)
    crypto.js                HMAC-SHA256 fuer Event-Hash-Kette
    pdf.js / pdf-lists.js    5 PDF-Listenfunktionen
    pdf-mahnbrief.js         Mahnbriefe (3 Stufen)
    csv.js                   CSV-Export
    license.js               Key-Validierung
    stores/
      members.js             Svelte Stores
      navigation.js          View-Navigation
  routes/
    MemberList.svelte        Mitgliederliste + Suche + Drucken
    MemberForm.svelte        Anlegen/Bearbeiten
    MemberDetail.svelte      Detailansicht + Zahlungshistorie
    Payments.svelte          Beitragsuebersicht
    Settings.svelte          Vereinsprofil
    Import.svelte            CSV-Import
app-shared/              Shared Svelte Components + DB-Helfer
  src/db/index.js            DB-Abstraktionsschicht (openDb, query, execute)
src-tauri/
  src/lib.rs                 Rust: Plugin-Registrierung (12 Zeilen)
  tauri.conf.json            App-Konfiguration
  Cargo.toml                 Rust Dependencies
tests/
  74 Tests in 7 Kategorien   (Unit, Integration, Migration, Ketten, Replay, Integritaet, Smoke)
```

### DB-Abstraktionsschicht (app-shared)

Die gesamte DB-Kommunikation laeuft ueber 4 Funktionen:

```javascript
// app-shared/src/db/index.js
import Database from '@tauri-apps/plugin-sql';

let db = null;

export async function openDb() {
  if (!db) db = await Database.load('sqlite:mitglieder.db');
  return db;
}

export async function query(sql, params = []) {
  const conn = await openDb();
  return conn.select(sql, params);
}

export async function execute(sql, params = []) {
  const conn = await openDb();
  return conn.execute(sql, params);
}
```

### Rust-Code (lib.rs)

Der Rust-Anteil ist minimal — nur Plugin-Registrierung:

```rust
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Anwendung");
}
```

### Tauri-spezifische Dependencies

| Paket | Zweck | Tauri-spezifisch? |
|-------|-------|:-:|
| `@tauri-apps/plugin-sql` | SQLite Zugriff | Ja |
| `@tauri-apps/plugin-dialog` | Datei-oeffnen/speichern Dialoge | Ja |
| `@tauri-apps/plugin-fs` | Dateisystem-Zugriff | Ja |
| `@tauri-apps/api` | Tauri API | Ja |
| `@tauri-apps/cli` | Build-Tooling | Ja |
| `pdfmake` | PDF-Generierung | Nein |
| `svelte` | UI-Framework | Nein |
| `vite` | Build-Tool | Nein |
| `better-sqlite3` | SQLite in Tests | Nein |

### Tests

Tests laufen komplett in Node.js mit `better-sqlite3` (nicht Tauri):

```javascript
// Testumgebung simuliert die DB-Schicht
import Database from 'better-sqlite3';
// ... ersetzt @tauri-apps/plugin-sql zur Testzeit
```

74 Tests in 7 Kategorien:
1. Unit-Tests — jede Funktion einzeln
2. Integrations-Tests — DB + Events zusammen
3. Migrations-Tests — Schema-Upgrades
4. Ketten-Tests — Multi-Version-Upgrade
5. Replay-Tests — Zustand aus Events rekonstruieren
6. Integritaets-Tests — Hash-Kette erkennt Manipulation
7. Smoke-Tests — App startet, CRUD funktioniert

---

## Das Problem: Tauri funktioniert nicht auf Windows 10

### Symptome

- App wird installiert (NSIS-Installer, 5-178 MB je nach WebView2-Modus)
- Doppelklick auf Desktop-Link: kurze Sanduhr, dann nichts
- Kein Fenster, kein Prozess im Task-Manager, kein Fehler in der Konsole
- ExitCode 0 bei Ausfuehrung aus cmd
- Windows 10 Pro, 64-Bit, Build 19045

### Was wir probiert haben

1. `downloadBootstrapper` (Standard) — WebView2 wurde nicht installiert
2. `embedBootstrapper` mit `silent: true` — WebView2 wurde nicht installiert
3. `embedBootstrapper` mit `silent: false` — WebView2 wurde nicht installiert
4. `offlineInstaller` mit `silent: false` (178 MB EXE) — WebView2 wurde nicht installiert
5. Manueller WebView2-Download — "bereits installiert" (ueber Microsoft Edge)
6. Edge ist installiert, WebView2 Registry-Eintraege vorhanden
7. GPU-Deaktivierung (`--disable-gpu`) — kein Effekt
8. Administrator-Ausfuehrung — kein Effekt
9. Kein Antivirus aktiv, Firewall aktiv aber irrelevant (kein Netzwerk noetig)

### Kernproblem

Tauri v2 basiert auf dem System-WebView2 (Microsoft Edge). Auf dem Zielrechner (Windows 10) startet die App nicht — ohne jegliche Fehlermeldung. Die Ursache ist unklar. Das ist ein Show-Stopper, weil die Zielgruppe (Vereinsvorstaende, Makler auf Windows 10) die App nicht nutzen kann.

Tauri hat grundsaetzlich das Problem, dass es vom System-WebView abhaengt. Windows 11 hat es vorinstalliert, Windows 10 theoretisch ueber Edge — aber in der Praxis funktioniert es nicht zuverlaessig.

---

## Was wir bewerten moechten

### Option A: Zu Electron wechseln

Electron bringt Chromium mit — kein WebView2-Problem, laeuft auf jedem Windows.

**Was sich aendert:**

| Aspekt | Tauri (jetzt) | Electron |
|--------|---------------|----------|
| Rendering | System WebView2 | Eigenes Chromium |
| Backend | Rust | Node.js |
| SQLite | @tauri-apps/plugin-sql | better-sqlite3 (bereits in Tests) |
| Dialoge | @tauri-apps/plugin-dialog | electron.dialog |
| Dateisystem | @tauri-apps/plugin-fs | Node.js fs |
| EXE-Groesse | ~5 MB (ohne WebView2) | ~150-200 MB |
| RAM-Verbrauch | Niedrig | Hoeher (~100-200 MB) |
| Build | Cargo + Vite | electron-builder + Vite |
| Windows-Kompatibilitaet | WebView2-abhaengig | Ueberall |

**Was gleich bleibt:**
- Svelte 5 Frontend (komplett)
- pdfmake PDF-Generierung
- CSV-Export
- Vite als Build-Tool
- Alle 74 Tests (laufen bereits mit better-sqlite3)
- Event-Log + Hash-Kette
- Gesamte UI

**Umzubauen:**
- `app-shared/src/db/index.js` — von `@tauri-apps/plugin-sql` auf `better-sqlite3`
- `src-tauri/` komplett entfernen → `main.js` (Electron Main Process)
- `src/lib/db.js` — `openDb()` aendert sich, Rest bleibt
- Dialog-Aufrufe (Datei oeffnen/speichern) — von Tauri-API auf Electron-API
- Build-Konfiguration — `tauri.conf.json` → `electron-builder` Config
- CI/CD Workflow — kein Rust mehr, nur Node.js

### Option B: Tauri weiter debuggen

Versuchen herauszufinden warum die App auf dem spezifischen Windows-10-Rechner nicht startet.

**Risiko:** Auch wenn wir den Bug auf diesem Rechner fixen, bleibt die WebView2-Abhaengigkeit ein grundsaetzliches Risiko fuer die Zielgruppe (nicht-technische Anwender auf unterschiedlichen Windows-Versionen).

### Option C: Andere Alternativen

- **Neutralino.js** — Aehnlich wie Tauri, nutzt System-WebView → gleiches Problem
- **.NET MAUI / WPF** — Kompletter Rewrite, anderer Tech-Stack
- **Flutter** — Kompletter Rewrite
- **Progressive Web App** — Kein direkter DB/Dateisystem-Zugriff

---

## Kontext fuer die Entscheidung

- **Solo-Entwickler** — Umstellungsaufwand muss realistisch sein
- **~20 Produkte geplant** — Framework-Entscheidung betrifft alle
- **Zielgruppe:** Nicht-technische Windows-10/11-Nutzer
- **"Muss einfach funktionieren"** — Kein technischer Support fuer Installationsprobleme
- **Aktueller Code ist ueberschaubar:** ~370 Zeilen DB-Layer, ~130 Zeilen App.svelte, 12 Zeilen Rust
- **Tests laufen bereits in Node.js** mit better-sqlite3 (nicht in Tauri)
- **CI/CD funktioniert** — GitHub Actions mit Linux-Tests + Windows-Build

## Fragen an den Reviewer

1. **Ist Electron die richtige Wahl** fuer diesen Anwendungsfall, oder gibt es eine bessere Alternative die wir uebersehen?

2. **Wie schaetzen Sie den Migrationsaufwand** von Tauri zu Electron ein, gegeben den beschriebenen Code-Umfang?

3. **Gibt es bekannte Probleme** mit Electron auf Windows 10 die wir beruecksichtigen sollten?

4. **Empfehlen Sie electron-builder oder electron-forge** fuer den Build/Packaging-Prozess?

5. **Gibt es Architektur-Empfehlungen** fuer die DB-Schicht (better-sqlite3 im Main Process vs. Renderer, IPC-Pattern)?

6. **Sehen Sie Risiken** bei der geplanten Skalierung auf ~20 Produkte mit Electron als Basis?

7. **Gibt es eine Moeglichkeit**, das Tauri-Problem auf Windows 10 doch noch zu loesen, bevor wir den Wechsel vollziehen?
