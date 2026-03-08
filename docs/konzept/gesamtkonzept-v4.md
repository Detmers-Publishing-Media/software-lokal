# Code-Fabrik — Das komplette Bild (v4)

*Stand: März 2026. Löst [Gesamtkonzept v3](gesamtkonzept-v3.md) ab.*
*Produktdetails: siehe `docs/produktstrategie-lokal-tools.md`*

---

## 1. Was Code-Fabrik ist

Code-Fabrik ist eine Software-Manufaktur, die fokussierte Desktop-Tools für Nischenzielgruppen
im DACH-Raum baut. Die Tools werden mit KI-Unterstützung entwickelt, aber die fertigen Tools
enthalten keine KI — sie telefonieren nicht nach Hause, speichern keine Daten in der Cloud
und übertragen nichts.

Der Quellcode ist öffentlich auf GitHub (GPL 3.0). Verkauft wird nicht die Software, sondern
ein Servicepaket: fertige Installer, Updates, Vorlagen, Diagnose und standardisierter Support.
Die Software selbst ist frei. Der Key ist ein Service-Zugangstoken — wie eine Sendungsnummer
bei der Paketverfolgung. Code-Fabrik kennt weder Name noch E-Mail noch Adresse seiner Kunden.

---

## 2. Die vier Versprechen

Alles was Code-Fabrik kommuniziert, folgt vier Versprechen. Sie erscheinen auf jeder Produktseite,
in jedem Tool-About-Dialog und in jeder Kommunikation.

### 2.1 Kein Geheimnis

> Jede Berechnung ist nachprüfbar — die Formeln, die Tests, der Code.
> Vertrauen durch Transparenz, nicht durch Versprechen.

- Jedes Tool hat eine Seite „So rechnet dieses Tool" — verständliche Erklärung in Alltagssprache
- Testberichte sind öffentlich einsehbar
- Quellcode ist offen — Kassenprüfer, Steuerberater, IT-Dienstleister können reinschauen
- Kein Wettbewerber legt offen, wie seine Software rechnet. Code-Fabrik schon.

### 2.2 Keine Cloud

> Ihre Daten bleiben auf Ihrem Rechner.
> Wir sehen nichts, speichern nichts, verkaufen nichts.

- Kein API-Call zu irgendeinem Server während der Nutzung
- Kein Telemetrie, kein Analytics, kein Tracking
- Kein Account, kein Login, keine E-Mail-Adresse nötig
- **Strict no mail:** Die Tools versenden keine E-Mails und fragen nie nach einer E-Mail-Adresse
- Alle Daten in lokalen Dateien (SQLite) auf dem Rechner des Nutzers

**KI-entwickelt, aber KI-frei:** Die Tools werden mit KI-Unterstützung gebaut. Im fertigen Tool
steckt keine KI — keine API-Aufrufe, keine Cloud-Verbindung. Das ist überprüfbar, weil der Code offen ist.

### 2.3 Kein Käfig

> Wenn Sie gehen wollen, nehmen Sie alles mit.
> Daten, Code, alles gehört Ihnen.

- Datenexport in offenen Formaten (CSV, JSON, PDF) immer eingebaut
- GPL-3.0 — jeder IT-Dienstleister kann die Software warten
- Kein Vendor Lock-in, kein proprietäres Datenformat

### 2.4 Kein Kontakt nötig

> Kein Account, kein Login, keine E-Mail-Adresse.
> Ihr Lizenzkey ist Ihr Zugang — wie eine Sendungsnummer bei der Paketverfolgung.

- Code-Fabrik kennt weder Namen, noch E-Mail, noch Adresse der Kunden
- Digistore24 hat die Zahlungsdaten (als Reseller) — Code-Fabrik nicht
- Der Lizenzkey ist das einzige Identifikationsmerkmal im gesamten System
- Support, Downloads, Updates, Feature-Voting — alles läuft über den Key

**Was Code-Fabrik speichert:**
Lizenzkey, Bundle-ID, Erstelldatum, Ablaufdatum, Digistore24-Transaction-ID, Support-Tickets.

