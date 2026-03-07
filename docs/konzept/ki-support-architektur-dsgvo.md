# Code-Fabrik — DSGVO-sichere KI-Support-Architektur

*Stand: 2026-03-06*
*Status: Verabschiedet*
*Bezug: support-betriebsmodell.md, electron-plattform-architektur.md (v5+)*

---

## 1. Grundprinzip

Code-Fabrik kann eine KI-gestuetzte Supportfunktion anbieten, wenn die KI nur auf
bewusst minimierte, strukturierte und vorab bereinigte Diagnosedaten zugreift —
und nicht auf echte Fachdaten.

**Leitprinzip:**
Nicht die KI darf entscheiden, welche Daten noetig sind, sondern die Produktarchitektur
legt vorab fest, welche minimalen, bereinigten Diagnoseinformationen ueberhaupt
exportierbar sind.

---

## 2. Zwei-Ebenen-Modell

### Ebene 1: Lokal beim Kunden

Diese Ebene darf auf die vollstaendigen lokalen Diagnosedaten zugreifen.

Aufgaben:
- Log-Analyse
- Fehlerklassifikation
- Root-Cause-Hinweise
- Generierung eines sanitisierten Support-Pakets
- Generierung eines case-summary.json
- Generierung eines diagnosis.md
- Generierung eines Recovery-Plans

Umsetzung: OpenClaw/Ollama mit lokalem Modell oder lokalem Regelwerk.
Datenschutzseitig die sichere Zone, weil Rohdaten das Geraet nicht verlassen.

### Ebene 2: Cloud-KI fuer Supportbearbeitung

In die Cloud geht nicht das Roh-Bundle, sondern nur ein sanitisiertes,
strukturiertes, datensparsames Diagnoseobjekt.

Aufgaben:
- Antwortentwuerfe
- Clustering
- Priorisierung
- Wissensbank-Abgleich
- Eskalationsentscheidung

**Kompromiss: Lokale Diagnose, cloudgestuetzte Formulierung und Mustererkennung.**

---

## 3. Drei Support-Datenklassen

### Klasse A — Nie exportieren

Bleibt immer lokal:

- Mitgliedernamen
- Adressen
- E-Mail-Adressen
- Telefonnummern
- Vereinsnamen, wenn klein und identifizierbar
- Inhalte von Notizen/Freitexten
- PDF-Inhalte
- CSV-Inhalte
- exakte Dateipfade mit Personenbezug
- Screenshots mit Fachdaten
- Lizenzschluessel im Klartext

### Klasse B — Nur lokal fuer Voranalyse

Darf lokal analysiert, aber nicht roh hochgeladen werden:

- Rohlogs
- SQL-Statements
- interne IDs
- lokale Dateistrukturen
- Backup-Dateinamen
- alte Fehlertexte
- Aktionshistorie

### Klasse C — Darf in die Cloud (nach Sanitizing)

- Produktname
- Produktversion
- Fehlercode
- issue_category
- severity
- risk_flags
- schema_version / expected_schema_version
- db_integrity_ok
- backup_age_bucket
- disk_space_bucket
- cloud_sync_risk: true/false
- update_status
- os_family / arch
- kurzes, bereinigtes Diagnose-Summary
- bereinigte Log-Signaturen

**Diese Datenklassifikation ist die wichtigste strukturelle Entscheidung.**

---

## 4. Lizenzschluessel nur gehasht uebertragen

Digistore24-Lizenzschluessel werden nie im Klartext an die Cloud-KI gegeben.

```text
support_customer_id = HMAC-SHA256(license_key, server_side_pepper)
```

Damit:
- stabile Wiedererkennbarkeit
- keine Klartextlizenz im KI-Kontext
- bessere Trennung von Support und Lizenzsystem

Noch besser: Die Cloud-KI bekommt nur eine interne Fall-ID und nicht einmal den Hash.

---

## 5. Sanitizing Engine (lib/support-sanitizer.js)

Pflichtmodul in `electron-platform`. Macht aus Rohdiagnose ein Cloud-taugliches Paket.

### Aufgaben

- E-Mails entfernen
- Telefonnummern entfernen
- Namen entfernen
- Vereinsnamen/Personennamen maskieren
- Freitext auf personenbezogene Hinweise pruefen
- Dateipfade normalisieren
- SQL auf Signatur reduzieren
- Logzeilen in Muster umwandeln
- Lizenzkey hashen/entfernen
- kleine Mengenwerte bucketisieren

### Beispiele

Aus:
```text
C:\Users\Max Mustermann\OneDrive\Mitglieder\mitglieder.db
```
wird:
```text
<USER_PATH>\<CLOUD_SYNC_FOLDER>\mitglieder.db
```

Aus:
```text
Mitglied Hans Mueller konnte nicht gespeichert werden
```
wird:
```text
entity_save_failed(member)
```

---

## 6. Support-Bundle zweiteilen

Nicht ein Bundle, sondern zwei:

### A. Lokales Vollbundle

Nur auf dem Kundensystem, nie automatisch extern.

Enthaelt:
- vollstaendige Logs
- lokale Diagnose
- Health-Check-Details
- Recovery-Daten
- evtl. redigierbare Zusatzinfos

### B. KI-Support-Bundle

Cloud-tauglich und bewusst klein.

Enthaelt:
- `case-summary.json`
- `diagnosis.md`
- `log-signatures.json`
- `risk-assessment.json`
- `recovery-options.json`

---

## 7. KI-Features nach Tier

