# Konzept: Update-Sicherheit ohne Support

Stand: 2026-03-10 | Status: **Review ausstehend**

---

## 1. Kernaussage

> Kunden zahlen 39 EUR/Jahr fuer eine installierbare, sich selbst aktualisierende
> Desktop-Software. Persoenlicher Support wird nicht angeboten.
> Dafuer MUSS die Software Updates und Datenmigrationen vollstaendig automatisch
> und zuverlaessig durchfuehren — ohne Benutzereingriff, ohne Datenverlust.

**Wenn wir keinen Support anbieten, muss die Software so gebaut sein, dass
keiner gebraucht wird.**

---

## 2. Geschaeftsmodell

```
Was der Kunde kauft:
  ✓ Fertige .exe / .AppImage / .dmg mit Auto-Update
  ✓ Signiertes Installationspaket
  ✓ Automatische Updates (Lizenzkey schaltet Update-Kanal frei)
  ✓ Wissensdatenbank + FAQ auf der Website
  ✗ KEIN persoenlicher Support (kein Ticket, kein Chat, kein Telefon)

Was kostenlos bleibt:
  ✓ Quellcode auf GitHub (Lizenz: noch zu entscheiden, MIT oder AGPL)
  ✓ Selbst kompilieren erlaubt — ohne Support

Kommunikation auf der Produktseite:
  "Dies ist ein Werkzeug, kein Dienst.
   Sie kaufen Software, keinen Support-Vertrag.
   39 EUR/Jahr = Updates + Sicherheitspatches."
```

---

## 3. Technische Voraussetzungen (existierende Architektur)

Die folgenden Mechanismen sind in `architektur-integritaet-tests.md` definiert
und bilden das Fundament fuer supportfreie Updates:

### 3.1 Automatische DB-Migration beim App-Start

```
App startet
  → Lese Schema-Version aus _schema_meta
  → Vergleiche mit erwarteter Version
  → Differenz <= 3: Inkrementelle Migration (ALTER TABLE Kette)
  → Differenz > 3: Event-Replay (automatischer Rebuild)
  → DB neuer als App: Fehlermeldung "Bitte aktualisieren"
```

**Entscheidend:** Der Benutzer sieht davon nichts (bei <= 3 Versionen) oder
bekommt einen Fortschrittsbalken (bei Event-Replay). Kein manueller Eingriff.

### 3.2 Automatisches Backup vor jeder Migration

```
Vor jedem Schema-Upgrade:
  1. Kopiere DB-Datei → <name>.backup-v<alte-version>.db
  2. Fuehre Migration aus
  3. Bei Fehler: Automatischer Restore aus Backup
  4. Fehlermeldung: "Update konnte nicht abgeschlossen werden.
     Ihre Daten sind unveraendert. Bitte laden Sie Version X.Y.Z
     erneut herunter."
```

### 3.3 Event-Log als Migrations-Fallback

```
Normaler Weg:    ALTER TABLE Kette (schnell, <1 Sek.)
Fallback 1:      Event-Replay (Sekunden bis Minuten)
Fallback 2:      Backup-Restore + Fehlermeldung
```

Das Event-Log (HMAC-SHA256 Hash-Kette, Snapshot-Events) ermoeglicht es,
den kompletten Zustand aus der Aenderungshistorie neu aufzubauen.

### 3.4 Hash-Kette verifiziert Datenintegritaet

```
Beim App-Start:
  → Pruefe letzte 100 Events (Hash-Kette)
  → Bei Luecke oder Manipulation: Warnung an Benutzer
  → NICHT: App blockieren — nur informieren
```

---

## 4. Testbarkeit — Der Beweis, dass es funktioniert

### 4.1 Bestehende 7 Testkategorien

Bereits definiert in `architektur-integritaet-tests.md`, Abschnitt 8.
Die fuer Update-Sicherheit kritischen Kategorien:

| Kategorie | Was sie beweist | Bezug zu "kein Support" |
|-----------|----------------|------------------------|
| **3: Migrations-Tests** | Jedes Fixture migriert korrekt | Benutzer muss nicht eingreifen |
| **4: Ketten-Tests** | v0.1 → ... → aktuell funktioniert | Auch lang-vernachlaessigte Installationen |
| **5: Replay-Tests** | Event-Rebuild = normaler Zustand | Fallback funktioniert zuverlaessig |
| **6: Integritaets-Tests** | Manipulation wird erkannt | Korrupte DB ≠ stiller Datenverlust |

### 4.2 Migrations-Test-Matrix (Beispiel fuer v0.5)

