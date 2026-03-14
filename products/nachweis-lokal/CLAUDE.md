# Nachweis Lokal — Agent-Anweisungen

## Produkt

Pruefprotokolle, Checklisten und Nachweise. Electron + Svelte 5 + SQLite Desktop-App.
Lokale Dokumentation wiederkehrender Pruefungen mit revisionssicherer Hash-Kette.

## Architektur-Pflicht

**Lies und befolge die uebergeordnete CLAUDE.md im Repo-Root (`../../CLAUDE.md`).**
**Lies und befolge `../../docs/konzept/architektur-integritaet-tests.md` fuer alle DB-Aenderungen.**

Kurzfassung:
- Jede Schreiboperation → Event in events-Tabelle (append-only, Hash-Kette)
- Schema-Version in `_schema_meta` hochzaehlen bei jeder Modellaenderung
- Soft-Delete fuer Vorlagen und Objekte (active-Flag), Hard-Delete fuer Pruefungen
- Alle 7 Testkategorien muessen bestehen vor Release

## Projektstruktur

```
app.config.cjs        Electron-Konfiguration (CFNW-Prefix)
electron/main.cjs     Electron Entry (nutzt @codefabrik/electron-platform)
src/
  lib/
    db.js             DB-Zugriff (Schema, Templates, Objects, Inspections, Events)
    license.js        Probe-Lizenz (10 Vorlagen Limit)
    pdf.js            PDF-Engine (Protokolle, Maengelberichte, Listen)
    stores/
      navigation.js   View-Navigation (String-basiert)
      inspections.js  Svelte Stores (inspections, search, filter)
  routes/
    Dashboard.svelte         Statistiken + Faelligkeitsuebersicht + Offene Maengel
    TemplateList.svelte      Vorlagenliste
    TemplateForm.svelte      Vorlage anlegen/bearbeiten + Pruefpunkte
    TemplateDetail.svelte    Vorlagendetail + Pruefhistorie
    TemplateLibrary.svelte   Vorlagen-Bibliothek (15 fertige Vorlagen)
    ObjectList.svelte        Objektliste (Geraete, Raeume, Anlagen)
    ObjectForm.svelte        Objekt anlegen/bearbeiten
    ObjectDetail.svelte      Objektdetail + Pruefhistorie
    InspectionList.svelte    Pruefungsliste + Filter + CSV/PDF Export
    InspectionForm.svelte    Neue Pruefung anlegen
    InspectionExecute.svelte Interaktive Pruefungsdurchfuehrung + Fotos + Wiederkehrend
    InspectionDetail.svelte  Ergebnisse + PDF + Fotos + Nachpruefung
    DefectList.svelte        Offene Maengel, gruppiert nach Objekt, filterbar
    DefectDetail.svelte      Einzelansicht, Status-Aenderung, Nachpruefung starten
    ImportTemplates.svelte   CSV-Import fuer Vorlagen
    Integrity.svelte         Hash-Ketten-Verifikation + Event-Log
    Settings.svelte          Organisationsprofil + Supportvertrag
  components/
    PhotoAttachment.svelte   Foto-Picker + Thumbnail-Galerie pro Ergebnis
  assets/
    template-library.json    15 Vorlagen (Brandschutz, Elektro, Spielgeraete, Leitern, Erste-Hilfe, Regale, UVV-Fahrzeug, PSA, Hygiene, Buero, Unterweisung, IT-Serverraum, Aufzug, Legionellen, Fluchtwege)
  App.svelte                Root-Komponente, Navigation, DB-Init
tests/
  fixtures/              SQLite-Fixtures pro Version (NIE loeschen)
  test_*.js              Testdateien (node --test)
```

## DB-Layer (src/lib/db.js)

