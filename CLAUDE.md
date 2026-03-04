# Code-Fabrik — Agent-Anweisungen

## Projekt

Code-Fabrik ist eine Software-Manufaktur fuer fokussierte Desktop-Tools (Tauri + Svelte + SQLite).
Monorepo mit Portal, Produkten und Infrastruktur.

## Sprache

- Code: Englisch (Variablen, Funktionen, Kommentare)
- UI-Texte: Deutsch (Umlaute als ae/oe/ue in Code, echte Umlaute nur in UI-Strings)
- Dokumentation: Deutsch

## Architektur-Pflicht fuer alle Produkte mit Datenbank

**WICHTIG: Lies und befolge `docs/konzept/architektur-integritaet-tests.md` bevor du an einem Produkt mit Datenbank arbeitest.**

Zusammenfassung der Pflichten:

### Event-Log (ab v0.3)

- Jede Schreiboperation (INSERT, UPDATE, DELETE) muss ein Event in die `events`-Tabelle schreiben
- Events sind append-only: nur INSERT, nie UPDATE, nie DELETE
- Jedes Event enthaelt einen vollstaendigen Snapshot des Objekts (nicht nur Diffs)
- Events sind per HMAC-SHA256 Hash-Kette verkettet
- Implementierung: `appendEvent(type, data)` in db.js aufrufen nach jeder Zustandsaenderung

### Schema-Versionierung

- Jedes Produkt hat eine `_schema_meta`-Tabelle mit aktueller Schema-Version
- Inkrementelle Migration fuer max. 3 Minor-Versionen Rueckstand
- Bei >3 Versionen Rueckstand: Event-Replay (automatisch)
- Jedes Minor-Release erzeugt ein SQLite-Fixture unter `tests/fixtures/db_vX.Y.Z.sqlite`

### Test-Pflicht

Kein Release ohne bestandene Tests in allen 7 Kategorien:

1. **Unit-Tests** — `tests/test_*.js` fuer jede Funktion
2. **Integrations-Tests** — DB + Events zusammen
3. **Migrations-Tests** — Jedes Fixture aus `tests/fixtures/` muss auf aktuelle Version migrierbar sein
4. **Ketten-Tests** — Simulation v0.1 → v0.2 → ... → aktuell mit Datennutzung pro Version
5. **Replay-Tests** — Zustand aus Events identisch mit normalem Zustand
6. **Integritaets-Tests** — Hash-Kette erkennt Manipulation und Loeschung
7. **Smoke-Tests** — App startet, CRUD funktioniert, PDFs generierbar

### Fixture-Pflicht

- Bei jedem Minor-Release: neues Fixture `tests/fixtures/db_vX.Y.Z.sqlite` erzeugen und committen
- Alte Fixtures NIEMALS loeschen
- Fixture enthaelt definierten Testdatensatz (siehe Architektur-Dokument Kap. 9.2)

### SQLCipher (ab v0.4)

- Gesamte DB verschluesselt mit AES-256 (SQLCipher)
- Schluessel im OS-Keystore, nicht als Datei

### Lokales Backup

- Automatisch bei jedem App-Start (wenn letztes Backup > 24h)
- Rotation: 7 Tage taeglich, 4 Wochen woechentlich, danach monatlich

## Bestehende Konventionen

- Tests: siehe `docs/test-conventions.md`
- Gesamtkonzept: siehe `docs/konzept/gesamtkonzept-v3.md`
- Produktspec MitgliederSimple: siehe `products/mitglieder-simple/docs/produktspec.md`

## Tech-Stack

- Desktop: Tauri v2 (Rust) + Svelte 5 + SQLite
- Portal: Express.js + PostgreSQL + Caddy
- Shared Components: `@codefabrik/vereins-shared`
- Build: Vite, pnpm
- CI/CD: Forgejo Actions, Azure Pipelines (Windows), OpenClaw (Tauri Builds)
- Tests: Node.js native `test` module (kein Jest, kein Mocha)

## Stil

- Kein Over-Engineering. MVP = 1 Funktion + Export, max. 2 Wochen.
- Keine Features auf Vorrat bauen.
- Jeder Bug wird zum automatisierten Test.

## Entwicklungsworkflow: Claude Code ↔ OpenClaw

Grundprinzip: **Planung und Review bei Claude Code, Ausfuehrung bei OpenClaw.**

### Ablauf fuer Feature-Entwicklung

1. **Claude Code plant**: Erstellt einen detaillierten Entwicklungsplan mit:
   - Genaue Dateiliste (neu/geaendert)
   - Code-Snippets fuer jede Aenderung
   - Abhaengigkeiten und Reihenfolge
   - Akzeptanzkriterien und Testfaelle
   - Verifikationsschritte

2. **OpenClaw fuehrt aus**: Setzt den Plan um — schreibt Code, erstellt Dateien,
   fuehrt Migrationen durch

3. **Claude Code reviewt**: Prueft das Ergebnis gegen den Plan:
   - Stimmt der Code mit den Vorgaben ueberein?
   - Bestehen alle Tests?
   - Sind Architektur-Pflichten eingehalten?

4. **Schleife bis fertig**: Bei Abweichungen → konkretes Feedback → OpenClaw korrigiert → erneutes Review

### Prinzipien

- **Mehr Schleifen, weniger Eigenarbeit**: Claude Code soll bevorzugt planen und reviewen,
  nicht selbst den gesamten Code schreiben. OpenClaw uebernimmt die Programmierarbeit.
- **Detailgrad**: Plaene muessen so detailliert sein, dass OpenClaw sie ohne Rueckfragen
  umsetzen kann (exakte SQL-Statements, vollstaendige Funktionssignaturen, Import-Pfade).
- **Kleine Arbeitspakete**: Lieber 5 kleine Schleifen als 1 grosses Paket.
  Jedes Arbeitspaket soll einzeln testbar sein.
- **Test-Gate**: Kein Arbeitspaket gilt als abgeschlossen, bevor alle relevanten Tests gruen sind.
