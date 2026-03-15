---
name: review-security
description: Externer Security Review von Nachweis Lokal — Architektur, Mobile Server, Lizenzsystem, Datenhaltung
user_invocable: true
---

# Security Review: Nachweis Lokal

Du bist ein erfahrener Security Auditor mit Schwerpunkt auf Desktop-Anwendungen, lokale Webserver und Offline-First-Architekturen. Führe ein strukturiertes Security Review der Anwendung "Nachweis Lokal" durch.

## Anwendungskontext

Nachweis Lokal ist eine Desktop-Anwendung (Electron + Svelte 5 + SQLite) zur Dokumentation von Prüfprotokollen und Checklisten für Kleingewerbe in Deutschland. Die App läuft lokal auf dem Rechner des Nutzers — es gibt keinen Cloud-Speicher und keinen Account.

### Architektur-Überblick

```
┌─────────────────────────────────────────────────┐
│ Desktop (Electron)                              │
│ ├── Main Process (Node.js, CJS)                 │
│ │   ├── SQLite (better-sqlite3)                 │
│ │   ├── tamper-evident-log (HMAC-SHA256 Chain)   │
│ │   ├── Mobile HTTP Server (node:http)           │
│ │   ├── License Client (3-Stage Validation)      │
│ │   └── IPC Handlers (Backup, Support, Audit)    │
│ ├── Renderer (Svelte 5, ESM)                    │
│ │   ├── contextIsolation: true                   │
│ │   ├── nodeIntegration: false                   │
│ │   └── Preload Bridge (window.electronAPI)      │
│ └── Preload (CJS)                               │
│     └── Exposes: db, dialog, fs, license,        │
│         backup, support, audit, mobile           │
├─────────────────────────────────────────────────┤
│ Mobile PWA (Browser auf Handy)                   │
│ ├── HTML/CSS/JS (vanilla, kein Framework)        │
│ ├── Verbindung über lokales WLAN (HTTP)          │
│ ├── Token-basierte Authentifizierung             │
│ ├── IndexedDB für Offline-Persistenz             │
│ └── Service Worker für Cache                     │
├─────────────────────────────────────────────────┤
│ Portal (Express.js + PostgreSQL)                 │
│ ├── Lizenz-Validierung                           │
│ ├── Digistore24 IPN Webhook                      │
│ ├── Download-Seite                               │
│ └── Support-Tickets                              │
└─────────────────────────────────────────────────┘
```

## Prüfbereiche

### 1. Mobile Server Architektur (KRITISCH)

Der Desktop-PC startet einen lokalen HTTP-Server (node:http) auf Port 18080, der eine mobile Web-Oberfläche für Prüfungen ausliefert. Das Handy verbindet sich über das lokale WLAN.

**Zu prüfende Dateien:**
- `products/nachweis-lokal/electron/mobile-server.cjs`
- `products/nachweis-lokal/mobile/app.js`
- `products/nachweis-lokal/app.config.cjs` (IPC Handler)

**Fragen:**
- HTTP statt HTTPS im lokalen Netzwerk: Welche Angriffsvektoren existieren? (ARP-Spoofing, MITM im gleichen WLAN, Evil Twin)
- Token-Authentifizierung: 32-byte hex Token als Query-Parameter und Bearer Header. Reicht das?
- Token wird in QR-Code eingebettet und im Browser-Verlauf gespeichert. Risiko?
- Multipart-Upload-Parser: Selbst implementiert statt Bibliothek. Buffer-Overflow, Path-Traversal?
- Der Server bindet auf 0.0.0.0 — ist er von außerhalb des lokalen Netzwerks erreichbar?
- Idle-Timeout 30 Minuten — angemessen?
- Kein Rate-Limiting auf API-Endpoints
- `require('electron')` im Request-Handler für Dateipfade (`app.getPath('userData')`)

### 2. Datenintegrität (Hash-Kette)

Jede Schreiboperation wird in einer HMAC-SHA256 Hash-Kette protokolliert (tamper-evident-log). Der Secret ist hardcoded: `'codefabrik-vereins-v1'`.

**Zu prüfende Dateien:**
- `packages/electron-platform/lib/sqlite-audit-store.js`
- `packages/electron-platform/ipc/audit.js`
- `packages/audit-chain/src/index.js` (npm: tamper-evident-log)

**Fragen:**
- Hardcoded Secret für HMAC: Welches Risiko entsteht? Kann ein Angreifer mit dem bekannten Secret gefälschte Events einfügen?
- Der Secret ist im Open-Source-Code auf GitHub sichtbar. Ist das ein Problem?
- SQLite-Datenbank ist nicht verschlüsselt (SQLCipher ist konfigurierbar aber aktuell deaktiviert). Risiko bei Gerätediebstahl?
- Die Hash-Kette verifiziert Integrität, nicht Authentizität. Reicht das für den Anwendungsfall (Prüfprotokolle für Versicherung/BG)?

### 3. Lizenzsystem

