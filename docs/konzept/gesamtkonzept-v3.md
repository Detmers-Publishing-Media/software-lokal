# Code-Fabrik — Das komplette Bild (v3)

*Konsolidierung aller Konzeptdiskussionen, Stand März 2026*
*Dieses Dokument geht in die Dokumentation von Release 0.5.7 ein.*

---

## 1. Was Code-Fabrik ist — in einem Absatz

Code-Fabrik ist eine Software-Manufaktur, die fokussierte Micro-Tools für Nischenzielgruppen im DACH-Raum baut. Die Tools werden mit KI-Unterstützung entwickelt, aber die fertigen Tools enthalten keine KI — sie telefonieren nicht nach Hause, speichern keine Daten in der Cloud, und übertragen nichts. Der Quellcode ist offen (MIT-Lizenz). Verkauft wird über Digistore24 nicht die Software, sondern eine Dienstleistung: fertige Installer, automatische Updates, Support und Mitbestimmung bei neuen Features. Die Software selbst ist ein Geschenk. Der Key kauft Bequemlichkeit und Sicherheit. Code-Fabrik kennt weder Name noch E-Mail noch Adresse seiner Kunden — der Lizenzkey ist das einzige Identifikationsmerkmal, und die gesamte Kommunikation läuft darüber, wie eine Sendungsnummer bei der Paketverfolgung.

---

## 2. Die vier Versprechen

Alles was Code-Fabrik kommuniziert, folgt vier Versprechen. Sie sind das Fundament der Marke und erscheinen auf jeder Produktseite, in jedem Tool-About-Dialog, und in jeder Kommunikation.

### Versprechen 1: Kein Geheimnis

> Jede Berechnung ist nachprüfbar — die Formeln, die Tests, der Code.
> Vertrauen durch Transparenz, nicht durch Versprechen.

**Was das konkret bedeutet:**
- Jedes Tool hat eine Seite "So rechnet dieses Tool" — keine Code-Doku, sondern verständliche Erklärung der Berechnungslogik in Alltagssprache
- Testberichte sind öffentlich einsehbar (Anzahl Tests, was getestet wird, Ergebnisse)
- Der Quellcode ist offen — jeder Datenschutzbeauftragte, jeder Kassenprüfer, jeder IT-Dienstleister kann reinschauen

**Warum das ein Differenzierungsmerkmal ist:**
Kein einziger Wettbewerber (Keasy, AMEISE, iCRM, Lexoffice, sevDesk) legt offen, wie die Software rechnet. Code-Fabrik schon.

### Versprechen 2: Keine Cloud

> Ihre Daten bleiben auf Ihrem Rechner.
> Wir sehen nichts, speichern nichts, verkaufen nichts.

**Was das konkret bedeutet:**
- Kein API-Call zu irgendeinem Server während der Nutzung
- Kein Telemetrie, kein Analytics, kein Tracking
- Kein Update-Check den der Nutzer nicht selbst anstößt
- Kein Account, kein Login, keine E-Mail-Adresse nötig um das Tool zu nutzen
- **Strict no mail:** Die Tools versenden keine E-Mails, empfangen keine, und fragen nie nach einer E-Mail-Adresse
- Alle Daten in lokalen Dateien (SQLite, JSON, CSV) auf dem Rechner des Nutzers

**Wichtige Abgrenzung — KI-entwickelt, aber KI-frei:**
Die Tools werden mit KI-Unterstützung (Claude/Anthropic) gebaut und getestet. Im fertigen Tool steckt keine KI — keine API-Aufrufe, keine Cloud-Verbindung, keine Datenübertragung. Das ist überprüfbar, weil der Code offen ist. Der Markt ist voll von "KI-powered" Tools die Daten an OpenAI oder andere APIs schicken. Code-Fabrik Tools tun das nicht.

### Versprechen 3: Kein Käfig

> Wenn Sie gehen wollen, nehmen Sie alles mit.
> Daten, Code, alles gehört Ihnen.

**Was das konkret bedeutet:**
- Datenexport in offenen Formaten (CSV, JSON, PDF) ist immer eingebaut
- Der Quellcode ist MIT-lizenziert — jeder IT-Dienstleister kann die Software warten, auch wenn Code-Fabrik morgen verschwindet
- Kein Vendor Lock-in, kein proprietäres Datenformat
- Der Nutzer kann jederzeit auf eine andere Software wechseln und seine Daten mitnehmen

**Warum das den Bus-Faktor-Einwand entschärft:**
Solo-Entwickler = Risiko, wenn der aufhört. Aber bei Code-Fabrik ist das beherrschbar: Der Code ist offen, die Daten sind lokal und exportierbar, die Infrastruktur ist dokumentiert ("Fabrik im Koffer"). Bei proprietärer Software ist ein Anbieter-Ausfall fatal. Bei Code-Fabrik ist er lösbar.

### Versprechen 4: Kein Kontakt nötig

> Kein Account, kein Login, keine E-Mail-Adresse.
> Ihr Lizenzkey ist Ihr Zugang — wie eine Sendungsnummer bei der Paketverfolgung.

