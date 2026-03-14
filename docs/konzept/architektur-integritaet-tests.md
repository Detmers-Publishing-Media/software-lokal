# Code-Fabrik — Architekturkonzept: Integritaet, Event-Log, Updates & Testpflicht

*Stand: 2026-03-11 | Gilt als Default fuer alle Code-Fabrik Desktop-Produkte*
*Grundlage: Gesamtkonzept v3, Mitgliederverwaltung-Produktspec, Brainstorming Maerz 2026*

---

## 1. Geltungsbereich

Dieses Konzept definiert die verbindliche Architektur fuer **alle** Code-Fabrik
Desktop-Produkte (Electron + SQLite). Es ist kein optionales Feature — jedes neue
Produkt muss diese Architektur von Tag 1 implementieren.

Betroffene Produkte: MitgliederSimple, kuenftige B-05 Tools, B-24 Finanz-Rechner,
alle weiteren Bundles.

---

## 2. Die drei Saeulen

```
┌─────────────────────────────────────────────────────────┐
│                    INTEGRITAET                           │
│                                                         │
│  Saeule 1: Datenschutz        SQLCipher (AES-256)       │
│  Saeule 2: Nachvollziehbarkeit Event-Log (Hash-Kette)   │
│  Saeule 3: Authentizitaet     Code-Signing              │
│                                                         │
│  + Lokales Backup (automatisch, immer dabei)            │
│  + Update-Pflicht (max. 3 Versionen ueberspringen)      │
└─────────────────────────────────────────────────────────┘
```

Bewusst gestrichen (aus dem Brainstorming):
- **Maschinenbindung** — erzeugt mehr Support-Tickets als Sicherheitsgewinn
- **Row-Hashing** — wird durch Event-Log + Hash-Kette ersetzt
- **Separate Audit-Tabelle** — das Event-Log *ist* das Audit-Log

---

## 3. Saeule 1: SQLCipher — Die Datenbank ist ein Tresor

### 3.1 Was

Die gesamte SQLite-Datenbank wird mit SQLCipher (AES-256-CBC) verschluesselt.
Ohne Schluessel ist die Datei nicht lesbar — kein DB-Browser, kein Hex-Editor,
kein "Enkel fummelt rum".

### 3.2 Schluessel-Management

```
Schluessel-Ableitung:

  Benutzer-Passwort (optional, Default: App-internes Geheimnis)
       │
       ▼
  PBKDF2-HMAC-SHA256 (100.000 Iterationen)
       │
       ▼
  DB-Schluessel (256 Bit)
       │
       ├── Gespeichert im OS-Keystore:
       │     Windows: Credential Manager (DPAPI)
       │     macOS:   Keychain
       │     Linux:   libsecret / GNOME Keyring
       │
       └── NICHT auf der Festplatte als Datei
```

### 3.3 Rechnerwechsel / Neuinstallation

Kein Problem: Der Benutzer gibt sein App-Passwort ein (oder hat keins gesetzt,
dann wird das App-interne Geheimnis verwendet). Der Schluessel wird neu abgeleitet
und im neuen OS-Keystore gespeichert.

Die DB-Datei ist portabel — der Schluessel steckt nicht in der Datei, sondern
wird aus dem Passwort abgeleitet.

### 3.4 Electron-Integration

`better-sqlite3` wird durch `@journeyapps/sqlcipher` ersetzt (Drop-in-Replacement
mit SQLCipher-Unterstuetzung). Das erfordert:

1. `@journeyapps/sqlcipher` statt `better-sqlite3` in package.json
2. `electron-rebuild` fuer native Module
3. PRAGMA key beim Oeffnen der DB setzen
4. Cross-Compilation fuer Windows/macOS/Linux via electron-builder

**Aufwand:** 1-2 Wochen. **Zeitpunkt:** v0.7 oder v0.8.

---

## 4. Saeule 2: Event-Log — Was passiert ist, ist beweisbar

### 4.1 Prinzip

