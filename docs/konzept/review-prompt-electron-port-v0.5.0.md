# Review-Prompt: MitgliederSimple Electron-Port v0.5.0

*Stand: 2026-03-07*
*Kontext: Minimaler Port von Tauri v2 auf Electron, Vorbereitung fuer Windows-EXE*

---

## Ausgangslage

MitgliederSimple wurde von Tauri v2 auf Electron portiert. Ziel: lauffaehige Windows-EXE
fuer Referenzkunden-Auslieferung. Minimaler Port — keine Plattform-Professionalisierung
(kommt spaeter als eigener Schritt fuer beide Produkte gleichzeitig).

### Warum Electron statt Tauri?

- Tauri v2 funktioniert nicht auf Windows 10 (Show-Stopper fuer Zielgruppe)
- Electron ermoeglicht geteilte Plattform fuer ~20 Produkte (`@codefabrik/electron-platform`)
- Referenz: `docs/konzept/desktop-framework-review.md`, `docs/konzept/electron-plattform-architektur.md`

---

## Geaenderte Dateien

### Neu erstellt

| Datei | Zweck |
|-------|-------|
| `electron/main.js` | Electron Main Process: BrowserWindow, better-sqlite3, IPC-Handler fuer DB/Dialog/FS |
| `electron/preload.cjs` | contextBridge: `window.electronAPI` mit db, dialog, fs |

### Geaendert

| Datei | Aenderung |
|-------|-----------|
| `app-shared/src/db/index.js` | `@tauri-apps/plugin-sql` → `window.electronAPI.db` (IPC) |
| `src/routes/Settings.svelte` | Tauri-Dialog/FS-Imports → `window.electronAPI.dialog/fs` |
| `package.json` | Tauri-Deps → Electron + electron-builder, v0.5.0, GPL-3.0 |
| `vite.config.js` | Tauri-Referenzen entfernt, `base: './'` fuer Electron file:// |
| `.github/workflows/build-windows.yml` | Tauri-CLI → electron-builder (NSIS) |
| `.gitignore` | `release/` hinzugefuegt |

### Nicht geaendert

- Alle 6 Svelte-Seiten (ausser Settings.svelte Logo-Funktion)
- `db.js` (370 Zeilen Fach-CRUD) — nutzt weiterhin `query()`, `execute()` aus app-shared
- `crypto.js`, `csv.js`, `pdf.js`, `pdf-lists.js`, `pdf-mahnbrief.js`
- `license.js`, Stores, App.svelte
- Alle Tests (11 Testdateien, 74 Tests)
- `src-tauri/` (noch vorhanden, Icons werden referenziert)

---

## Bekanntes Testproblem: better-sqlite3 ABI-Mismatch

### Symptom

42 von 74 Tests schlagen fehl mit:
```
NODE_MODULE_VERSION 108. This version of Node.js requires NODE_MODULE_VERSION 109.
```

### Ursache (analysiert)

Ubuntu 24.04 liefert ein gepatchtes Node.js-Paket (`nodejs 18.19.1+dfsg-6ubuntu5`):
- `node --version` → `v18.19.1`
- `process.versions.modules` → `109` (normalerweise erst ab Node 22)
- System-Shared-Library: `libnode.so.109` (ABI 109)
- System-Headers (`/usr/include/node/node_version.h`): `NODE_MODULE_VERSION 109`

**Aber:** `node-gyp` cached Headers fuer `18.19.1` aus dem offiziellen Node-Repo:
- `~/.cache/node-gyp/18.19.1/include/node/node_version.h`: `NODE_MODULE_VERSION 108`

**Ergebnis:** `node-gyp` kompiliert better-sqlite3 gegen ABI 108 (offizielle 18.19.1 Headers),
aber zur Laufzeit erwartet die Ubuntu-gepatchte `libnode.so.109` ABI 109 → Mismatch.

### Betroffene Tests (42 Fehler)

Alle Tests die `better-sqlite3` direkt importieren:
- `test_chain.js` (Ketten-Tests) — 9 Tests
- `test_integrity.js` (Integritaet) — 4 Tests
- `test_migration.js` (Migration) — 6 Tests
- `test_payments.js` (Payment CRUD) — 5 Tests
- `test_replay.js` (Replay) — 4 Tests
- `test_schema.js` (Schema-Meta) — 6 Tests
- `test_smoke.js` (Smoke-Tests) — 8 Tests

### Nicht betroffene Tests (32 bestehen)

