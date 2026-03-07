# Externer Review-Prompt: Code-Fabrik Prozessmodell v2

*Erstellt: 2026-03-07*
*Zweck: Externer Review der neu eingefuehrten Governance-Struktur (Prozessmodell v2)*

---

## Auftrag an den Reviewer

Bitte bewerte die Governance-Artefakte des Prozessmodells v2 der Code-Fabrik.

**Hintergrund:** Ein vorheriger externer Review hat identifiziert, dass der Entwicklungsprozess
zu stark auf "Automatisierung von Umsetzung" und zu wenig auf "gezielte Plattformbildung"
optimiert war. Die Empfehlung war: haertere strukturelle Leitplanken fuer ~20 geplante Produkte.

Die folgenden Artefakte wurden als Reaktion auf diesen Review erstellt.
Bewerte sie aus der Perspektive eines erfahrenen Software-Architekten / DevOps-Engineers.

---

## Kontext

### Was ist Code-Fabrik?

- Solo-Gruender, keine Angestellten, nebenberuflich
- ~20 geplante Desktop-Produkte (Electron + Svelte + SQLite)
- GPL 3.0 Open Source, Einnahmen ueber Support-Abo via Digistore24
- Drei Rollen: Claude Code (Planer/Reviewer), OpenClaw (Entwickler), Gruender (Entscheider)
- Selbstinstallierende Infrastruktur ("Fabrik im Koffer"): UpCloud + Forgejo + Portal
- Automatisierte Pipeline: Poller (30s) → Dispatch → OpenClaw → Review → PR → Merge

### Vorheriger Review — Identifizierte Risiken

| # | Risiko | Schwere |
|---|---|---|
| 1 | Zu viel Plattform ueber Dokumente, zu wenig ueber technische Guardrails | Hoch |
| 2 | Prozess produziert leicht "guten Produktcode", aber nicht automatisch "gute Plattformbausteine" | Hoch |
| 3 | Infra und Produktplattform konkurrieren um Gruender-Aufmerksamkeit | Mittel |
| 4 | KeePass als zu grosser Single Point of Truth | Mittel |
| 5 | Hohes Qualitaetsideal mit zu vielen gleichzeitig offenen Fronten | Mittel |

### Vorheriger Review — Kernaussage

> Guter Fabrikprozess fuer Softwareerzeugung — braucht den naechsten Reifegrad:
> einen Fabrikprozess fuer Plattformdisziplin.

---

## Artefakt 1: Story-Template v2

Datei: `.stories/story.template.yml`

```yaml
# Code-Fabrik — Story-Template v2
# Kopieren, umbenennen, ausfuellen.

id: "PLAT-XXX"
title: ""
epic: ""
status: "inbox"          # inbox | refined | ready | in_progress | review | done | blocked

# --- Governance (Pflicht ab Prozessmodell v2) ---

story_type: ""
# Erlaubte Werte:
#   product-fast     — Reine Produktfeatures, UI, Fachlogik
#   shared-pattern   — Wiederverwendbare Module in packages/shared
#   platform-core    — Aenderungen am Plattformkern
#   support-runtime  — Diagnose, Recovery, Support, Fehlercodes
#   infra-factory    — CI, Automation, Poller, Ansible, Fabrik-im-Koffer
#   docs-governance  — Verbindliche Architektur- oder Prozessdoku

lane: ""
# Erlaubte Werte:
#   fast   — Auto-Merge moeglich, Force-Approve erlaubt, KI-Review reicht
#   slow   — Kein Auto-Merge, kein Force-Approve, Founder Gate Pflicht

platform_impact: "none"
# Erlaubte Werte: none | low | high
# none = reine Produktaenderung
# low  = beruehrt shared-pattern, aber nicht den Kern
# high = beruehrt Plattformkern, IPC, Preload, Migrationen

founder_gate_required: false
# true wenn: platform-core, support-runtime, infra-factory,
#   oder Aenderungen an geschuetzten Pfaden (siehe protected-paths.yml)

force_approve_allowed: true
# false wenn: platform-core, support-runtime, infra-factory,
#   migrationsrelevante shared-pattern

auto_merge_allowed: true
# false wenn: lane == slow

# --- Platform Gate (nur bei platform_impact != none) ---

platform_rationale: ""
# Warum Plattformcode und nicht Produktcode?

reused_by_products: []
# Welche Produkte profitieren? z.B. ["mitglieder-simple", "kassenbuch"]

non_goals: []
# Was bleibt bewusst produktspezifisch?

# --- Inhalt ---

description: |
  Was soll erreicht werden?

acceptance_criteria:
  - ""

affected_files:
  - ""

depends_on: []

manual_steps: []
# Handoff-Schritte an PO (wenn noetig)

estimated_effort: ""
# XS (< 1h) | S (1-4h) | M (4-8h) | L (1-2d) | XL (> 2d)
```