**Was das konkret bedeutet:**
- Code-Fabrik kennt weder Namen, noch E-Mail, noch Adresse der Kunden
- Digistore24 hat diese Daten (als Zahlungsabwickler/Reseller) — Code-Fabrik nicht
- Der Lizenzkey ist das einzige Identifikationsmerkmal im gesamten System
- Support, Downloads, Updates, Feature-Voting — alles läuft über den Key, nichts über E-Mail
- Keine Newsletter, keine Marketing-Mails, keine "Wir vermissen Sie"-Mails
- Telefon: Sipgate-Nummer auf Anrufbeantworter — für absolute Notfälle, nicht als Support-Kanal

**E-Mail-Adresse existiert, ist aber kein Kommunikationskanal:**
Im Impressum und auf der Webseite steht eine E-Mail-Adresse (gesetzliche Pflicht). Wer dorthin schreibt, erhält eine automatische Antwort mit einem zufällig generierten Link zum Portal. Über die E-Mail-Adresse selbst werden keine inhaltlichen Antworten gegeben — mit einer Ausnahme: rechtliche Anfragen (Impressum, Datenschutz, Abmahnung) werden per Mail beantwortet. Alles andere läuft über das Portal.

```
Eingehende Mail → Auto-Reply:
"Vielen Dank für Ihre Nachricht.

Damit wir Ihnen schnell helfen können, nutzen Sie bitte
folgenden Link — dort können Sie sich einen kostenlosen
Zugangsschlüssel erzeugen und Ihre Frage direkt einstellen:

→ portal.codefabrik.../frage/a8k2m4x7

Über diesen Weg können wir Ihnen gezielt antworten und Sie
können den Status Ihrer Anfrage jederzeit einsehen — ohne
Account, ohne Login, ohne Passwort.

Bei rechtlichen Anliegen (Impressum, Datenschutz, Widerruf)
antworten wir direkt auf diese Mail."
```

**Warum ein Zufallslink statt ein fertiger Key:**
- Der Link (`/frage/a8k2m4x7`) ist ein Einmal-Token, der zur Portal-Seite führt
- Erst dort klickt der Besucher auf "Schlüssel erzeugen" und erhält seinen Key
- Zwischen der eingehenden E-Mail und dem erzeugten Key gibt es **keine technische Verbindung**
- Code-Fabrik speichert nicht, welche Mail zu welchem Link oder Key gehört
- Der Zufallslink dient gleichzeitig als **Spam-Schutz**: Nur wer die Auto-Reply erhalten hat, kennt den Link
- Der Link ist zeitlich begrenzt gültig (z.B. 7 Tage) und funktioniert nur einmal

```
Ablauf technisch:

Eingehende Mail
→ Auto-Reply mit Zufallslink (Token in URL)
→ Mail wird NICHT gespeichert, NICHT geloggt, NICHT mit Token verknüpft
→ Token wird in DB gespeichert: { token, created_at, used: false }
→ Besucher klickt Link → Portal-Seite "Schlüssel erzeugen"
→ Klick auf Button → Key wird generiert (CF-FREE-XXXXXXXX-XX)
→ Token wird als "used" markiert (Link funktioniert nicht mehr)
→ Key hat KEINE Verbindung zur E-Mail — er existiert unabhängig
```

**Das Sendungsverfolgungsprinzip — warum das funktioniert:**
Jeder kennt Paketverfolgung: Nummer eingeben, Status sehen, fertig. Kein Account, kein Login, kein Passwort. Code-Fabrik funktioniert genauso:

```
Sendungsverfolgung:                     Code-Fabrik Portal:
───────────────────                     ────────────────────
Sendungsnummer eingeben                 Lizenzkey eingeben
→ "Paket ist in Zustellung"            → "3 neue Updates verfügbar"
→ "Zugestellt am 04.03."               → "Ihre Frage #12 wurde beantwortet"
→ Kein Account nötig                   → Kein Account nötig
→ Kein Login nötig                     → Kein Login nötig
→ Kein Passwort nötig                  → Kein Passwort nötig
```

**Zwei Arten von Keys:**

| | Kostenloser Key | Bezahlter Key |
|---|---|---|
| Herkunft | Vom Nutzer selbst erzeugt (über Zufallslink oder Portal-Seite) | Digistore24-Kauf |
| Berechtigung | Frage stellen, FAQ lesen | Alles: Download, Support, Updates, Voting |
| Support-Antwort | Best effort, keine Garantie | 48h Reaktionszeit |
| Feature-Voting | Nein | Ja |
| Downloads | Nein | Ja |

So wird die E-Mail-Adresse zum Trichter: Jede eingehende Mail enthält einen Zufallslink, über den die Person sich selbst einen kostenlosen Key erzeugen kann — ohne dass Code-Fabrik die E-Mail mit dem Key verknüpft. Im Portal sieht die Person die Tools, die FAQ, die Feature-Roadmap — und entscheidet selbst, ob sie einen bezahlten Key haben will.

**Warum das auch ein DSGVO-Argument ist:**
Code-Fabrik kann keine Kundendaten verlieren, weil Code-Fabrik keine Kundendaten hat. Kein Datenleck möglich, keine Auskunftsersuchen zu beantworten, kein Verzeichnis der Verarbeitungstätigkeiten für Kundendaten nötig. Die einzigen Daten sind: Key, Bundle-ID, Erstelldatum, Ablaufdatum, Support-Tickets (die der Kunde selbst schreibt). Das ist radikal minimal — und radikal sicher.

**Was Code-Fabrik speichert vs. was nicht:**