> **Hinweis:** Die HMAC-SHA256-Hash-Ketten-Logik wird als eigenstaendiges, oeffentliches
> npm-Paket (`audit-chain`) extrahiert. Siehe FEAT-008 und
> `docs/konzept/audit-log-npm-business-review.md` fuer Details.

Jede Schreiboperation erzeugt ein Event. Die Events sind append-only (nur INSERT,
nie UPDATE, nie DELETE). Eine HMAC-Hash-Kette verkettet alle Events kryptographisch.

Das Event-Log ist **kein** volles Event-Sourcing. Die Zustandstabellen (members,
fee_classes, etc.) bleiben die primaere Lese-Quelle fuer die UI. Das Event-Log ist:

- **Audit-Trail** — wer hat wann was geaendert
- **Backup-Quelle** — aus Events kann der Zustand neu aufgebaut werden
- **Migrations-Fallback** — wenn ALTER TABLE fehlschlaegt, Events in neues Schema abspielen
- **Sync-Grundlage** — fuer spaeteres Web-Connect: nur neue Events hochladen

### 4.2 Event-Schema

```sql
CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,           -- 'MitgliedAngelegt', 'BeitragGeaendert', ...
    timestamp   TEXT NOT NULL,           -- ISO 8601
    actor       TEXT NOT NULL DEFAULT 'app',
    version     INTEGER NOT NULL DEFAULT 1,  -- Event-Schema-Version
    data        TEXT NOT NULL,           -- JSON: vollstaendiger Snapshot des Objekts
    hash        TEXT NOT NULL,           -- HMAC-SHA256 ueber id+type+timestamp+data+prev_hash
    prev_hash   TEXT NOT NULL            -- Hash des vorherigen Events (Kette)
);

-- Index fuer schnelle Abfragen nach Typ und Objekt
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
```

### 4.3 Event-Typen (MitgliederSimple)

```
Mitglieder:
  MitgliedAngelegt           { ...alle Felder als Snapshot }
  MitgliedGeaendert          { ...alle Felder als Snapshot }
  MitgliedGeloescht          { id, grund }

Beitragsklassen:
  BeitragsklasseAngelegt     { ...alle Felder }
  BeitragsklasseGeaendert    { ...alle Felder }

Vereinsprofil:
  VereinsprofílGespeichert   { ...alle Felder }

DSGVO:
  EinwilligungErteilt        { mitglied_id, kanal, datum }
  EinwilligungWiderrufen     { mitglied_id, kanal, datum }

System:
  AppGestartet               { version, db_version }
  MigrationAusgefuehrt       { von_version, nach_version }
  BackupErstellt             { pfad, groesse_bytes }
  IntegritaetGeprueft        { ergebnis, fehlende_events }
```

### 4.4 Wichtig: Snapshot-Events, keine Diff-Events

Jedes Event enthaelt den **vollstaendigen Zustand** des betroffenen Objekts nach
der Aenderung — nicht nur das Delta. Das macht Replay trivial und vermeidet
Schema-Versionierungsprobleme bei Diffs.

```js
// RICHTIG: Snapshot
{ type: "MitgliedGeaendert", data: { id: 42, first_name: "Hans", last_name: "Mueller", beitrag: 120, ... } }

// FALSCH: Diff (fragil bei Schema-Aenderungen)
{ type: "MitgliedGeaendert", data: { id: 42, geaendert: { beitrag: { alt: 96, neu: 120 } } } }
```

### 4.5 Hash-Kette

```
Event #1:  hash = HMAC(id=1 | type | timestamp | data | prev_hash="0")
Event #2:  hash = HMAC(id=2 | type | timestamp | data | prev_hash=hash_von_1)
Event #3:  hash = HMAC(id=3 | type | timestamp | data | prev_hash=hash_von_2)
```

Wenn ein Event geloescht oder veraendert wird, bricht die Kette. Die Software
prueft beim Start die letzten N Events (z.B. 100) und bei Bedarf die gesamte Kette.

### 4.6 Replay-Funktion (Zustand aus Events neu aufbauen)

