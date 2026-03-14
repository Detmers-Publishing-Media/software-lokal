# Code-Fabrik — Agent-Anweisungen (v0.7.0)

## Projekt

Code-Fabrik ist eine Software-Manufaktur fuer fokussierte Desktop-Tools.
Monorepo mit Portal, Shared Packages, Produkten und Infrastruktur.

**Version:** 0.8.0 (siehe `VERSION`)

## Sprache

- Code: Englisch (Variablen, Funktionen, Kommentare)
- UI-Texte: Deutsch (Umlaute als ae/oe/ue in Code, echte Umlaute nur in UI-Strings)
- Dokumentation: Deutsch

## Monorepo-Struktur

```
code-fabrik/
  packages/
    electron-platform/     Electron Hauptprozess + IPC + Plattform-Libs
    app-shared/        Svelte 5 Shared Components + DB/License Utils
    ui-shared/             Generische Svelte 5 UI-Komponenten
    finanz-shared/         Geteilter Finanz-Kern (Schema, Models, EUeR)
    shared/                Reine JS-Utils (Crypto, CSV, License-Format)
  products/
    mitglieder-lokal/     Vereinsverwaltung (Electron + Svelte 5 + SQLite)
    finanz-rechner/        Versicherungsrechner (Electron + Svelte 5, kein DB)
    rechnung-lokal/        Rechnungsstellung (Electron + Svelte 5 + SQLite)
    fruehwarnreport/       Fruehwarnbericht (Python, eigenstaendig)
    bundles.json           Produkt-Bundle-Registry
  portal/                  Backend-API (Express.js + PostgreSQL)
  ansible/                 Infrastruktur (26 Rollen, 11 Playbooks)
  scripts/                 Build-, Install-, Validierungs-Scripts
  docs/                    Konzepte, Governance, Runbooks, ADRs, Roadmap
  .stories/                Kanban Story-Tracking
```

### Workspace (pnpm)

Definiert in `pnpm-workspace.yaml`:
- `packages/*` (electron-platform, shared, app-shared)
- `products/mitglieder-lokal`
- `products/rechnung-lokal`
- `products/finanz-rechner`
- `products/berater-lokal`

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Desktop | Electron + Svelte 5 + SQLite |
| Portal | Express.js + PostgreSQL + Caddy |
| Shared Components | `@codefabrik/app-shared` (Svelte 5) |
| Shared Utils | `@codefabrik/shared` (Crypto, CSV, License) |
| Plattform | `@codefabrik/electron-platform` (IPC, Backup, License, Support) |
| Build | Vite, pnpm |
| CI/CD | Forgejo Actions (Infra), GitHub Actions (Electron-Builds: Win/Linux/macOS) |
| Tests | Node.js native `test` module (kein Jest, kein Mocha) |
| Infra | Ansible, UpCloud (VPS), Cloudflare (DNS+SSL), Digistore24 (Payment) |

## Packages

### electron-platform (`@codefabrik/electron-platform`)

Electron Hauptprozess-Plattform. CommonJS. Exports: `main.cjs`, `preload.cjs`.

**IPC-Handler** (`ipc/`):
- `backup.js` — Backup erstellen, auflisten, validieren, wiederherstellen, rotieren
- `license.js` — Key eingeben, Status pruefen, entfernen, Hash abrufen, revalidieren
- `support.js` — Bundle sammeln, Kompakt-Info, Ticket einreichen, Tickets abrufen
- `update.js` — Update pruefen, herunterladen, installieren

**Libs** (`lib/`):
- `backup-core.js` — Lokale Backup-Logik (7d taeglich, 4w woechentlich, monatlich)
- `keystore.js` — OS-Keystore fuer SQLCipher-Schluessel
- `license-client.js` — 3-stufige Lizenzpruefung (Offline-Format → Portal → 30d Cache)
- `logger.js` — Strukturiertes JSON-Logging
- `recovery.js` — DB-Recovery aus Backups/Events
- `support-bundle.js` — Diagnosedaten-Sammlung
- `support-sanitizer.js` — Klasse-C-Filter (DSGVO), Pfad-Scrubbing, Log-Signaturen
- `error-codes.js` — Standardisierte Fehlercodes (CF-DB-xxx, CF-LIC-xxx, etc.)
- `health.js` — App-Gesundheitschecks

**Preload Bridge** (`preload.cjs`):
Exponiert `window.electronAPI` mit Namespaces: `db`, `dialog`, `fs`, `update`, `backup`, `support`, `recovery`, `license`, `app`, `firstRun`.

