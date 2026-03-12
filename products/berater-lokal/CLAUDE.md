# Berater Lokal — Agent-Anweisungen

## Produkt

Ganzheitliche Beratungssoftware fuer Finanz- und Versicherungsberater. Electron + Svelte 5 + SQLite Desktop-App.
Kundenverwaltung, Lueckenanalyse, PDF-Beratungsprotokolle und revisionssichere Hash-Kette.

## Architektur-Pflicht

**Lies und befolge die uebergeordnete CLAUDE.md im Repo-Root (`../../CLAUDE.md`).**
**Lies und befolge `../../docs/konzept/architektur-integritaet-tests.md` fuer alle DB-Aenderungen.**

Kurzfassung:
- Jede Schreiboperation → Event in events-Tabelle (append-only, Hash-Kette)
- Schema-Version in `_schema_meta` hochzaehlen bei jeder Modellaenderung
- Alle 7 Testkategorien muessen bestehen vor Release

## Projektstruktur

```
app.config.cjs        Electron-Konfiguration (CFBL-Prefix)
electron/main.cjs     Electron Entry (nutzt @codefabrik/electron-platform)
electron/preload.cjs  Custom Preload (Platform + Excel + dialog:saveFile)
src/
  lib/
    db.js             DB-Zugriff (Schema, CRUD, Events, OrgProfile)
    analyse.js        Lueckenanalyse (7 Risikobereiche, Ampel-Status)
    lebensphase.js    Lebensphasen-Segmentierung
    license.js        Probe-Lizenz (10 Kunden Limit)
    pdf.js            PDF-Engine (Beratungsprotokoll)
    types.js          Option-Listen (Sparten, Typen, Kategorien)
    stores/
      navigation.js   View-Navigation (String-basiert)
      kunden.js       Svelte Stores (kunden, search, filter)
  routes/
    Dashboard.svelte         Statistiken + letzte Kunden
    KundenListe.svelte       Kundenliste mit Suche
    KundeForm.svelte         Kunde anlegen/bearbeiten (Tabs)
    KundeDetail.svelte       Kundendetail + Ampel + PDF-Button
    KonditionenView.svelte   Konditionen-Datenbanken
    ExcelImport.svelte       Excel-Import/Export
    Integrity.svelte         Hash-Ketten-Verifikation + Event-Log
    Settings.svelte          Beraterprofil + Supportvertrag
  App.svelte                Root-Komponente, Navigation, DB-Init
tests/
  helpers/           Mock-Helfer
  test_*.js          Testdateien (node --test)
```

## DB-Layer (src/lib/db.js)

- `initDb()` erstellt Schema v1 (13 Tabellen)
- Kunden: `getKunden()`, `getKunde()`, `getKundeCount()`, `saveKunde()`, `deleteKunde()`
- Kinder: `getKinder()`, `saveKind()`, `deleteKind()`
- Einnahmen: `getEinnahmen()`, `saveEinnahme()`, `deleteEinnahme()`
- Ausgaben: `getAusgaben()`, `saveAusgabe()`, `deleteAusgabe()`
- Policen: `getPolicen()`, `savePolicen()`, `deletePolice()`
- Vermoegen: `getVermoegen()`, `saveVermoegen()`, `deleteVermoegen()`
- Verbindlichkeiten: `getVerbindlichkeiten()`, `saveVerbindlichkeit()`, `deleteVerbindlichkeit()`
- Altersvorsorge: `getAltersvorsorge()`, `saveAltersvorsorge()`, `deleteAltersvorsorge()`
- Konditionen: `getKonditionenVersicherung()`, `getKonditionenDarlehen()`, Bulk-Import
- Profile: `getOrgProfile()`, `saveOrgProfile()`
- Dashboard: `getDashboardStats()`
- Events: `appendEvent()`, `verifyChain()`, `getEvents()`

## Svelte 5 Patterns

- Runes: `$state`, `$props`, `$derived`, `$derived.by`, `$effect`
- Stores: `writable`, `derived` aus svelte/store
- Navigation: String-basiert via `currentView` Store
  - Hauptviews: 'dashboard', 'kunden', 'konditionen', 'import', 'integrity', 'settings', 'feature-request', 'support'
  - Detail: 'kunde:ID'
  - Formulare: 'kunde-neu', 'kunde-edit:ID'
- Shared Components: `SupportView`, `FeatureRequestView`, `LicenseSection` aus `@codefabrik/app-shared/components`

## Aktuelle Version: v0.2.0

Features:
- Kundenverwaltung (Stammdaten, Kinder, Einnahmen, Ausgaben)
- Versicherungsverwaltung (17 Sparten, Bewertung)
- Vermoegen + Verbindlichkeiten + Altersvorsorge
- Lueckenanalyse (7 Risikobereiche, Ampel rot/gelb/gruen)
- PDF-Beratungsprotokoll (Briefkopf, Stammdaten, Haushalt, Analyse, Empfehlungen)
- Konditionen-Datenbanken (Versicherung + Darlehen)
- Excel-Import/Export (Kunden, Konditionen, Templates)
- Beraterprofil (Briefkopf fuer PDFs)
- Event-Log mit HMAC-SHA256 Hash-Kette
- Integritaetspruefung (sichtbar im UI)
- Probe-Lizenz (10 Kunden Limit)
- Support-Integration + Feature-Requests
