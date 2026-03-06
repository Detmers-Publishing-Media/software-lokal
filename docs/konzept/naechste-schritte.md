# Code-Fabrik — Naechste Schritte

*Priorisierte Handlungsempfehlungen, Stand 2026-03-06 (aktualisiert fuer GPL 3.0 + Support-Abo)*
*Grundlage: Gesamtkonzept v3 (docs/konzept/gesamtkonzept-v3.md), Lizenzstrategie (docs/konzept/lizenzstrategie.md)*

---

## Sofort (v0.6.1 — Private Repos + CI vorbereiten)

**Ziel:** Private Repos und CI-Pipeline in GitHub-Organisation aufbauen.

1. **GitHub Organisation `codefabrik` — Private Repos anlegen**
   - Organisation ist angelegt (Team-Plan, bezahlt)
   - Produkt-Repos als **Private Repos** anlegen (Public ab v1.0)
   - GPL 3.0 LICENSE bereits jetzt in die Repos legen (Vorbereitung)

2. **GitHub Actions aufbauen (Private Repos im Team-Plan)**
   - ADR-009 umsetzen (Test-Server oder Docker-Isolation)
   - Windows-Installer-Validierung automatisieren
   - Tauri-Builds fuer Win/macOS/Linux
   - Build-Artefakte als Actions Artifacts (intern, temporaer)

4. **MitgliederSimple v0.1 an Referenzkunde ausliefern**
   - App lokal mit `cargo tauri dev` testen
   - An Referenzkunde per Mail schicken (Phase 1, lt. Gesamtkonzept Kap. 5.1)
   - Feedback-Schleife: Bug → Test (lt. Kap. 12.1)

5. **Geschaeftsplan (v0.5.8, parallel)**
   - Business-Plan ueberarbeiten (Marktanalyse, Finanzplanung)
   - Referenzkunden-Gespraechsleitfaden erstellen

---

## Kurzfristig (v0.6.2 — MitgliederSimple v0.2 nach Feedback)

**Ziel:** Produkt nach Referenzkunden-Feedback iterieren.

1. **Referenzkunden-Feedback auswerten**
   - "Nutzt du das wirklich?" → Signal fuer Phase 2
   - Fehlende Features priorisieren

2. **MitgliederSimple v0.2 bauen**
   - Weitere Felder / Validierungen (je nach Feedback)
   - CSV-Import Verbesserungen, UX-Optimierungen
   - "So rechnet dieses Tool" Seite (lt. Kap. 12.2)

3. **Service-Abo Scope definieren**
   - Welche Support-Leistungen gehoeren zum Abo? (Updates, Hotline, Prioritaets-Tickets)
   - Preisstruktur fuer Support-Abo festlegen (lt. lizenzstrategie.md)

---

## Mittelfristig (v0.7.0)

**Ziel:** Vom Prototyp zum kaufbaren Produkt.

1. **Digistore24 Support-Abo einrichten**
   - Abo-Produkt in Digistore24 anlegen (monatlich/jaehrlich)
   - IPN-Anbindung fuer Abo-Events (Zahlung, Kuendigung, Wiederaufnahme)
   - HTTPS auf Portal (Caddy + Let's Encrypt)

2. **Erster echter Kauf (v0.7.0)**
   - Referenzkunde schliesst Support-Abo ab → "Geld fliesst" Moment (lt. Kap. 5.2)
   - Software bleibt frei (GPL 3.0), Key schaltet Service frei

---

## Langfristig (v0.8.0 — v1.0.0)

**Ziel:** Multi-Produkt-Faehigkeit beweisen und Go-Live.

1. **Zweites Produkt (v0.8.0)**
   - Zweites B-05-Tool (wird nach Referenzkunden-Feedback definiert)
   - Shared Components extrahieren (`@codefabrik/vereins-shared`)
   - Pipeline-Beweis: zweites Produkt in < 1 Woche

2. **Zweites Bundle (v0.9.0)**
   - B-24 Finanz-Rechner: Tilgungsplanrechner
   - Shared Math-Engine
   - Referenz-Makler einbinden

3. **Go-Live (v1.0.0)**
   - 24/7 Betrieb, Alerting, Credential-Rotation
   - Min. 5 Tools B-05 + 3 Tools B-24
   - Erster organischer Kunde
   - GitHub Repos auf Public umschalten (GPL 3.0)
   - Community-Feedback integriert

---

## Offene Entscheidungen

Aus Gesamtkonzept Kap. 14 — muessen im Laufe der Roadmap getroffen werden:

| # | Thema | Status |
|---|-------|--------|
| 1 | **Finanz-UI-Framework:** Svelte vs. React | Offen — vor v0.9.0 (B-24 Start) |
| 2 | **Digistore24 langfristig:** Bleiben vs. Paddle/LemonSqueezy | Offen — nach 6 Monaten Live-Betrieb |
| 3 | **GPL 3.0 Lizenz:** Software frei, Service kostenpflichtig | Entschieden — siehe lizenzstrategie.md |
| 4 | **Web-Versionen der Rechner:** SEO-Hebel vs. Fokus | Offen — nicht priorisiert |
| 5 | **GitHub Actions als CI:** Private Repos (Team-Plan), ab v1.0 kostenlos (Public) | Entschieden — sofort umsetzen |
| 6 | **PayPal neben Digistore24:** Fuer Event-Tickets (B-05) | Offen — bei konkretem Bedarf |

---

## Grundprinzipien (als Leitplanken)

- **Fabrik nicht auf Vorrat bauen** (Gesamtkonzept Kap. 7.3) — Pipeline nur so weit erweitern wie das aktuelle Tool es erfordert
- **MVP = 1 Funktion + Export, max. 2 Wochen** (Risiko #1: Feature Creep)
- **Referenzkunden validieren VOR dem Skalieren** (Risiko #2: kein Product-Market-Fit)
- **"Geld fliesst" Moment so frueh wie moeglich** (Risiko #8: kein Umsatz in 6 Monaten)
- **Nicht "50 Tools" versprechen, sondern verkaufen was da ist** (Risiko #3: Bundle-Erwartungsproblem)
- **Alle lokalen Features frei — Key nur fuer Service** (Lizenzstrategie)