```
Normal:     App liest aus Zustandstabellen (schnell)
Fallback:   Events abspielen → Zustandstabellen neu fuellen

Wann Replay:
  - Migration fehlgeschlagen
  - DB korrupt
  - Benutzer waehlt "Aus Event-Log wiederherstellen"
  - Schema-Upgrade ueber >3 Versionen (erzwungener Rebuild)
```

### 4.7 Separate Event-Datei (empfohlen ab v0.5)

Ab v0.5 liegen Events in einer separaten SQLite-Datei (`events.db`), getrennt
von der Zustands-DB (`mitglieder.db`). Vorteile:

- Zustandstabellen koennen ohne Events-Verlust geloescht werden
- Event-Datei ist klein und ideal fuer Backup/Sync
- Unabhaengige Verschluesselung moeglich

Fuer v0.3/v0.4: Events in der Haupt-DB (einfacher Start, Trennung spaeter).

---

## 5. Saeule 3: Code-Signing — Die Software ist echt

### 5.1 Windows: Authenticode

- EV Code-Signing-Zertifikat (ab ~300 EUR/Jahr)
- Oder: Standard-Zertifikat (ab ~70 EUR/Jahr) + SmartScreen-Reputation aufbauen
- Signierung im CI/CD (Azure Pipeline oder GitHub Actions)
- Ohne Signatur: Windows SmartScreen blockiert den Installer

### 5.2 macOS: Notarization

- Apple Developer Account (99 USD/Jahr)
- `codesign` + `notarytool` im Build-Prozess
- Ohne Notarization: macOS Gatekeeper blockiert die App

### 5.3 Selbst-Verifikation (optional, Phase 2)

Beim Start prüft die App die Checksummen kritischer Module. Manipulation einer
einzelnen Datei → Warnung + Neuinstallation empfehlen. Fuer v1.0 nicht noetig —
der OS-Level-Schutz (Authenticode/Gatekeeper) reicht.

---

## 6. Lokales Backup

### 6.1 Automatisch bei jedem Start

```
App startet
  → Pruefe: Letztes Backup > 24h alt?
    → Ja: Backup erstellen
    → Nein: Weiter

Backup:
  1. Kopiere DB-Datei(en) nach /backups/
  2. Dateiname: verein_YYYY-MM-DD_HH-mm.db.enc
  3. Verifiziere: Backup oeffenbar?
  4. Event schreiben: BackupErstellt
  5. Alte Backups aufraemen:
     - 7 Tage: taeglich
     - 4 Wochen: woechentlich
     - Danach: monatlich
```

### 6.2 Zusaetzliches Backup-Ziel (USB/NAS)

Konfigurierbar in den Einstellungen. Kein Cloud-Upload in v0.x — kommt mit
Web-Connect (v2.x).

### 6.3 Wiederherstellung

```
Einstellungen → Backup → Wiederherstellen
  → Liste verfuegbarer Backups (Datum, Groesse)
  → Auswahl → Aktuelle DB wird durch Backup ersetzt
  → Event schreiben: BackupWiederhergestellt
```

---

## 7. Update-Strategie & Versionspflicht

### 7.1 Versionierung

Semantic Versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0, 2.0): Breaking Changes, neues Schema, erzwungener Rebuild
- **MINOR** (0.1, 0.2, 0.3): Neue Features, additive Schema-Aenderungen
- **PATCH** (0.1.1, 0.1.2): Bugfixes, keine Schema-Aenderungen

Jede Version hat eine **DB-Schema-Version** (Integer, monoton steigend):

```
App v0.1.0 → Schema v1
App v0.2.0 → Schema v2 (DSGVO + ClubProfile)
App v0.3.0 → Schema v3 (Event-Log)
App v0.4.0 → Schema v4 (Backup-Metadaten)
...
```

### 7.2 Migrations-Strategie

```
App startet → Lese aktuelle Schema-Version aus DB
           → Vergleiche mit erwarteter Schema-Version

Fall 1: Gleich → Weiter, alles gut
Fall 2: DB aelter, Differenz <= 3 → Inkrementelle Migration (ALTER TABLE Kette)
Fall 3: DB aelter, Differenz > 3 → Event-Replay erzwungen
Fall 4: DB neuer als App → Fehlermeldung: "Bitte aktualisieren Sie die Software"
```