```
Release v0.5 muss bestehen:

  v0.4 → v0.5    Inkrementell (1 Version)     ✓ Pflicht
  v0.3 → v0.5    Inkrementell (2 Versionen)    ✓ Pflicht
  v0.2 → v0.5    Inkrementell (3 Versionen)    ✓ Pflicht
  v0.1 → v0.5    Event-Replay (4 Versionen)    ✓ Pflicht
  Leere DB        Neuinstallation               ✓ Pflicht

Ergebnis-Pruefung:
  ✓ Alle Datensaetze vorhanden + korrekte Feldwerte
  ✓ Neue Felder mit sinnvollen Defaults gefuellt
  ✓ Event-Kette lueckenlos
  ✓ Schema-Version korrekt aktualisiert
```

### 4.3 Fixture-Pflicht

```
Bei JEDEM Minor-Release:
  1. Neues Fixture erzeugen (DB + Events)
  2. Ins Repository committen
  3. Zur Test-Matrix hinzufuegen
  4. NIEMALS alte Fixtures loeschen

Fixtures sind der Beweis:
  "Unsere Software kann Daten aus JEDER frueheren Version
   korrekt in die aktuelle Version ueberfuehren."
```

### 4.4 Zusaetzliche Tests fuer supportfreien Betrieb

Ueber die bestehenden 7 Kategorien hinaus:

```
Kategorie 8: Fehlerfall-Tests (NEU)

  Test: "Migration schlaegt fehl — Backup greift"
    1. Erzeuge DB mit v0.3-Schema
    2. Injiziere defekte Migration (z.B. Spalte existiert bereits)
    3. Starte App
    4. Pruefe: DB ist unveraendert (Backup-Restore hat gegriffen)
    5. Pruefe: Fehlermeldung ist verstaendlich

  Test: "Event-Replay bei korrupter Migrationskette"
    1. Erzeuge DB mit v0.1-Schema + Events
    2. Loesche Migration v0.2 → v0.3 (simuliere Bug)
    3. Starte App
    4. Pruefe: App faellt automatisch auf Event-Replay zurueck
    5. Pruefe: Daten korrekt

  Test: "Leere Event-Tabelle bei altem Fixture (pre-Event-Log)"
    1. Lade Fixture db_v0.1.0 (hat noch kein Event-Log)
    2. Migriere auf aktuelle Version
    3. Pruefe: Migration funktioniert auch ohne Events
    4. Pruefe: Ab jetzt werden Events geschrieben

  Test: "Doppelter App-Start waehrend Migration"
    1. Starte Migration (langsam, z.B. 10.000 Events Replay)
    2. Starte zweite App-Instanz
    3. Pruefe: Lock-Datei verhindert parallelen Zugriff
    4. Pruefe: Zweite Instanz zeigt "Migration laeuft, bitte warten"
```

---

## 5. Fehlerkommunikation ohne Support

### 5.1 Prinzip: Die App erklaert sich selbst

Jede Fehlermeldung muss drei Fragen beantworten:
1. **Was ist passiert?** (verstaendlich, kein Fachjargon)
2. **Sind meine Daten sicher?** (immer beantworten, auch wenn ja)
3. **Was soll ich tun?** (genau eine Handlungsanweisung)

### 5.2 Fehlermeldungen (Beispiele)

```
Migration erfolgreich (unsichtbar):
  → Nichts anzeigen. App startet normal.
  → Im Event-Log: MigrationAusgefuehrt { von: 3, nach: 5 }

Migration mit Event-Replay (sichtbar):
  ┌──────────────────────────────────────────────┐
  │  Update auf Version X.Y                      │
  │                                              │
  │  Ihre Version war mehrere Updates alt.       │
  │  Die Datenbank wird aus dem Aenderungs-      │
  │  protokoll neu aufgebaut.                    │
  │                                              │
  │  Ihre Daten bleiben vollstaendig erhalten.   │
  │                                              │
  │  ████████████████░░░░░ 72%                   │
  └──────────────────────────────────────────────┘

Migration fehlgeschlagen (selten, ernst):
  ┌──────────────────────────────────────────────┐
  │  ⚠ Update konnte nicht abgeschlossen werden  │
  │                                              │
  │  Ihre Daten sind unveraendert — es wurde     │
  │  automatisch das Backup wiederhergestellt.   │
  │                                              │
  │  Bitte laden Sie die neueste Version         │
  │  erneut herunter:                            │
  │  → [Download-Link]                           │
  │                                              │
  │  Falls das Problem weiterhin besteht,        │
  │  finden Sie Hilfe in der Wissensdatenbank:   │
  │  → [FAQ-Link]                                │
  └──────────────────────────────────────────────┘

DB korrupt (sehr selten):
  ┌──────────────────────────────────────────────┐
  │  ⚠ Die Datenbank konnte nicht geoeffnet      │
  │  werden                                      │
  │                                              │
  │  Moegliche Ursachen:                         │
  │  • Die Datei wurde ausserhalb der App        │
  │    veraendert                                │
  │  • Die Festplatte hat einen Fehler           │
  │                                              │
  │  Wiederherstellung:                          │
  │  → [Aus Backup wiederherstellen]             │
  │  → [Aus Aenderungsprotokoll neu aufbauen]    │
  │                                              │
  │  Ihr letztes Backup: 09.03.2026, 14:32 Uhr  │
  └──────────────────────────────────────────────┘
```