**Tests:** 94 Tests in 9 Dateien.

### app-shared (`@codefabrik/app-shared`)

Svelte 5 Shared Components und Utils. ESM. Exports: `./components`, `./db`, `./license`.

**Components** (`src/components/`):
- `DataTable.svelte` — Wiederverwendbare Datentabelle
- `SearchBar.svelte` — Suchleiste
- `ExportButton.svelte` — CSV/PDF-Export-Button
- `LicenseSection.svelte` — Supportvertrag-Verwaltung (Key eingeben/entfernen/Status)
- `SupportView.svelte` — Support-Seite (Problem melden, Diagnose, Tickets, Backup)

**Alle Svelte-Komponenten verwenden Svelte 5 Runes:** `$state`, `$effect`, `$derived`.

### shared (`@codefabrik/shared`)

Reine JS-Utilities ohne Framework-Abhaengigkeit. ESM. Exports: `./license`, `./crypto`, `./csv`.

### ui-shared (`@codefabrik/ui-shared`)

Generische Svelte 5 UI-Komponenten fuer alle Desktop-Produkte. ESM. Export: `./components`.

**Components** (`src/components/`):
- `StatusBadge.svelte` — Status-Badges mit automatischer Farb-/Label-Zuordnung
- `SummaryCard.svelte` — Kennzahlen-Karten (Einnahmen, Ausgaben, Gewinn)
- `FormSection.svelte` — Fieldset-Wrapper mit Titel und Hinweis
- `FormRow.svelte` — Flex-Zeile fuer Formularfelder
- `YearNavigator.svelte` — Jahres-Navigation (Pfeile + Label)
- `SettingsSection.svelte` — Abschnitt fuer Einstellungsseiten
- `PageHeader.svelte` — Seitenkopf mit Titel und Aktionen
- `EmptyState.svelte` — Leerzustand-Nachricht

### finanz-shared (`@codefabrik/finanz-shared`)

Geteilter Finanz-Kern fuer Rechnung Lokal (und kuenftige Finanz-Produkte). ESM. Exports: `./db`, `./models`, `./euer`.

**DB** (`src/db/`):
- `schema.js` — Feature-aware Schema (16 Tabellen, 5 Feature-Gruppen: core, invoices, fees, donations, assembly)
- `index.js` — Re-Export

**Models** (`src/models/`):
- `events.js` — EventLog (append-only, HMAC-SHA256 Hash-Kette)
- `profile.js` — Geschaeftsprofil (Singleton)
- `person.js` — Kunden/Mitglieder (Soft-Delete)
- `invoice.js` — Rechnungen (Storno, Vorlagen, Nummernkreis RE-YYYY-NNNN)
- `transaction.js` — Buchungen (Storno mit Gegenbuchung)
- `category.js` — EUeR-Kategorien
- `index.js` — Factory `createModels(deps, features)`

**EUeR** (`src/euer/`):
- `categories.js` — 23 BMF-Kategorien (4 Einnahmen, 19 Ausgaben), `seedCategories()`
- `summary.js` — `annualSummary()`, `monthlySummary()`, `runningSaldo()`

**Tests:** 48 Tests in 6 Dateien.

## Produkte

### Mitglieder lokal (v0.5.0)

Vereinsverwaltung. Bundle: `B-05-verein-ehrenamt`. Hat eigene `CLAUDE.md`.

**Routes:** MemberList, MemberForm, MemberDetail, Payments, Settings, Import, Support
**Libs:** db.js (CRUD + Events + Migrations), crypto.js (HMAC), pdf.js/pdf-lists.js/pdf-mahnbrief.js, csv.js, license.js
**Stores:** members.js, navigation.js (String-basiert: 'list', 'payments', 'add', 'edit:ID', 'detail:ID', 'import', 'settings', 'support')
**Tests:** 74 Tests in 7 Kategorien (Unit, Integration, Migration, Ketten, Replay, Integritaet, Smoke)

### Rechnung Lokal (v0.1.0)

Rechnungsstellung mit E-Rechnung (ZUGFeRD). Bundle: `B-07-rechnung`. Hat eigene `CLAUDE.md`.
Basiert auf `@codefabrik/finanz-shared` Kern mit Feature-Flags.

