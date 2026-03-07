# Code-Fabrik — Roadmap v0.6 bis v1.0

*Stand: 2026-03-07*
*Grundlage: Gesamtkonzept v3 (docs/konzept/gesamtkonzept-v3.md), Lizenzstrategie (docs/konzept/lizenzstrategie.md)*

---

## v0.5.8 "Geschaeftsplan" *(parallel/spaeter)*

**Ziel:** Business-Plan auf Basis Gesamtkonzept v3 ueberarbeiten.
**Typ:** Rein dokumentarisch, kein Code. Kein Blocker fuer v0.6.x.

- [ ] Business-Plan ueberarbeiten (Marktanalyse, Finanzplanung, Zielgruppen)
- [ ] Preisstruktur finalisieren (39/59/79 EUR Staffelung lt. Kap. 4.2)
- [ ] Bundle B-05 Scope definieren: welche 5-8 Tools zum Launch?
- [ ] Digistore24-Produktkonfiguration dokumentieren (Einmalkauf + Abo)
- [ ] Referenzkunden-Gespraechsleitfaden erstellen (lt. Kap. 5.1 + 11.2)
- [ ] Zeitplan fuer Referenzkunden-Gespraeche festlegen

---

## v0.6.0 "Mitglieder" — MitgliederSimple v0.1 ✅

**Status:** Done
**Typ:** Produkt-Entwicklung + Pipeline-Erweiterung.

- [x] MitgliederSimple fertig bauen (Mitgliederliste, CRUD, Datenexport)
- [x] CSV-Export (Semikolon-getrennt, UTF-8 BOM, Excel-kompatibel)
- [x] Phase-0-Tests (node:test — CSV + DB-Layer)
- [x] Produkt in Portal-DB geseeded + Forgejo Release erstellt
- [x] MitgliederSimple v0.3 "Protokoll" (Event-Log, Hash-Kette, 7 Testkategorien)
- [x] MitgliederSimple v0.4 "Beitrag" (Beitragsverwaltung, Zahlungen, Mahnbriefe)
- [ ] Erster Referenzkunden-Test per Mail (Phase 1 lt. Gesamtkonzept Kap. 5.1)
- [ ] Feedback einholen und iterieren

---

## v0.6.3 "Taschenrechner" — Finanz-Rechner MVP ✅

**Status:** Done (v0.1.0 gebaut, auf GitHub gepusht)
**Typ:** Produkt-Entwicklung (neues Bundle) + Geschaeftsmodell-Validierung.

- [x] Finanz-Toolbox als integrierte App
- [x] 5 Makler-Rechner (BeitragsAnpassung, StornoHaftung, Ratenzuschlag, CourtagenBarwert, SpartenDeckungsGrad)
- [x] Transparenz-Box in jedem Rechner
- [ ] PDF-Export (Service-Feature, per Key freigeschaltet)
- [ ] Makler-Validierung (1-2 Test-Makler als Pilotkunden)

---

## v0.6.4–v0.6.7 — Infrastruktur-Haertung ✅

**Status:** Done

- [x] v0.6.4 "Fabrik im Koffer" — Versioned Tarballs, install.sh mit Update-Modus
- [x] v0.6.5 "Lizenzstrategie" — GPL 3.0 + Support-Abo
- [x] v0.6.6 "GitHub CI" — Private Repos + GitHub Actions Workflows
- [x] v0.6.7 "Prozessmodell v2" — Governance-Gates, story-types.yml, CI-Guardrails

---

## v0.7.0 "Pruefstand" — Windows-Builds + Referenzkunde ← **Naechster Meilenstein**

**Ziel:** Echte Windows-EXE-Dateien bauen und an Referenzkunden ausliefern.
**Typ:** Infrastruktur + Produkt-Auslieferung.
**CI-Entscheidung:** GitHub Actions fuer Builds, Forgejo bleibt fuer interne Infra.

### Windows-Builds
- [ ] GitHub Actions Workflow fuer Windows-Build (Tauri → EXE)
- [ ] Installer-Smoke-Tests (EXE installiert, startet, Grundfunktion OK)
- [ ] Build-Artefakte automatisch als GitHub Release hochladen

### Referenzkunden-Auslieferung
- [ ] MitgliederSimple Windows-EXE an Referenzkunde ausliefern
- [ ] Feedback einholen und iterieren
- [ ] "So rechnet dieses Tool" Seite (lt. Gesamtkonzept Kap. 12.2)
- [ ] Testbericht oeffentlich einsehbar

---

## v0.8.0 "Ladenkasse" — Erster Digistore24-Kauf End-to-End

