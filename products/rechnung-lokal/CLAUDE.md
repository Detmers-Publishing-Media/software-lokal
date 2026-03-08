# Rechnung Lokal — Agent-Anweisungen

## Produkt

Rechnungsstellung mit E-Rechnung (ZUGFeRD) fuer Nebenberufler und Kleinunternehmer.
Electron + Svelte 5 + SQLite Desktop-App auf dem finanz-shared Kern.

## Architektur-Pflicht

**Lies und befolge die uebergeordnete CLAUDE.md im Repo-Root (`../../CLAUDE.md`).**
**Lies und befolge `../../docs/konzept/architektur-integritaet-tests.md` fuer alle DB-Aenderungen.**

Kurzfassung:
- Jede Schreiboperation → Event in events-Tabelle (append-only, Hash-Kette)
- Schema-Version in `_schema_meta` hochzaehlen bei jeder Modellaenderung
- Storno statt Loeschen (Rechnungen und Buchungen)
- Alle Testkategorien muessen bestehen vor Release

## Projektstruktur

```
product.config.js     Feature-Flags (invoices, customers, euer, zugferd)
app.config.cjs        Electron-Konfiguration
electron/main.cjs     Electron Entry (nutzt @codefabrik/electron-platform)
src/
  lib/
    db.js             DB-Init (finanz-shared Schema + Models + EUeR Seed)
    stores/
      navigation.js   View-Navigation (String-basiert)
  routes/
    InvoiceList.svelte     Rechnungsliste + Filter
    InvoiceForm.svelte     Rechnung erstellen/bearbeiten
    InvoiceDetail.svelte   Rechnungsdetail + Aktionen
    CustomerList.svelte    Kundenliste + Suche
    CustomerForm.svelte    Kunde anlegen/bearbeiten
    EuerOverview.svelte    Jahres-/Monatsuebersicht
    TransactionForm.svelte Buchung erfassen
    ProfileSettings.svelte Geschaeftsprofil
  App.svelte              Root-Komponente, Navigation, DB-Init
tests/
  test_*.js              Testdateien (node --test)
```

## Shared Packages

- `@codefabrik/finanz-shared` — Datenmodell, Models (Person, Invoice, Transaction, Category, EventLog), EUeR
- `@codefabrik/electron-platform` — Electron Main-Prozess, IPC, Backup, License, Support
- `@codefabrik/shared` — Crypto (HMAC), CSV, License-Format
- `@codefabrik/app-shared` — DB IPC Wrapper, Shared Components (SupportView, LicenseSection)

## Svelte 5 Patterns

- Runes: `$state`, `$props`, `$derived`, `$derived.by`, `$effect`
- Stores: `writable` aus svelte/store
- Navigation: String-basiert via `currentView` Store
  - Hauptviews: 'invoices', 'customers', 'euer', 'profile', 'support'
  - Detail: 'invoice:ID', 'customer:ID'
  - Formulare: 'invoice:new', 'invoice:edit:ID', 'customer:new', 'customer:edit:ID', 'transaction:new'

## Aktuelle Version: v0.1.0

Features in Entwicklung: Rechnungs-CRUD, Kundenverwaltung, EUeR-Uebersicht,
Geschaeftsprofil, Storno, Vorlagen, Kleinunternehmer-Modus.
Geplant: ZUGFeRD PDF/A-3, PDF-Rechnungen, Backup.

## Regulatorisch

- Pflichtangaben §14 UStG: automatisch aus Geschaeftsprofil
- Kleinunternehmer §19 UStG: Profil-Einstellung
- Fortlaufende Rechnungsnummern: konfigurierbar
- Aufbewahrung 10 Jahre: Storno statt Loeschen
- GoBD-Prozessunterstuetzung: Event-Log mit Hash-Kette
- Haftungsausschluss: "Organisatorisches Hilfsmittel, ersetzt keine Steuerberatung"
