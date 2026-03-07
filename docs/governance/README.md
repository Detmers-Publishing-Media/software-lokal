# Code-Fabrik — Governance

*Status: Verbindlich*
*Stand: 2026-03-07*

Dieses Verzeichnis enthaelt die verbindlichen Prozess- und Qualitaetsregeln
der Code-Fabrik. Aenderungen an diesen Dokumenten erfordern Slow Lane + Founder Gate.

## Dokumente

| Datei | Inhalt |
|---|---|
| `story-types.yml` | Story-Typen mit Lanes und Regeln (Single Source of Truth) |
| `merge-policy.md` | Fast Lane / Slow Lane, Gates, Dokumenten-Klassifikation |
| `protected-paths.yml` | Geschuetzte Pfade + Import-Grenzen (maschinenlesbar) |

## Weitere Governance-Artefakte (ausserhalb dieses Verzeichnisses)

| Pfad | Inhalt |
|---|---|
| `.stories/story.template.yml` | Story-Vorlage mit Governance-Feldern |
| `.stories/current.yml` | Aktive Story (fuer CI und Pipeline) |
| `scripts/validate-story-governance.mjs` | CI-Guardrail-Script |
| `CLAUDE.md` | Root-Agenten-Anweisungen (enthaelt Governance-Abschnitt) |

## Bezugsdokumente

| Pfad | Inhalt |
|---|---|
| `docs/konzept/review-ergebnis-entwicklungsprozess.md` | Review-Ergebnis mit verabschiedeten Massnahmen |
| `docs/konzept/architektur-integritaet-tests.md` | Architektur- und Testpflichten |