**Routes:** InvoiceList, InvoiceForm, InvoiceDetail, CustomerList, CustomerForm, EuerOverview, TransactionForm, ProfileSettings, Support
**Libs:** db.js (finanz-shared Init + EUeR Seed + Models)
**Stores:** navigation.js (String-basiert: 'invoices', 'customers', 'euer', 'profile', 'support', 'invoice:ID', 'invoice:edit:ID', 'customer:new', etc.)
**Tests:** (in Aufbau)

### Nachweis Lokal (v0.4.0)

Pruefprotokolle, Checklisten und Nachweise. Bundle: `B-08-nachweis`. Hat eigene `CLAUDE.md`.

**Routes:** Dashboard, TemplateList/Form/Detail, TemplateLibrary, ObjectList/Form/Detail, InspectionList/Form/Execute/Detail, DefectList, DefectDetail, ImportTemplates, Integrity, Settings
**Libs:** db.js (CRUD + Events + Hash-Kette + Attachments + Defects + Recurring + Inspectors + Template-Duplikation), license.js (Probe-Limit 10 Vorlagen), pdf.js (Protokoll/Maengelbericht/Liste/Sammel-PDF + Foto-Einbettung + QR-Code)
**Components:** PhotoAttachment.svelte (Foto-Picker + Thumbnails)
**Stores:** navigation.js, inspections.js (String-basiert: 'dashboard', 'templates', 'objects', 'defects', 'inspections', 'templates:library', 'template:ID', 'object:ID', 'inspection:ID', 'defect:ID', 'inspection:execute:ID')
**Tests:** 98+ Tests in 12 Kategorien (Unit, Schema, Events, Integritaet, Replay, CSV, Smoke, Library, Recurring, Attachments, Defects, Migration)

### Berater Lokal (v0.2.0)

Ganzheitliche Beratungssoftware. Bundle: `B-09-berater`. Hat eigene `CLAUDE.md`.

**Routes:** Dashboard, KundenListe, KundeForm, KundeDetail, KonditionenView, ExcelImport, Integrity, Settings, Support
**Libs:** db.js (CRUD + Events + Hash-Kette + OrgProfile), analyse.js (Lueckenanalyse, 7 Risikobereiche), license.js (Probe-Limit 10 Kunden), pdf.js (Beratungsprotokoll), lebensphase.js, types.js
**Stores:** navigation.js, kunden.js (String-basiert: 'dashboard', 'kunden', 'konditionen', 'import', 'integrity', 'settings', 'kunde:ID', 'kunde-neu', 'kunde-edit:ID')
**Tests:** 45+ Tests in 5 Kategorien (Unit, Events, Integritaet, Analyse, Smoke)

### FinanzRechner lokal (v0.2.0)

Versicherungsrechner. Bundle: `B-24-finanz-rechner`. **Kein DB, kein Event-Log.**

**Routes:** Ratenzuschlag, SpartenDeckung, BeitragsAnpassung, StornoHaftung, CourtagenBarwert, Settings, Support
**Libs:** calculators.js (reine Berechnungslogik), license.js, pdf.js
**Tests:** 23 Tests in 2 Dateien

### FruehwarnReport (v1.0.0)

Python-Anwendung (kein Node.js). Eigenstaendig, nicht im pnpm-Workspace.

## Portal (v0.5.5)

Backend-API. CommonJS (Express.js + PostgreSQL).

**Routes** (`src/routes/`):
- `api-buy.js` — Kaufablauf
- `api-license.js` — Lizenz-Validierung + Key-Recovery (Rate-Limited: 5/IP/Stunde)
- `api-digistore-ipn.js` — Digistore24 IPN-Webhook
- `api-support-ticket.js` — Ticket-CRUD (HMAC-authentifiziert)
- `api-support.js` — Support-Anfragen
- `api-ideas.js` — Feature-Requests
- `api-requests.js` — Anfragen-Routing
- `api-test-reports.js` — Automatische Testergebnisse
- `api-status.js` — System-Health
- `pages.js` — Statische Seiten

**Services** (`src/services/`):
- `license-keygen.js` — CFML-Format Key-Generierung (CRC-8, SAFE_ALPHABET)
- `license.js` — Lizenz-Lifecycle (activateFromIPN, cancelByOrderId, resumeByOrderId, validateForApp, recoverByOrderId)
- `digistore-verify.js` — IPN-Signaturpruefung
- `yaml-generator.js`, `text-generator.js`, `forgejo.js`, `upcloud.js`

**Background Workers:**
- `dispatcher.js` — Order-YAML-Queue (pusht zu Forgejo)
- `watchdog.js` — Health-Monitor + PROD-Status

**Tests:** 127 Tests in 12 Dateien.