**Was Code-Fabrik nicht speichert:**
Name, E-Mail, Adresse, Telefonnummer, IP-Adresse, Browser-Fingerprint, Nutzungsstatistiken.

---

## 3. Produkte

### 3.1 Aktuelle Produkte

| Produkt | Zielgruppe | Status |
|---|---|---|
| **Rechnung Lokal** | Nebenberufler, Kleinunternehmer | In Entwicklung (v1.0 geplant) |
| **Mitglieder Lokal** | Kleine Vereine (30–250 Mitglieder) | v0.5.0 (Neubau auf Shared-Architektur geplant) |
| **FinanzRechner Lokal** | Versicherungsmakler | v0.2.0 |

### 3.2 Produktphilosophie

Produkte sind **fokussierte Einzelprodukte**, nicht Sammlungen von Micro-Tools.
Jedes Produkt löst einen klar abgegrenzten Aufgabenbereich für eine definierte Zielgruppe.

Produkte auf dem Shared-Kern (finanz-shared) sind **Konfigurationen**, nicht eigene Codebasen.
Sie unterscheiden sich in aktivierten Feature-Modulen, Labels und Templates — nicht im Datenmodell.

### 3.3 Entwicklungsreihenfolge

```
Phase 1: finanz-shared Package (Datenmodell, Models, EÜR, PDF, Tests)
Phase 2: Rechnung Lokal v1.0 (beweist Shared-Architektur + ZUGFeRD)
Phase 3: Mitglieder Lokal v2.0 (Neubau auf finanz-shared)
Phase 4: Weitere Produkte (Feature-Aktivierung statt neuem Code)
```

Rechnung Lokal zuerst, weil:

- Kleinerer Scope, schnellerer Markteintritt
- E-Rechnungspflicht ab 2028 erzeugt konkreten Handlungsdruck
- Validiert die Shared-Architektur mit einem echten Produkt

Details: siehe `docs/produktstrategie-lokal-tools.md`

---

## 4. Geschäftsmodell

### 4.1 Open Source plus Servicepaket

```
SOFTWARE (GPL 3.0)
  → Alle lokalen Funktionen frei, kein DRM, kein Nag-Screen
  → Auf GitHub (öffentlich ab v1.0)
  → Key-Check nur für Service-Features (Updates, Support, Templates)

SERVICEPAKET (Dienstleistungsvertrag via Digistore24)
  → 39 EUR pro Jahr pro Produkt
  → Fertige Installer, Updates, Vorlagen, Diagnose, Support
  → Gewährleistung bezieht sich auf den Service, nicht auf Software-Qualität

DISCLAIMER (in jedem Tool)
  → „Organisatorisches Hilfsmittel. Ersetzt keine qualifizierte Fachberatung."
```

### 4.2 Preisstruktur

**39 EUR pro Jahr** pro Produkt. Ein Preis, keine Staffelung.

- Kein Mitglieder-Limit, kein Rechnungs-Limit
- Keine Funktionsstaffel
- Keine kostenlose Light-Version mit künstlichen Sperren
- Kein Upselling

Warum dieser Preis:

- Niedrig genug für ehrenamtliche Vereine und Nebenberufler
- Hoch genug, um preissensitive Problemkunden zu filtern
- Hoch genug, um Service und Infrastruktur zu rechtfertigen
- Einfach genug für Website, Digistore und Gespräche

### 4.3 Digistore24-Produkt pro Produktlinie

```
Produkt 1: „Rechnung Lokal — Servicepaket"    39 EUR/Jahr
Produkt 2: „Mitglieder Lokal — Servicepaket"  39 EUR/Jahr
Produkt 3: „FinanzRechner Lokal — Servicepaket" (bestehend)
```

### 4.4 Key-Format & Validierung

```
Key-Format:  CF[PREFIX]-XXXX-XXXX-XXXX-XXXX
Beispiele:   CFRL-A7K9-M2X4-P3Q8-3F    (Rechnung Lokal)
             CFML-K2M8-P4R6-N7W5-7A    (Mitglieder Lokal)
             CFFR-N3X7-Q1W5-R2T4-2D    (FinanzRechner Lokal)

Prefix bestimmt Produkt. Letzte 2 Zeichen: CRC-8 Prüfsumme.
SAFE_ALPHABET: keine O/0/I/1/l (Verwechslungsgefahr).
```

