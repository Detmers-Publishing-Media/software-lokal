# Code-Fabrik — Support-Workflow und Lizenzanbindung

*Stand: 2026-03-07*
*Status: Verabschiedet (PO-Freigabe 2026-03-07)*
*Bezug: lizenzstrategie.md, support-betriebsmodell.md, ki-support-architektur-dsgvo.md*
*Bezug: electron-plattform-architektur.md (Kap. 5, 6)*

---

## 1. Grundmodell

Das Produkt ist kostenlos und vollstaendig nutzbar (GPL 3.0, kein Feature-Gate).
Der Support-Lizenzkey ist ein **Service-Zugang**, kein Produktschluessel.

```
Ohne Key:   Alle lokalen Features, kein Support
Mit Key:    Alle lokalen Features + Support-Funktionen freigeschaltet
Key abgelaufen: Alle lokalen Features, Support-Funktionen gesperrt
```

Der Key wird ueber Digistore24 verkauft (29 EUR/Jahr) und in der App hinterlegt.

---

## 2. Kaufflow (Digistore24 → Portal → App)

### 2.1 Ablauf

```
Schritt 1: Kunde kauft auf Digistore24
           → Digistore24 sendet IPN-Webhook an Portal
           → Portal empfaengt IPN, validiert HMAC-Signatur

Schritt 2: Portal generiert Lizenzkey
           → Format: CFML-XXXX-XXXX-XXXX-XXXX (produktspezifisches Praefix)
           → Speichert: key, product_id, digistore_order_id, created_at, expires_at
           → Status: active

Schritt 3: Digistore24 "Danke"-Seite
           → Zeigt Lizenzkey an (konfiguriert in Digistore24 "Liefern"-Tab)
           → Optional: Weiterleitung auf Portal Download-Seite

Schritt 4: Kunde oeffnet App → Einstellungen → Supportvertrag
           → Gibt Key ein
           → App validiert (siehe Kap. 3)
```

### 2.2 IPN-Events die das Portal verarbeitet

| Digistore24-Event | Portal-Aktion |
|---|---|
| Zahlung (payment) | Key generieren, Status: active, expires_at setzen |
| Abo wieder aufgenommen (rebill) | expires_at verlaengern, Status: active |
| Rueckgabe (refund) | Status: revoked |
| Ruecklastschrift (chargeback) | Status: revoked |
| Abo gekuendigt (cancellation) | Kein sofortiger Widerruf — laeuft bis expires_at aus |
| Bezahlte Zeit zu Ende (end_of_term) | Status: expired (kein Eingriff, natuerlicher Ablauf) |

### 2.3 Key-Wiederherstellung

Wenn der Kunde seinen Key verloren hat, kann er ihn ueber seine Digistore24-Bestellnummer
im Portal wiederherstellen — kein Login, kein Account noetig.

```
Portal-Seite: /support/key-wiederherstellen

  "Bitte geben Sie Ihre Digistore24-Bestellnummer ein:"
  [________________]  [Key anzeigen]

  → Portal prueft: Bestellnummer existiert in licenses-Tabelle?
  → Ja: Key wird angezeigt (maskiert bis auf letzte 4 Zeichen, Vollansicht per Klick)
  → Nein: "Bestellnummer nicht gefunden. Bitte pruefen Sie die Nummer aus Ihrer Digistore24-Bestellung."
```

```
GET /api/license/recover?orderId=D123456789

Response (gefunden):
{
  "found": true,
  "licenseKey": "CFML-****-****-****-WXYZ",
  "productId": "mitglieder-lokal",
  "status": "active",
  "expiresAt": "2027-03-07T00:00:00Z"
}

Response (nicht gefunden):
{
  "found": false
}
```

Rate-Limiting: Max. 5 Anfragen pro IP pro Stunde (Brute-Force-Schutz).

### 2.4 Lizenzkey-Format

```
Praefix pro Produkt:
  CFML = MitgliederSimple (CF = Code-Fabrik, ML = Mitglieder Lokal)
  CFFR = FinanzRechner

Format: CFML-XXXX-XXXX-XXXX-XXXX
  4 Gruppen a 4 alphanumerische Zeichen (Grossbuchstaben + Ziffern)
  Keine verwechselbaren Zeichen (kein O/0, kein I/1/l)
  Alphabet: ABCDEFGHJKMNPQRSTUVWXYZ23456789

Validierbar:
  Letzte 2 Zeichen = Pruefsumme (CRC-8 ueber die ersten 18 Zeichen)
  → App kann Tippfehler sofort erkennen, ohne Online-Check
```