```
Code-Fabrik speichert:                 Code-Fabrik speichert NICHT:
──────────────────────                 ────────────────────────────
✓ Lizenzkey                            ✗ Name
✓ Bundle-ID (oder "FREE")              ✗ E-Mail-Adresse
✓ Erstelldatum / Ablaufdatum           ✗ Postadresse
✓ Digistore24-Transaction-ID           ✗ Telefonnummer
✓ Support-Tickets (vom Kunden verfasst)✗ IP-Adresse
✓ Feature-Votes (Key + Stimme)         ✗ Browser-Fingerprint
                                       ✗ Nutzungsstatistiken
                                       ✗ Irgendwelche Daten aus den Tools
```

---

## 3. Was auf der Verkaufsseite NICHT steht

| Nicht sagen | Stattdessen sagen |
|---|---|
| "MIT-Lizenz" | "Kein Geheimnis — der Code ist einsehbar" |
| "Open Source" | "Nachprüfbar — Ihr Kassenprüfer kann reinschauen" |
| "GitHub/Forgejo" | "Der Quellcode ist öffentlich verfügbar" |
| "KI-entwickelt" | "Mit modernsten Methoden gebaut und automatisiert getestet" |
| "Keine Gewährleistung" | "Organisatorisches Hilfsmittel — ersetzt keine Fachberatung" |
| "MIT/Apache 2.0" | "Kein Käfig — Sie können jederzeit wechseln" |
| "Delayed Open Source" | (Gar nicht erwähnen — internes Konzept) |
| "Digistore24" | "Sichere Bezahlung" |
| "Wir speichern keine E-Mail" | "Kein Account nötig — Ihr Schlüssel ist Ihr Zugang" |
| "DSGVO-konform" | "Wir haben Ihre Daten gar nicht erst" |
| "Sipgate-Anrufbeantworter" | "Telefonische Erreichbarkeit" |
| "Sendungsverfolgungsprinzip" | "Geben Sie einfach Ihren Schlüssel ein — wie bei der Paketverfolgung" |

Die technischen Details (Lizenz, Repository, Build-Prozess) gehören auf eine separate "Für Entwickler"-Seite, nicht auf die Verkaufsseite.

---

## 4. Das Geschäftsmodell

### 4.1 Die juristische Konstruktion

```
┌─────────────────────────────────────────────────────────────────┐
│  SOFTWARE (MIT-Lizenz)                                          │
│                                                                  │
│  → Rechtlich: Schenkung                                          │
│  → Haftung: nur bei Vorsatz/arglistigem Verschweigen (§ 524 BGB) │
│  → Auf GitHub/Forgejo frei verfügbar                             │
│  → Kein Key-Check in der Software                                │
│  → Kein DRM, kein Nag-Screen, keine Einschränkung               │
│  → Volle Funktionalität auch ohne Key                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DIGISTORE24-KEY (Dienstleistungsvertrag)                       │
│                                                                  │
│  → Rechtlich: Dienstleistung, nicht Produktkauf                  │
│  → Gewährleistung bezieht sich auf den Service                   │
│    (Support-Reaktionszeit, Update-Bereitstellung)                │
│  → NICHT auf Software-Qualität                                   │
│                                                                  │
│  Key kauft:                        Key kauft NICHT:              │
│  ✓ Fertige Installer (EXE/DMG)    ✗ Die Software selbst         │
│  ✓ Auto-Update-Benachrichtigung   ✗ Exklusiven Zugang zum Code  │
│  ✓ Support-Ticket (48h Antwort)   ✗ Telefon-Support             │
│  ✓ Feature-Request + Voting       ✗ Garantie auf Ergebnisse     │
│  ✓ Download-Portal-Zugang         ✗ DRM oder Kopierschutz       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  DISCLAIMER (in jedem Tool, im About-Dialog)                     │
│                                                                  │
│  "Organisatorisches Hilfsmittel. Ersetzt keine qualifizierte     │
│   Fachberatung. Alle Berechnungen ohne Gewähr."                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Preisstruktur — wächst mit dem Umfang

Nicht "50 Tools für 79 EUR" verkaufen wenn am Launch-Tag 7 Tools existieren. Stattdessen:

```
Launch (5-8 Tools):     39 EUR Einmalkauf / 29 EUR/Jahr Abo
Ausbau (15-25 Tools):   59 EUR Einmalkauf / 39 EUR/Jahr Abo
Voll (40-50 Tools):     79 EUR Einmalkauf / 49 EUR/Jahr Abo
```

**Bestandskunden behalten ihren Preis.** Wer bei 39 EUR gekauft hat, zahlt nicht mehr — auch wenn das Bundle auf 50 Tools wächst. Das schafft Dringlichkeit ("jetzt kaufen, bevor es teurer wird") und belohnt Early Adopter.

**Einmalkauf vs. Abo — klare Trennung:**

| | Einmalkauf | Abo |
|---|---|---|
| Was enthalten? | Aktueller Stand der Tools | Immer neueste Version |
| Updates | 12 Monate ab Kauf | Solange Abo läuft |
| Support | 12 Monate | Solange Abo läuft |
| Feature-Voting | 12 Monate | Solange Abo läuft |
| Zielgruppe | Vereine (keine Abo-Diskussion im Vorstand) | Makler (Betriebsausgabe, monatlich absetzbar) |

### 4.3 Pro Bundle ein Digistore24-Produkt

Bei Digistore24 wird pro Bundle genau ein Produkt angelegt:

```
Produktname:   "Vereins-Toolbox — Support & Updates"
Produkttyp:    Digital
Beschreibung:  "Aktuell 8 Tools, wächst monatlich. Fertige Installer,
                automatische Updates, Support, Feature-Mitbestimmung.
                Die Software ist Open Source — alle Daten bleiben auf
                Ihrem Rechner."