## Lizenz-System

### Key-Format
`CFML-XXXX-XXXX-XXXX-XXXX` (Mitglieder lokal) / `CFRL-...` (Rechnung Lokal) / `CFFR-...` (FinanzRechner lokal)
Trial-Prefixes: `CFTM-...` / `CFTL-...` / `CFTR-...`
- SAFE_ALPHABET: keine O/0/I/1/l (Verwechslungsgefahr)
- Letzte 2 Zeichen: CRC-8 Pruefsumme
- Prefix bestimmt Produkt

### 3-Stufen-Validierung (Desktop)
1. **Offline**: Format + CRC-8 pruefen
2. **Online**: Portal `/api/license/validate` aufrufen
3. **Cache**: 30 Tage gueltig, 180 Tage max Offline

### Lifecycle
- `on_payment` → `activateFromIPN()` → Key generieren
- `on_rebill_cancelled` → `cancelByOrderId()` → `auto_renew = false` (Lizenz laeuft bis `expires_at` weiter)
- `on_rebill_resumed` → `resumeByOrderId()` → `expires_at` + 1 Jahr
- Grace Period: 30 Tage nach Ablauf, sofortiger Widerruf bei `revoked`

### HMAC-Hash
License-Key wird nie zum Portal gesendet (fuer Tickets).
Stattdessen: `HMAC-SHA256(key, 'codefabrik-support-v1')` → `license_hash`.

## Support-System

### Datenklassen
- **Klasse A** (Kundendaten): NIEMALS senden
- **Klasse B** (Nutzungsstatistiken): NIEMALS senden
- **Klasse C** (Technische Diagnose): Sicher zu senden

### Support-Bundle-Sanitizer
`support-sanitizer.js` filtert auf Klasse-C:
- Whitelist: `system-info.json`, `case-summary.json`, `integrity-check.json`, `schema-meta.json`
- Pfade werden gescrubbt (Username → `[user]`)
- Logs: Nur Signaturen extrahiert (Error-Codes + Timestamps), keine Rohdaten

### Ticket-Flow
1. Desktop sammelt Bundle → Sanitizer filtert auf Klasse-C
2. `POST /api/support/ticket` mit HMAC-Hash + sanitized kiBundle
3. Ticket-Ref: `CF-YYYY-MM-DD-NNNNN`
4. Desktop zeigt Tickets via `GET /api/support/tickets`

## Architektur-Pflicht (nur Produkte mit DB)

**WICHTIG: Lies `docs/konzept/architektur-integritaet-tests.md` vor DB-Aenderungen.**

### Event-Log
- Jede Schreiboperation → Event in `events`-Tabelle (append-only, HMAC-SHA256 Hash-Kette)
- `appendEvent(type, data)` nach jeder Zustandsaenderung aufrufen
- Events enthalten vollstaendigen Snapshot (nicht nur Diffs)

### Schema-Versionierung
- `_schema_meta`-Tabelle mit aktueller Version
- Inkrementelle Migration fuer max. 3 Minor-Versionen, danach Event-Replay
- Fixture `tests/fixtures/db_vX.Y.Z.sqlite` bei jedem Minor-Release (nie loeschen)

### SQLCipher (ab v0.4)
- DB verschluesselt mit AES-256, Schluessel im OS-Keystore

### Lokales Backup
- Automatisch bei App-Start (wenn letztes > 24h)
- Rotation: 7d taeglich, 4w woechentlich, monatlich

## Test-Pflicht

Kein Release ohne bestandene Tests. Node.js native `test` module.

### 7 Testkategorien (DB-Produkte)
1. **Unit** — `tests/test_*.js` pro Funktion
2. **Integration** — DB + Events zusammen
3. **Migration** — Jedes Fixture migrierbar
4. **Ketten** — v0.1 → v0.2 → ... → aktuell
5. **Replay** — Zustand aus Events = normaler Zustand
6. **Integritaet** — Hash-Kette erkennt Manipulation
7. **Smoke** — App startet, CRUD, PDFs

### Aktuelle Testzahlen (485+ gesamt)
- electron-platform: 94 Tests
- mitglieder-lokal: 74 Tests
- nachweis-lokal: 98+ Tests
- berater-lokal: 45+ Tests
- finanz-shared: 48 Tests
- finanz-rechner: 23 Tests
- portal: 127 Tests