### 2.4 Portal-Datenbankschema

```sql
CREATE TABLE licenses (
  id           SERIAL PRIMARY KEY,
  license_key  VARCHAR(24) UNIQUE NOT NULL,  -- CFML-XXXX-XXXX-XXXX-XXXX
  product_id   VARCHAR(50) NOT NULL,         -- 'mitglieder-lokal', 'finanz-rechner'
  digistore_order_id VARCHAR(50),
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active, expired, revoked, suspended
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  last_validated_at TIMESTAMPTZ,
  validation_count INTEGER DEFAULT 0,
  metadata     JSONB DEFAULT '{}'
);

CREATE INDEX idx_licenses_key ON licenses(license_key);
CREATE INDEX idx_licenses_product ON licenses(product_id);
CREATE INDEX idx_licenses_status ON licenses(status);
```

---

## 3. Key-Validierung in der App

### 3.1 Dreistufige Validierung

```
Stufe 1 — Offline-Formatpruefung (sofort, kein Netzwerk)
  → Praefix passt zum Produkt?
  → Format korrekt (Laenge, Zeichensatz)?
  → Pruefsumme stimmt?
  → Ergebnis: "Key ungueltig, bitte pruefen" oder weiter zu Stufe 2

Stufe 2 — Online-Validierung (einmalig bei Eingabe)
  → POST /api/license/validate
  → Portal prueft: Key existiert, Status active, Produkt stimmt, nicht abgelaufen
  → Antwort: { valid: true, expiresAt, productId, features }
  → App speichert: Key + Validierungsergebnis + Timestamp in userData

Stufe 3 — Periodischer Re-Check (alle 30 Tage, im Hintergrund)
  → Gleicher Endpoint wie Stufe 2
  → Bei Erfolg: Cache aktualisiert
  → Bei Fehler (Netzwerk): Letztes Ergebnis bleibt gueltig (Offline-Grace)
  → Bei Fehler (Key revoked/expired): Support-Features sperren
```

### 3.2 Offline-Grace-Period

Die App ist offline-first. Der Key-Cache hat folgende Regeln:

```
Cache gueltig:           Support-Features aktiv
Cache aelter als 30d:    Stiller Re-Check im Hintergrund
Cache aelter als 90d:    Hinweis "Bitte mit Internet verbinden zur Pruefung"
Cache aelter als 180d:   Support-Features gesperrt (Key muss erneut validiert werden)
Key Status = revoked:    Sofort gesperrt (kein Grace)
Key Status = expired:    30 Tage Grace nach expires_at, dann gesperrt
```

### 3.3 Portal-API-Endpoint

```
POST /api/license/validate
Content-Type: application/json

Request:
{
  "licenseKey": "CFML-XXXX-XXXX-XXXX-XXXX",
  "productId": "mitglieder-lokal",
  "appVersion": "0.5.0"
}

Response (gueltig):
{
  "valid": true,
  "status": "active",
  "expiresAt": "2027-03-07T00:00:00Z",
  "productId": "mitglieder-lokal",
  "features": ["support", "updates", "templates"]
}

Response (ungueltig):
{
  "valid": false,
  "reason": "expired"  // oder "revoked", "unknown", "wrong_product"
}
```

### 3.4 Lokale Key-Speicherung

```
userData/
  license.json          Key + Cache (verschluesselt via safeStorage)
```

```json
{
  "licenseKey": "<verschluesselt>",
  "productId": "mitglieder-lokal",
  "lastValidation": {
    "timestamp": "2026-03-07T10:00:00Z",
    "valid": true,
    "status": "active",
    "expiresAt": "2027-03-07T00:00:00Z",
    "features": ["support", "updates", "templates"]
  }
}
```

Der Lizenzkey selbst wird ueber `safeStorage.encryptString()` verschluesselt —
gleicher Mechanismus wie der DB-Encryption-Key in `lib/keystore.js`.

---

## 4. Support-Features (freigeschaltet mit Key)

### 4.1 Uebersicht

