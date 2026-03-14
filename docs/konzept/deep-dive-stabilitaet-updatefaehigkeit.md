# Deep Dive: Stabilitaet, Sicherheit und Updatefaehigkeit

Stand: 2026-03-10 | Zielgruppe: Kunden, Interessenten, Partner

---

## Zusammenfassung

Code-Fabrik Desktop-Produkte (Rechnung Lokal, Mitglieder Lokal) speichern
alle Daten lokal auf Ihrem Rechner. Keine Cloud, kein Konto, keine
Abhaengigkeit von einem Server. Dieses Dokument erklaert, wie die Software
Ihre Daten bei Updates schuetzt — und warum das zuverlaessiger funktioniert
als bei den meisten vergleichbaren Produkten.

---

## 1. Wo liegen Ihre Daten?

```
Ihr Rechner
  └── Dokumente/
        └── Rechnung Lokal/
              ├── daten.db          ← Ihre Datenbank (verschluesselt)
              ├── daten.db.backup   ← Automatisches Backup
              └── backups/
                    ├── 2026-03-09.db
                    ├── 2026-03-08.db
                    └── ...
```

**Alles bleibt auf Ihrem Rechner.** Keine Daten werden in die Cloud
hochgeladen. Kein Internetzugang fuer den taeglichen Betrieb noetig
(nur fuer Updates und Lizenzpruefung alle 30 Tage).

---

## 2. Was passiert bei einem Update?

### Der normale Fall (99% aller Updates)

```
Sie starten die App
  → App prüft: Gibt es eine neue Version?
  → Ja: Download im Hintergrund
  → "Neue Version verfuegbar — jetzt neu starten?"
  → Neustart
  → App prueft Datenbank-Version
  → Passt Datenbank zur neuen App-Version?
     → Nein: Automatische Anpassung (< 1 Sekunde)
  → Fertig. Sie arbeiten weiter wie gewohnt.
```

Sie merken davon in der Regel nichts. Die Datenbank wird automatisch
an das neue Format angepasst. Ihre Daten bleiben vollstaendig erhalten.

### Was dabei im Hintergrund passiert

Vor jeder Anpassung der Datenbank:

1. **Automatisches Backup** — Ihre aktuelle Datenbank wird kopiert
2. **Anpassung** — Neue Felder werden hinzugefuegt (vorhandene bleiben)
3. **Pruefung** — Die App kontrolliert, ob alles korrekt ist
4. **Bei Fehler: Automatische Wiederherstellung** — Das Backup wird
   zurueckgespielt, Ihre Daten sind unveraendert

### Der seltene Fall: Grosse Versionsspruenge

Wenn Sie mehrere Updates uebersprungen haben (mehr als 3 Versionen),
nutzt die App einen besonderen Mechanismus: Sie baut Ihre Datenbank
aus dem **Aenderungsprotokoll** neu auf. Jede Aenderung, die Sie jemals
vorgenommen haben, ist lueckenlos gespeichert und kann abgespielt werden.

```
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
```

---

## 3. Drei Sicherheitsnetze fuer Ihre Daten

### Sicherheitsnetz 1: Automatisches Backup

Die App erstellt automatisch Sicherungskopien:
- **Taeglich** — die letzten 7 Tage
- **Woechentlich** — die letzten 4 Wochen
- **Monatlich** — unbegrenzt

Vor jedem Update wird zusaetzlich eine Sicherungskopie erstellt.
Sie koennen jederzeit eine aeltere Version Ihrer Daten wiederherstellen:
Einstellungen → Backup → Wiederherstellen.

### Sicherheitsnetz 2: Aenderungsprotokoll (Event-Log)

Jede Aenderung an Ihren Daten wird in einem manipulationssicheren
Protokoll festgehalten:

- Rechnung erstellt, geaendert, storniert
- Kunde angelegt, Adresse geaendert
- Einstellung geaendert

Das Protokoll ist kryptographisch verkettet (HMAC-SHA256). Wenn jemand
eine Aenderung nachtraeglich manipuliert, erkennt die Software das sofort.

**Nutzen fuer Sie:**
- Im Notfall kann die gesamte Datenbank aus dem Protokoll neu aufgebaut werden
- Fuer Steuerpruefer nachvollziehbar: Wer hat wann was geaendert
- Entspricht den Anforderungen der GoBD (Grundsaetze ordnungsmaessiger Buchfuehrung)

### Sicherheitsnetz 3: Verschluesselung

Die gesamte Datenbank ist mit AES-256 verschluesselt (SQLCipher).
Ohne Ihren Schluessel kann niemand die Datei oeffnen — kein Familien-
mitglied, kein Techniker, kein Einbrecher.