Preis:         39 EUR (Einmalkauf) oder 29 EUR/Jahr (Abo)
```

Keine 50 Einzelprodukte. Kein Upsell-Funnel. Ein Produkt, ein Preis, fertig.

---

## 5. Der Payment-Flow

### 5.1 Phase 1: Manuell (jetzt — Referenzkunden)

```
Tool fertig → Per Mail an Referenzkunden schicken
           → Feedback per Mail einholen
           → Iterieren
           → Kein Digistore24, kein Portal, kein Key
```

Zweck: Produktvalidierung entkoppelt von Pipeline-Validierung. Wenn das Tool nicht funktioniert, liegt es am Tool — nicht an der Pipeline.

### 5.2 Phase 2: Erster echter Kauf (sobald Tool validiert)

```
Referenzkunde sagt "das nutze ich wirklich"
→ Digistore24-Produkt anlegen
→ Ersten echten Kauf durchführen (auch wenn Key noch manuell per Mail)
→ Moment "Geld fließt" muss real werden
```

Zweck: Kaufprozess-Validierung. Der schwierigste Moment ist nicht "Tool bauen" sondern "jemand gibt 39 EUR aus".

### 5.3 Phase 3: Automatisiert (Portal stabil)

```
Kunde findet Tool → Produktseite
→ Klick → Digistore24-Bestellseite
→ Zahlung (PayPal, Kreditkarte, SEPA, Sofort)
→ Digistore24 IPN-Webhook → Portal API
→ Signaturprüfung (SHA256-HMAC)
→ license.generate() → Key in DB
→ Danke-Seite zeigt Key + Download-Link
→ Kein E-Mail-Versand nötig (aber möglich als Fallback)
```

### 5.4 Key-Format & Validierung

```
Key-Format:  CF-[BUNDLE]-[RANDOM]-[CHECK]
Beispiele:   CF-B05-A7K9M2X4-3F    (bezahlter Key, Vereins-Bundle)
             CF-B24-K2M8P4R6-7A    (bezahlter Key, Finanz-Rechner)
             CF-FREE-N3X7Q1W5-2D   (kostenloser Key, vom Nutzer selbst im Portal erzeugt)

CF      = Prefix (Code-Fabrik)
BUNDLE  = Bundle-ID (B05, B24, ...) oder FREE (kostenlos)
RANDOM  = 8 alphanumerische Zeichen (kryptographisch zufällig)
CHECK   = 2-stellige Prüfsumme (Luhn-ähnlich, verhindert Tippfehler)
```

**Die Software prüft den Key NICHT.** Der Key existiert nur für:
- Portal-Zugang (Download, Support-Tickets, Feature-Voting)
- Update-Berechtigung prüfen (hat der Key noch aktives Abo?)
- Key-Recovery (über Digistore24-Bestellnummer)
- Unterscheidung kostenlos/bezahlt (FREE-Key vs. Bundle-Key)

### 5.5 Key-Recovery ohne E-Mail

| Methode | Ablauf |
|---------|--------|
| Bestellnummer | portal.codefabrik.../recover → Digistore24-Bestellnr → Key anzeigen |
| In-App | Tool → "Über" → zeigt eigenen Key → QR-Code zum Abfotografieren |
| SMS (optional) | Bei Kauf optional Handynummer → Key per SMS (~0,07 EUR) |

---

## 6. Die Open-Source-Strategie

### 6.1 Delayed Open Source

```
Tag 0:    Tool fertig → Portal-Download für Key-Inhaber (neueste Version)
Tag 90:   Quellcode auf Forgejo veröffentlichen (MIT, ältere stabile Version)
Tag 180:  Optional GitHub-Mirror (Sichtbarkeit)