Tests die Mock-basiert arbeiten oder kein better-sqlite3 nutzen:
- `test_crypto.js` (HMAC) — 3 Tests ✅
- `test_csv.js` (CSV-Export) — 10 Tests ✅
- `test_db.js` (DB-Logik via Mock) — 14 Tests ✅
- `test_events.js` (Events via Mock) — 4 Tests ✅
- `test_payments.js` (annualAmountCents) — 1 Test ✅

---

## Review-Fragen

### A) Electron-Port (Korrektheit)

1. **IPC-Sicherheit:** Ist die contextBridge-Konfiguration sicher? Sind die IPC-Handler
   in `main.js` ausreichend eingegrenzt (kein willkuerliches SQL von aussen)?
   Empfehlung: SQL-Injection ueber IPC bewerten.

2. **DB-Lifecycle:** Wird die SQLite-DB korrekt geoeffnet/geschlossen?
   Was passiert bei Absturz — bleibt WAL-Journal konsistent?

3. **Pfade:** Ist `app.getPath('userData')` der richtige Ort fuer die DB auf allen Plattformen?
   Funktioniert der Logo-Pfad (`fs:copyFile` IPC) korrekt?

4. **electron-builder Config:** Sind `files`, `win.target`, `nsis`-Optionen korrekt?
   Wird `better-sqlite3` als Native-Modul korrekt gepackt?

5. **Vite-Config:** Ist `base: './'` korrekt fuer Electron file://-Protokoll?
   Werden Assets (CSS, JS, Bilder) im gepackten Build gefunden?

### B) Test-Infrastruktur

6. **ABI-Mismatch beheben:** Welche Optionen gibt es?
   - a) `node-gyp rebuild --nodedir=/usr` (System-Headers statt gecachte nutzen)
   - b) Node 22 via nvm/fnm installieren (saubere Umgebung)
   - c) `prebuild-install` mit expliziter ABI-Version
   - d) Tests nur in CI laufen lassen (GitHub Actions hat sauberes Node 22)

7. **Empfehlung:** Was ist die beste Loesung fuer ein Solo-Entwickler-Setup auf Ubuntu 24.04?

8. **CI-Aequivalenz:** Laufen die 42 fehlenden Tests in GitHub Actions (Ubuntu + Node 22)?
   Gibt es Risiken dass der Electron-Port dort ebenfalls fehlschlaegt?

### C) Architektur-Bewertung

9. **DB-Layer Abstraktion:** Der DB-Layer (`app-shared/src/db/index.js`) nutzt jetzt
   `window.electronAPI.db`. Ist das eine gute Zwischenloesung bis zur Plattform-Professionalisierung?
   Was sollte beim naechsten Schritt (electron-platform Package) anders werden?

10. **Testbarkeit:** Die Tests nutzen `better-sqlite3` direkt (nicht ueber IPC).
    Im Produkt laeuft better-sqlite3 im Main Process, die Tests in Node.
    Ist das ein Problem? Testen wir das Richtige?

11. **Tauri-Reste:** `src-tauri/` ist noch vorhanden (Icons). Soll das jetzt oder
    beim Professionalisierungsschritt aufgeraeumt werden?

### D) Risikobewertung

12. **Windows 10 Kompatibilitaet:** Electron 33 unterstuetzt Windows 10.
    Gibt es bekannte Einschraenkungen mit better-sqlite3 auf Windows?

13. **Native Module Packaging:** `better-sqlite3` muss fuer Windows-x64 kompiliert werden.
    Funktioniert das in GitHub Actions out-of-the-box mit electron-builder?

14. **Auto-Update:** Ist der aktuelle Stand (kein Auto-Update) akzeptabel fuer v0.5.0?
    Wann sollte electron-updater eingefuehrt werden?

15. **Signing:** Windows-EXE ohne Code-Signing zeigt SmartScreen-Warnung.
    Ist das fuer Referenzkunden akzeptabel? Ab wann wird Signing benoetigt?

---

## Kontext-Dateien fuer den Reviewer

Bitte lesen:
- `electron/main.js` — Electron Main Process
- `electron/preload.cjs` — contextBridge
- `app-shared/src/db/index.js` — DB-Abstraktion (vorher/nachher)
- `src/routes/Settings.svelte` — Logo-Dialog (vorher/nachher)
- `package.json` — Dependencies und Build-Config
- `.github/workflows/build-windows.yml` — CI-Pipeline
- `docs/konzept/electron-plattform-architektur.md` — Ziel-Architektur (fuer Kontext)

Optional:
- `tests/test_chain.js` — Beispiel eines betroffenen Tests
- `docs/konzept/desktop-framework-review.md` — Warum Electron statt Tauri
