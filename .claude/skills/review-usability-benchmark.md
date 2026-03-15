---
name: review-usability-benchmark
description: Usability-Benchmark gegen Mitbewerber und Top-Notch-Software — Fokus auf Onboarding-Hürden die Nutzung verhindern
user_invocable: true
---

# Usability-Benchmark Review

Führe zwei parallele Reviews durch:

## Review A: Vergleich mit Mitbewerbern

Vergleiche Nachweis Lokal mit den direkten Wettbewerbern im Bereich Prüfprotokoll-/Inspektionssoftware:

**Wettbewerber recherchieren (Web Search):**
- SafetyCulture (iAuditor) — Onboarding, erster Audit, Time-to-Value
- Lumiform — Wizard, Template-Auswahl, erste Inspektion
- firstaudit — Einrichtung, Checklisten-Erstellung
- Checkware, PlanRadar, Pruefplaner (falls Infos verfügbar)

**Für jeden Wettbewerber ermitteln:**
1. Wie viele Schritte bis zur ersten Prüfung?
2. Gibt es einen Einrichtungsassistenten?
3. Wie werden Templates/Checklisten gewählt?
4. Gibt es einen Branchenfilter oder KI-Assistenten?
5. Wann erlebt der Nutzer seinen ersten Erfolg ("Aha-Moment")?
6. Was passiert nach der Installation wenn der Nutzer nichts tut?

**Nachweis Lokal dagegen bewerten:**
- Wo sind wir besser?
- Wo sind wir schlechter?
- Was können wir kopieren (Best Practice)?

## Review B: Vergleich mit Top-Notch-Onboarding

Analysiere Software-Produkte die für exzellentes Onboarding bekannt sind — insbesondere solche wo die Konfiguration komplex ist aber die tägliche Nutzung einfach:

**Referenzprodukte (Web Search für aktuelle Onboarding-Patterns):**
- Notion — leere Seite vs. Templates, was macht den Einstieg schwer?
- Canva — wie führt Canva Anfänger zur ersten Grafik?
- Todoist/Things — einfache App, aber Setup bestimmt den Erfolg
- Trello — Board-Metapher sofort verständlich?
- 1Password — Sicherheits-Setup als Hürde
- Home Assistant — komplexe Konfiguration, Automatisierung danach einfach
- Steuersoftware (WISO, Lexware) — Wizard als Kern-Erlebnis

**Patterns identifizieren:**
1. **Time-to-First-Value:** Wie schnell erlebt der Nutzer einen Erfolg?
2. **Progressive Disclosure:** Was wird zuerst gezeigt, was versteckt?
3. **Guided vs. Exploratory:** Führung vs. Selbstentdeckung?
4. **Empty State Design:** Was sieht der Nutzer bei einer leeren App?
5. **Template-First vs. Build-First:** Vorlage übernehmen oder selbst bauen?
6. **Commitment Escalation:** Kleine Schritte die zum nächsten führen?

## Das Kernproblem analysieren

**Die Konfiguration verhindert die Nutzung.**

Software wird runtergeladen aber nicht genutzt weil:
- Der Wizard zu viele Fragen stellt bevor man etwas tun kann
- Der Nutzer nicht weiß was er konfigurieren soll
- Die erste echte Aktion (Prüfung durchführen) zu weit weg ist
- Der Nutzer bei "Welche Checklisten?" aufhört weil er es nicht weiß

**Für Nachweis Lokal konkret prüfen:**
1. Wie viele Klicks von App-Start bis zur ersten abgeschlossenen Prüfung?
2. Kann ein Nutzer in 2 Minuten eine Prüfung durchführen (ohne Konfiguration)?
3. Was passiert wenn der Nutzer den Wizard abbricht?
4. Gibt es einen "Sofort loslegen" Modus (null Konfiguration)?

## Gewünschtes Ergebnis

1. **Benchmark-Tabelle:** Nachweis Lokal vs. 3 Wettbewerber (Schritte, Time-to-Value, Features)
2. **Top-5 Onboarding-Patterns** die wir übernehmen sollten
3. **Konkreter Vorschlag** für einen "Zero-Config-Start":
   - Nutzer öffnet App → sieht sofort eine Demo-Prüfung die er durchführen kann
   - Erst NACH der ersten Prüfung: "Möchten Sie eigene Checklisten einrichten?"
4. **Architektur-Empfehlung:** Wizard vs. Progressive Disclosure vs. Demo-Modus
5. **Priorisierte Maßnahmen** (Quick Wins vs. größere Umbauten)