Der Schluessel liegt im sicheren Bereich Ihres Betriebssystems
(Windows: Credential Manager, macOS: Keychain, Linux: GNOME Keyring).

---

## 4. Wie wird die Zuverlaessigkeit sichergestellt?

### Automatisierte Tests vor jedem Release

Bevor eine neue Version veroeffentlicht wird, durchlaeuft sie
**7 Kategorien automatisierter Tests**:

| Test | Was wird geprueft | Warum wichtig |
|------|-------------------|---------------|
| Migrations-Test | Kann eine aeltere Datenbank aktualisiert werden? | Kein Datenverlust bei Updates |
| Ketten-Test | Funktioniert v0.1 → v0.2 → ... → aktuell? | Auch lang-vernachlaessigte Installationen |
| Replay-Test | Kann die DB aus dem Protokoll neu aufgebaut werden? | Notfall-Wiederherstellung |
| Integritaets-Test | Erkennt die Hash-Kette Manipulation? | Datenintegritaet |
| Unit-Tests | Funktioniert jede einzelne Funktion? | Keine Regressionen |
| Integrations-Tests | Arbeiten die Komponenten zusammen? | Keine Seiteneffekte |
| Smoke-Tests | Startet die App, kann man arbeiten? | Grundfunktionen |

### Fixture-Kette: Jede Version wird aufbewahrt

Fuer jede veroeffentlichte Version wird eine Test-Datenbank archiviert.
Jede neue Version muss beweisen, dass sie Daten aus **jeder** frueheren
Version korrekt verarbeiten kann. Diese Archive werden nie geloescht.

```
Beispiel fuer Version 1.5:

  v1.0 → v1.5  ✓ Getestet, funktioniert
  v1.1 → v1.5  ✓ Getestet, funktioniert
  v1.2 → v1.5  ✓ Getestet, funktioniert
  v1.3 → v1.5  ✓ Getestet, funktioniert
  v1.4 → v1.5  ✓ Getestet, funktioniert
  Neu → v1.5   ✓ Getestet, funktioniert
```

**Das bedeutet:** Selbst wenn Sie ein Jahr lang kein Update gemacht haben,
funktioniert das naechste Update zuverlaessig — weil es gegen Ihre
Version getestet wurde.

---

## 5. Vergleich mit anderen Produkten

### Lokale Desktop-Software

| Eigenschaft | Rechnung Lokal | GnuCash | HomeBank | KMyMoney | MoneyMoney |
|------------|----------------|---------|----------|----------|------------|
| **Daten lokal** | Ja | Ja | Ja | Ja | Ja |
| **Verschluesselung** | AES-256 (SQLCipher) | Nein | Nein | Nein | Ja (Master-PW) |
| **Auto-Update** | Ja | Nein (manuell) | Nein (manuell) | Nein (manuell) | Ja |
| **Backup vor Update** | Automatisch | Manuell | Manuell | Manuell | Manuell |
| **Aenderungsprotokoll** | HMAC-Hash-Kette | Nein | Nein | Nein | Nein |
| **Replay (Notfall-Rebuild)** | Ja | Nein | Nein | Nein | Nein |
| **Migrations-Tests** | Automatisiert (7 Kat.) | Begrenzt | Nein | Begrenzt | Unbekannt |
| **Versionsspruenge** | Beliebig (via Replay) | Nur aufeinanderfolgend | Nur aufwaerts, Datenverlust moeglich | Probleme dokumentiert | Unklar |
| **Preis** | 39 EUR/Jahr | Kostenlos | Kostenlos | Kostenlos | 30 EUR (einmalig) |

#### Bekannte Probleme bei Vergleichsprodukten

