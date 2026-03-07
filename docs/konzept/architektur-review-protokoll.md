# Code-Fabrik — Architektur-Review-Protokoll

*Stand: 2026-03-06*
*Zweck: Dokumentation der externen Review-Ergebnisse zur Electron-Plattform-Architektur*

---

## Uebersicht

| Review | Datum | Fokus | Ergebnis |
|---|---|---|---|
| Review 1 | 2026-03-06 | Grundarchitektur, Supportfaehigkeit | 5 kritische Luecken → v3 |
| Review 2 | 2026-03-06 | Katastrophenfestigkeit, Recovery | 10 Luecken → v4 |
| Review 3 | 2026-03-06 | KI-Support-Integration | 5 Luecken → v5 |
| Review 4 | 2026-03-06 | DSGVO-sichere KI-Support-Architektur | 7 Luecken → v6 |

---

## Review 1: Grundarchitektur

### Gesamteinschaetzung

Niveau eines technisch versierten Indie-Softwareherstellers beim Uebergang
vom Prototyp zur auslieferbaren Produktplattform. Grundentscheidungen richtig.
Fehlend: alles was nach dem ersten erfolgreichen Start passiert (Unhappy Path).

Architektonisch bei ca. 60% dessen was ein kleiner kommerzieller Hersteller braucht.

### Benannte Staerken

1. Injizierbares DB-Backend (setBackend)
2. Migrationen im Main Process mit Transaktionen
3. Zwei-Zeilen-Produkteinstieg (createApp)
4. Event-Log mit HMAC-Kette
5. WAL-Mode + Foreign Keys als Default

### Kritische Luecken (alle in v3 adressiert)

1. Kein Logging-System
2. Kein Fehler-Recovery bei DB-Problemen
3. Kein Backup/Restore-Mechanismus
4. Keine Code-Signierung
5. Kein Datenexport/Umzug

### Top 5 Massnahmen

1. Logging + Crash-Reporting
2. Single-Instance-Lock + DB-Health-Check
3. Automatisches Backup vor Migration + manuelles Backup/Restore
4. Code-Signierung (EV Certificate)
5. Support-Bundle-Export

---

## Review 2: Katastrophenfestigkeit

### Gesamteinschaetzung

Architektur liegt auf Niveau eines kleinen professionellen Desktop-Softwareherstellers.
Fuer ein Solo-Produkt aussergewoehnlich strukturiert. Groesster Unterschied zu
kommerzieller Software liegt nicht mehr in Datenarchitektur oder Testbarkeit,
sondern in Recovery-Faehigkeiten im Feld.

### Benannte Staerken

1. Backup-First-Migration (absolut professionell)
2. DB-Health-Check beim Start (besser als viele kommerzielle Systeme)
3. Logging-Architektur (solide)
4. Support-Bundle (starkes Feature, meiste kleine Tools haben das nicht)
5. Plattform-Trennung (genau richtig fuer Produktportfolio)

### Kritische Luecken (alle in v4 adressiert)

1. Installer-Recovery / Reparaturinstallation
2. Update-Rollback
3. Installer-Diagnose / Logs
4. Safe Mode
5. DB-Repair-Flow (nicht nur erkennen, auch reparieren)
6. Strukturierte Log-Levels (CRITICAL..DEBUG)
7. Recovery-UI (Recovery-Center)
8. Netzlaufwerk-Erkennung (UNC/SMB)
9. DB-Lock-Recovery (Retry + WAL-Cleanup)
10. Ressourcenlimits (DB/WAL-Groesse, Speicherplatz)

### Top 5 Massnahmen

1. Recovery-Center (Hilfe → Diagnose)
2. Safe Mode (--safe-mode + automatisch nach Crash)
3. Backup-Validierung (oeffnen + integrity_check + Metadaten)
4. Update-Rollback (Status-Tracking + Verify-Timer)
5. Fehlerdialoge mit klarer Handlungsanweisung + Fehler-ID

### Die 3 gefaehrlichsten Fehlannahmen (aus Review)

1. "Wenn es startet, ist alles gut." — Falsch. Viele Probleme zeigen sich erst bei
   Backup, Ausdruck, Migration, Wiederherstellung.
2. "Backup vorhanden = sicher." — Falsch. Nur validierte Backups sind verlaesslich.
3. "Logs reichen fuer Support." — Nicht bei Nicht-Technikern. Es braucht Logs +
   Recovery-Flows + Diagnose-UI.

### 15 Chaos-Szenarien (als Testmatrix in Architektur v4 aufgenommen)