**3-Stufen-Validierung (Desktop):**

1. **Offline:** Format + CRC-8 prüfen
2. **Online:** Portal `/api/license/validate` aufrufen
3. **Cache:** 30 Tage gültig, 180 Tage max Offline

**Service-Features (nur mit Key):**

- Portal-Zugang (Download, Support-Tickets, Feature-Voting)
- Update-Berechtigung
- Professionelle Templates und gebrandete PDF-Exporte
- Key-Recovery über Digistore24-Bestellnummer

**Lokale Funktionen (ohne Key):**

- Alle Kernfunktionen (CRUD, Export, Berechnung, PDF)
- Vollständig nutzbar, kein Limit, kein Nag-Screen

### 4.5 Zwei Arten von Keys

| | Kostenloser Key (FREE-*) | Bezahlter Key (CF[PREFIX]-*) |
|---|---|---|
| Herkunft | Vom Nutzer selbst erzeugt im Portal | Digistore24-Kauf |
| Berechtigung | Frage stellen, FAQ lesen | Alles: Download, Support, Updates, Voting |
| Support-Antwort | Best effort | 48h Reaktionszeit |
| Feature-Voting | Nein | Ja |
| Downloads | Nein | Ja |

---

## 5. Kommunikation nach dem Sendungsverfolgungsprinzip

Der gesamte Kommunikationsweg läuft über den Lizenzkey — wie eine Sendungsnummer.

### 5.1 Support (bezahlter Key)

```
Nutzer hat Problem → Tool → „Hilfe" → Portal-Link
→ Key eingeben → Support-Ticket erstellen (Freitext, kein Name/Mail nötig)
→ Antwort im Ticket-System sichtbar
→ 48h Reaktionszeit garantiert
```

### 5.2 Fragen (kostenloser Key)

```
Interessent schreibt an E-Mail-Adresse
→ Auto-Reply mit Zufallslink (Einmal-Token)
→ Interessent klickt Link → „Schlüssel erzeugen"
→ Keine Verbindung zwischen E-Mail und Key
→ Frage im Portal eingeben → Antwort best effort
```

### 5.3 Updates

```
Tool prüft beim Start (optional, vom Nutzer angestoßen):
→ GET /api/version/{product}?current=1.2.0
→ „Update verfügbar" Banner → Download im Tool
→ Key bestimmt ob Update-Recht besteht
→ Keine E-Mail „Neues Update verfügbar!"
```

### 5.4 E-Mail als Trichter, nicht als Kanal

Die E-Mail-Adresse existiert wegen Impressum-Pflicht. Sie ist kein Kommunikationskanal.
Jede eingehende Mail erhält einen Auto-Reply mit Zufallslink. Über den Link erzeugt der
Interessent selbst einen kostenlosen Key — ohne Verknüpfung Mail ↔ Key.

Ausnahme: Rechtliche Anfragen (Impressum, Datenschutz, Widerruf) werden direkt per Mail beantwortet.

### 5.5 Erreichbarkeit

```
Primär:     Portal (per Key)
Sekundär:   E-Mail → Auto-Reply mit Zufallslink
Telefon:    Sipgate AB (Impressum-Pflicht + absolute Notfälle)
```

---

## 6. Nicht-Kommunikation: Was auf Verkaufsseiten NICHT steht

| Nicht sagen | Stattdessen sagen |
|---|---|
| „GPL 3.0" | „Kein Geheimnis — der Code ist einsehbar" |
| „Open Source" | „Nachprüfbar — Ihr Kassenprüfer kann reinschauen" |
| „KI-entwickelt" | „Mit modernsten Methoden gebaut und automatisiert getestet" |
| „Keine Gewährleistung" | „Organisatorisches Hilfsmittel — ersetzt keine Fachberatung" |
| „Wir speichern keine E-Mail" | „Kein Account nötig — Ihr Schlüssel ist Ihr Zugang" |
| „DSGVO-konform" | „Wir haben Ihre Daten gar nicht erst" |

