# Code-Fabrik — Roadmap v0.5.8 bis v1.0

*Reviewer-Vorschlag, Stand 2026-03-04*
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

## v0.6.0 "Mitglieder" — MitgliederSimple v0.1 ✓

**Ziel:** Mitgliederverwaltung (MitgliederSimple) als erste fertige Desktop-App ausliefern.
**Typ:** Produkt-Entwicklung + Pipeline-Erweiterung.
**Basis:** Bestehendes Projekt `products/mitglieder-simple/` (SvelteKit + Tauri).

- [x] MitgliederSimple fertig bauen (Mitgliederliste, CRUD, Datenexport)
- [x] CSV-Export (Semikolon-getrennt, UTF-8 BOM, Excel-kompatibel)
- [x] Phase-0-Tests (node:test — CSV + DB-Layer)
- [ ] Produkt in Portal-DB seeden + Forgejo Release erstellen
- [ ] Erster Referenzkunden-Test per Mail (Phase 1 lt. Gesamtkonzept Kap. 5.1)
- [ ] Feedback einholen und iterieren

---

## v0.6.1 "Mitglieder v0.2" — MitgliederSimple nach Feedback

**Ziel:** MitgliederSimple v0.2 nach erstem Referenzkunden-Feedback.
**Typ:** Produkt-Iteration.

- [ ] Referenzkunden-Feedback auswerten
- [ ] Weitere Felder / Validierungen (je nach Feedback)
- [ ] CSV-Import Verbesserungen
- [ ] UX-Optimierungen

---

## v0.6.2 "Pruefstand" — GitHub Actions Windows-Builds + EXE-Erstellung

**Ziel:** Windows-EXE-Erstellung und CI/CD fuer Tauri-Apps.
**Typ:** Infrastruktur + CI/CD + Produkt-Iteration.
**Status:** **Aktuell**
**CI-Entscheidung (Maerz 2026):** GitHub Actions fuer oeffentliche Repos, Forgejo bleibt fuer interne Infra.
Grund: Kostenlos fuer Public Repos, kein Mirror noetig, native Windows-Runner.
**Prioritaet:** Naechster Schritt nach Abschluss der Tests — Ziel: echte EXE-Dateien.
**Datentrennung:** GitHub Actions erhaelt nur Quellcode fuer Build + Test, keine persoenlichen
Daten. Forgejo bleibt der fuehrende Git-Host fuer interne Infra. GitHub Actions ist ein reiner
Build-Dienst (kompilieren, testen, EXE erstellen) — keine Kundendaten, keine Lizenzen, keine DB-Zugriffe.

- [ ] GitHub-Repos anlegen (Public, GPL 3.0 Lizenz)
- [ ] GitHub Actions Workflow fuer Windows-Build (Tauri → EXE)
- [ ] Phase-1-Tests: Windows-Installer-Validierung (GitHub Actions)
- [ ] Installer-Smoke-Tests (EXE installiert, startet, Grundfunktion OK)
- [ ] Build-Artefakte automatisch als GitHub Release hochladen
- [ ] Referenzkunden-Feedback auswerten (MitgliederSimple v0.2)
- [ ] "So rechnet dieses Tool" Seite (lt. Gesamtkonzept Kap. 12.2)
- [ ] Testbericht oeffentlich einsehbar (Anzahl Tests, Ergebnisse)

---

## v0.6.3 "Wappen" — Logo-Personalisierung + UX

**Ziel:** Vereine koennen ihr eigenes Logo in der App hinterlegen.
**Typ:** Produkt-Feature.

- [ ] Settings-Seite: Vereinslogo hochladen (PNG/JPG, wird lokal gespeichert)
- [ ] Logo in Sidebar/Titelbereich der App anzeigen
- [ ] Fallback: generisches Platzhalter-Icon wenn kein Logo gesetzt
- [ ] Logo im CSV-Export-Header (optional)

---

## v0.6.4 "Taschenrechner" — Finanz-Rechner MVP (Bundle B-24)

**Ziel:** 5 risikofreie Rechner-Tools fuer Versicherungsmakler als erstes B-24-Produkt.
**Typ:** Produkt-Entwicklung (neues Bundle) + Geschaeftsmodell-Validierung.
**Konzept:** `docs/konzept/finanz-rechner-mvp.md`

### Kern-Deliverables
- [ ] GitHub-Repos anlegen (GPL 3.0, alle Rechner einzeln)
- [ ] Finanz-Toolbox als integrierte App (Key fuer Service-Features)
- [ ] Tauri-Monorepo `products/finanz-rechner/` aufsetzen (Shared UI + Math-Engine)
- [ ] BeitragsAnpassungsRechner (3 Tage)
- [ ] StornoHaftungsRechner (4 Tage)
- [ ] RatenzuschlagRechner (2 Tage)
- [ ] CourtagenBarwertRechner (3 Tage)
- [ ] SpartenDeckungsGrad (4 Tage)
- [ ] Transparenz-Box in jedem Rechner (Formel + Disclaimer sichtbar neben Ergebnis)
- [ ] PDF-Export (Service-Feature, per Key freigeschaltet)

### Portal-Integration
- [ ] Produkt B-24 in Portal-DB seeden
- [ ] Digistore24-Produkt "Finanz-Rechner-Toolbox" anlegen (Support-Abo)