### Beispiel: Aktive Story (`current.yml`)

```yaml
id: "PLAT-048"
title: "Prozessmodell v2 — Governance-Dateien erstellen"
epic: "PLAT-GOVERNANCE"
status: "in_progress"

story_type: "docs-governance"
lane: "slow"
platform_impact: "high"
founder_gate_required: true
force_approve_allowed: false
auto_merge_allowed: false

platform_rationale: |
  Fuehrt verbindliche Prozessregeln ein, die alle kuenftigen Stories
  und alle Produkte betreffen. Aenderungen am Root-CLAUDE.md und an
  der CI-Pipeline.

reused_by_products: ["alle"]

non_goals:
  - "Keine Codeaenderungen an Produkten"
  - "Kein Electron-Plattform-Umbau (kommt danach)"

description: |
  Umsetzung der verabschiedeten Massnahmen aus dem Entwicklungsprozess-Review:
  Story-Template v2, Merge-Policy, Protected Paths, CI-Guardrails,
  CLAUDE.md-Update mit Governance-Regeln.

acceptance_criteria:
  - "story.template.yml mit allen Governance-Feldern vorhanden"
  - "merge-policy.md beschreibt Fast Lane / Slow Lane verbindlich"
  - "protected-paths.yml definiert geschuetzte Pfade und Import-Grenzen"
  - "validate-story-governance.mjs validiert Story-YAML korrekt"
  - "CLAUDE.md enthaelt Governance-Abschnitt"

affected_files:
  - ".stories/story.template.yml"
  - ".stories/current.yml"
  - "docs/governance/merge-policy.md"
  - "docs/governance/protected-paths.yml"
  - "docs/governance/README.md"
  - "scripts/validate-story-governance.mjs"
  - "CLAUDE.md"

depends_on: []

manual_steps:
  - step: "PO prueft alle Governance-Dateien"
    owner: "PO"
  - step: "PO gibt Founder Gate frei"
    owner: "PO"

estimated_effort: "M"
```

---

## Artefakt 2: Merge-Policy

Datei: `docs/governance/merge-policy.md` — Status: Verbindlich

### Zwei Prozesspfade

**Fast Lane** — fuer `product-fast`, kleine `shared-pattern`, harmlose `docs-governance`:
- Auto-Merge moeglich
- Force-Approve erlaubt
- KI-Review reicht
- Founder Gate nicht erforderlich

**Slow Lane** — fuer `platform-core`, `support-runtime`, `infra-factory`, migrationsrelevante `shared-pattern`:
- Kein Auto-Merge
- Kein Force-Approve
- KI-Review + Founder Gate
- Founder Gate Pflicht

### 6 Story-Typen mit Default-Lane