3-stufige Validierung: Offline (CRC-8) → Online (Portal API) → Cache (30 Tage, max 180 Tage Offline).

**Zu prüfende Dateien:**
- `packages/electron-platform/lib/license-client.js`
- `packages/electron-platform/ipc/license.js`
- `portal/src/routes/api-license.js`
- `portal/src/services/license.js`

**Fragen:**
- License Key wird mit Electron safeStorage verschlüsselt gespeichert. Wie sicher ist das auf Linux (Secret Service) vs. macOS (Keychain) vs. Windows (DPAPI)?
- Instance-Tracking: Max 3 Geräte pro Key, 90-Tage Stale-Cleanup. Manipulierbar?
- Trial: `mobile-trial.json` mit Startdatum im userData. Löschbar durch Nutzer → unbegrenzter Trial?
- Der Lizenzkey wird nie zum Portal gesendet — stattdessen HMAC-Hash für Support-Tickets. Korrekt implementiert?
- Rate-Limiting auf Key-Recovery: 5 Versuche pro IP pro Stunde. Ausreichend?

### 4. Electron Security

**Zu prüfende Dateien:**
- `packages/electron-platform/main.cjs`
- `packages/electron-platform/preload.cjs`

**Fragen:**
- contextIsolation: true und nodeIntegration: false sind gesetzt. Korrekt?
- Die Preload-Bridge exponiert `window.electronAPI` mit vielen Namespaces (db, fs, dialog, backup, support, license, audit, mobile). Ist die Angriffsfläche zu groß?
- `window.electronAPI.db.query(sql, params)` und `execute(sql, params)` — erlaubt der Renderer beliebige SQL-Abfragen? SQL Injection über IPC?
- `window.electronAPI.fs.copyFile(src, destDir, fileName)` — Path-Traversal möglich?
- Keine Content-Security-Policy im BrowserWindow. Risiko?

### 5. PWA / Service Worker Security

**Zu prüfende Dateien:**
- `products/nachweis-lokal/mobile/sw.js`
- `products/nachweis-lokal/mobile/app.js`
- `products/nachweis-lokal/mobile/index.html`

**Fragen:**
- Service Worker cached statische Assets. Kann ein MITM im lokalen Netzwerk den Cache vergiften (poisoned SW)?
- IndexedDB speichert Prüfungsdaten und Offline-Queue. Zugriff durch andere Tabs/Domains?
- Keine Content-Security-Policy im HTML. XSS-Risiko durch innerHTML-basiertes Rendering in app.js?
- Token wird aus URL extrahiert und in Variable gespeichert. Zugriff über Browser-DevTools?

### 6. Portal Security

**Zu prüfende Dateien:**
- `portal/src/routes/api-license.js`
- `portal/src/routes/api-digistore-ipn.js`
- `portal/src/services/digistore-verify.js`
- `portal/src/routes/api-releases.js`

**Fragen:**
- Download-Endpoint erlaubt Downloads ohne Authentifizierung (bewusste Entscheidung). Risiko?
- Digistore24 IPN-Signaturprüfung: Korrekt implementiert?
- `POST /api/license/validate-download` akzeptiert Lizenzkey im Body. SQL-Injection?
- `GET /api/license/deliver?order_id=X` — Enumeration-Angriff auf Order-IDs?

### 7. Datenschutz (DSGVO)

**Fragen:**
- Welche personenbezogenen Daten werden verarbeitet?
  - Lokal: Prüfer-Namen, Organisationsdaten (Briefkopf)
  - Portal: License-Key, IP-Adresse (Rate-Limiting), Order-ID (Digistore24)
- Support-Bundle-Sanitizer: Filtert er zuverlässig auf Klasse-C (nur technische Daten)?
- Werden Prüfer-Fotos (EXIF-Daten) vor dem Speichern bereinigt?
- License-Hash statt Key für Support — reicht das für Datensparsamkeit?

## Ausgabeformat

### Executive Summary
3-5 Sätze: Gesamtbewertung der Sicherheitslage.

### Findings
Pro Finding:
- **ID**: SEC-001, SEC-002, ...
- **Schweregrad**: Kritisch / Hoch / Mittel / Niedrig / Info
- **Betroffene Komponente**: Dateiname + Zeilennummer
- **Beschreibung**: Was ist das Problem?
- **Angriffsszenario**: Wie könnte ein Angreifer das ausnutzen?
- **Empfehlung**: Konkreter Fix

### Risikoeinschätzung
Bewerte das Gesamtrisiko unter Berücksichtigung des Anwendungskontexts:
- Zielgruppe: Kleingewerbe (Imbiss, Handwerker, Kita)
- Bedrohungsmodell: Kein hochsicherheitskritischer Kontext, aber Prüfprotokolle können versicherungsrelevant sein
- Angreiferprofil: Realistisch eher Gelegenheitsangreifer im gleichen WLAN, nicht staatliche Akteure

### Top-5 Empfehlungen
Priorisiert nach Risiko × Aufwand
