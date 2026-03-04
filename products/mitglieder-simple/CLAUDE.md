# MitgliederSimple — Agent-Anweisungen

## Produkt

Mitgliederverwaltung fuer Vereine. Tauri v2 + Svelte 5 + SQLite Desktop-App.
Produktspec: `docs/konzept/mitgliederverwaltung-produktspec.md`

## Architektur-Pflicht

**Lies und befolge die uebergeordnete CLAUDE.md im Repo-Root (`../../CLAUDE.md`).**
**Lies und befolge `docs/konzept/architektur-integritaet-tests.md` fuer alle DB-Aenderungen.**

Kurzfassung:
- Jede Schreiboperation → Event in events-Tabelle (append-only, Hash-Kette)
- Schema-Version in `_schema_meta` hochzaehlen bei jeder Modellaenderung
- Migration: max. 3 Versionen inkrementell, danach Event-Replay
- Fixture `tests/fixtures/db_vX.Y.Z.sqlite` bei jedem Minor-Release erzeugen
- Alle 7 Testkategorien muessen bestehen vor Release

## Projektstruktur

```
src/
  lib/
    db.js           DB-Zugriff (initDb, CRUD, Events, Migrations)
    types.js        JSDoc Typedefs (Member, FeeClass, ClubProfile)
    license.js      Probe-Lizenz (30-Mitglieder-Limit)
    pdf.js          PDF-Basisfunktion (pdfmake)
    pdf-lists.js    4 PDF-Listenfunktionen
    csv.js          CSV-Export
    stores/
      members.js    Svelte Stores (members, search, filter)
      navigation.js View-Navigation
  routes/
    MemberList.svelte    Mitgliederliste + Suche + Drucken
    MemberForm.svelte    Anlegen/Bearbeiten + DSGVO-Felder + Limit-Check
    MemberDetail.svelte  Detailansicht + DSGVO-Badges
    Settings.svelte      Vereinsprofil + Beitragsklassen
    Import.svelte        CSV-Import
  App.svelte             Root-Komponente, Navigation, DB-Init
src-tauri/
  migrations/            SQL-Migrationsdateien
  capabilities/          Tauri v2 Permissions
  Cargo.toml             Rust Dependencies
  src/lib.rs             Plugin-Registrierung
tests/
  fixtures/              SQLite-Fixtures pro Version (NIE loeschen)
  test_*.js              Testdateien (node --test)
```

## DB-Layer (src/lib/db.js)

- `initDb()` fuehrt alle Migrationen aus (CREATE TABLE + ALTER TABLE mit try/catch)
- `saveMember()` — INSERT oder UPDATE + Event schreiben
- `deleteMember()` — DELETE + Event schreiben
- `getClubProfile()` / `saveClubProfile()` — Singleton-Tabelle club_profile
- `getActiveMemberCount()` — fuer Probe-Lizenz-Check

## Svelte 5 Patterns

- Runes: `$state`, `$props`, `$derived`, `$derived.by`, `$effect`
- Stores: `writable`, `derived` aus svelte/store
- Navigation: String-basiert via `currentView` Store ('list', 'add', 'edit:ID', 'detail:ID', 'import', 'settings')
- Shared Components: `DataTable`, `SearchBar`, `ExportButton` aus `@codefabrik/vereins-shared/components`

## Aktuelle Version: v0.2.0

Features: Mitglieder-CRUD, Beitragsklassen, CSV-Export/Import, DSGVO-Einwilligungen,
Vereinsprofil/Briefkopf, Probe-Lizenz (30 Mitglieder), PDF-Listen (4 Typen).

Naechste Schritte (v0.3): Event-Log, Schema-Versionierung, Migrations-Tests.