Technische Details (Lizenz, Repository, Build-Prozess) gehören auf eine „Für Entwickler"-Seite.

---

## 7. Technischer Stack

### 7.1 Desktop-Produkte

```
Framework:    Electron
UI:           Svelte 5 (Runes: $state, $effect, $derived)
Datenbank:    SQLite (SQLCipher AES-256 ab v0.4)
Build:        Vite, pnpm Workspace
Tests:        Node.js native test module (7 Kategorien)
Code:         Englisch (Variablen, Funktionen), Deutsch (UI-Texte, Dokumentation)
```

### 7.2 Monorepo-Struktur

```
code-fabrik/
  packages/
    electron-platform/     Electron Hauptprozess + IPC + Plattform-Libs
    shared/                Reine JS-Utils (Crypto, CSV, License-Format)
    app-shared/        Svelte 5 Shared Components + DB/License Utils
    finanz-shared/         (NEU) Shared Finanz-Kern (Datenmodell, EÜR, PDF, ZUGFeRD)
    ui-shared/             (NEU) Svelte 5 Shared Views
  products/
    rechnung-simple/       Rechnung Lokal (Electron + Svelte 5 + SQLite)
    mitglieder-lokal/     Mitglieder Lokal (Electron + Svelte 5 + SQLite)
    finanz-rechner/        FinanzRechner Lokal (Electron + Svelte 5, kein DB)
  portal/                  Backend-API (Express.js + PostgreSQL)
  ansible/                 Infrastruktur (26 Rollen, 11 Playbooks)
  scripts/                 Build-, Install-, Validierungs-Scripts
  docs/                    Konzepte, Governance, Runbooks, ADRs, Roadmap
```

### 7.3 Shared-Finanz-Architektur

Produkte auf dem Shared-Kern sind Konfigurationen, nicht eigene Codebasen.

```js
// product.config.js pro Produkt
{
  product: 'rechnung-lokal',
  features: { invoices: true, euer: true, zugferd: true, members: false, ... },
  labels: { person: 'Kunde', profile: 'Geschäftsprofil' }
}
```

Schema wird Feature-aware erzeugt. Migrationen sind Feature-aware.
Event-Replay funktioniert produktübergreifend.

Details: siehe `docs/konzept/produktkonzept-rechnung-lokal.md`

### 7.4 Infrastruktur

```
PROD-Server (UpCloud, DEV-1xCPU-4GB):
  Forgejo (interner Git-Server), OpenClaw (Builds), Poller

Portal-Server (UpCloud, DEV-1xCPU-1GB):
  Express.js (Port 3200), PostgreSQL 16, Caddy, Dispatcher, Watchdog

DNS: Cloudflare
Secrets: KeePass + Ansible Vault
Deployment: Ansible (5+7 Phasen)
CI/CD: Forgejo Actions, GitHub Actions (Windows)
```

---

## 8. Qualitätssystem

### 8.1 Architektur-Integrität (DB-Produkte)

- **Event-Log:** Jede Schreiboperation → Event in append-only Tabelle, HMAC-SHA256 Hash-Kette
- **SQLCipher:** DB verschlüsselt mit AES-256, Schlüssel im OS-Keystore
- **Schema-Versionierung:** `_schema_meta`, inkrementelle Migration (max 3 Versionen), danach Event-Replay
- **Backup:** Automatisch bei App-Start (wenn > 24h), VACUUM INTO, Rotation (7d/4w/12m)

### 8.2 7 Testkategorien

1. **Unit** — Einzelne Funktionen
2. **Integration** — DB + Events zusammen
3. **Migration** — Jedes Fixture migrierbar
4. **Ketten** — v0.1 → v0.2 → ... → aktuell
5. **Replay** — Zustand aus Events = normaler Zustand
6. **Integrität** — Hash-Kette erkennt Manipulation
7. **Smoke** — App startet, CRUD, PDFs

