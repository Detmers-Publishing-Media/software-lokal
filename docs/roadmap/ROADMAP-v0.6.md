# Code-Fabrik — Roadmap v0.5.8 bis v1.0

*Reviewer-Vorschlag, Stand 2026-03-04*
*Grundlage: Gesamtkonzept v3 (docs/konzept/gesamtkonzept-v3.md)*

---

## v0.5.8 "Geschaeftsplan"

**Ziel:** Business-Plan auf Basis Gesamtkonzept v3 ueberarbeiten.
**Typ:** Rein dokumentarisch, kein Code.

- [ ] Business-Plan ueberarbeiten (Marktanalyse, Finanzplanung, Zielgruppen)
- [ ] Preisstruktur finalisieren (39/59/79 EUR Staffelung lt. Kap. 4.2)
- [ ] Bundle B-05 Scope definieren: welche 5-8 Tools zum Launch?
- [ ] Digistore24-Produktkonfiguration dokumentieren (Einmalkauf + Abo)
- [ ] Referenzkunden-Gespraechsleitfaden erstellen (lt. Kap. 5.1 + 11.2)
- [ ] Zeitplan fuer Referenzkunden-Gespraeche festlegen

---

## v0.6.0 "Mitglieder" — Erstes echtes Produkt

**Ziel:** Mitgliederverwaltung (MitgliederSimple) als erste fertige Desktop-App ausliefern.
**Typ:** Produkt-Entwicklung + Pipeline-Erweiterung.
**Basis:** Bestehendes Projekt `products/mitglieder-simple/` (SvelteKit + Tauri).

- [ ] MitgliederSimple fertig bauen (Mitgliederliste, CRUD, Datenexport)
- [ ] Phase-0-Tests auf Forgejo Runner (lt. `docs/test-conventions.md`)
- [ ] Produkt in Portal-DB seeden + Forgejo Release erstellen
- [ ] Erster Referenzkunden-Test per Mail (Phase 1 lt. Gesamtkonzept Kap. 5.1)
- [ ] Feedback einholen und iterieren

---

## v0.6.1 "Pruefstand" — Azure Testing

**Ziel:** Windows-Installer-Validierung automatisieren.
**Typ:** Infrastruktur + CI/CD.

- [ ] ADR-009 umsetzen (Test-Server oder Docker-Isolation, s. `docs/adr/ADR-009`)
- [ ] Phase-1-Tests: Windows-Installer-Validierung (Azure DevOps Pipeline)
- [ ] Tauri-Build fuer Windows/macOS/Linux via OpenClaw
- [ ] Installer-Smoke-Tests (EXE installiert, startet, Grundfunktion OK)
- [ ] Build-Artefakte automatisch in Forgejo Release hochladen

---

## v0.6.2 "Schaufenster"

**Ziel:** Oeffentliche Produktseite im Portal.
**Typ:** Portal-Erweiterung.

- [ ] Produktseite im Portal (Texte aus spec.yml, generiert via Text-Generator)
- [ ] "So rechnet dieses Tool" Seite (lt. Gesamtkonzept Kap. 12.2)
- [ ] Testbericht oeffentlich einsehbar (Anzahl Tests, Ergebnisse)
- [ ] Portal-Navigation erweitern (Produkt-Detailseiten)

---

## v0.7.0 "Ladenkasse" — Erster Digistore24-Kauf

**Ziel:** End-to-End Kaufprozess mit echtem Geld.
**Typ:** Integration + Go-Live-Vorbereitung.

- [ ] Digistore24-Produkt veroeffentlichen (Tab "Liefern" → Auto-Lizenzkeys)
- [ ] Key-Format CF-B05-XXXXXXXX-XX implementieren (statt UUID)
- [ ] Key-Recovery ueber Bestellnummer (`/recover` Route)
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

## v0.9.0 "Marktplatz" — Bundle B-24 (Finanz-Rechner)

**Ziel:** Paralleles Bundle validieren.
**Typ:** Produkt + Geschaeftsmodell-Validierung.

- [ ] Tilgungsplanrechner als erstes B-24-Tool
- [ ] Shared Math-Engine (`@codefabrik/math-engine`)
- [ ] Referenz-Makler-Gespraech (lt. Gesamtkonzept Kap. 11.3)
- [ ] Zweites Digistore24-Produkt (B-24 Bundle)
- [ ] Portal: Bundle-Auswahl auf Produktseite

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
- [ ] Delayed Open Source: erste Repos auf Forgejo oeffentlich (Tag 90+)
- [ ] Optional: GitHub-Mirror fuer Sichtbarkeit

---

## Offene Entscheidungen (aus Gesamtkonzept Kap. 14)

| # | Thema | Optionen | Empfehlung | Entscheidung bis |
|---|-------|----------|------------|-----------------|
| 1 | Finanz-UI-Framework | Svelte vs. React | Svelte (Konsistenz) | v0.9.0 |
| 2 | Digistore24 langfristig | Bleiben vs. Paddle/LemonSqueezy | Starten, nach 6 Mon. evaluieren | v1.0.0 |
| 3 | GitHub-Mirror | Sofort vs. Tag 180 vs. nie | Ab Tag 180 | v1.0.0 |
| 4 | Web-Versionen der Rechner | Ja (SEO) vs. Nein (Fokus) | Optional, nicht priorisiert | v1.0.0+ |
| 5 | Einzelverkauf von Tools | Nur Bundle vs. auch Einzel | Nur Bundle | v0.7.0 |
| 6 | PayPal neben Digistore24 | Fuer Ticket-Verkauf B-05 Events | Evaluieren bei Bedarf | v1.0.0+ |