**GnuCash** (Open Source, kostenlos):
- Migrationen zwischen Major-Versionen erfordern Zwischeninstallationen
- Direktes Ueberspringen von Versionen kann zu Datenproblemen fuehren
- Kein Auto-Update — Benutzer muss selbst herunterladen und installieren
- Dateien sind unverschluesselt auf der Festplatte
- Quelle: [GnuCash Migrationsdokumentation](https://www.gnucash.org/docs/v5/C/gnucash-guide/basics-migrate-settings.html)

**HomeBank** (Open Source, kostenlos):
- Rueckwaertskompatibilitaet explizit NICHT garantiert
- Oeffnen einer neueren Datei mit aelterer Version kann Datenverlust verursachen
- Ausfuehrung einer "Sanity Check" nach Updates, die Daten veraendern kann
- Quelle: [HomeBank FAQ](https://www.gethomebank.org/en/faq.php)

**KMyMoney** (Open Source, kostenlos):
- Dokumentierte Bugs mit Datenverlust bei bestimmten Operationen (Payee-Merge)
- Fehlende Update-Funktionen in der Datenbank-Schicht fuehrten zu App-Haengern
- Fixes werden aktiv entwickelt (v5.2.2, Februar 2026)
- Quellen: [KMyMoney 5.2.2](https://kmymoney.org/2026/02/22/kmymoney-5-2-2-released.html), [KMyMoney Changelog](https://kmymoney.org/changelog.html)

**MoneyMoney** (Kommerziell, macOS):
- Verschluesselte Datenbank mit Master-Passwort
- Hohe Zuverlaessigkeit ueber Jahre ("never failed")
- ABER: Ein-Entwickler-Abhaengigkeit — als der Entwickler erkrankte,
  konnten keine Updates geliefert werden, Bankanbindungen fielen aus
- Nur macOS, kein Windows/Linux
- Quelle: [ifun.de — MoneyMoney ohne Aktualisierungen](https://www.ifun.de/moneymoney-ohne-aktualisierungen-mehrere-bankzugaenge-betroffen-275402/)

### Cloud-Software (SaaS)

| Eigenschaft | Rechnung Lokal | lexoffice | sevdesk |
|------------|----------------|-----------|---------|
| **Daten lokal** | Ja | Nein (Cloud) | Nein (Cloud) |
| **Offline nutzbar** | Ja | Nein | Nein |
| **Datenschutz** | Volle Kontrolle | Server in DE | Server in DE (ISO 27001) |
| **Update-Risiko** | Kontrolliert (Sie entscheiden) | Automatisch, ohne Ihr Zutun | Automatisch, ohne Ihr Zutun |
| **Anbieter-Abhaengigkeit** | Gering (lokale Daten + Quellcode) | Hoch (Daten auf Server) | Hoch (Daten auf Server) |
| **Bei Insolvenz des Anbieters** | Software + Daten bleiben | Zugang gefaehrdet | Zugang gefaehrdet |
| **Preis** | 39 EUR/Jahr | ab 90 EUR/Jahr | ab 108 EUR/Jahr |

#### Bekannte Probleme bei Cloud-Loesungen

**lexoffice** (Lexware Office):
- Berichte ueber Datenverlust bei grossen Datenmengen
- ELSTER-Modul nicht immer aktuell, was zu Uebertragungsproblemen fuehrt
- Staendige Aenderungen an der Oberflaeche verwirren Nutzer
- Kein Zwei-Faktor-Authentifizierung (Stand 2025 kritisiert)
- Quelle: [OMR Reviews](https://omr.com/en/reviews/product/lexoffice), [Trustpilot](https://de.trustpilot.com/review/www.lexoffice.de?page=6)

**sevdesk**:
- ISO 27001-zertifiziert, technisch solide
- Aber: Abhaengigkeit von Internetverbindung und Server-Verfuegbarkeit
- Datenexport moeglich, aber Migration zu anderem Anbieter aufwendig

---

## 6. Was "kein persoenlicher Support" bedeutet

### Was Sie bekommen

- **Automatische Updates** mit Datenschutz-Garantie
- **Wissensdatenbank** mit Anleitungen und Loesungen
- **Community-Forum** (GitHub Discussions) fuer Austausch mit anderen Nutzern
- **Anonyme Fehlerberichte** (nur mit Ihrer Zustimmung) — wir sehen Probleme
  bevor Sie sie bemerken und koennen Fixes gezielt bauen

### Was Sie NICHT bekommen

- Kein Telefon-Support
- Kein Chat-Support
- Kein Ticket-System
- Keine individuelle Hilfe bei der Einrichtung

### Warum das funktioniert

Die Software ist so gebaut, dass sie sich selbst erklaert und repariert:

1. **Klare Fehlermeldungen** — Jeder Fehler sagt Ihnen: Was ist passiert,
   sind Ihre Daten sicher, und was Sie tun sollen
2. **Automatische Reparatur** — Bei Update-Problemen greift das Backup
   automatisch, ohne dass Sie etwas tun muessen
3. **Getestet gegen jede Version** — Kein Update geht raus, das nicht
   gegen jede fruehere Version getestet wurde

**Der Vergleich:** Die meisten kostenlosen Desktop-Programme (GnuCash,
HomeBank, KMyMoney) bieten ebenfalls keinen persoenlichen Support —
aber auch keine automatischen Updates, keine Verschluesselung und
keine automatisierten Migrations-Tests. Sie zahlen 39 EUR/Jahr fuer
die Sicherheit, dass Updates zuverlaessig funktionieren.

---

## 7. Haeufige Fragen

**"Was wenn meine Festplatte kaputt geht?"**
→ Ihre automatischen Backups liegen im selben Verzeichnis. Wir empfehlen
  zusaetzlich, den Datenordner regelmaessig auf einen USB-Stick zu kopieren.
  Die App erinnert Sie alle 30 Tage daran.

**"Kann ich meine Daten exportieren?"**
→ Ja. Alle Daten koennen jederzeit als CSV exportiert werden. Rechnungen
  als PDF. Sie sind nie eingesperrt.

**"Was wenn es Code-Fabrik nicht mehr gibt?"**
→ Ihre Daten liegen lokal auf Ihrem Rechner. Die Software funktioniert
  ohne Internet weiter (bis zu 180 Tage ohne Lizenzpruefung). Der Quellcode
  ist oeffentlich zugaenglich — im Ernstfall kann die Community die Software
  weiterentwickeln.

**"Kann ich eine alte Version weiterverwenden?"**
→ Ja. Updates sind empfohlen, aber nicht erzwungen. Die App funktioniert
  auch ohne Update weiter. Sie erhalten lediglich ab 3 uebersprungenen
  Versionen einen Hinweis, dass ein Update empfohlen wird.

**"Sind meine Daten DSGVO-konform gespeichert?"**
→ Ja. Alle Daten liegen ausschliesslich auf Ihrem Rechner, verschluesselt
  mit AES-256. Keine Cloud, kein Tracking, keine Datenverarbeitung durch
  Dritte. Fuer den Datenschutzbeauftragten: Die Software fuehrt ein
  lueckenloses Aenderungsprotokoll (Audit-Trail).

---

## 8. Technische Details (fuer IT-Verantwortliche)

| Eigenschaft | Detail |
|-------------|--------|
| Datenbank | SQLite + SQLCipher (AES-256-CBC) |
| Schluessel-Ableitung | PBKDF2-HMAC-SHA256, 100.000 Iterationen |
| Schluessel-Speicher | OS-Keystore (DPAPI / Keychain / libsecret) |
| Audit-Trail | Event-Log mit HMAC-SHA256 Hash-Kette |
| Event-Format | Snapshot (vollstaendiger Zustand pro Event) |
| Migrations-Strategie | Inkrementell (≤3 Versionen) oder Event-Replay (>3) |
| Backup-Rotation | 7d taeglich, 4w woechentlich, monatlich |
| Auto-Update | electron-updater (signierte Pakete) |
| Code-Signing | Authenticode (Windows), Notarization (macOS) |
| Test-Abdeckung | 7 Kategorien, automatisiert in CI/CD |
| Offline-Faehigkeit | Voller Funktionsumfang, Lizenz-Cache 30 Tage |
| Maximale Offline-Zeit | 180 Tage (dann erneute Lizenzpruefung noetig) |
| Datenformat | Offen (SQLite), Export als CSV/PDF |
| Plattformen | Windows 10+, macOS 12+, Linux (AppImage) |

---

## 9. Einordnung: Wo steht Rechnung Lokal im Markt?

```
                    Datenschutz / Kontrolle
                           ▲
                           │
          HomeBank ●       │      ● Rechnung Lokal
          GnuCash ●        │
         KMyMoney ●        │      ● MoneyMoney
                           │
    ───────────────────────┼──────────────────► Zuverlaessigkeit bei Updates
                           │
                           │      ● sevdesk
                           │      ● lexoffice
                           │
                           │
```

**Rechnung Lokal kombiniert die Datenkontrolle lokaler Open-Source-Software
mit der Update-Zuverlaessigkeit kommerzieller Cloud-Loesungen — zu einem
Bruchteil des Preises.**

Die bestehenden lokalen Finanz-Programme (GnuCash, HomeBank, KMyMoney) bieten
Datenkontrolle, aber weder automatische Updates noch Verschluesselung noch
automatisierte Migrations-Tests. Cloud-Loesungen (lexoffice, sevdesk) bieten
zuverlaessige Updates, aber auf Kosten der Datenkontrolle und zu deutlich
hoeherem Preis.

---

*Dieses Dokument beschreibt den Zielzustand fuer Version 1.0.
Einzelne Funktionen (SQLCipher, Auto-Update, Code-Signing) werden schrittweise
eingefuehrt. Der aktuelle Implementierungsstand ist im internen Konzept
`update-sicherheit-ohne-support.md` dokumentiert.*