Kein Release ohne bestandene Tests. Bug wird zum automatisierten Test.

### 8.3 „So rechnet dieses Tool"

Jedes Tool bekommt eine verständliche Erklärungsseite — keine Code-Doku, sondern
Alltagssprache. Testberichte sind öffentlich einsehbar.

---

## 9. Go-to-Market

### 9.1 Organisches Wachstum, kein Marketing

```
NICHT:                               STATTDESSEN:
✗ Landingpages mit Conversion-Funnel  ✓ Gute README + Doku auf GitHub
✗ Facebook/Google Ads                 ✓ Paketmanager (winget, scoop)
✗ E-Mail-Marketing                    ✓ Fachforen: Hilfe anbieten, nicht verkaufen
✗ Influencer-Kampagnen                ✓ Mundpropaganda durch zufriedene Nutzer
✗ Newsletter                          ✓ Release Notes auf Portal + GitHub
```

### 9.2 Vertriebsweg ohne Kundendaten

```
1. Nutzer findet Tool (Google, Forum, Mundpropaganda, winget/scoop)
2. Probiert Open-Source-Version oder liest „So rechnet dieses Tool"
3. Will fertige EXE + Support → „Servicepaket kaufen"
4. Digistore24-Bestellseite → Zahlung
5. Danke-Seite zeigt Key + Download-Link
6. KEIN Account, KEINE Registrierung, KEINE E-Mail nötig
```

### 9.3 Payment-Phasen

```
Phase 1 (jetzt):    Manuell per Mail an Referenzkunden
Phase 2 (validiert): Erster echter Digistore24-Kauf
Phase 3 (stabil):    Automatisiert (IPN → Portal → Key → Danke-Seite)
```

---

## 10. Haftung

| Produkt | Risiko | Absicherung |
|---|---|---|
| Rechnung Lokal | **Niedrig-Mittel** — Rechnungsangaben müssen stimmen, ZUGFeRD muss valide sein | Automatisierte Tests gegen ZUGFeRD-Testdaten + Disclaimer |
| Mitglieder Lokal | **Niedrig** — Organisatorisch, Kassenprüfer fängt Fehler auf | Disclaimer |
| Spendenbescheinigung | **Mittel** — §10b EStG, falsche Bescheinigung schadet Spender | BMF-Muster als Vorlage + Disclaimer: Vorstand unterschreibt, nicht das Tool |
| FinanzRechner Lokal | **Niedrig** — Rechner rechnen, beraten nicht | Tests gegen Referenzwerte + Disclaimer |

Genereller Disclaimer in jedem Tool:
> „Organisatorisches Hilfsmittel. Ersetzt keine qualifizierte Fachberatung. Alle Berechnungen ohne Gewähr."

---

## 11. Risiken

| # | Risiko | Stufe | Gegenmaßnahme |
|---|---|---|---|
| 1 | Feature Creep | Hoch | Produktstrategie-Leitlinie als Gate |
| 2 | Kein Product-Market-Fit | Mittel | Referenzkunden validieren vor Skalierung |
| 3 | ZUGFeRD komplexer als erwartet | Mittel | Library evaluieren, offizielle Testdaten |
| 4 | Shared-Datenmodell passt nicht | Niedrig | Rechnung Lokal zuerst beweisen |
| 5 | Pipeline vor Produkt | Hoch | Erst per Mail ausliefern, Fabrik nur so weit wie nötig |
| 6 | Solo-Betrieb, Bus-Faktor 1 | Hoch | Open Source + lokale Daten + Doku + „Fabrik im Koffer" |
| 7 | Kein Umsatz in 6 Monaten | Hoch | Nebenerwerb, kein Kostendruck |
| 8 | Nebenberufler gehen zu lexoffice | Hoch | Akzeptiertes Risiko, organisches Wachstum |
| 9 | KI-Stigma | Mittel | „KI-entwickelt, aber KI-frei" als Differenzierung |

---

## 12. Entscheidungen

### 12.1 Getroffen