Portal hat immer die neueste Version.
Forgejo/GitHub hinkt 1-2 Minor-Versionen hinterher.
Keine Binaries auf GitHub/Forgejo — nur Quellcode.
Fertige Installer nur über Portal (mit Key).
```

### 6.2 Community-Modell

```
OHNE Key (Open-Source-Nutzer):          MIT Key (Lizenzinhaber):
───────────────────────────────         ────────────────────────────
✓ Code lesen, forken, kompilieren      ✓ Alles links PLUS:
✓ Bugs melden über Issues              ✓ Fertige Installer/EXEs
✓ Pull Requests einreichen             ✓ Auto-Update-Benachrichtigung
✗ Kein Support-Ticket                  ✓ Support-Tickets (48h Antwort)
✗ Kein Feature-Voting                  ✓ Feature-Requests + Voting
✗ Keine fertigen Downloads             ✓ Download-Portal
```

### 6.3 Warum ein Vereinsvorstand trotzdem den Key kauft

Ein typischer Vereinsvorstand (Kassenwart, 62 Jahre, Windows) wird niemals `cargo tauri build` ausführen. Der will auf "Download" klicken, eine .exe bekommen, und loslegen. 39 EUR/Jahr ist weniger als eine Vereinsfeier kostet. Der Support-Kanal ist das Sahnehäubchen.

Ein Versicherungsmakler (45, nutzt bereits Software für 50+ EUR/Monat) sieht 99 EUR/Jahr und denkt: "Das ist eine Monatsrate bei meinem aktuellen MVP." Wenn das Tool eine Lücke füllt die sein MVP nicht abdeckt, kauft er ohne zu zögern.

### 6.4 Fork-Risiko

Jemand könnte den Code forken und ein Konkurrenzprodukt bauen. In der Praxis passiert das nicht, weil:
- Die Nischen sind zu klein für große Anbieter (50 Vereins-Tools für 79 EUR — das lohnt sich nur für einen Solo-Entwickler)
- Der Wert liegt im Service (Support, Updates, Voting), nicht im Code
- Wer forken kann, braucht das Tool nicht zu kaufen — der baut es ohnehin selbst
- Aber: wer es selbst baut, muss es auch selbst warten. Code-Fabrik übernimmt das für 39-99 EUR/Jahr.

---

## 7. Die "Fabrik" — Was das wirklich bedeutet

### 7.1 Die Idee

Nicht ein Tool bauen, sondern eine Maschine bauen die Tools produziert. Jedes neue Tool durchläuft die gleiche Pipeline, und diese Pipeline erzeugt automatisch alles drum herum:

```
Kundenwunsch / Feature-Request
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  DIE FABRIK                                          │
│                                                      │
│  Eingang:  Anforderung (Feature-Request, Bug, Idee)  │
│                                                      │
│  Pipeline: Code → Tests → Build → Installer          │
│            → Produktseite-Text → FAQ-Eintrag          │
│            → Digistore24-Beschreibung-Update          │
│            → Support-Doku → Release Notes             │
│                                                      │
│  Ausgang:  Fertiges Tool mit allem drum herum         │
└─────────────────────────────────────────────────────┘
```

### 7.2 Warum das skaliert

Bundle 1 (Vereine): langsam, viel manuell, Pipeline wird gebaut
Bundle 2 (Finanz): schneller, Templates existieren, Shared Components
Bundle 5: fast automatisch — neues Tool = neue Konfiguration + branchenspezifische Logik

Der Wettbewerbsvorteil ist nicht das einzelne Tool, sondern die Fähigkeit, aus einem Kundenwunsch innerhalb von Tagen ein fertiges Tool mit Produktseite, FAQ, Support-Doku und Portal-Listing zu produzieren.

### 7.3 Aber: Fabrik nicht auf Vorrat bauen

Die Fabrik wird genau so weit gebaut wie nötig für das aktuelle Tool. Beim nächsten Tool wird sie erweitert. Nicht vorher. Sonst entsteht eine perfekte Pipeline die noch nie ein echtes Produkt ausgeliefert hat.

---

## 8. Haftung nach Bundle-Typ

| Bundle | Haftungsrisiko | Warum | Absicherung |
|--------|---------------|-------|-------------|
| B-05 Vereine | **Niedrig** | Organisatorische Tools. Kassenbuch-Fehler = ärgerlich, aber Kassenprüfer fängt es auf. | Disclaimer im Tool |
| B-05 Spendenquittung | **Mittel** | §10b EStG — falsche Zuwendungsbestätigung schadet dem Spender steuerlich. | Aber: Vorstand unterschreibt, nicht das Tool. Disclaimer + Vorlage basierend auf BMF-Muster |
| B-24 Finanz-Rechner | **Niedrig** | Rechner rechnen, beraten nicht. Keine Tarifvergleiche, keine Empfehlungen. | Disclaimer + automatisierte Tests gegen Referenzwerte |
| B-21 Makler-Büro | **Niedrig-Mittel** | Organisatorische Tools (Gesprächsnotiz, IDD-Tracker). Keine Beratung. | Disclaimer + keine Verarbeitung von Gesundheitsdaten (Art. 9 DSGVO vermieden) |
| B-22 Compliance | **Mittel** | Compliance-Checklisten könnten ein falsches Sicherheitsgefühl erzeugen | Disclaimer: "Prüfhilfe, ersetzt nicht die IHK-Beratung" |
| B-01 Arbeitsschutz | **Mittel-Hoch** | Vorlagen müssen inhaltlich korrekt sein (DGUV-Vorschriften, ArbSchG) | Vorlagen basierend auf offiziellen BG-/GDA-Quellen + Disclaimer + erst ab Bundle 5 angehen |

---

## 9. Der Go-to-Market-Ansatz

### 9.1 Kein Marketing. Organisches Wachstum.

```
NICHT:                              STATTDESSEN:
─────                               ────────────
✗ Landingpages mit Conversion-Funnel ✓ Gute README + Doku auf Forgejo/GitHub
✗ Facebook/Google Ads                ✓ Paketmanager (winget, scoop)
✗ E-Mail-Marketing                   ✓ Fachforen: Hilfe anbieten, nicht verkaufen
✗ Influencer-Kampagnen               ✓ Mundpropaganda durch zufriedene Nutzer
✗ SEO-optimierte Landingpages        ✓ SEO indirekt: kostenlose Web-Rechner (optional)
✗ Newsletter                         ✓ Release Notes auf Portal + Forgejo
```

### 9.2 Vertriebsweg ohne Kundendaten

```
1. Nutzer findet Tool (Google, Forum, Mundpropaganda, winget/scoop)
2. Probiert Open-Source-Version oder liest "So rechnet dieses Tool"
3. Will fertige EXE + Support → Klick auf "Toolbox kaufen"
4. Digistore24-Bestellseite → Zahlung
5. Danke-Seite zeigt Key + Download-Link
6. KEINE E-Mail nötig. KEINE Registrierung. KEIN Account.
7. Key + Download auf der Danke-Seite — fertig.
```

Code-Fabrik speichert: `transaction_id`, `bundle_id`, `key`, `created_at`, `expires_at`.
Code-Fabrik speichert NICHT: Name, E-Mail, Adresse, Telefon, IP.
Digistore24 hat die Kundendaten (als Reseller/Zahlungsabwickler). Code-Fabrik nicht.

### 9.3 Kommunikation nach dem Sendungsverfolgungsprinzip

Der gesamte Kommunikationsweg zwischen Code-Fabrik und Kunde läuft über den Lizenzkey — wie eine Sendungsnummer bei der Paketverfolgung. Kein Account, kein Login, kein Passwort, keine E-Mail-Korrespondenz.

**Support (bezahlter Key):**
```
Nutzer hat Problem → Öffnet Tool → "Hilfe" → Portal-Link
→ Gibt Key ein → Support-Ticket erstellen (Freitext, kein Name/Mail nötig)
→ Antwort im Ticket-System sichtbar
→ Nutzer checkt Status jederzeit per Key
→ 48h Reaktionszeit garantiert
```

**Fragen (kostenloser Key):**
```
Interessent schreibt an E-Mail-Adresse
→ Auto-Reply mit Zufallslink (Einmal-Token)
→ Interessent klickt Link → Portal-Seite "Schlüssel erzeugen"
→ Interessent erzeugt sich selbst einen kostenlosen Key (CF-FREE-...)
→ Keine Verbindung zwischen E-Mail und Key
→ Interessent gibt Frage im Portal ein
→ Antwort best effort (keine Garantie)
→ Interessent sieht Tools, FAQ, Roadmap → ggf. Kaufentscheidung
```

**Updates:**
```
Tool prüft beim Start (optional, vom Nutzer angestoßen):
→ GET /api/version/{bundle}?current=1.2.0
→ "Update verfügbar" Banner → Download im Tool
→ Key bestimmt ob Update-Recht besteht
→ Keine E-Mail "Neues Update verfügbar!"
```

**Feature-Voting (nur bezahlter Key):**
```
Portal → Key eingeben → Feature-Requests sehen → Abstimmen
→ Neue Feature-Idee einreichen (Freitext)
→ Status einsehen: "Geplant" / "In Arbeit" / "Fertig"
→ Alles per Key, keine Registrierung
```

**Erreichbarkeit von Code-Fabrik:**
```
Primär:     Portal (per Key — kostenlos oder bezahlt)
Sekundär:   E-Mail-Adresse auf Webseite/Impressum
            → Auto-Reply mit Zufallslink → Nutzer erzeugt Key selbst
            → Inhaltliche Antworten NUR bei rechtlichen Anfragen