### Tests ausfuehren
```bash
# fnm aktivieren (Node 22)
export PATH="$HOME/.local/share/fnm:$PATH" && eval "$(fnm env)" && fnm use 22

# Einzelnes Package
node --test packages/electron-platform/tests/test_*.js
node --test products/mitglieder-lokal/tests/test_*.js
node --test packages/finanz-shared/tests/test_*.js
node --test products/finanz-rechner/tests/test_*.js
node --test products/nachweis-lokal/tests/test_*.js
node --test products/berater-lokal/tests/test_*.js
node --test portal/test/unit/*.test.js
```

## Stil

- Kein Over-Engineering. MVP = 1 Funktion + Export, max. 2 Wochen.
- Keine Features auf Vorrat.
- Jeder Bug wird zum automatisierten Test.

## Pflege-Regeln

- Jede Story die den Tech-Stack aendert, hat AC: "CLAUDE.md aktualisiert"
- Bei Migration: `docs/governance/migration-checklist.md` als eigene Story abarbeiten
- Vor jedem Minor-Release: `pnpm lint:unused`, `pnpm lint:ansible` und `pnpm lint:migrations` ausfuehren
- Verwaiste Ansible-Rollen und ungenutzte Dependencies sofort entfernen
- Bei jeder neuen Portal-Migration (`portal/src/db/migrate-v*.sql`): Ansible-Rolle `portal-db` wird automatisch erkannt (dynamische Schleife), aber `pnpm lint:migrations` prueft Konsistenz
- `build-installer.sh` fuehrt Lint-Checks automatisch vor dem Tarball-Build aus

### Release-Checkliste (bei jedem neuen Feature)

Jedes Feature das eine Produkt-Funktion aendert oder hinzufuegt MUSS folgende Dateien aktualisieren:

1. **`products/<produkt>/spec.yml`** — Feature-Eintrag (status: done, since: version), version hochzaehlen
2. **`products/<produkt>/package.json`** — version hochzaehlen
3. **`products/<produkt>/CLAUDE.md`** — Aktuelle Version + Feature-Liste
4. **`CLAUDE.md` (Root)** — Produkt-Version + Testzahlen
5. **Portal-DB-Migration** — Falls sich Produktname/Beschreibung/Preis aendert
6. **`VERSION`** — Monorepo-Version bei Release-wuerdigem Aenderungsumfang

## Entwicklungsworkflow: Claude Code <-> Aider + DeepSeek

Grundprinzip: **Planung und Review bei Claude Code, Ausfuehrung bei Aider + DeepSeek.**

1. **Claude Code plant**: Detaillierter Plan (Dateiliste, SQL, Signaturen, Imports, Tests)
2. **Aider + DeepSeek fuehrt aus**: Code schreiben, Dateien erstellen, Migrationen
3. **Claude Code reviewt**: Ergebnis gegen Plan pruefen
4. **Schleife**: Feedback → Korrektur → Review

Pipeline: Poller (systemd Timer, 30s) → Forgejo → Aider (deepseek-v3.1:671b via Ollama.com) → Review → PR → Auto-Merge (Fast Lane) oder Founder Gate (Slow Lane)

Git-User: "Factory Junior" (junior@factory.local)

### Prinzipien
- **Mehr Schleifen, weniger Eigenarbeit**: Planen und reviewen > selbst schreiben
- **Detailgrad**: Plaene muessen ohne Rueckfragen umsetzbar sein
- **Kleine Arbeitspakete**: 5 kleine Schleifen > 1 grosses Paket
- **Test-Gate**: Kein Arbeitspaket fertig ohne gruene Tests

### Agent Teams (Planungsphase)

Fuer Features die mehrere Schichten betreffen (Portal + IPC + App), kann die Planungsphase
mit Agent Teams parallelisiert werden.

**Voraussetzung:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

**Agent-Definitionen:** `.claude/agents/` (4 Agents)

| Agent | Rolle | Modell | Schreibzugriff |
|-------|-------|--------|----------------|
| `planner` | Orchestrator, synthetisiert Plan | Opus | Nur `docs/plans/` |
| `backend-scout` | Portal-API, DB, Migrations-Recherche | Sonnet | Read-only |
| `frontend-scout` | Svelte, IPC, Preload-Recherche | Sonnet | Read-only |
| `arch-scout` | Governance, Import-Grenzen, Tests | Sonnet | Read-only |

**Ablauf:**
1. PO gibt Feature-Beschreibung an `planner`
2. Planner spawnt 3 Scouts parallel (Read-only-Recherche)
3. Scouts liefern strukturierte Findings zurueck
4. Planner synthetisiert zu Plan-Dokument in `docs/plans/<feature>.md`
5. Plan wird an Aider uebergeben (normaler Pipeline-Flow)