| # | Entscheidung | Gewählt | Begründung |
|---|---|---|---|
| E1 | Desktop-Framework | **Electron + Svelte 5** | Bewährt, Cross-Platform, SQLite-Integration |
| E2 | Preis | **39 EUR/Jahr Servicepaket** | Einfach, fair, filtert Problemkunden |
| E3 | Lizenz | **GPL 3.0** | Copyleft schützt vor proprietären Forks |
| E4 | Kundendaten | **Radikal minimal** | Nur Key + Timestamps + Tickets |
| E5 | E-Mail | **Trichter, nicht Kanal** | Auto-Reply → Zufallslink → Key |
| E6 | KI im Tool | **Nein** | KI-entwickelt, aber KI-frei |
| E7 | Strict no mail | **Ja** | Tools versenden/empfangen keine E-Mails |
| E8 | Produktschnitt | **Fokussierte Einzelprodukte** | Statt 50 Micro-Tools pro Bundle |
| E9 | Architektur | **Shared-Kern (finanz-shared)** | Produkte = Konfigurationen |
| E10 | Reihenfolge | **Rechnung Lokal zuerst** | Kleinerer Scope, E-Rechnungspflicht als Markttreiber |
| E11 | Mehrplatz | **Nicht geplant** | Single-User, Backup/Übergabe statt Sync |
| E12 | GitHub-Timing | **Privat bis v1.0, dann Public** | Entwicklung privat, ab v1.0 öffentlich |
| E13 | CI/CD | **GitHub Actions + Forgejo** | GitHub für Builds, Forgejo für Infra |

### 12.2 Offen

| # | Entscheidung | Optionen | Status |
|---|---|---|---|
| O1 | Digistore24 langfristig? | Bleiben vs. Paddle/LemonSqueezy | Nach 6 Monaten evaluieren |
| O2 | Web-Versionen der Rechner? | Ja (SEO) vs. Nein (Fokus) | Nicht priorisiert |
| O3 | ZUGFeRD-Library | factur-x vs. eigene Impl. | Evaluieren in Phase 1 |
| O4 | app-shared Zukunft | Erhalten vs. in finanz-shared/ui-shared aufgehen | Nach Rechnung Lokal v1.0 |

---

## 13. Zusammenfassung

### Was Code-Fabrik ist

Eine Software-Manufaktur für fokussierte, lokale Desktop-Tools. Open Source, cloudfreil,
datensensibel, produktisiert.

### Was Code-Fabrik nicht ist

- **Kein SaaS.** Keine Cloud, kein Login, kein Account.
- **Kein CRM.** Keine Kundendaten — weder Name noch E-Mail noch Adresse.
- **Keine Blackbox.** Offener Code, nachprüfbare Berechnungen.
- **Kein Marketing-Unternehmen.** Organisches Wachstum durch Qualität.
- **Kein KI-im-Tool.** KI-entwickelt, aber das Produkt enthält keine KI.
- **Kein Datensammler.** Kann keine Kundendaten verlieren, weil keine vorhanden.

### Aktueller Fokus

```
Jetzt:     finanz-shared Package aufsetzen
Dann:      Rechnung Lokal v1.0 (ZUGFeRD + EÜR)
Danach:    Mitglieder Lokal v2.0 (Neubau auf Shared-Architektur)
Prinzip:   Lieber kleiner, stabiler und klarer als breiter, lauter und supportintensiver.
```

---

## Referenzen

- **Produktstrategie (beide Produkte):** `docs/produktstrategie-lokal-tools.md`
- **Rechnung Lokal Konzept:** `docs/konzept/produktkonzept-rechnung-lokal.md`
- **Mitglieder Lokal Features:** `products/mitglieder-lokal/docs/feature-uebersicht.md`
- **Mitglieder Lokal Spec:** `products/mitglieder-lokal/docs/produktspec.md`
- **Architektur Integrität:** `docs/konzept/architektur-integritaet-tests.md`
- **Electron-Plattform:** `docs/konzept/electron-plattform-architektur.md`
- **Governance:** `docs/governance/merge-policy.md`
- **Roadmap:** `docs/roadmap/ROADMAP-v0.6.md`