| Feature | Ohne Key | Mit Key |
|---|---|---|
| Alle lokalen Features | Ja | Ja |
| Recovery-Center (Diagnose) | Ja (Grundfunktionen) | Ja (erweitert) |
| Backup/Restore | Ja | Ja |
| Support-Bundle lokal exportieren | Ja | Ja |
| **KI-Analyse (lokal, Ebene 1)** | Nein | **Ja** |
| **Bundle ans Portal senden** | Nein | **Ja** |
| **Support-Ticket oeffnen** | Nein | **Ja** |
| **"Technische Infos kopieren"** | Ja (ohne Fall-ID) | Ja (mit Fall-ID) |
| **Update-Checker** | Nein | **Ja** |
| **Feature-Requests + Voting** | Nein | **Ja** |
| **Vorlagen-Bibliothek** | Nein | **Ja** |

### 4.2 UI ohne Key

```
Hilfe → Support
  ┌─────────────────────────────────────────────────┐
  │  Support                                         │
  │                                                   │
  │  Sie nutzen den Community-Modus.                  │
  │  Alle Funktionen stehen Ihnen zur Verfuegung.     │
  │                                                   │
  │  Fuer persoenlichen Support, automatische Updates  │
  │  und weitere Services:                             │
  │                                                   │
  │  [Supportvertrag erwerben]    [Key eingeben]      │
  │                                                   │
  │  ─────────────────────────────────                │
  │  Selbsthilfe (immer verfuegbar):                  │
  │  [Diagnose starten]  [Backup erstellen]           │
  │  [Diagnosedaten exportieren]                      │
  └─────────────────────────────────────────────────┘
```

### 4.3 UI mit Key

```
Hilfe → Support
  ┌─────────────────────────────────────────────────┐
  │  Support                              Aktiv bis  │
  │                                      07.03.2027  │
  │                                                   │
  │  [Problem melden]                                 │
  │    → KI analysiert lokal → Loesung vorschlagen    │
  │    → oder Fall ans Portal senden                  │
  │                                                   │
  │  [Diagnose starten]  [Backup erstellen]           │
  │  [Diagnosedaten exportieren]                      │
  │  [Technische Infos kopieren]                      │
  │  [Recovery-Center]                                │
  │                                                   │
  │  Supportvertrag: CFML-ABCD-...  [Verwalten]      │
  └─────────────────────────────────────────────────┘
```

---

## 5. Supportfall-Flow (mit Key)

### 5.1 In-App-Flow

```
Nutzer klickt "Problem melden"
  │
  ├─ App sammelt automatisch:
  │    Support-Bundle (lokal, vollstaendig)
  │    case-summary.json
  │
  ├─ Ebene 1: Lokale KI-Analyse
  │    → Analysiert Bundle mit lokalem Modell (Ollama/OpenClaw)
  │    → Erzeugt: diagnosis.md, recovery-options.json
  │    → Zeigt dem Nutzer:
  │       "Moegliche Ursache: [Beschreibung]"
  │       "Empfohlene Schritte: [1, 2, 3]"
  │       [Das hat geholfen]  [Weiter an Support]
  │
  ├─ Falls "Das hat geholfen":
  │    → Fall geschlossen, kein Ticket
  │    → Muster lokal gespeichert fuer kuenftige Analyse
  │
  ├─ Falls "Weiter an Support":
  │    → Sanitizer erzeugt KI-Support-Bundle (nur Klasse C)
  │    → Nutzer kann optionale Beschreibung hinzufuegen
  │    → App sendet ans Portal:
  │       POST /api/support/ticket
  │       { licenseKey (HMAC-Hash), kiBundle, userDescription }
  │    → Portal gibt Fall-ID zurueck
  │    → Nutzer sieht: "Fall #CF-2026-03-07-00123 erstellt"
  │
  └─ Ebene 2: Portal/Cloud-KI
       → Liest nur sanitisiertes Bundle
       → Klassifiziert, priorisiert
       → Standardfall: KI antwortet direkt
       → Grenzfall: Eskalation an Gruender
```

### 5.2 Portal-seitige Verarbeitung

```
POST /api/support/ticket eingehend
  │
  ├─ Lizenz validieren (HMAC-Hash gegen DB)
  ├─ Ticket in DB anlegen (ticket_id, license_ref, status: open)
  ├─ KI-Bundle speichern (nur Klasse-C-Daten)
  │
  ├─ KI-Analyse (Cloud, Ebene 2)
  │    → case-summary.json + log-signatures.json lesen
  │    → Fehlercode zuordnen
  │    → Standardantwort erzeugen
  │    → Eskalationsentscheidung
  │
  ├─ Standardfall (KI kann antworten):
  │    → Antwort in Ticket speichern
  │    → Status: resolved
  │    → App ruft GET /api/support/ticket/{id} ab
  │    → Nutzer sieht Antwort in der App
  │
  └─ Grenzfall (Eskalation):
       → Gruender bekommt Benachrichtigung
       → Kompakte Fallzusammenfassung
       → Entscheidet und antwortet
       → Status: resolved
```