| Typ | Beschreibung | Default-Lane |
|---|---|---|
| `product-fast` | Reine Produktfeatures, UI, Fachlogik | fast |
| `shared-pattern` | Wiederverwendbare Module in packages/shared | fast* |
| `platform-core` | Aenderungen am Plattformkern | slow |
| `support-runtime` | Diagnose, Recovery, Support, Fehlercodes | slow |
| `infra-factory` | CI, Automation, Poller, Ansible | slow |
| `docs-governance` | Verbindliche Architektur- oder Prozessdoku | slow** |

\* `shared-pattern` wird `slow` wenn migrationsrelevant oder von >2 Produkten genutzt.
\*\* Reine Tippfehler-Korrekturen in Doku koennen `fast` sein.

### Platform Gate

Pflichtfragen vor jeder Story mit `platform_impact != none`:

1. Warum Plattformcode und nicht Produktcode?
2. Welche Produkte profitieren?
3. Welche Schicht wird geaendert?
4. Was bleibt bewusst produktspezifisch?
5. Welche Risiken fuer andere Produkte?

Antworten dokumentiert in: `platform_rationale`, `reused_by_products`, `non_goals`.

### Founder Gate

Pflicht bei Aenderungen an geschuetzten Pfaden. Ablauf:
1. Story wird als `founder_gate_required: true` markiert
2. KI-Review findet statt
3. PO prueft und gibt explizit frei
4. Erst nach PO-Freigabe darf gemergt werden

### Force-Approve Einschraenkung

| Erlaubt | Verboten |
|---|---|
| `product-fast` | `platform-core` |
| Kleine Doku-Korrekturen | `support-runtime` |
| | `infra-factory` |
| | Migrationsrelevante `shared-pattern` |

### Import-Grenzen

| Regel | Beschreibung |
|---|---|
| Plattform → Produkt | Plattformcode darf keine Produkte importieren |
| Renderer → Node | Renderer darf kein `better-sqlite3` importieren |
| Renderer → Electron | Renderer darf keine direkten Electron Low-Level APIs nutzen |
| Shared → Produkt | Shared-Packages duerfen keine Produkte importieren |
| Testbare Kernlogik → Electron | Testbare Kernlogik darf kein Electron importieren |

### Dokumenten-Klassifikation

| Typ | Beispiele | Aenderungsregeln |
|---|---|---|
| **Verbindlich** | Architekturpflichten, CLAUDE.md, Testpflichten, PII-Regeln | Slow Lane + Founder Gate |
| **Planend** | Roadmaps, Umsetzungsplaene | Fast Lane |
| **Historisch** | Review-Protokolle, alte Bewertungen | Fast Lane |

---

## Artefakt 3: Protected Paths

Datei: `docs/governance/protected-paths.yml` — maschinenlesbar, von CI ausgewertet

