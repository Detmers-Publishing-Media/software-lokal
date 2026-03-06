# Code-Fabrik — Naechste Schritte

*Priorisierte Handlungsempfehlungen, Stand 2026-03-04 (aktualisiert fuer v0.6.0)*
*Grundlage: Gesamtkonzept v3 (docs/konzept/gesamtkonzept-v3.md)*

---

## Sofort (v0.6.1 — Azure Testing vorbereiten)

**Ziel:** Windows-Builds fuer MitgliederSimple automatisieren.

1. **Azure Testing aufbauen**
   - ADR-009 umsetzen (Test-Server oder Docker-Isolation)
   - Windows-Installer-Validierung automatisieren
   - Tauri-Builds fuer Win/macOS/Linux via OpenClaw

2. **MitgliederSimple v0.1 an Referenzkunde ausliefern**
   - App lokal mit `cargo tauri dev` testen
   - An Referenzkunde per Mail schicken (Phase 1, lt. Gesamtkonzept Kap. 5.1)
   - Feedback-Schleife: Bug → Test (lt. Kap. 12.1)

3. **Geschaeftsplan (v0.5.8, parallel)**
   - Business-Plan ueberarbeiten (Marktanalyse, Finanzplanung)
   - Preisstruktur finalisieren (39/59/79 EUR Staffelung)
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

3. **Bundle B-05 Scope definieren**
   - Welche 5-8 Tools kommen zum Launch?
   - Weitere Tools nach Referenzkunden-Feedback planen

---

## Mittelfristig (v0.7.0)

**Ziel:** Vom Prototyp zum kaufbaren Produkt.

1. **Erster echter Kauf (v0.7.0)**
   - Digistore24-Produkt veroeffentlichen
   - Key-Format CF-B05-XXXXXXXX-XX
   - HTTPS auf Portal (Caddy + Let's Encrypt)
   - Referenzkunde kauft ueber Digistore24 → "Geld fliesst" Moment (lt. Kap. 5.2)

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
   - Delayed Open Source: erste Repos oeffentlich (Tag 90+)

---

## Offene Entscheidungen

Aus Gesamtkonzept Kap. 14 — muessen im Laufe der Roadmap getroffen werden:

| # | Thema | Wann relevant |
|---|-------|--------------|
| 1 | **Finanz-UI-Framework:** Svelte vs. React | Vor v0.9.0 (B-24 Start) |
| 2 | **Digistore24 langfristig:** Bleiben vs. Paddle/LemonSqueezy | Nach 6 Monaten Live-Betrieb |
| 3 | **GitHub-Mirror:** Ab Tag 180 fuer Sichtbarkeit? | Vor v1.0.0 |
| 4 | **Web-Versionen der Rechner:** SEO-Hebel vs. Fokus | Optional, nicht priorisiert |
| 5 | **Einzelverkauf von Tools:** Nur Bundle vs. auch Einzel | Vor v0.7.0 (Preisstruktur) |
| 6 | **PayPal neben Digistore24:** Fuer Event-Tickets (B-05) | Bei konkretem Bedarf |

---

## Grundprinzipien (als Leitplanken)

- **Fabrik nicht auf Vorrat bauen** (Gesamtkonzept Kap. 7.3) — Pipeline nur so weit erweitern wie das aktuelle Tool es erfordert
- **MVP = 1 Funktion + Export, max. 2 Wochen** (Risiko #1: Feature Creep)
- **Referenzkunden validieren VOR dem Skalieren** (Risiko #2: kein Product-Market-Fit)
- **"Geld fliesst" Moment so frueh wie moeglich** (Risiko #8: kein Umsatz in 6 Monaten)
- **Nicht "50 Tools" versprechen, sondern verkaufen was da ist** (Risiko #3: Bundle-Erwartungsproblem)