Telefon:    Sipgate-Nummer → Anrufbeantworter
            → Nur Impressum-Pflicht + absolute Notfälle
```

**Die E-Mail als Trichter, nicht als Kanal:**
Die E-Mail-Adresse existiert, weil sie muss (Impressum-Pflicht). Aber sie ist kein Kommunikationskanal — sie ist ein Trichter ins Portal. Jede eingehende Mail wird mit einem Auto-Reply beantwortet, der einen Zufallslink enthält. Über diesen Link erzeugt sich der Interessent selbst einen kostenlosen Key — ohne dass Code-Fabrik die E-Mail mit dem Key verknüpfen kann. Das hat drei Effekte:

1. Der Interessent landet im Portal und sieht die Tools, die FAQ, die Roadmap
2. Code-Fabrik muss keine E-Mail-Korrespondenz führen (spart Zeit)
3. Jede Anfrage ist einem Key zugeordnet — auch kostenlose — und kann getrackt werden

---

## 10. Technischer Stack

### 10.1 Infrastruktur

```
PROD-Server (UpCloud, DEV-1xCPU-2GB):
├── Forgejo (eigener Git-Server)
├── OpenClaw (Headless Tauri Builds)
├── GitHub Actions Runner
├── Poller
└── Nightstop (Auto-Shutdown nachts)

Portal-Server (UpCloud, DEV-1xCPU-1GB):
├── Express.js (Port 3200)
├── PostgreSQL 16
├── Caddy (HTTPS, Reverse Proxy)
├── Dispatcher (Job Queue)
└── Watchdog (Health)