---

## 6. Anonyme Crash-Reports (optional, DSGVO-konform)

```
Bei Fehler:
  1. App sammelt: Fehlercode, Schema-Version, App-Version, OS
  2. NICHT gesammelt: Benutzerdaten, DB-Inhalte, Pfade, IPs
  3. Anonymer POST an Portal: /api/crash-report
  4. Benutzer wird gefragt: "Duerfen wir den Fehlerbericht senden?"
  5. Opt-in, nicht Opt-out

Nutzen:
  → Wir sehen Migrations-Fehler bevor der Benutzer im Forum postet
  → Wir koennen Hotfixes gezielt bauen
  → Kein persoenlicher Kontakt noetig
```

---

## 7. Wissensdatenbank statt Support

```
Struktur (auf der Website, statisch):

  /hilfe/
    /installation/
      windows.md          "So installieren Sie die Software"
      linux.md            "So installieren Sie unter Linux"
      update.md           "So funktionieren automatische Updates"
    /probleme/
      migration.md        "Was tun bei Update-Fehlern"
      backup.md           "So stellen Sie ein Backup wieder her"
      lizenz.md           "Lizenzkey eingeben und verwalten"
    /bedienung/
      erste-schritte.md   "Erste Rechnung erstellen"
      euer.md             "EUeR-Uebersicht verstehen"
      export.md           "Daten exportieren (CSV, PDF)"
    /faq/
      haeufige-fragen.md  "Die 10 haeufigsten Fragen"

Prinzip:
  → Maximal 15-20 Artikel (nicht 200)
  → Jeder Artikel beantwortet EINE Frage
  → Screenshots wo noetig
  → Kein Chatbot, kein Kontaktformular
```

---

## 8. Risikobewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|--------|-------------------|------------|------------|
| Migration schlaegt fehl | Sehr gering (Tests) | Hoch | Automatisches Backup-Restore |
| User hat Version >3 zurueck | Mittel | Mittel | Event-Replay automatisch |
| DB-Datei korrupt (Festplatte) | Gering | Hoch | Lokales Backup + Replay |
| User findet keinen FAQ-Artikel | Mittel | Gering | Artikel iterativ erweitern |
| User will trotzdem Support | Mittel | Gering | Klare Kommunikation vorab |
| Code-Signing fehlt (SmartScreen) | v0.x: vorhanden | Mittel | Vor v1.0 loesen |

---

## 9. Abhaengigkeiten

| Voraussetzung | Status | Referenz |
|---------------|--------|----------|
| Event-Log mit Hash-Kette | Implementiert | finanz-shared/src/models/events.js |
| Schema-Versionierung (_schema_meta) | Implementiert | finanz-shared/src/db/schema.js |
| Migrations-Tests (Kategorie 3) | Teilweise (finanz-shared) | 48 Tests |
| Ketten-Tests (Kategorie 4) | Noch nicht | architektur-integritaet-tests.md |
| Replay-Tests (Kategorie 5) | Noch nicht | architektur-integritaet-tests.md |
| Fixture-Erzeugung automatisiert | Noch nicht | create-fixture.js geplant |
| Backup vor Migration | Implementiert | electron-platform/lib/backup-core.js |
| Auto-Update (Electron) | Noch nicht | electron-builder + update-server |
| Code-Signing | Noch nicht | Vor v1.0 |
| Wissensdatenbank | Noch nicht | Statische Seiten auf Website |
| Crash-Reports | Noch nicht | Optional, Prioritaet niedrig |

---

## 10. Fazit

Das supportfreie Modell ist technisch tragfaehig, weil:

1. **SQLite + eigenes Schema** = vollstaendige Kontrolle ueber Migrationen
2. **Event-Log** = Fallback fuer jede Situation (Replay statt Datenverlust)
3. **Automatisches Backup** = Sicherheitsnetz vor jedem Upgrade
4. **7+1 Testkategorien** = Beweis, dass Migrationen funktionieren
5. **Fixture-Kette** = Regressionsschutz ueber die gesamte Versionshistorie

**Die Testinfrastruktur IST der Support.** Statt Probleme zu loesen nachdem
sie beim Kunden auftreten, verhindern wir sie vorher durch automatisierte
Tests gegen jede fruehere Version.

---

## 11. Review-Ergebnisse (2026-03-10)

Review durchgefuehrt anhand `review-prompt-update-sicherheit.md`.

### Blocker (muessen vor v1.0 geloest werden)