1. Doppelklick / Doppelstart
2. DB in OneDrive/Dropbox
3. Virenscanner blockiert EXE/DLL
4. DB korrupt (Stromausfall)
5. Festplatte voll
6. Update bricht ab
7. Nutzer beendet App waehrend Migration
8. Renderer laedt nicht (weisses Fenster)
9. userData nicht beschreibbar
10. DB-Datei fehlt ploetzlich
11. Backup existiert, ist aber unbrauchbar
12. Restore schlaegt fehl / stellt alten Stand her
13. WAL waechst unbemerkt
14. Kunde sagt nur "es geht nicht"
15. Installation beschaedigt, nicht die Daten

---

## Review 3: KI-Support-Integration

### Gesamteinschaetzung

Architektur v4 ist technisch stark. Die Luecke liegt zwischen dem was die Architektur
liefert und dem was das Support-Betriebsmodell erwartet: die Maschinenlesbarkeit
fuer die KI-Analyse. Das Bundle muss nicht nur vollstaendig, sondern strukturiert sein.

### Was bereits passt

- Support-Bundle mit system-info, integrity-check, schema-meta, Logs, Backups
- Recovery-Center mit DB-Pruefung, Reparatur, Backup, Restore
- Fehlerdialoge mit Handlungsempfehlungen
- Safe Mode mit automatischer Crash-Erkennung

### 5 konkrete Luecken (alle in v5 adressiert)

1. **Fehlercode-System als Datenstruktur** — `lib/error-codes.js` mit CF-Codes,
   `getErrorInfo()`, `formatErrorDialog()`, `formatCompactInfo()`
2. **case-summary.json im Support-Bundle** — maschinenlesbar, KI liest zuerst.
   Enthaelt: activeErrors, recentErrors, Zustandsindikatoren, Risikoflags.
3. **Error-Code-Tagging im Logger** — `logCodedError()` mit CF-Code in jedem Eintrag.
   Ermoeglicht: recentErrors-Extraktion, Filterung nach Code.
4. **last-error.json Persistence** — ueberlebt Crashes, wird ins Bundle aufgenommen.
5. **"Technische Infos kopieren" Kompaktformat** — 2 Zeilen, vorlesbar bei Telefon-Support.

### Geschlossene Kette

Fehler entsteht → wird mit CF-Code getaggt → wird geloggt → landet im Bundle
mit case-summary → KI liest Summary → klassifiziert → antwortet oder eskaliert.

---

## Review 4: DSGVO-sichere KI-Support-Architektur

### Gesamteinschaetzung

Die Architektur v5 ist technisch stark. Die Luecke liegt in der Frage, wie
Diagnosedaten DSGVO-sicher an eine Cloud-KI uebergeben werden koennen.
Loesung: Zwei-Ebenen-Modell mit lokaler Vollanalyse und sanitisiertem
Cloud-Export.

### Was bereits passt

1. Support-Bundle mit case-summary.json
2. Fehlercode-System (CF-Codes)
3. Recovery-Center
4. Error-Code-Tagging im Logger
5. last-error.json Persistence

### Kritische Luecken (alle in v6 adressiert)

1. Keine Datenklassifikation fuer Support-Export
2. Support-Bundle enthielt potentiell PII
3. Keine Sanitizing-Engine
4. Lizenzkeys koennten im Klartext an Cloud gelangen
5. Keine Trennung lokale/Cloud-KI
6. Kein Predictive Health Monitor
7. Keine log-signatures.json (Muster statt Rohlogs)

### Kernentscheidungen

1. **Drei Datenklassen**: A (nie exportieren), B (nur lokal), C (cloud nach Sanitizing)
2. **Split-Bundle**: Lokales Vollbundle + KI-Support-Bundle (nur Klasse C)
3. **Sanitizing Engine**: `lib/support-sanitizer.js` als Pflichtmodul
4. **Lizenzkey**: Nur HMAC-SHA256-Hash, nie Klartext an Cloud
5. **Zwei-Ebenen-KI**: Lokal (OpenClaw/Ollama, Vollzugriff) + Cloud (nur sanitisiert)
6. **Predictive Health Monitor**: Lokal im Produkt, keine Cloud noetig
7. **Log-Signaturen**: Muster statt Rohtext fuer Cloud-Analyse

### Leitprinzip

Nicht die KI entscheidet welche Daten noetig sind, sondern die Produktarchitektur
legt vorab fest, welche minimalen bereinigten Diagnoseinformationen ueberhaupt
exportierbar sind.

Vollstaendige Spezifikation: `ki-support-architektur-dsgvo.md`

---

## Naechster moeglicher Review-Schritt

Chaos-Testmatrix als ausfuehrbares Testskript umsetzen —
automatisierte Tests fuer alle 15 Szenarien.
