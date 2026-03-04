# MitgliederSimple — Agent-Anweisungen

## Produkt

Mitgliederverwaltung fuer Vereine. Tauri v2 + Svelte 5 + SQLite Desktop-App.
Produktspec: `docs/produktspec.md`
Release-Historie: `docs/RELEASES.md`

## Architektur-Pflicht

**Lies und befolge die uebergeordnete CLAUDE.md im Repo-Root (`../../CLAUDE.md`).**
**Lies und befolge `../../docs/konzept/architektur-integritaet-tests.md` fuer alle DB-Aenderungen.**

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
    db.js           DB-Zugriff (initDb, CRUD, Payments, Events, Migrations)
    types.js        JSDoc Typedefs (Member, FeeClass, ClubProfile, Payment)
    license.js      Probe-Lizenz (30-Mitglieder-Limit)
    crypto.js       HMAC-SHA256 fuer Event-Hash-Kette
    pdf.js          PDF-Basisfunktion (pdfmake)
    pdf-lists.js    5 PDF-Listenfunktionen (inkl. Beitragsuebersicht)
    pdf-mahnbrief.js  Mahnbriefe (3 Stufen)
    csv.js          CSV-Export
    stores/
      members.js    Svelte Stores (members, search, filter)
      navigation.js View-Navigation
  routes/
    MemberList.svelte    Mitgliederliste + Suche + Drucken
    MemberForm.svelte    Anlegen/Bearbeiten + DSGVO-Felder + Limit-Check
    MemberDetail.svelte  Detailansicht + DSGVO-Badges + Zahlungshistorie
    Payments.svelte      Beitragsuebersicht + Zahlungserfassung
    Settings.svelte      Vereinsprofil + Beitragsklassen
    Import.svelte        CSV-Import
  App.svelte             Root-Komponente, Navigation, DB-Init
src-tauri/
  migrations/            SQL-Migrationsdateien (001-005)
  capabilities/          Tauri v2 Permissions
  Cargo.toml             Rust Dependencies
  src/lib.rs             Plugin-Registrierung
tests/
  fixtures/              SQLite-Fixtures pro Version (NIE loeschen)
  test_*.js              Testdateien (node --test)
docs/
  produktspec.md         Produktspezifikation & Release-Planung
  RELEASES.md            Release-Historie & Funktionsuebersicht
demo/
  DEMO-PLAN.md           Drehbuch fuer Demo-Video
```

## DB-Layer (src/lib/db.js)

- `initDb()` fuehrt alle Migrationen aus (001-005)
- `saveMember()` / `deleteMember()` — CRUD + Event
- `savePayment()` / `deletePayment()` — Beitragszahlungen + Event
- `getAnnualOverview(year)` — Soll/Ist-Vergleich pro Mitglied
- `getOverdueMembers(year)` — Mitglieder mit offenen Beitraegen
- `getClubProfile()` / `saveClubProfile()` — Singleton-Tabelle
- `appendEvent()` / `verifyChain()` — Event-Log mit HMAC-Kette

## Svelte 5 Patterns

- Runes: `$state`, `$props`, `$derived`, `$derived.by`, `$effect`
- Stores: `writable`, `derived` aus svelte/store
- Navigation: String-basiert via `currentView` Store ('list', 'payments', 'add', 'edit:ID', 'detail:ID', 'import', 'settings')
- Shared Components: `DataTable`, `SearchBar`, `ExportButton` aus `@codefabrik/vereins-shared/components`

## Aktuelle Version: v0.4.0 "Beitrag"

Features: Mitglieder-CRUD, Beitragsklassen, CSV-Export/Import, DSGVO-Einwilligungen,
Vereinsprofil/Briefkopf, Probe-Lizenz (30 Mitglieder), PDF-Listen (5 Typen),
Beitragsverwaltung (Zahlungserfassung, Jahresuebersicht, Mahnbriefe),
Event-Log mit Hash-Kette, Schema-Versionierung.

74 Tests in 7 Kategorien: Unit, Integration, Migration, Ketten, Replay, Integritaet, Smoke.
