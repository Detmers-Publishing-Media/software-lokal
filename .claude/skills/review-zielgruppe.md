---
name: review-zielgruppe
description: UX-Review aus Sicht von Kleingewerbe-Gründern — Erwartungsmanagement, sprachliche Zugänglichkeit, Onboarding, Mehrsprachigkeit
user_invocable: true
---

# Review: Zielgruppe & Erwartungshaltung

Führe einen UX-Review von Nachweis Lokal durch mit Fokus auf Kleingewerbe-Gründer und Soloselbständige.

## Zielgruppen-Kontext

Die Hauptzielgruppe umfasst drei Nutzertypen:
1. **Ahnungslose** — wissen nicht, welche Prüfpflichten sie haben
2. **Aufschieber** — wissen es, machen es aber nicht
3. **Hoffnungsvolle** — erwarten, dass die Software alles regelt

Demografisch: 21% der Gründer in DE haben Migrationshintergrund. Häufigste Branchen: Gastronomie, Reinigung, Handwerk, Pflege — alles mit hohen Prüfpflichten. Viele sprechen Deutsch nicht als Muttersprache.

## Prüfbereiche

### 1. Erwartungsmanagement
- Wird sofort klar, dass die App ein Dokumentations-Werkzeug ist, kein Compliance-Berater?
- Vermitteln Hinweistexte (Wizard, Bibliothek, Dashboard) klar, was die App NICHT leistet?
- Kann der Nutzer fälschlich annehmen, er sei "compliant" weil er die App nutzt?
- Ist der Verweis auf BG/SiFa konkret genug? Weiß ein Gründer, was das ist?

### 2. Sprachliche Zugänglichkeit
- Sind Texte in einfachem Deutsch (B1-Niveau)?
- Gibt es unverständliche Fachbegriffe (SiFa, DGUV, Hash-Kette, Integrität)?
- Wäre Übersetzung sinnvoll (Türkisch, Arabisch, Rumänisch, Polnisch)?

### 3. Onboarding für Ahnungslose
- Versteht ein Gründer ohne Prüfpflicht-Wissen, warum er die App braucht?
- Fehlt ein "Warum prüfen?" Abschnitt (Haftung, Versicherung)?
- Ist die Bibliothek nach Branchen filterbar?

### 4. Motivationsdesign
- Positiver Druck ohne zu nerven?
- Belohnung für durchgeführte Prüfungen?
- Aufwand pro Prüfung realistisch niedrig?

### 5. Haftung
- Reichen die Disclaimer rechtlich?
- Fehlt ein expliziter Haftungsausschluss beim ersten Start?

## Vorgehen

1. Lies alle relevanten UI-Dateien (App.svelte, Dashboard, FirstRunWizard, TemplateLibrary, Settings, Bibliothek-JSON)
2. Bewerte jeden Prüfbereich mit konkreten Textstellen
3. Formuliere konkrete Textvorschläge in einfachem Deutsch (B1)
4. Erstelle priorisierte Liste von UX-Änderungen
5. Gib Empfehlung zur Mehrsprachigkeit

## Ausgabe

- Konkrete Textvorschläge (in einfachem Deutsch)
- Priorisierte UX-Änderungen (Quick Wins vs. größere Umbauten)
- Empfehlung Mehrsprachigkeit (ja/nein/später)
- Branchenfilter-Konzept für Bibliothek