### 5.3 Ticket-Abruf in der App

Die App pollt nicht, sondern prueft bei jedem Oeffnen des Support-Bereichs:

```
GET /api/support/tickets?licenseHash=<HMAC>&status=open,resolved
```

Antworten werden lokal gecached und angezeigt.

---

## 6. Lizenzkey-Sicherheit

### 6.1 In der App

- Key wird ueber `safeStorage.encryptString()` gespeichert (OS-Keystore)
- Key wird nie im Klartext geloggt
- Key wird nie im Support-Bundle uebertragen
- Fuer Portal-Kommunikation: HMAC-SHA256-Hash des Keys als Identifier

```javascript
// In der App — Key nie im Klartext an Portal
const licenseHash = computeHmac(licenseKey, 'codefabrik-support-v1');
// licenseHash geht ans Portal, nicht licenseKey
```

### 6.2 Im Portal

- Portal speichert den Key im Klartext (muss Key anzeigen koennen auf "Danke"-Seite)
- Portal speichert zusaetzlich den HMAC-Hash fuer Ticket-Zuordnung
- Portal-DB ist verschluesselt (Managed DB, TLS)
- Key-Anzeige nur ueber authentifizierte "Danke"-Seite (einmalig nach Kauf)

### 6.3 In der Cloud-KI

- KI bekommt nie den Key, weder Klartext noch Hash
- KI bekommt nur die interne Fall-ID
- Keine Zuordnung Key → Ticket fuer die KI moeglich

---

## 7. Portal-Erweiterungen

### 7.1 Neue Endpoints

| Endpoint | Methode | Beschreibung |
|---|---|---|
| `/api/license/validate` | POST | Key-Validierung (App → Portal) |
| `/api/support/ticket` | POST | Ticket erstellen (App → Portal) |
| `/api/support/tickets` | GET | Tickets abrufen (App → Portal) |
| `/api/license/recover` | GET | Key-Wiederherstellung ueber Digistore24-Bestellnummer |
| `/api/digistore-ipn` | POST | IPN-Webhook (Digistore24 → Portal) |

### 7.2 Neue Portal-Tabellen

```sql
-- licenses: siehe Kap. 2.4

CREATE TABLE support_tickets (
  id           SERIAL PRIMARY KEY,
  ticket_ref   VARCHAR(30) UNIQUE NOT NULL,  -- CF-2026-03-07-00123
  license_hash VARCHAR(64) NOT NULL,         -- HMAC-SHA256 des Keys
  product_id   VARCHAR(50) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'open',
    -- open, analyzing, resolved, escalated, closed
  user_description TEXT,
  ki_bundle    JSONB,                        -- Nur Klasse-C-Daten
  ki_diagnosis JSONB,                        -- KI-Analyse-Ergebnis
  ki_response  TEXT,                         -- KI-generierte Antwort
  escalated    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ
);

CREATE INDEX idx_tickets_license ON support_tickets(license_hash);
CREATE INDEX idx_tickets_status ON support_tickets(status);
```

---

## 8. Implementierungsreihenfolge

### Phase A — Lizenz-Grundgeruest (Voraussetzung fuer alles)

1. Key-Format definieren (Praefix, Alphabet, Pruefsumme)
2. `lib/license-client.js` in electron-platform (Format-Pruefung, Cache, Online-Check)
3. `ipc/license.js` — IPC-Handler (enterKey, validateKey, getStatus, removeKey)
4. Preload: `license` Namespace
5. Lokale Speicherung in `license.json` (verschluesselt)
6. Tests fuer Format-Validierung und Cache-Logik

### Phase B — Portal: IPN + Lizenz-API

7. `POST /api/digistore-ipn` — IPN-Webhook-Verarbeitung
8. Key-Generierung im Portal (Format, Pruefsumme, DB-Insert)
9. `POST /api/license/validate` — Validierungs-Endpoint
10. `licenses`-Tabelle im Portal
11. IPN-Signatur-Validierung (HMAC mit Digistore24-Passphrase)
12. Tests fuer IPN-Verarbeitung und Validierungs-API

### Phase C — Support-Ticket-Flow