### 7.3 Maximal 3 Versionen ueberspringen

**Regel:** Die Software unterstuetzt inkrementelle Migrationen fuer maximal 3
Minor-Versionen Rueckstand. Wer mehr als 3 Versionen ueberspringt, muss den
Zustand aus dem Event-Log neu aufbauen (automatisch, aber dauert laenger).

```
Beispiel:

v0.2 → v0.3: ALTER TABLE (schnell, <1 Sek.)
v0.2 → v0.5: ALTER TABLE Kette v2→v3→v4→v5 (schnell)
v0.2 → v0.6: Event-Replay (Sekunden bis Minuten, je nach Datenmenge)
v0.2 → v0.9: Event-Replay erzwungen

Dem Benutzer wird erklaert:
┌──────────────────────────────────────────────┐
│  Update von v0.2 auf v0.9                    │
│                                              │
│  Ihre Version ist mehr als 3 Versionen alt.  │
│  Die Datenbank wird aus dem Aenderungs-      │
│  protokoll neu aufgebaut.                    │
│                                              │
│  Dies kann einige Minuten dauern.            │
│  Ihre Daten bleiben vollstaendig erhalten.   │
│                                              │
│  ████████████████░░░░░ 72%                   │
│  Event 3.482 / 4.832                         │
└──────────────────────────────────────────────┘
```

### 7.4 Update-Server erzwingt Aktualitaet

Der Lizenzserver (ab v0.7 "Ladenkasse") prueft bei Lizenzverlaengerung:

```
Verein verlaengert Lizenz (jaehrlich)
  → Server prueft: Welche App-Version nutzt der Verein?
  → Version < (aktuelle - 3)?
    → Lizenz wird trotzdem verlaengert
    → ABER: Download-Link zeigt auf neueste Version
    → In-App-Hinweis: "Bitte aktualisieren Sie vor der naechsten Verlaengerung"
    → Nach 2x Verlaengerung ohne Update: Warnhinweis "Update dringend empfohlen"

Kein hartes Blocking — der Verein kann weiterarbeiten.
Aber: Support fuer Versionen > 3 zurueck wird NICHT geleistet.
```

### 7.5 Schema-Versionstabelle

```sql
CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL,
    last_migration TEXT,           -- ISO Datum der letzten Migration
    event_replay_at TEXT           -- Letzter Rebuild-Zeitpunkt (NULL = nie)
);
INSERT OR IGNORE INTO _schema_meta (id, schema_version, app_version) VALUES (1, 1, '0.1.0');
```

---

## 8. Testkonzept — Pflicht, nicht optional

### 8.1 Grundsatz

Jedes Release muss folgende Test-Kategorien bestehen bevor es ausgeliefert wird.
Es gibt keine Ausnahme. Ein fehlgeschlagener Test blockiert das Release.

### 8.2 Test-Kategorien

```
Kategorie 1: Unit-Tests           Logik isoliert (DB, CSV, PDF, License)
Kategorie 2: Integrations-Tests   Komponenten zusammen (DB + UI, Event + Migration)
Kategorie 3: Migrations-Tests     Schema-Upgrade mit Bestandsdaten
Kategorie 4: Ketten-Tests         Mehrere Versionssprünge hintereinander
Kategorie 5: Replay-Tests         Zustand aus Events neu aufbauen
Kategorie 6: Integritaets-Tests   Hash-Kette, SQLCipher, Manipulation erkennen
Kategorie 7: Smoke-Tests          App startet, Grundfunktionen laufen (Windows/macOS)
```

### 8.3 Kategorie 1: Unit-Tests

Bestehende Konvention (`docs/test-conventions.md`): `tests/test_*.js` mit
`node --test`. Mindestens:

```
tests/
├── test_db.js            Alle DB-Funktionen (CRUD, Queries)
├── test_csv.js           CSV-Export/Import
├── test_license.js       checkMemberLimit, hasLicenseKey
├── test_pdf.js           PDF-Generierung (Struktur, nicht Pixel)
├── test_events.js        appendEvent, verifyChain, replay
└── test_integrity.js     Hash-Berechnung, Ketten-Verifikation
```

