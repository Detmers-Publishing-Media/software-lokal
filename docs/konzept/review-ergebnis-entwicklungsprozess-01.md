# Code-Fabrik — Review-Ergebnis: Entwicklungsprozess

*Stand: 2026-03-07*
*Status: Verabschiedet*
*Bezug: review-prompt-entwicklungsprozess.md*

---

## Gesamturteil

Der Prozess ist grundsaetzlich tragfaehig, aber staerker auf "Automatisierung von
Umsetzung" als auf "gezielte Plattformbildung" optimiert. Fuer ~20 Produkte braucht
er haertere strukturelle Leitplanken.

**Kernaussage:** Guter Fabrikprozess fuer Softwareerzeugung — braucht den naechsten
Reifegrad: einen Fabrikprozess fuer Plattformdisziplin.

---

## Benannte Staerken

1. **Rollenlogik** — Trennung Entscheidung/Umsetzung/Verantwortung sauberer als bei vielen Solo-Setups
2. **Kleine Arbeitspakete** — Plattformfreundlich, ermoeglicht gezielte Grenzpruefung
3. **Dokumentenhierarchie** — Nicht nur Doku, sondern Governance-Struktur (4 Ebenen)
4. **Qualitaetssicherung** — 7 Testkategorien sind nicht nur Produkt-QS, sondern Plattform-QS
5. **Fabrik im Koffer** — Reproduzierbare Herstellungs- und Betriebsumgebung

---

## Identifizierte Risiken

| # | Risiko | Schwere |
|---|---|---|
| 1 | Zu viel Plattform ueber Dokumente, zu wenig ueber technische Guardrails | Hoch |
| 2 | Prozess produziert leicht "guten Produktcode", aber nicht automatisch "gute Plattformbausteine" | Hoch |
| 3 | Infra und Produktplattform konkurrieren um Gruender-Aufmerksamkeit | Mittel |
| 4 | KeePass als zu grosser Single Point of Truth | Mittel (adressiert: Seafile Backup + Rollback) |
| 5 | Hohes Qualitaetsideal mit zu vielen gleichzeitig offenen Fronten | Mittel |

---

## Verabschiedete Massnahmen (Prozessmodell v2)

### 1. Story-Klassifikation mit 6 Typen

| Typ | Beschreibung |
|---|---|
| `product-fast` | Reine Produktfeatures, UI, Fachlogik |
| `shared-pattern` | Wiederverwendbare Module in packages/shared |
| `platform-core` | Aenderungen am Plattformkern (electron-platform) |
| `support-runtime` | Diagnose, Recovery, Support, Fehlercodes |
| `infra-factory` | CI, Automation, Poller, Ansible, Fabrik-im-Koffer |
| `docs-governance` | Verbindliche Architektur- oder Prozessdoku |

### 2. Zwei Prozesspfade: Fast Lane + Slow Lane

**Fast Lane** — fuer product-fast, kleine shared-pattern, harmlose docs:
- Auto-Merge moeglich
- Force-Approve erlaubt
- KI-Review reicht

**Slow Lane** — fuer platform-core, support-runtime, infra-factory:
- Kein Auto-Merge
- Kein Force-Approve
- Founder Gate Pflicht

### 3. Platform Gate

Pflichtfragen vor jeder Plattform-Story:
- Warum Plattformcode und nicht Produktcode?
- Welche Produkte profitieren?
- Welche Schicht wird geaendert?
- Was bleibt bewusst produktspezifisch?
- Welche Risiken fuer andere Produkte?

### 4. Founder Gate

Pflicht bei Aenderungen an:
- packages/electron-platform/lib/*
- packages/electron-platform/ipc/*
- preload.cjs
- Migrations-/Backup-Kern
- Support-Bundle/Sanitizer/Fehlercodes
- Poller/Automation/Installation
- Root-CLAUDE/verbindliche Architektur-Doku

### 5. Force-Approve eingeschraenkt

- Erlaubt: product-fast, kleine Doku-Aenderungen
- Verboten: platform-core, support-runtime, infra-factory, migrationsrelevante shared-pattern

### 6. CI-Gates fuer Plattformdisziplin

Maschinenlesbare Regeln:
- Plattformcode darf keine Produkte importieren
- Testbare Kernlogik darf kein Electron importieren
- Renderer darf kein better-sqlite3 importieren
- Renderer darf keine direkten Node/Electron Low-Level APIs nutzen
- Geschuetzte Pfade erzwingen automatisch Slow Lane

### 7. Story-Template v2

Jede Story enthaelt: story_type, lane, platform_impact, founder_gate_required,
force_approve_allowed, auto_merge_allowed, platform_rationale, non_goals.

### 8. Dokumenten-Klassifikation

| Typ | Beispiele |
|---|---|
| **Verbindlich** | Architekturpflichten, Root-CLAUDE, Testpflichten, PII-Regeln |
| **Planend** | Roadmaps, Umsetzungsplaene, naechste Schritte |
| **Historisch** | Review-Protokolle, alte Bewertungen, Alternativen |

---

## Neue Dateien

| Datei | Zweck |
|---|---|
| `.stories/story.template.yml` | Story-Vorlage mit Governance-Feldern |
| `.stories/current.yml` | Aktive Story fuer CI und Pipeline |
| `docs/governance/merge-policy.md` | Verbindliche Merge-Regeln |
| `docs/governance/protected-paths.yml` | Geschuetzte Pfade + Import-Regeln |
| `scripts/validate-story-governance.mjs` | CI-Guardrail-Script |

---

## Unerwartet gut (Reviewer-Feedback)

1. **Verbindung von Produktplattform und Supportplattform** — Recovery, Diagnose, KI-Auswertbarkeit von Anfang an mitgedacht
2. **Denkweise "jede Plattformentscheidung muss spaeter viele Produkte tragen"** — in Architektur, Doku und Tests sichtbar
3. **"Mehr Schleifen, weniger Gruenderhandarbeit"** — fuer nebenberuflichen Gruender sinnvoll