**Wann Agent Teams nutzen:**
- Feature betrifft 3+ Schichten (DB + API + IPC + App)
- Bestehender Code muss vorher verstanden werden
- Plan braucht Governance-Pruefung (Founder Gate, Import-Grenzen)

**Wann NICHT:**
- Kleine Bugfixes, Einzeiler, reine UI-Aenderungen
- Features die nur eine Datei betreffen

## Governance (Prozessmodell v2)

**Lies `docs/governance/merge-policy.md` und `docs/governance/protected-paths.yml`.**

### Story-Klassifikation

Jede Story braucht `story_type` und `lane`. Definiert in `docs/governance/story-types.yml`.

- **Fast Lane** (`product-fast`, `shared-pattern`): Auto-Merge, Force-Approve, KI-Review reicht
- **Slow Lane** (alles andere): Kein Auto-Merge, Founder Gate Pflicht

### Founder Gate (geschuetzte Pfade)

Aenderungen erfordern explizite PO-Freigabe:
- `packages/electron-platform/lib/*` und `ipc/*`
- `preload.cjs`, Migrationen, Backup-Kern
- Support-Bundle, Sanitizer, Fehlercodes
- Poller, Ansible, Installationsroutinen
- Diese Datei (`CLAUDE.md`), `docs/governance/`

### Import-Grenzen (CI-geprueft via `scripts/validate-story-governance.mjs`)

- Plattformcode darf keine Produkte importieren
- Renderer darf kein `better-sqlite3`, `electron`, `node:fs`, `node:child_process` importieren
- Shared-Packages duerfen keine Produkte importieren
- Produkte duerfen keine anderen Produkte importieren (nur shared packages)

## Session-Workflow

- Lies `state.md` zu Beginn jeder Session
- Aktualisiere `state.md` nach jedem abgeschlossenen Task
- Aktualisiere `.stories/current.yml` wenn Story-Status sich aendert
- Am Session-Ende: `/review` ausfuehren (aktualisiert state.md, prueft CLAUDE.md, gleicht Story ab)
- Story-Format in state.md: ID + Titel + Status + Lane (aus current.yml)

## Bestehende Konventionen

- Tests: `docs/test-conventions.md`
- Gesamtkonzept: `docs/konzept/gesamtkonzept-v3.md`
- Integritaet: `docs/konzept/architektur-integritaet-tests.md`
- Produktspec MS: `products/mitglieder-lokal/docs/produktspec.md`
- Roadmap: `docs/roadmap/ROADMAP-v0.6.md`

## Infrastruktur (Kurzuebersicht)

- **SSH-Workaround**: `ksshaskpass` ist kaputt (Plasma 6.5). Vor allen Ansible- und SSH-Befehlen `SSH_ASKPASS=""` voranstellen, sonst haengt die Verbindung.
- **26 Ansible-Rollen**, **11 Playbooks** in `ansible/`
- `install.yml` (5 Phasen: Server → DNS → Config → Smoke → push-infra)
- `install-portal.yml` (7 Phasen: Server → DNS → Setup → Secrets → Deploy → DB → Watchdog → Validate)
- **Secrets-Quelle**: KeePass-DB (`~/seafile/ipe-security/Code-Fabrik-V1-0.kdbx`). Alle Scripts die Secrets brauchen (API-Tokens, Passwoerter) MUESSEN aus KeePass lesen (via `pykeepass`), nicht aus Env-Variablen oder Vault-Dateien. Masterpasswort wird interaktiv abgefragt.
- Server: UpCloud DEV-1xCPU-4GB (PROD), DEV-1xCPU-1GB (Portal)

### CI/CD Workflows

**Forgejo Actions** (`.forgejo/workflows/`):
- `lint.yml` — Lint + Validate (knip, ansible, migrations, shellcheck, import-boundaries)
- `test-portal.yml` — Portal-Tests (127 Tests)
- `test-packages.yml` — Package-Tests (electron-platform, finanz-shared)
- `build-installer.yml` — Infra-Tarball + Release
- `validate-governance.yml` — Story-Governance auf PRs

**GitHub Actions** (`.github/workflows/` + `products/<name>/.github/workflows/`):
- `electron-build.yml` — Reusable Workflow: Test → Build (Windows + Linux + macOS)
- Produkt-Workflows rufen `electron-build.yml` auf mit `product_dir` + `artifact_prefix`