### 8.4 Kategorie 2: Integrations-Tests

Testen das Zusammenspiel von Modulen:

```
test_integration_db_events.js:
  - saveMember() schreibt sowohl Zustandstabelle als auch Event
  - Event-Payload stimmt mit gespeichertem Zustand ueberein
  - deleteMember() schreibt MitgliedGeloescht-Event

test_integration_license_ui.js:
  - Bei 30 Mitgliedern: saveMember() wird blockiert
  - Bei 25 Mitgliedern: Banner wird angezeigt
```

### 8.5 Kategorie 3: Migrations-Tests (KRITISCH)

Das Herzstück des Testkonzepts. Jede Version erzeugt Testdaten. Jede neue
Version muss diese Testdaten korrekt migrieren.

#### 8.5.1 Prinzip: Jede Version hat ein Fixture

```
tests/fixtures/
├── db_v0.1.0.sqlite      Datenbank mit Testdaten aus v0.1
├── db_v0.2.0.sqlite      Datenbank mit Testdaten aus v0.2
├── db_v0.3.0.sqlite      Datenbank mit Testdaten aus v0.3
├── events_v0.3.0.json    Events aus v0.3 (fuer Replay-Tests)
└── README.md             Beschreibung was in jedem Fixture steckt
```

#### 8.5.2 Was in jedem Fixture steckt

Jedes DB-Fixture enthaelt einen definierten Testdatensatz:

```
Mitglieder:
  - #1001 Mueller, Hans    (aktiv, Vollmitglied, alle Felder gefuellt)
  - #1002 Schmidt, Anna    (passiv, Ermaessigt, minimale Felder)
  - #1003 Weber, Karl      (ausgetreten, mit Austrittsdatum)
  - #1004 Fischer, Maria   (aktiv, mit DSGVO-Einwilligungen) [ab v0.2]
  - #1005 Bauer, Thomas    (aktiv, Ehrenmitglied, beitragsfrei)

Beitragsklassen:
  - Standard 4 Klassen (Voll, Ermaessigt, Ehren, Foerder)
  - 1 benutzerdefinierte Klasse "Jugend"

Vereinsprofil: [ab v0.2]
  - Name, Adresse, Logo-Pfad ausgefuellt

Events: [ab v0.3]
  - Alle Aenderungen als Event-Kette
```

#### 8.5.3 Migrations-Test-Matrix

Fuer jedes neue Release wird getestet:

```
┌──────────────┬─────────────────────────────────────────────────┐
│ Release v0.5 │ Muss migrieren koennen:                        │
├──────────────┼─────────────────────────────────────────────────┤
│ Pflicht      │ v0.4 → v0.5 (1 Version, inkrementell)          │
│ Pflicht      │ v0.3 → v0.5 (2 Versionen, inkrementell)        │
│ Pflicht      │ v0.2 → v0.5 (3 Versionen, inkrementell)        │
│ Pflicht      │ v0.1 → v0.5 (4 Versionen, Event-Replay)        │
│ Pflicht      │ Leere DB → v0.5 (Neuinstallation)              │
├──────────────┼─────────────────────────────────────────────────┤
│ Ergebnis     │ Alle 5 Mitglieder vorhanden + korrekte Felder  │
│              │ Beitragsklassen vollstaendig                    │
│              │ Vereinsprofil vorhanden (ab v0.2-Fixture)       │
│              │ Events konsistent (ab v0.3-Fixture)             │
│              │ Neue v0.5-Features mit Defaults gefuellt        │
└──────────────┴─────────────────────────────────────────────────┘
```

#### 8.5.4 Test-Code (Beispiel)