| # | Problem | Detail |
|---|---------|--------|
| B1 | Electron-vs-Tauri-Widerspruch | `architektur-integritaet-tests.md` referenziert Tauri, Code ist Electron. Dokument aktualisieren. |
| B2 | Event-Replay nicht generisch | Replay existiert nur in mitglieder-lokal, nicht in finanz-shared. Muss paketuebergreifend werden. |
| B3 | Backup vor Migration fehlt | backup-core.js macht nur 24h-Intervall-Backup, kein Pre-Migration-Backup. Pflichtschritt einbauen. |
| B4 | Major-Versions-Strategie undefiniert | Was passiert bei v1.x → v2.x? Event-Schema-Version muss hochgezaehlt werden, Replay muss alte Versionen verstehen. |
| B5 | Festplatte-voll nicht behandelt | Wenn Backup wegen Speichermangel fehlschlaegt, Migration trotzdem startet. Pruefung vorher noetig. |
| B6 | Auto-Update + Code-Signing | Ohne beides kein supportfreier Betrieb moeglich. |

### Wichtig (sollten vor v1.0 geloest werden)

| # | Problem | Detail |
|---|---------|--------|
| W1 | Nicht-additive Schema-Aenderungen | Spalte umbenennen/loeschen in SQLite erzwingt Replay. Regel dokumentieren. |
| W2 | Migrations-Transaktion | Migration muss atomar sein (eine Transaktion) oder Status-Tracking in _schema_meta. |
| W3 | WAL-Datei-Loeschung | `cleanupStaleLocks()` in recovery.js loescht WAL-Dateien — das sind Daten, keine Locks. |
| W4 | SQLCipher-Key-Verlust | Bei Keystore-Reset ohne App-Passwort ist DB unwiederbringlich. Hinweis beim ersten Start. |
| W5 | Fehlermeldung differenzieren | "Download erneut" hilft nicht bei Migrations-Bug. Unterscheidung noetig. |
| W6 | Gewaehrleistungs-Kontakt | BGB 327f (seit 2022): Bei Maengeln muss Kaeufer Anbieter erreichen koennen. Impressum mit E-Mail Pflicht. |
| W7 | Backup-Verschluesselung | VACUUM INTO erzeugt unverschluesselte Kopie auch bei SQLCipher-DB. DSGVO-Problem. |
| W8 | DSGVO fuer Crash-Reports | Opt-in braucht Datenschutzerklaerung (Art. 13 DSGVO). IP-Logging fuer Endpoint abschalten. |
| W9 | Community-Forum | GitHub Discussions als Ventil. Kein Support-Versprechen, aber Fruehwarnsystem. |
| W10 | Wissensdatenbank vor v1.0 | Muss mit Screenshots und einfacher Sprache befuellt sein — nicht "spaeter". |
| W11 | Lizenzmodell-Entscheidung | MIT erlaubt kostenlose Redistribution. BSL oder Source-Available pruefen. |
| W12 | In-App-Changelog | "Was ist neu"-Dialog nach Update erhoent Vertrauen. |

### Nice-to-have

| # | Problem | Detail |
|---|---------|--------|
| N1 | Kategorie 8 in test-conventions.md | Fehlerfall-Tests formal aufnehmen. |
| N2 | Telemetrie-Dashboard | Anonyme Nutzungsdaten fuer priorisierte Fehlerbehebung. |
| N3 | App-Rollback | Zurueck zur alten Version wenn Update Probleme macht. |
| N4 | Feature-Status in _schema_meta | Pro-Feature statt globaler Schema-Version. |

### Gesamtbewertung

**Modell ist grundsaetzlich tragfaehig.** Die drei Saeulen (Backup, Event-Replay,
Hash-Kette) sind architektonisch solide. Kritischste Luecke: Event-Replay als
generischer Mechanismus (B2) und Pre-Migration-Backup (B3).

Empfehlung: Die 6 Blocker als eigenes Epic tracken und vor v1.0 abarbeiten.

---

## Review-Checkliste

- [ ] Geschaeftsmodell-Aussage ("kein Support") vom PO bestaetigt
- [ ] Lizenzmodell (MIT vs. AGPL vs. BSL) entschieden
- [ ] Kategorie 8 (Fehlerfall-Tests) in Test-Conventions aufnehmen
- [ ] Fehlermeldungs-Texte vom PO freigegeben
- [ ] Wissensdatenbank-Struktur festgelegt
- [ ] Crash-Report-Feature: Ja/Nein-Entscheidung
- [ ] Abgleich mit `architektur-integritaet-tests.md` auf Widerspruche
- [ ] Gewaehrleistungs-Kontakt im Impressum (BGB 327f)
- [ ] Backup-Verschluesselung bei SQLCipher geklaert
- [ ] Community-Forum (GitHub Discussions) Ja/Nein
- [ ] Deep-Dive-Kundendokument vom PO freigegeben
