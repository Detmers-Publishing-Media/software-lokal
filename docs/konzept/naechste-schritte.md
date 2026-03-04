# Code-Fabrik — Naechste Schritte

*Priorisierte Handlungsempfehlungen, Stand 2026-03-04*
*Grundlage: Gesamtkonzept v3 (docs/konzept/gesamtkonzept-v3.md)*

---

## Sofort (v0.5.8 — Geschaeftsplan)

**Ziel:** Entscheidungsgrundlage fuer den Launch schaffen.

1. **Business-Plan ueberarbeiten**
   - Gesamtkonzept v3 als Basis nehmen
   - Finanzplanung: Kosten (UpCloud, Digistore24-Gebuehren, Domain) vs. Einnahmen
   - Break-Even-Rechnung: ab wie vielen Kunden/Monat lohnt es sich?

2. **Bundle B-05 Scope definieren**
   - Welche 5-8 Tools kommen zum Launch?
   - Erstes Tool: Mitgliederverwaltung (MitgliederSimple) — bereits in Entwicklung
   - Weitere Tools nach Referenzkunden-Feedback planen

3. **Preisstruktur festlegen**
   - 39/59/79 EUR Staffelung (lt. Gesamtkonzept Kap. 4.2)
   - Einmalkauf vs. Abo: beide Varianten in Digistore24 anlegen?
   - Bestandskunden-Garantie: "Ihr Preis bleibt"

4. **Referenzkunden-Gespraeche planen**
   - Verein: Gespraechsleitfaden erstellen (lt. Gesamtkonzept Kap. 11.2)
   - Makler: Gespraechsleitfaden erstellen (lt. Gesamtkonzept Kap. 11.3)
   - Termine vereinbaren

---

## Kurzfristig (v0.6.0 — Mitgliederverwaltung)

**Ziel:** Erstes fertiges Produkt an Referenzkunden ausliefern.

1. **MitgliederSimple fertig bauen**
   - Bestehendes Projekt `products/mitglieder-simple/` (SvelteKit + Tauri)
   - Mitgliederliste, CRUD, Datenexport
   - Phase-0-Tests (Forgejo Runner)
   - MVP-Regel: 1 Kernfunktion + Export, max. 2 Wochen (lt. Risiko #1)

2. **Referenzkunde einbinden**
   - Tool per Mail schicken (Phase 1, lt. Gesamtkonzept Kap. 5.1)
   - Feedback-Schleife: Bug → Test (lt. Kap. 12.1)
   - "Nutzt du das wirklich?" → Signal fuer Phase 2

3. **"So rechnet dieses Tool" schreiben**
   - Verstaendliche Erklaerung der Berechnungslogik (lt. Kap. 12.2)
   - Testbericht: Anzahl Tests, was getestet, Ergebnisse
   - Muster fuer alle weiteren Tools setzen

---

## Mittelfristig (v0.6.1 — v0.7.0)

**Ziel:** Vom Prototyp zum kaufbaren Produkt.

1. **Azure Testing aufbauen (v0.6.1)**
   - ADR-009 umsetzen (Test-Server oder Docker-Isolation)
   - Windows-Installer-Validierung automatisieren
   - Tauri-Builds fuer Win/macOS/Linux via OpenClaw

2. **Produktseite im Portal (v0.6.2)**
   - Texte aus spec.yml (Text-Generator existiert bereits)
   - Testbericht oeffentlich
   - Erste echte "Verkaufsseite" (ohne Marketing-Sprache, lt. Kap. 3)

3. **Erster echter Kauf (v0.7.0)**
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