```js
import { describe, it } from 'node:test';
import assert from 'node:assert';

const FIXTURES = ['db_v0.1.0', 'db_v0.2.0', 'db_v0.3.0', 'db_v0.4.0'];

for (const fixture of FIXTURES) {
  describe(`Migration ${fixture} → aktuell`, () => {
    it('migriert erfolgreich', async () => {
      const db = await loadFixture(fixture);
      await runMigrations(db);  // Gleiche Logik wie initDb()

      // Pflicht-Pruefungen nach Migration:
      const members = await db.query('SELECT * FROM members ORDER BY member_number');
      assert.ok(members.length >= 5, 'Mindestens 5 Mitglieder vorhanden');
      assert.strictEqual(members[0].member_number, '1001');
      assert.strictEqual(members[0].last_name, 'Mueller');

      // Neue Felder haben Defaults:
      for (const m of members) {
        assert.ok('consent_phone' in m, 'DSGVO-Feld existiert');
      }

      // Schema-Version stimmt:
      const meta = await db.query('SELECT * FROM _schema_meta WHERE id = 1');
      assert.strictEqual(meta[0].schema_version, CURRENT_SCHEMA_VERSION);
    });

    it('Mitgliederdaten sind inhaltlich korrekt', async () => {
      const db = await loadFixture(fixture);
      await runMigrations(db);
      const hans = await db.query("SELECT * FROM members WHERE member_number = '1001'");
      assert.strictEqual(hans[0].first_name, 'Hans');
      assert.strictEqual(hans[0].status, 'aktiv');
    });
  });
}
```

### 8.6 Kategorie 4: Ketten-Tests (Versions-Kaskade)

Simuliert einen Verein der mehrere Versionen hintereinander durchlaeuft und
in jeder Version Daten aendert.

```
Test: "Verein von v0.1 bis aktuell"

1. Starte mit Fixture db_v0.1.0 (5 Mitglieder)
2. Migriere auf v0.2 → Pruefe: 5 Mitglieder + DSGVO-Felder NULL
3. Simuliere v0.2-Nutzung:
   - Setze consent_phone fuer Mitglied #1001
   - Lege Vereinsprofil an
   - Lege Mitglied #1006 an (mit DSGVO-Feldern)
4. Migriere auf v0.3 → Pruefe: 6 Mitglieder, Events fuer Schritt 3 vorhanden
5. Simuliere v0.3-Nutzung:
   - Aendere Beitrag von #1001
   - Erzeuge PDF-Liste
6. Migriere auf v0.4 → Pruefe: Alles korrekt
7. ... weiter bis zur aktuellen Version

Am Ende:
  - Alle 6+ Mitglieder vorhanden
  - DSGVO-Einwilligungen korrekt
  - Vereinsprofil vollstaendig
  - Event-Kette lueckenlos
  - Alle PDFs generierbar
```

Dieser Test wird **automatisiert** ausgefuehrt und waechst mit jeder Version.
Er ist der wichtigste einzelne Test im gesamten System.

### 8.7 Kategorie 5: Replay-Tests

```
Test: "Zustand aus Events neu aufbauen"

1. Lade Event-Fixture (events_v0.3.0.json + spaetere Events)
2. Erstelle leere DB mit aktuellem Schema
3. Spiele alle Events ab
4. Vergleiche Ergebnis mit erwartetem Zustand:
   - Gleiche Mitglieder?
   - Gleiche Beitragsklassen?
   - Gleiche Felder-Werte?
5. Pruefe: Ergebnis identisch mit dem einer normalen Migration

Test: "Replay nach >3 Versionssprung"

1. Lade Fixture db_v0.1.0 + alle Events seit v0.3
2. Erzwinge Replay (weil Sprung > 3)
3. Pruefe: Ergebnis korrekt
```

### 8.8 Kategorie 6: Integritaets-Tests

```
Test: "Hash-Kette erkennt Manipulation"

1. Schreibe 10 Events
2. Verifiziere Kette → OK
3. Aendere data-Feld von Event #5 direkt in der DB
4. Verifiziere Kette → FEHLER bei Event #5
5. Pruefe: Fehlermeldung nennt korrektes Event

Test: "Hash-Kette erkennt Loeschung"

1. Schreibe 10 Events
2. Loesche Event #7
3. Verifiziere Kette → FEHLER (Luecke #6 → #8)

Test: "SQLCipher verhindert Zugriff"

1. Erstelle verschluesselte DB
2. Versuche Oeffnung ohne Schluessel → "not a database"
3. Oeffne mit korrektem Schluessel → Daten lesbar
```