DNS: Cloudflare
Secrets: KeePass + .env
Deployment: Ansible (5 Phasen)
```

### 10.2 Desktop-App-Technologie

```
Framework:   Tauri (Rust + Web-Frontend)
UI:          Svelte (Vereins-Tools), React oder Svelte (Finanz — noch offen)
Architektur: Monorepo pro Bundle (50 Tools in einem Repository)
Shared:      UI-Components, Math-Engine, Datenbank-Abstraktion
Daten:       SQLite lokal (pro Tool oder shared per Bundle)
Export:       CSV, JSON, PDF (immer eingebaut)
```

### 10.3 Portal-Architektur

```
portal/src/
├── server.js                    # Express Entry Point
├── dispatcher.js                # Background Queue Processor
├── routes/
│   ├── api-buy.js               # Produktkatalog & Lizenzen
│   ├── api-digistore-ipn.js     # Digistore24 Webhook (SHA256-HMAC)
│   ├── api-ideas.js             # Feature-Ideen + Voting
│   ├── api-support.js           # Support-Tickets
│   ├── api-requests.js          # Feature-Requests
│   └── api-status.js            # Prod-Status & Queue-Monitoring
├── services/
│   ├── license.js               # Key-Lifecycle
│   ├── digistore-verify.js      # IPN-Signaturprüfung
│   └── forgejo.js               # Release-Fetching
└── db/
    └── init.sql                 # Schema
```

---

## 11. Die zwei Startbundles — parallel

### 11.1 Warum parallel, nicht sequenziell

Peter hat für beide Bundles Referenzkunden. Sequenziell (erst Verein, dann Finanz) verliert 6 Monate beim zweiten Kunden. Parallel heißt nicht doppelter Aufwand — es heißt: beide Gespräche jetzt führen, aus beiden die ersten 3 Tools ableiten, und die Pipeline so bauen, dass sie für beide funktioniert.

### 11.2 B-05 Vereine — Startplan

```
Woche 1-2:   Gespräch mit Referenzverein (Leitfaden nutzen)
             → Top-3-Schmerzpunkte identifizieren
             → Vermutung: Mitgliederverwaltung, Kassenbuch, SEPA