```yaml
protected_paths:
  # Plattformkern
  - pattern: "packages/electron-platform/lib/**"
    reason: "Plattformkern — alle Produkte betroffen"
  - pattern: "packages/electron-platform/ipc/**"
    reason: "IPC-Schicht — alle Produkte betroffen"
  - pattern: "**/preload.cjs"
    reason: "Preload-Bridge — Sicherheitsgrenze"

  # Migrationen und Backup
  - pattern: "**/migrations/**"
    reason: "Datenbankmigrationen — Datenverlustrisiko"
  - pattern: "**/backup/**"
    reason: "Backup-Kern — Datensicherheit"
  - pattern: "**/lib/backup*.js"
    reason: "Backup-Logik — Datensicherheit"

  # Support und Diagnose
  - pattern: "**/lib/support-bundle*.js"
    reason: "Support-Bundle — Diagnosefaehigkeit"
  - pattern: "**/lib/support-sanitizer*.js"
    reason: "Sanitizer — DSGVO-Konformitaet"
  - pattern: "**/lib/error-codes*.js"
    reason: "Fehlercode-System — Support-Kette"

  # Infrastruktur
  - pattern: "scripts/install*.sh"
    reason: "Installationsroutine — Betriebssicherheit"
  - pattern: "ansible/**"
    reason: "Infrastruktur — Serverkonfiguration"
  - pattern: "**/poller/**"
    reason: "Poller — Pipeline-Kern"

  # Governance
  - pattern: "CLAUDE.md"
    reason: "Root-Agenten-Anweisungen — alle Agenten betroffen"
  - pattern: "docs/governance/**"
    reason: "Verbindliche Governance-Dokumente"
  - pattern: ".stories/story.template.yml"
    reason: "Story-Template — Prozessdefinition"

import_rules:
  - name: "platform-no-product-imports"
    description: "Plattformcode darf keine Produkte importieren"
    source_pattern: "packages/electron-platform/**/*.{js,ts,mjs}"
    forbidden_imports:
      - "products/"
      - "../products/"
      - "../../products/"

  - name: "renderer-no-native-modules"
    description: "Renderer darf kein better-sqlite3 importieren"
    source_pattern: "**/renderer/**/*.{js,ts,svelte,mjs}"
    forbidden_imports:
      - "better-sqlite3"
      - "electron"
      - "node:fs"
      - "node:child_process"
      - "node:crypto"

  - name: "shared-no-product-imports"
    description: "Shared-Packages duerfen keine Produkte importieren"
    source_pattern: "packages/shared/**/*.{js,ts,mjs}"
    forbidden_imports:
      - "products/"
      - "../products/"
      - "../../products/"

  - name: "testable-core-no-electron"
    description: "Testbare Kernlogik darf kein Electron importieren"
    source_pattern: "packages/electron-platform/lib/**/*.{js,ts,mjs}"
    forbidden_imports:
      - "electron"
    exceptions:
      - "packages/electron-platform/lib/app-lifecycle.js"
      - "packages/electron-platform/lib/window-manager.js"
```

---

## Artefakt 4: CI-Guardrail-Script

Datei: `scripts/validate-story-governance.mjs` (~280 Zeilen)

### Was es prueft

1. **Pflichtfelder**: id, title, status, story_type, lane, platform_impact, founder_gate_required, force_approve_allowed, auto_merge_allowed
2. **Gueltiger story_type**: Muss einer der 6 definierten Typen sein
3. **Lane-Konsistenz**: `platform-core`, `support-runtime`, `infra-factory` erzwingen `lane: slow`
4. **Force-Approve-Konsistenz**: Slow-Lane-Typen muessen `force_approve_allowed: false` haben
5. **Auto-Merge-Konsistenz**: `lane: slow` muss `auto_merge_allowed: false` haben
6. **Platform-Gate-Felder**: Bei `platform_impact != none` muessen `platform_rationale` und `reused_by_products` vorhanden sein
7. **Geschuetzte Pfade**: Aenderungen an Pfaden aus `protected-paths.yml` erzwingen `slow` + `founder_gate_required`
8. **Import-Grenzen**: Prueft alle Quelldateien gegen verbotene Imports aus `protected-paths.yml`

### Nutzung

```bash
# Standard: Prueft .stories/current.yml + Import-Grenzen
node scripts/validate-story-governance.mjs

# Mit expliziter Story und geaenderten Dateien
node scripts/validate-story-governance.mjs --story path/to/story.yml --changed-files CLAUDE.md

# Nur Import-Grenzen pruefen
node scripts/validate-story-governance.mjs --check-imports
```

### Testergebnisse

**Test 1: Korrekte Slow-Lane-Story (current.yml)**
```
--- Story Governance Check ---
  OK: All governance checks passed.
--- Import Boundary Check ---
  OK: No import boundary violations.
```

**Test 2: Fast-Lane-Story mit geschuetztem Pfad (CLAUDE.md)**
```
--- Story Governance Check ---
  ERROR: Changed file "CLAUDE.md" matches protected path "CLAUDE.md" — requires lane "slow"
  ERROR: Changed file "CLAUDE.md" matches protected path "CLAUDE.md" — requires founder_gate_required: true
```