### 8.9 Kategorie 7: Smoke-Tests

Bestehend (GitHub Actions: electron-build.yml), erweitert um:

```
Smoke-Test-Checkliste:
  □ App startet ohne Fehler
  □ DB wird initialisiert (Migration laeuft)
  □ Mitglied anlegen → speichern → in Liste sichtbar
  □ Mitglied bearbeiten → Aenderungen gespeichert
  □ Mitglied loeschen → aus Liste entfernt
  □ CSV-Export erzeugt Datei
  □ PDF-Liste oeffnet sich
  □ Einstellungen → Vereinsprofil speichern + laden
  □ Bei Probe-Version: Limit-Banner ab 25 Mitgliedern
  □ Bei Probe-Version: PDF-Wasserzeichen vorhanden
```

---

## 9. Fixture-Erzeugung — Pflicht bei jedem Release

### 9.1 Prozess

Bei **jedem Minor-Release** (v0.1, v0.2, v0.3, ...) wird ein neues Fixture
erzeugt und ins Repository committet:

```
Release v0.4 wird gebaut:

1. Erzeuge Fixture:
   - Starte App mit leerem Datenordner
   - Fuehre Standard-Testdatensatz ein (Skript)
   - Nutze alle neuen v0.4-Features
   - Kopiere DB als tests/fixtures/db_v0.4.0.sqlite
   - Exportiere Events als tests/fixtures/events_v0.4.0.json

2. Committe Fixture ins Repository

3. Aktualisiere Migrations-Test-Matrix:
   - Fuege v0.4-Fixture zur Test-Schleife hinzu
   - Pruefe: v0.1 → v0.4 migriert korrekt
   - Pruefe: v0.2 → v0.4 migriert korrekt
   - Pruefe: v0.3 → v0.4 migriert korrekt
```

### 9.2 Fixture-Erzeugungsskript

```
tests/create-fixture.js

  Erzeugt eine DB mit dem definierten Testdatensatz:
  - 5 Standardmitglieder (immer gleich)
  - 1+ versionsspezifische Mitglieder (nutzt neue Features)
  - Beitragsklassen (Standard + benutzerdefiniert)
  - Vereinsprofil (ab v0.2)
  - Events (ab v0.3)
  - Alles was die aktuelle Version kann
```

### 9.3 Keine Fixtures loeschen

Alte Fixtures werden **nie** aus dem Repository entfernt. Sie sind der
Beweis, dass die Software Daten aus jeder frueheren Version korrekt
verarbeiten kann.

---

## 10. CI/CD-Integration

### 10.1 Pipeline-Anforderungen

```
Jeder Push / PR:
  ├── Unit-Tests (Kategorie 1)
  ├── Integrations-Tests (Kategorie 2)
  └── Migrations-Tests (Kategorie 3) — alle Fixtures

Jedes Minor-Release:
  ├── Alle obigen Tests
  ├── Ketten-Test (Kategorie 4) — v0.1 bis aktuell
  ├── Replay-Test (Kategorie 5) — falls Events vorhanden
  ├── Integritaets-Tests (Kategorie 6)
  ├── Smoke-Tests (Kategorie 7) — Windows + macOS
  └── Neues Fixture erzeugen und committen

Blockiert Release wenn:
  - Irgendein Test fehlschlaegt
  - Fixture fehlt fuer die vorherige Version
  - Event-Ketten-Verifikation fehlschlaegt
```

### 10.2 Test-Dauer

```
Unit + Integration:     <30 Sekunden
Migrations (alle):      <2 Minuten (waechst mit Versions-Anzahl)
Ketten-Test:            <5 Minuten
Replay:                 <1 Minute (bei <10.000 Events)
Integritaet:            <30 Sekunden
Smoke (Windows):        ~5 Minuten (Azure)
────────────────────────────────────────
Gesamt:                 <15 Minuten
```

---

## 11. Umsetzungsreihenfolge