Woche 3-6:   Erstes Tool bauen (was der Verein als #1 genannt hat)
             → Per Mail an Verein schicken
             → Feedback einholen

Woche 7-10:  Tool iterieren + zweites Tool bauen
             → Beide per Mail an Verein

Woche 11-12: Erster Digistore24-Testkauf
             → Referenzverein kauft (auch wenn symbolisch)
             → Pipeline end-to-end testen

Ab Woche 13: Nächste Tools, Portal-Texte, FAQ
             → Fabrik erweitern
```

### 11.3 B-24 Finanz-Rechner — Startplan

```
Woche 1-2:   Gespräch mit Referenz-Makler (Leitfaden nutzen)
             → Welcher Rechner fehlt ihm?
             → Vermutung: Tilgungsplan, Courtage, bAV

Woche 3-4:   Ersten Rechner bauen
             → Per Mail an Makler schicken
             → Feedback einholen

Woche 5-8:   3-4 weitere Rechner
             → Shared Math-Engine entsteht
             → Wiederverwendbar für alle Bundles

Woche 9-10:  Erster Digistore24-Testkauf
             → Referenz-Makler kauft

Ab Woche 11: Nächste Rechner, Portal-Texte
```

### 11.4 Was parallel entsteht: Die Fabrik

Beide Bundles erzwingen den Ausbau derselben Pipeline:

```
Verein Tool #1 → Tauri-Build-Pipeline steht
Finanz Tool #1 → Shared UI-Components entstehen
Verein Tool #2 → Digistore24-Integration getestet
Finanz Tool #2 → Portal-Download-Flow getestet
Verein Tool #3 → Support-Ticket-System getestet
Finanz Tool #3 → FAQ-Generierung getestet
...
Ab Tool #10 (egal welches Bundle): Die Fabrik läuft.
```

---

## 12. Qualitätssystem — Die Feedback-Schleife

### 12.1 Bug wird zum Test

```
Kunde meldet Bug → Bug wird zum automatisierten Test
→ Test wird Teil jedes Releases
→ Bug kann nie wieder auftreten
→ Testanzahl wächst mit jeder Version
   v1.0: 50 Tests → v1.5: 200 Tests → v2.0: 500 Tests
```

### 12.2 "So rechnet dieses Tool"

Jedes Tool bekommt eine verständliche Erklärungsseite. Beispiele:

**Kassenbuch-Verein:**
> "Einnahmen minus Ausgaben, kategorisiert nach SKR 49.
> Hier ist der Testbericht: 500 Buchungen durchlaufen, alle Summen korrekt."

**Tilgungsplanrechner:**
> "Annuitätendarlehen: Rate = Darlehensbetrag × (Zins × (1+Zins)^n) / ((1+Zins)^n - 1).
> Getestet gegen: Bundesbank-Referenzrechner, 100 Szenarien, maximale Abweichung: 0,01 EUR."

**Beitragsrechner-Verein:**
> "Jahresbeitrag × Mitgliederzahl, abzüglich Ermäßigungen laut Satzung.
> Familienermäßigung: zweites Mitglied 50%, drittes+ 75%."

### 12.3 Bedarf vs. Bedürfnis

| Bedarf (Demand) | Bedürfnis (Wish) |
|---|---|
| Geld hinterlegt (Lizenzinhaber) | Kein Geld hinterlegt |
| Konkretes Problem aus dem Arbeitsalltag | "Wäre cool wenn..." |
| Wird priorisiert, fließt in Roadmap | Wird notiert, nicht priorisiert |
| Feature-Voting berechtigt | Kein Voting-Recht |

Nur Lizenzinhaber (inklusive Test-/Demo-Lizenzen) können Feature-Requests stellen und voten. Wer zahlt, hat ein echtes Problem. Das ist der Qualitätsfilter.

---

## 13. Risiken — ehrlich bewertet

| # | Risiko | Stufe | Gegenmassnahme |
|---|--------|-------|----------------|
| 1 | **Feature Creep**: Jedes Tool wird zu komplex | Hoch | MVP = 1 Funktion + Export. Max 2 Wochen, dann ausliefern. |
| 2 | **Kein Produkt-Market-Fit**: Keiner will das | Mittel | Referenzkunden validieren VOR dem Skalieren. |
| 3 | **Bundle-Erwartungsproblem**: "50 Tools" versprochen, 7 geliefert | Hoch | Nicht "50 Tools" verkaufen. Verkaufe was da ist + "wächst monatlich". |
| 4 | **Digistore24-Image**: Zu "Infoprodukt", nicht "Fachsoftware" | Mittel (Finanz) | Für Vereine OK. Für Makler mittelfristig Alternative evaluieren (Paddle, LemonSqueezy, eigene Rechnung). |
| 5 | **Pipeline vor Produkt**: Perfekte Fabrik, kein Kunde | Hoch | Erst per Mail ausliefern. Fabrik nur so weit bauen wie nötig. |
| 6 | **Solo-Betrieb, Bus-Faktor 1** | Hoch | Open Source + lokale Daten + Doku + "Fabrik im Koffer" entschärfen das. |
| 7 | **1.200 Tools Wartung** | Hoch (langfristig) | Shared Components, Monorepo, KI-gestützte Wartung. Aber: erst Problem wenn >50 Tools live. |
| 8 | **Kein Umsatz in den ersten 6 Monaten** | Hoch | Nebenerwerb, kein Kostendruck. Erster Digistore24-Kauf so früh wie möglich erzwingen. |
| 9 | **Haftung bei Rechenfehler** | Niedrig | Automatisierte Tests + Disclaimer + nur Rechner/Organisationstools, keine Beratung. |
| 10 | **KI-Stigma** | Mittel | "KI-entwickelt, aber KI-frei" als Differenzierung. Offene Tests als Gegenargument. |

---

## 14. Getroffene Entscheidungen & Offene Punkte

### Entschieden

| # | Entscheidung | Gewählt | Begründung |
|---|-------------|---------|------------|
| E1 | E-Mail als Kommunikationskanal | **Trichter, nicht Kanal** | E-Mail existiert (Impressum-Pflicht). Auto-Reply mit Zufallslink → Nutzer erzeugt Key selbst im Portal → keine Verknüpfung Mail↔Key. Inhaltliche Antworten nur bei rechtlichen Anfragen. |
| E2 | Telefon | **Sipgate AB** | Nur Impressum-Pflicht + absolute Notfälle. Kein Support-Kanal. |
| E3 | Kundendaten bei Code-Fabrik | **Radikal minimal** | Nur Key, Bundle-ID, Timestamps, Support-Tickets. Kein Name, keine Mail, keine Adresse. |
| E4 | KI im Tool | **Nein** | KI-entwickelt, aber KI-frei. Keine API-Calls, keine Cloud-Verbindung. |
| E5 | Tools strict no mail | **Ja** | Tools versenden keine E-Mails, empfangen keine, benötigen keine Mail-Adresse. |

### Offen

| # | Entscheidung | Optionen | Empfehlung | Status |
|---|-------------|----------|------------|--------|
| 1 | Finanz-UI-Framework | Svelte vs. React | Svelte (Konsistenz mit Verein) | Offen |
| 2 | Digistore24 langfristig? | Bleiben vs. Paddle/LemonSqueezy/eigene Rechnung | Starten mit DS24, nach 6 Monaten evaluieren | Offen |
| 3 | GitHub-Mirror? | Sofort vs. ab Tag 180 vs. nie | Ab Tag 180 (Sichtbarkeit), Forgejo bleibt primär | Offen |
| 4 | Web-Versionen der Rechner? | Ja (SEO) vs. Nein (Fokus) | Optional, nicht priorisiert | Offen |
| 5 | Einzelverkauf von Tools? | Nur Bundle vs. auch Einzel | Nur Bundle (weniger Verwaltung) | Offen |
| 6 | PayPal statt/neben Digistore24? | Für Ticket-Verkauf (B-05 Events) | Evaluieren wenn konkreter Bedarf | Offen |

---

## 15. Zusammenfassung: Was Code-Fabrik NICHT ist

- **Kein SaaS.** Keine Cloud, kein Login, kein Account.
- **Kein CRM.** Keine Kundendaten bei uns — weder Name noch E-Mail noch Adresse.
- **Kein Monolith.** 50 fokussierte Tools statt einer überladenen Suite.
- **Keine Blackbox.** Offener Code, nachprüfbare Berechnungen.
- **Kein Abo-Zwang.** Einmalkauf ist immer eine Option.
- **Kein Marketing-Getriebenes Unternehmen.** Organisches Wachstum durch Qualität.
- **Kein KI-im-Tool.** KI-entwickelt, aber das Produkt enthält keine KI.
- **Kein E-Mail-Kanal.** E-Mail existiert, ist aber nur Trichter ins Portal — Auto-Reply mit Zufallslink, Key erzeugt der Nutzer selbst.
- **Kein Datensammler.** Code-Fabrik kann keine Kundendaten verlieren, weil Code-Fabrik keine hat.