### Qualitaet
- [ ] Automatisierte Berechnungstests (Referenzwerte gegen Excel/Formelsammlung)
- [ ] Oeffentlicher Testbericht pro Rechner
- [ ] Transparenz-Box: Formel, "Was er tut / Was er NICHT tut"

### Makler-Validierung
- [ ] 1-2 Test-Makler als Pilotkunden gewinnen
- [ ] Feedback einholen: Sind die 5 Rechner die richtigen?
- [ ] Erwartungsmanagement: "Was du bekommst / Was du nicht bekommst" (s. Konzept Kap. 5)

**Geschaetzter Aufwand:** 4 Wochen (5 Rechner + PDF + Portal-Integration + Lizenzpruefung)

---

## v0.7.0 "Ladenkasse" — Erster Digistore24-Kauf End-to-End

**Ziel:** End-to-End Kaufprozess mit echtem Geld. Key schaltet Service-Features frei (kein Seat-Modell).
**Typ:** Integration + Go-Live-Vorbereitung.

### Portal-Integration

- [ ] DB-Schema `orders` (Migration `migrate-v070.sql`)
- [ ] CF-Key-Format in `@codefabrik/shared` (CF-B05-XXXXXXXX-XX + Checksum)
- [ ] IPN-Handler fuer Key-Generierung + Payload-Redaction
- [ ] Lizenz-Validierung (Key → Service-Features freigeschaltet)
- [ ] License-Seite + Recovery (`/license/:order_id`, `/recover`)

### Desktop-Apps

- [ ] Finanz-Rechner Key-Validierung (Service-Features freischalten)
- [ ] MitgliederSimple Lizenz-Aktivierung (license.js, Settings-UI)

### Infrastruktur + Go-Live

- [ ] DNS `digistore.detmers-publish.de` → Portal-IP
- [ ] HTTPS auf Portal (Caddy + Let's Encrypt auf Port 3200)
- [ ] IPN End-to-End mit echtem Geld testen
- [ ] Referenzkunde kauft ueber Digistore24 (Phase 2 lt. Gesamtkonzept Kap. 5.2)
- [ ] Danke-Seite zeigt Key + Download-Link

---

## v0.8.0 "Werkbank" — Zweites Produkt

**Ziel:** Pipeline beweist Multi-Produkt-Faehigkeit.
**Typ:** Produkt + Pipeline-Validierung.

- [ ] Zweites B-05-Tool (wird spaeter definiert, nach Referenzkunden-Feedback)
- [ ] Shared Components `@codefabrik/vereins-shared` extrahieren
- [ ] Zweites Produkt durch Pipeline schleusen (Ziel: < 1 Woche)
- [ ] Portal: zweites Produkt gelistet + downloadbar
- [ ] Beide Produkte im selben Bundle B-05

---

## v0.9.0 "Marktplatz" — B-24 Erweiterung + B-21 Start

**Ziel:** Finanz-Rechner-Bundle ausbauen (10-15 weitere Rechner), erstes B-21-Tool.
**Typ:** Produkt-Skalierung + zweites Bundle.

- [ ] B-24 erweitern: TilgungsPlanRechner, EntgeltUmwandlung, SteuerProgression, RiesterZulagen, etc.
- [ ] Shared Math-Engine verfeinern (`@codefabrik/math-engine`)
- [ ] Erstes B-21-Tool (MaklerKartei oder WiederVorlage — nach Makler-Feedback)
- [ ] Portal: Bundle-Auswahl auf Produktseite (B-05, B-24, B-21)
- [ ] Drittes Digistore24-Produkt (B-21 Makler-Buero-Toolbox)

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
- [ ] GitHub Organisation `codefabrik` — private Repos auf Public umschalten
- [ ] Alle Produkt-Repos oeffentlich auf GitHub (GPL 3.0)

---

## Offene Entscheidungen (aus Gesamtkonzept Kap. 14)

| # | Thema | Optionen | Entscheidung | Status |
|---|-------|----------|-------------|--------|
| 1 | Finanz-UI-Framework | Svelte vs. React | Svelte (Konsistenz) | Offen (v0.9.0) |
| 2 | Digistore24 langfristig | Bleiben vs. Paddle/LemonSqueezy | Starten, nach 6 Mon. evaluieren | Offen (v1.0.0) |
| 3 | GitHub-Veroeffentlichung | Sofort vs. ab v1.0 | Entschieden: Private Repos bis v1.0, dann Public | **Entschieden** |
| 4 | Web-Versionen der Rechner | Ja (SEO) vs. Nein (Fokus) | Optional, nicht priorisiert | Offen (v1.0.0+) |
| 5 | Einzelverkauf von Tools | Nur Bundle vs. auch Einzel | Nur Bundle | Offen (v0.7.0) |
| 6 | PayPal neben Digistore24 | Fuer Ticket-Verkauf B-05 Events | Evaluieren bei Bedarf | Offen (v1.0.0+) |
| 7 | **Windows CI/CD** | Azure vs. CircleCI vs. GitHub Actions | **GitHub Actions** (Private Repos im Team-Plan, ab v1.0 kostenlos) | **Entschieden** |
| 8 | **Lizenz-Modell** | MIT vs. GPL 3.0 | **GPL 3.0** + Support-Abo | **Entschieden** |