```
v0.3:  Event-Log Grundlage
       ├── events-Tabelle in Haupt-DB
       ├── appendEvent() in db.js
       ├── Alle Schreiboperationen erzeugen Events
       ├── Hash-Kette (HMAC-SHA256)
       ├── _schema_meta Tabelle
       ├── Fixture db_v0.2.0.sqlite erzeugen (rueckwirkend)
       ├── Migrations-Tests Kategorie 3 aufsetzen
       └── Unit-Tests fuer Event-Log

v0.4:  SQLCipher + Backup
       ├── better-sqlite3 durch @journeyapps/sqlcipher ersetzen
       ├── Schluessel im OS-Keystore
       ├── Lokales Backup bei jedem Start
       ├── Backup-Wiederherstellung in Einstellungen
       ├── Integritaets-Tests (Kategorie 6)
       ├── Fixture db_v0.3.0.sqlite
       └── Ketten-Test v0.1 → v0.4

v0.5:  Event-Replay + separate Event-DB
       ├── Events in eigene SQLite-Datei auslagern
       ├── Replay-Funktion: Zustand aus Events aufbauen
       ├── Migration > 3 Versionen → automatischer Replay
       ├── Replay-Tests (Kategorie 5)
       └── Fixture db_v0.4.0.sqlite

v0.7:  Update-Server / Lizenz
       ├── Versionscheck bei Lizenzverlaengerung
       ├── In-App-Update-Hinweis
       ├── Support-Ausschluss fuer Versionen > 3 zurueck
       └── Code-Signing (Windows + macOS)

v1.0:  Alles aktiv
       ├── SQLCipher aktiv
       ├── Event-Log mit Hash-Kette
       ├── Lokales Backup automatisch
       ├── Code-Signing
       ├── Update-Pflicht via Lizenzserver
       ├── Ketten-Test v0.1 → v1.0
       └── Alle 7 Testkategorien grueen
```

---

## 12. Zusammenfassung: Was das fuer den Verein bedeutet

```
Verein installiert MitgliederSimple:

  ✓ Daten verschluesselt (SQLCipher) — niemand kann die DB oeffnen
  ✓ Jede Aenderung protokolliert (Event-Log) — alles nachvollziehbar
  ✓ Backup automatisch (lokal) — Datenverlust verhindert
  ✓ Software signiert (Code-Signing) — keine Faelschung moeglich
  ✓ Updates funktionieren (max. 3 Versionen) — Daten bleiben erhalten
  ✓ Notfall: Aus Event-Log neu aufbauen — auch nach Jahren

Fuer den Kassenwart:
  "Meine Daten sind sicher, meine Aenderungen nachvollziehbar,
   und wenn der Rechner kaputt geht, habe ich ein Backup."

Fuer den Kassenprueefer:
  "Ich kann sehen wer wann was geaendert hat — und ob jemand
   das Protokoll manipuliert hat."

Fuer den Datenschutzbeauftragten:
  "Die Datenbank ist verschluesselt, Einwilligungen sind dokumentiert,
   und die Software speichert keine Daten in der Cloud."
```

---

## 13. Offene Entscheidungen

| # | Thema | Optionen | Empfehlung | Entscheiden bis |
|---|-------|----------|------------|-----------------|
| 1 | SQLCipher-Integration | @journeyapps/sqlcipher vs. eigener Build | @journeyapps/sqlcipher (Drop-in) | Vor v0.8 |
| 2 | Event-DB separat? | Ab v0.3 separat vs. ab v0.5 | Ab v0.3 in Haupt-DB, ab v0.5 separat | Vor v0.3 |
| 3 | Code-Signing-Zertifikat | EV (~300 EUR/J) vs. Standard (~70 EUR/J) | Standard + Reputation aufbauen | Vor v0.7 |
| 4 | HMAC-Secret | In App eingebettet vs. aus Schluessel abgeleitet | Aus DB-Schluessel ableiten | Vor v0.3 |
| 5 | Backup-Verschluesselung | Gleicher Schluessel wie DB vs. separater | Gleicher Schluessel (einfacher) | Vor v0.4 |