- `initDb()` erstellt Schema v3 (11 Tabellen, Migration v1→v2→v3 integriert)
- Templates: `getTemplates()`, `saveTemplate()`, `deleteTemplate()` (Soft-Delete)
- Template Items: `getTemplateItems()`, `saveTemplateItems()` (Replace-Strategie)
- Template Library: `importLibraryTemplate(libraryTemplate)` — Import aus Vorlagen-Bibliothek
- Template Duplication: `duplicateTemplate(id)` — Vorlage als Kopie anlegen
- Inspectors: `getInspectors()`, `saveInspector()`, `deleteInspector()` — Prueferverwaltung
- Objects: `getObjects()`, `saveObject()`, `deleteObject()` (Soft-Delete)
- Inspections: `getInspections(filter)`, `saveInspection()`, `deleteInspection()` (Hard-Delete)
- Recurring: `createRecurringInspection(sourceInspectionId)` — Folgepruefung aus Intervall
- Results: `getInspectionResults()`, `saveInspectionResults()`, `initInspectionResults()`
- Attachments: `saveAttachment()`, `getAttachments()`, `getAttachmentsByInspection()`, `deleteAttachment()`
- Defects: `createDefectsFromInspection()`, `getDefects(filter)`, `getDefect()`, `updateDefectStatus()`, `getOpenDefectCount()`, `createReinspection()`
- Dashboard: `getDueInspections()` (Ampellogik), `getInspectionStats()`, `getOpenDefectCount()`
- History: `getObjectHistory(objectId)`
- Profile: `getOrgProfile()`, `saveOrgProfile()`
- Export: `exportInspectionsCSV()`
- Events: `appendEvent()`, `verifyChain()`, `getEvents()`

## Svelte 5 Patterns

- Runes: `$state`, `$props`, `$derived`, `$derived.by`, `$effect`
- Stores: `writable`, `derived` aus svelte/store
- Navigation: String-basiert via `currentView` Store
  - Hauptviews: 'dashboard', 'inspections', 'templates', 'objects', 'defects', 'templates:library', 'import', 'integrity', 'settings', 'support', 'feature-request'
  - Detail: 'template:ID', 'object:ID', 'inspection:ID', 'defect:ID'
  - Formulare: 'template:new', 'template:edit:ID', 'object:new', 'object:edit:ID', 'inspection:new'
  - Spezial: 'inspection:execute:ID'
- Shared Components: `SupportView`, `FeatureRequestView`, `LicenseSection` aus `@codefabrik/app-shared/components`

## Aktuelle Version: v0.3.0

31 Features (20 aus v0.1.0 + 4 aus v0.2.0 + 7 neu in v0.3.0):
- Vorlagen-CRUD mit Pruefpunkten (beliebig viele)
- Objekt-/Gegenstandsverwaltung mit Pruefhistorie
- Pruefungsverwaltung (anlegen, durchfuehren, abschliessen)
- Interaktive Checkliste (OK/Maengel/N/A pro Punkt, Zwischenspeichern)
- Status-Workflow (offen → bestanden/bemaengelt/abgebrochen)
- Dashboard mit Statistiken + Faelligkeits-Ampel + Offene Maengel
- PDF-Pruefprotokoll + Maengelbericht + Pruefungsliste
- CSV-Export + CSV-Import (Vorlagen)
- Organisationsprofil (Briefkopf)
- Event-Log mit HMAC-SHA256 Hash-Kette
- Integritaetspruefung (sichtbar im UI)
- Probe-Lizenz (10 Vorlagen Limit)
- Support-Integration + Feature-Requests
- Vorlagen-Bibliothek (5 → 15 fertige Vorlagen)
- Wiederkehrende Pruefungen (automatische Folgepruefung)
- Foto-Anhaenge (pro Pruefpunkt, Thumbnail-Galerie)
- Maengeltracking (offen/behoben/verifiziert, Nachpruefung)
- **NEU v0.3.0:** Erweiterte Vorlagen-Bibliothek (15 Vorlagen: +Regale, UVV-Fahrzeug, PSA, Hygiene, Buero, Unterweisung, IT-Serverraum, Aufzug, Legionellen, Fluchtwege)
- **NEU v0.3.0:** Sammel-PDF (mehrere Pruefprotokolle in einem Dokument)
- **NEU v0.3.0:** Fotos in PDF (eingebettete Foto-Anhaenge im Pruefprotokoll)
- **NEU v0.3.0:** Vorlagen duplizieren (Kopie erstellen und anpassen)
- **NEU v0.3.0:** Erinnerungen (Warnbanner fuer ueberfaellige/bald faellige Pruefungen)
- **NEU v0.3.0:** Prueferverwaltung (Pruefer mit Rolle/Qualifikation, Autovervollstaendigung)
- **NEU v0.3.0:** QR-Code auf PDF (Pruefungsreferenz zur Zuordnung)