13. `POST /api/support/ticket` — Ticket-Erstellung
14. `GET /api/support/tickets` — Ticket-Abruf
15. `support_tickets`-Tabelle im Portal
16. `lib/support-sanitizer.js` in electron-platform (Klasse-C-Bundle erzeugen)
17. App: "Problem melden"-UI mit Bundle-Upload
18. Tests fuer Sanitizer und Ticket-API

### Phase D — KI-Integration

19. Ebene 1: Lokale KI-Analyse (Ollama/OpenClaw, Regelwerk)
20. Ebene 2: Cloud-KI fuer Ticketbearbeitung (case-summary → Antwort)
21. Eskalationslogik (Regeln aus support-betriebsmodell.md)
22. Gruender-Benachrichtigung bei Eskalation

### Phase E — UI in den Produkten

23. "Einstellungen → Supportvertrag" — Key eingeben/entfernen/Status
24. "Hilfe → Support" — Abhaengig von Key-Status (Kap. 4.2 vs. 4.3)
25. "Problem melden"-Dialog mit lokalem KI-Ergebnis
26. Ticket-Ansicht (offene/geloeste Faelle)

---

## 9. Abgrenzung: Was NICHT in diesem Konzept

| Thema | Status | Wo definiert |
|---|---|---|
| Code-Signierung (EV Certificate) | Eigene Phase vor v1.0 | electron-plattform-architektur.md Kap. 7 |
| Cloud-Backup | Spaeter (Open-Core-Option) | lizenzstrategie.md Kap. 8 |
| Vorlagen-Bibliothek | Spaeter, nach Support-Flow | lizenzstrategie.md Kap. 3.2 |
| Gebrandete PDFs | Spaeter, nach Support-Flow | lizenzstrategie.md Kap. 3.2 |
| Feature-Voting | Spaeter | lizenzstrategie.md Kap. 3.2 |
| Multi-Mandanten | Nicht geplant | lizenzstrategie.md Kap. 8.3 |

---

## 10. Entschiedene Fragen

| # | Frage | Entscheidung | Begruendung |
|---|---|---|---|
| S1 | Key-Funktion | Service-Zugang, kein Produktschluessel | lizenzstrategie.md, GPL 3.0 |
| S2 | Key-Validierung | Hybrid (Offline-Format + Online-Check + Cache) | Desktop = Offline-first |
| S3 | Grace Period | 30d nach Ablauf, 180d Offline-Cache | Nutzerfreundlich, kein harter Cutoff |
| S4 | Key im Support-Bundle | Nie — nur HMAC-Hash als Identifier | ki-support-architektur-dsgvo.md Kap. 4 |
| S5 | Lokale KI | Ollama/OpenClaw, read-only, regelbasiert | ki-support-architektur-dsgvo.md Kap. 7 |
| S6 | Cloud-KI | Nur sanitisierte Klasse-C-Daten | ki-support-architektur-dsgvo.md Kap. 3 |
| S7 | Ticket-Zuordnung | HMAC-Hash, nie Klartext-Key an KI | Datensparsamkeit |
| S8 | Key-Speicherung in App | safeStorage (OS-Keystore) | Gleicher Mechanismus wie DB-Key |
| S9 | Support ohne Key | Selbsthilfe (Diagnose, Backup, Export) immer verfuegbar | GPL-Prinzip |
| S10 | Digistore24-Anbindung | IPN-Webhook ans Portal | Bereits konfiguriert (see MEMORY) |

---

## 11. Entschiedene offene Punkte (PO-Freigabe 2026-03-07)

| # | Frage | Entscheidung | Begruendung |
|---|---|---|---|
| O1 | Wo zeigt Digistore24 den Key an? | "Danke"-Seite (Digistore24 Tab "Liefern") | no-email-Prinzip, kein Extra-System |
| O2 | Key im Portal einsehbar? | Ja — ueber Digistore24-Bestellnummer wiederherstellbar | Kein Login noetig, Portal bietet `GET /api/license/recover?orderId=...` |
| O3 | Gruender-Benachrichtigung bei Eskalation | Portal-Dashboard | Poller prueft ohnehin, kein Extra-Kanal |
| O4 | Ab wann lokale KI (Ebene 1)? | Erst nach 10+ realen Supportfaellen | Kein Bauen ins Blaue, Phase D nach echtem Material |
| O5 | Preismodell FinanzRechner | Support-Abo (29 EUR/Jahr), kein Einmalkauf | Software ist Open Source — es gibt nur Support-Abos, keine Produktverkaeufe |