### Technische Details

- Kein YAML-Parser als Abhaengigkeit — minimaler Parser eingebaut (~60 Zeilen)
- Import-Pruefung via `find` + Regex auf Import/Require-Statements
- Glob-Pattern-Matching via Regex-Konvertierung (`**` → `.*`, `*` → `[^/]*`)
- Node.js 18+ kompatibel, keine externen Abhaengigkeiten

---

## Artefakt 5: CLAUDE.md Governance-Abschnitt

Neuer Abschnitt in der Root-CLAUDE.md (Agent-Anweisungen fuer alle KI-Agenten):

```markdown
## Governance (Prozessmodell v2)

**WICHTIG: Lies `docs/governance/merge-policy.md` und `docs/governance/protected-paths.yml`.**

### Story-Klassifikation

Jede Story MUSS einen `story_type` und eine `lane` haben (siehe `.stories/story.template.yml`).

| Typ | Default-Lane |
|---|---|
| `product-fast` | fast |
| `shared-pattern` | fast (slow wenn migrationsrelevant) |
| `platform-core` | slow |
| `support-runtime` | slow |
| `infra-factory` | slow |
| `docs-governance` | slow (fast bei Tippfehlern) |

### Fast Lane vs. Slow Lane

- **Fast Lane**: Auto-Merge moeglich, Force-Approve erlaubt, KI-Review reicht
- **Slow Lane**: Kein Auto-Merge, kein Force-Approve, Founder Gate Pflicht

### Founder Gate

Aenderungen an geschuetzten Pfaden (definiert in `docs/governance/protected-paths.yml`)
erfordern **immer** eine explizite PO-Freigabe. Dazu gehoeren u.a.:
- `packages/electron-platform/lib/*` und `ipc/*`
- `preload.cjs`, Migrationen, Backup-Kern
- Support-Bundle, Sanitizer, Fehlercodes
- Poller, Ansible, Installationsroutinen
- Diese Datei (`CLAUDE.md`)
- Alle Dateien unter `docs/governance/`

### Import-Grenzen (CI-geprueft)

- Plattformcode darf keine Produkte importieren
- Renderer darf kein `better-sqlite3`, `electron`, `node:fs`, `node:child_process` importieren
- Shared-Packages duerfen keine Produkte importieren
- Testbare Kernlogik darf kein `electron` importieren (Ausnahmen in `protected-paths.yml`)

### CI-Validierung

Vor jedem Merge prueft `scripts/validate-story-governance.mjs`:
1. Story-YAML hat alle Pflichtfelder
2. Story-Typ und Lane sind konsistent
3. Geschuetzte Pfade erzwingen Slow Lane
4. Import-Grenzen werden eingehalten
```

---

## Artefakt 6: Governance-Uebersicht

Datei: `docs/governance/README.md`

Verweist auf alle Governance-Artefakte:

| Datei | Zweck |
|---|---|
| `docs/governance/merge-policy.md` | Fast/Slow Lane, Story-Klassifikation, Gates |
| `docs/governance/protected-paths.yml` | Geschuetzte Pfade + Import-Grenzen (maschinenlesbar) |
| `.stories/story.template.yml` | Story-Vorlage mit Governance-Feldern |
| `.stories/current.yml` | Aktive Story (fuer CI und Pipeline) |
| `scripts/validate-story-governance.mjs` | CI-Guardrail-Script |
| `CLAUDE.md` | Root-Agenten-Anweisungen (enthaelt Governance-Abschnitt) |

---

## Bestehender Kontext (fuer Tiefe des Reviews)

### Architektur-Pflichten (bereits vor v2 vorhanden)

Jedes Produkt mit Datenbank muss:
- Event-Log mit HMAC-SHA256 Hash-Kette fuehren (append-only)
- Schema-Versionierung mit `_schema_meta`-Tabelle
- 7 Testkategorien bestehen (Unit, Integration, Migration, Kette, Replay, Integritaet, Smoke)
- Bei jedem Minor-Release ein SQLite-Fixture erzeugen
- SQLCipher-Verschluesselung ab v0.4
- Automatisches lokales Backup mit Rotation

### Pipeline-Architektur (bereits vorhanden)

```
Story-YAML in Forgejo → Poller (30s) → Dispatch → OpenClaw (Sonnet) →
KI-Review (Opus) → PR → CI (validate-story-governance.mjs) → Merge
```

### Geplante Electron-Plattform-Architektur

- 34 Arbeitspakete in 6 Phasen
- Monorepo mit `packages/electron-platform/` als Kern
- Produkte in `products/*/` konsumieren die Plattform
- Shared Components in `packages/shared/`
- DSGVO-sichere KI-Support-Architektur (Split-Bundle, Sanitizer, Zwei-Ebenen-KI)
- 4 externe Reviews bereits durchgefuehrt (Grundarchitektur, Katastrophenfestigkeit, KI-Support, DSGVO)

---

## Fragen an den Reviewer

### Governance-Struktur

1. **Vollstaendigkeit**: Decken die 6 Story-Typen alle relevanten Aenderungsarten ab? Fehlt ein Typ (z.B. fuer Security-Patches, Dependency-Updates, Hotfixes)?

2. **Fast/Slow-Abgrenzung**: Ist die Grenze zwischen Fast Lane und Slow Lane sinnvoll gezogen? Gibt es Grenzfaelle, die unklar bleiben?

3. **Platform Gate**: Sind die 5 Pflichtfragen ausreichend, um Fehlentscheidungen bei "Plattform vs. Produkt" zu verhindern? Fehlt eine Frage?

4. **Founder Gate**: Ist die Liste der geschuetzten Pfade vollstaendig? Fehlen kritische Pfade? Sind zu viele Pfade geschuetzt (Gruender-Bottleneck)?

### CI-Durchsetzung

5. **Guardrail-Script**: Ist der minimale YAML-Parser ausreichend robust? Sollte stattdessen eine echte YAML-Bibliothek genutzt werden? Lohnt sich die Zero-Dependency-Entscheidung?

6. **Import-Grenzen**: Sind die 4 Import-Regeln ausreichend? Fehlen Grenzen (z.B. Produkt-A darf nicht Produkt-B importieren)?

7. **Glob-Matching**: Die Konvertierung von Glob-Patterns zu Regex ist vereinfacht. Gibt es Muster, die falsch matchen?

### Skalierung

8. **20-Produkte-Test**: Wenn 20 Produkte parallel entwickelt werden — haelt das Story-YAML-System? Werden Fast/Slow Lane zum Engpass?

9. **Governance-Overhead**: Fuer einen Solo-Gruender mit KI-Agenten — ist der Prozess schlank genug, oder wird der Overhead zur Bremse?

### Integration

10. **Pipeline-Integration**: Die Pipeline (Poller → OpenClaw → Review → Merge) muss das neue Governance-System respektieren. Welche Aenderungen an der Pipeline sind noetig, und welche Risiken entstehen beim Umbau?

11. **CLAUDE.md als Steuerungsinstrument**: CLAUDE.md wird sowohl von Claude Code als auch von OpenClaw gelesen. Ist der Governance-Abschnitt klar genug formuliert, dass KI-Agenten ihn zuverlaessig befolgen?

12. **Konsistenzpruefung**: Wie wird sichergestellt, dass `merge-policy.md`, `protected-paths.yml` und das CI-Script konsistent bleiben, wenn eines der drei geaendert wird?

### Was fehlt?

13. **Top 5 Luecken**: Was sind die 5 wichtigsten Dinge, die im Prozessmodell v2 fehlen?

14. **Was wuerdest du als erstes aendern?**

15. **Was ist unerwartet gut?**
