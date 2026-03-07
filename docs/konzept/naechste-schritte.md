# Code-Fabrik — Naechste Schritte

*Priorisierte Handlungsempfehlungen, Stand 2026-03-07*
*Grundlage: Gesamtkonzept v3, Lizenzstrategie, Roadmap v0.6*

---

## Sofort (v0.7.0 — Windows-Builds + Referenzkunde)

**Ziel:** Echte EXE-Dateien bauen und an Referenzkunde ausliefern.

1. **GitHub Actions Windows-Build aufsetzen**
   - Workflow `build-windows.yml` in beiden Repos (mitglieder-simple, finanz-rechner)
   - Tauri → Windows EXE + Installer (MSI/NSIS)
   - Build-Artefakte als GitHub Release hochladen

2. **MitgliederSimple an Referenzkunde ausliefern**
   - Windows-EXE lokal testen
   - An Referenzkunde per Mail schicken (Phase 1, lt. Gesamtkonzept Kap. 5.1)
   - Feedback-Schleife: Bug → Test (lt. Kap. 12.1)

3. **"So rechnet dieses Tool" Seite**
   - Berechnungslogik in Alltagssprache (lt. Kap. 12.2)
   - Testbericht oeffentlich einsehbar

---

## Kurzfristig (v0.8.0 — Erster Kauf End-to-End)

**Ziel:** "Geld fliesst" Moment — Referenzkunde kauft ueber Digistore24.

1. **Digistore24 IPN-Handler implementieren**
   - `/api/digistore-ipn` Endpoint auf Portal
   - Key-Generierung (CF-B05-XXXXXXXX-XX)
   - HTTPS auf Portal (Caddy + Let's Encrypt)

2. **Lizenz-Aktivierung in Desktop-Apps**
   - MitgliederSimple: license.js + Settings-UI
   - Finanz-Rechner: Key-Validierung fuer Service-Features (PDF-Export)

3. **End-to-End Test mit echtem Geld**
   - Referenzkunde kauft Support-Abo → Key → Downloads freigeschaltet

---

## Mittelfristig (v0.9.0 — Zweites Produkt)

**Ziel:** Pipeline beweist Multi-Produkt-Faehigkeit.

1. **Zweites B-05-Tool bauen** (wird nach Referenzkunden-Feedback definiert)
2. **Shared Components extrahieren** (`@codefabrik/vereins-shared`)
3. **Pipeline-Beweis:** Zweites Produkt in < 1 Woche durch die Pipeline

---

## Langfristig (v1.0.0 — Go-Live)

**Ziel:** Produktionsbetrieb mit echten Kunden.

1. **24/7 Betrieb** (Nightstop deaktivieren oder konfigurierbar)
2. **Min. 5 Tools B-05 + 3 Tools B-24**
3. **Erster organischer Kunde** (nicht Referenzkunde)
4. **GitHub Repos auf Public umschalten** (GPL 3.0)

---

## Parallel (kein Blocker fuer Produkt-Entwicklung)

- **Geschaeftsplan (v0.5.8):** Business-Plan ueberarbeiten, Preisstruktur, Referenzkunden-Gespraeche
- **Infrastruktur-Haertung:** Erst wenn Produkt und Kunden es erfordern (Wachposten, Restore-Test, CVE-Scan)

---

## Grundprinzipien (als Leitplanken)

- **Fabrik nicht auf Vorrat bauen** (Gesamtkonzept Kap. 7.3) — Pipeline nur so weit erweitern wie das aktuelle Tool es erfordert
- **MVP = 1 Funktion + Export, max. 2 Wochen** (Risiko #1: Feature Creep)
- **Referenzkunden validieren VOR dem Skalieren** (Risiko #2: kein Product-Market-Fit)
- **"Geld fliesst" Moment so frueh wie moeglich** (Risiko #8: kein Umsatz in 6 Monaten)
- **Nicht "50 Tools" versprechen, sondern verkaufen was da ist** (Risiko #3: Bundle-Erwartungsproblem)
- **Alle lokalen Features frei — Key nur fuer Service** (Lizenzstrategie)