**Ziel:** End-to-End Kaufprozess mit echtem Geld. Key schaltet Service-Features frei.
**Typ:** Integration + Go-Live-Vorbereitung.

### Portal-Integration
- [ ] DB-Schema `orders` (Migration `migrate-v080.sql`)
- [ ] CF-Key-Format in `@codefabrik/shared` (CF-B05-XXXXXXXX-XX + Checksum)
- [ ] IPN-Handler fuer Key-Generierung + Payload-Redaction
- [ ] Lizenz-Validierung (Key → Service-Features freigeschaltet)
- [ ] License-Seite + Recovery (`/license/:order_id`, `/recover`)

### Desktop-Apps
- [ ] MitgliederSimple Lizenz-Aktivierung (license.js, Settings-UI)
- [ ] Finanz-Rechner Key-Validierung (Service-Features freischalten)

### Infrastruktur + Go-Live
- [ ] DNS `digistore.detmers-publish.de` → Portal-IP
- [ ] HTTPS auf Portal (Caddy + Let's Encrypt auf Port 3200)
- [ ] IPN End-to-End mit echtem Geld testen
- [ ] Referenzkunde kauft ueber Digistore24 (Phase 2 lt. Gesamtkonzept Kap. 5.2)
- [ ] Danke-Seite zeigt Key + Download-Link

---

## v0.9.0 "Werkbank" — Zweites Produkt + Multi-Produkt-Beweis

**Ziel:** Pipeline beweist Multi-Produkt-Faehigkeit.
**Typ:** Produkt + Pipeline-Validierung.

- [ ] Zweites B-05-Tool (wird nach Referenzkunden-Feedback definiert)
- [ ] Shared Components `@codefabrik/vereins-shared` extrahieren
- [ ] Zweites Produkt durch Pipeline schleusen (Ziel: < 1 Woche)
- [ ] Portal: zweites Produkt gelistet + downloadbar
- [ ] Beide Produkte im selben Bundle B-05

---

## v1.0.0 "Eroeffnung" — Go-Live

**Ziel:** Produktionsbetrieb mit echten Kunden.
**Typ:** Operations + Go-Live.

- [ ] 24/7 Betrieb (kein Nightstop mehr, oder konfigurierbar)
- [ ] Alerting (Health-Checks, Downtime-Benachrichtigung)
- [ ] Credential-Rotation dokumentiert und getestet
- [ ] Min. 5 Tools in B-05 (Vereine)
- [ ] Min. 3 Tools in B-24 (Finanz-Rechner)
- [ ] Erster organischer Kunde (nicht Referenzkunde)
- [ ] GitHub Organisation — private Repos auf Public umschalten (GPL 3.0)

---

## Infrastruktur-Haertung (wenn Plattform und Produkt es erfordern)

Diese Items werden NICHT vorab gebaut, sondern erst wenn der Produktionsbetrieb es verlangt:

- Wachposten + Briefkasten (24/7 Mini-VPS mit Watchdog)
- Control Plane Trennung (factory-core nur via Blue-Green)
- Automatisierter Restore-Test (woechentlich)
- UpCloud Snapshots bei Nacht-Stopp
- trivy CVE Scan

---

## Offene Entscheidungen (aus Gesamtkonzept Kap. 14)

| # | Thema | Optionen | Entscheidung | Status |
|---|-------|----------|-------------|--------|
| 1 | Finanz-UI-Framework | Svelte vs. React | Svelte (Konsistenz) | Offen (v0.9.0) |
| 2 | Digistore24 langfristig | Bleiben vs. Paddle/LemonSqueezy | Starten, nach 6 Mon. evaluieren | Offen (v1.0.0) |
| 3 | GitHub-Veroeffentlichung | Sofort vs. ab v1.0 | Private Repos bis v1.0, dann Public | **Entschieden** |
| 4 | Web-Versionen der Rechner | Ja (SEO) vs. Nein (Fokus) | Optional, nicht priorisiert | Offen (v1.0.0+) |
| 5 | Einzelverkauf von Tools | Nur Bundle vs. auch Einzel | Nur Bundle | Offen (v0.8.0) |
| 6 | PayPal neben Digistore24 | Fuer Ticket-Verkauf B-05 Events | Evaluieren bei Bedarf | Offen (v1.0.0+) |
| 7 | **Windows CI/CD** | Azure vs. CircleCI vs. GitHub Actions | **GitHub Actions** | **Entschieden** |
| 8 | **Lizenz-Modell** | MIT vs. GPL 3.0 | **GPL 3.0** + Support-Abo | **Entschieden** |