### Tier 1 — Kurzfristig umsetzbar

#### 1. Autonomous Log Analysis

Lokal zuerst. Exportiert werden nur:
- Log-Signaturen
- Ereignisketten
- Fehlercodes
- Severity
- bekannte Pattern

Beispiel log-signatures.json:
```json
{
  "signatures": [
    "startup_ok",
    "db_open_ok",
    "integrity_check_failed",
    "cloud_sync_detected",
    "recovery_prompt_shown"
  ]
}
```

#### 2. AI-Generated Diagnostics

Lokal erzeugt:
- technische Diagnose
- nutzerverstaendliche Diagnose
- Risikoeinstufung

In die Cloud geht nur die bereinigte Version.

#### 3. Predictive Support (Predictive Health Monitor)

Komplett lokal moeglich, keine Cloud noetig:
- Backup zu alt
- Disk knapp
- OneDrive-Risiko
- WAL zu gross
- letzte Migration fehlerhaft

Direkt im Produkt implementieren.

#### 4. Local Support Copilot

Zunaechst read-only und streng begrenzt.

Darf beantworten:
- Was bedeutet Fehlercode X?
- Wie alt ist mein letztes Backup?
- Ist meine DB in Ordnung?
- Was ist der sichere naechste Schritt?

Darf anfangs nicht frei ueber Produktdaten sprechen.

### Tier 2 — Mittelfristig

#### 5. Autonomous Bug Reproduction

Nur als Metadaten-Trace.

Speichern:
- Route
- letzte UI-Aktionen
- letzte Commands
- betroffene Funktionsbereiche

Nicht speichern:
- Feldinhalte
- Namen
- Fachdaten

#### 6. AI Incident Clustering

Sehr stark und gut cloudfaehig.

Benoetigt nur:
- Fehlercode
- Produktversion
- Plattform
- issue_category
- risk_flags
- log_signatures

Fast ideal fuer cloudgestuetzte Mustererkennung.

#### 7. AI-Generated Recovery Plans

Regelbasiert gerahmt, nicht frei improvisiert.

Die KI waehlt aus einem kontrollierten Katalog:
- sichere Schritte
- nicht erlaubte Schritte
- Eskalationskriterien

---

## 8. Konkrete Produktartefakte

### 8.1 Support-Center im Produkt

Funktionen:
- Fehlercode anzeigen
- Technische Infos kopieren
- Diagnosedaten lokal pruefen
- KI-Support-Paket erzeugen
- Recovery-Optionen anzeigen
- Lokalen Support-Assistenten oeffnen

### 8.2 case-summary.json (Kernartefakt)

```json
{
  "case_id": "cf-2026-03-06-00123",
  "product": "MitgliederSimple",
  "version": "0.5.0",
  "error_code": "CF-DB-002",
  "issue_category": "database_integrity",
  "severity": "high",
  "risk_flags": ["data_integrity_risk", "cloud_sync_risk"],
  "db_integrity_ok": false,
  "schema_version": 5,
  "expected_schema_version": 5,
  "backup_age_bucket": "0-24h",
  "disk_space_bucket": "5-20GB",
  "cloud_sync_risk": true,
  "recovery_options": ["restore_backup", "export_diagnostics"],
  "customer_ref": "<internal_case_ref_only>"
}
```

### 8.3 log-signatures.json

Nicht Rohlogs, sondern Muster:

```json
{
  "signatures": [
    "startup_ok",
    "db_open_ok",
    "integrity_check_failed",
    "cloud_sync_detected",
    "recovery_prompt_shown"
  ]
}
```

### 8.4 diagnosis.md

Fuer Mensch und KI lesbar, aber bereinigt.

### 8.5 recovery-options.json

Kontrollierter Massnahmenraum.

---

## 9. Zielarchitektur

### Lokale Ebene im Produkt

- Support-Center
- Fehlercodes
- Predictive Health Monitor
- lokale Log-Analyse
- lokale Diagnoseerzeugung
- Sanitizer (`lib/support-sanitizer.js`)
- lokaler Recovery-Plan-Generator
- optional lokaler Support-Copilot (OpenClaw/Ollama)

### Cloud-Support-Ebene

- Ticketannahme
- KI liest nur sanitisiertes Bundle
- Antwortentwurf
- Incident Clustering
- Wissensbank-Abgleich
- Eskalationsentscheidung
- Serienfehler-Erkennung

### Gruender-Ebene

Der Gruender bekommt nur:
- verdichtete Faelle
- neue Muster
- risikoreiche Faelle
- Produktbugs
- Vorschlag fuer Antwort und Massnahme

---

## 10. Ausdruecklich ausgeschlossen

Folgendes wird nicht umgesetzt:

- Rohlogs an ein Cloud-Modell schicken
- Freitextfelder unbereinigt hochladen
- PDFs, CSVs oder Screenshots standardmaessig mitschicken
- Lizenzschluessel im Klartext uebertragen
- die KI auf beliebige Kundendaten loslassen
- freie SQL- oder Dateisystem-Ratschlaege zulassen

---

## 11. Rechtlich-praktische Leitlinie

Pseudonymisierung ist ein wichtiges Schutzmittel nach EDPB-Leitlinien, aber
pseudonymisierte Daten sind nicht automatisch anonym. Ob Daten anonym sind,
haengt davon ab, ob Personen mit vertretbaren Mitteln noch identifizierbar waeren.

Deshalb: Die Sanitizing Engine ist keine optionale Verbesserung, sondern
eine architektonische Pflichtkomponente.
