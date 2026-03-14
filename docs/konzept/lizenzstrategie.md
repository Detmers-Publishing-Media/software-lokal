# Code-Fabrik — Lizenzstrategie GPL 3.0 + Servicepaket

*Stand: 2026-03-12*
*Dieses Dokument ersetzt die bisherige MIT-Lizenz-Strategie und "Delayed Open Source".*
*Aktualisiert: "Support-Abo" → "Servicepaket" (Reframing: Bequemlichkeit + Inhalte als Hauptwert, Support als Sicherheitsnetz)*

---

## 1. Kernentscheidung

**Code-Fabrik veroeffentlicht alle Software unter GPL 3.0.**

Der Quellcode ist sofort und vollstaendig oeffentlich auf GitHub verfuegbar.
Es gibt kein "Delayed Open Source", keinen Zeitversatz, keine eingeschraenkte Version.
Die Software ist frei — nicht nur im Sinne von kostenlos, sondern im Sinne von Freiheit.

**Verkauft wird nicht die Software, sondern der Service drumherum:**
Fertige Installer, automatische Updates, Support, Templates, gebrandete PDFs,
Cloud-Backup und Mitbestimmung bei der Weiterentwicklung.

---

## 2. Warum GPL 3.0 statt MIT

| Kriterium | MIT | GPL 3.0 |
|-----------|-----|---------|
| Weiterverbreitung | Beliebig, auch proprietaer | Muss wieder GPL sein |
| Fork-Schutz | Keiner — Fork kann proprietaer werden | Fork muss offen bleiben |
| Community-Effekt | Gering — Verbesserungen fliessen nicht zurueck | Stark — Aenderungen muessen geteilt werden |
| Signal an Kunden | "Wir verschenken das" | "Wir garantieren Freiheit" |
| Kompatibilitaet | Sehr breit | Linux-Kernel, WordPress, viele grosse Projekte |

**Entscheidungsgrund:** GPL 3.0 schuetzt davor, dass jemand den Code nimmt, proprietaer
verpackt und als Konkurrenzprodukt verkauft — ohne zurueckzugeben. Bei MIT waere das legal.
GPL erzwingt, dass Verbesserungen der Community zugutekommen.

---

## 3. Was der Key kauft — und was nicht

### 3.1 Community-Modus (ohne Key)

Jeder kann die Software von GitHub herunterladen, kompilieren und nutzen.
**Alle lokalen Features sind vollstaendig verfuegbar** — keine kuenstlichen Einschraenkungen,
kein Nag-Screen, kein Wasserzeichen, kein Mitglieder-Limit.

Das ist keine Probe-Version. Das ist die vollstaendige Software.

```
COMMUNITY-MODUS (ohne Key):
  Alle lokalen Features vollstaendig
  Alle PDF-Exports ohne Wasserzeichen
  Alle Berechnungen ohne Einschraenkung
  Kein Mitglieder-Limit
  Kein Zeitlimit
  CSV/JSON/PDF Export vollstaendig
  SQLite-Datenbank lokal, verschluesselt
  Event-Log mit Hash-Kette
  DSGVO-Funktionen komplett
```

### 3.2 Servicepaket-Modus (mit Key)

Der Key schaltet **Service-Features** frei — Dinge die eine Verbindung zum
Code-Fabrik-Portal erfordern:

```
SERVICEPAKET-MODUS (mit Key):
  Alles aus Community-Modus PLUS:
  Fertige Installer (EXE/DMG/AppImage Download)
  Zugang zum Download-Portal mit stabilen Releases
  Update-Checker (prueft Portal auf neue Versionen)
  Branchenspezifische Vorlagen-Pakete
  Feature-Requests + Stimmrecht (exklusiv fuer Servicepaket-Kunden)
  Gebrandete PDFs (eigenes Logo im Footer statt "Code-Fabrik")
  Cloud-Backup (verschluesselt, optional)
  Technische Hilfe bei Problemen (Ticket, 48h)
```

**Reihenfolge bewusst:** Bequemlichkeit und Inhalte stehen vorn.
Technische Hilfe ist der letzte Punkt — das Sicherheitsnetz, nicht das Produkt.

### 3.3 Technische Umsetzung des Keys in der App

Die App fragt beim Start: "Haben Sie einen Servicepaket-Schluessel?"

```
App-Start:
  Key vorhanden?
    Ja  → Validierung gegen Portal-API (einmalig, dann 30 Tage Offline-Cache)
        → Service-Features aktiviert
        → Kein Unterschied in lokalen Features
    Nein → Alle lokalen Features verfuegbar
         → Service-Features ausgegraut mit Hinweis:
           "Diese Funktion ist Teil des Servicepakets.
            Mehr erfahren: detmers-publish.de/servicepaket"
         → Kein Nag-Screen, kein Popup, kein Timer
```

**Wichtig:** Die App funktioniert vollstaendig offline und ohne Key.
Der Key ist ein Service-Zugang, kein Produktschluessel.

---

## 4. Anwendung auf MitgliederSimple (Vereinsverwaltung)

### Community-Modus (GitHub, kostenlos)

- Mitgliederverwaltung komplett (CRUD, Suche, Filter)
- Alle PDF-Listen (Mitglieder, Telefon, Geburtstag, Jubilare, Mahnliste)
- Beitragsverwaltung (Zahlungserfassung, Jahresuebersicht, Mahnbriefe)
- CSV-Export/Import
- DSGVO-Einwilligungen und Loeschung
- Vereinsprofil und Briefkopf
- Spendenquittungen
- SEPA-XML Export (ab Stufe 3)
- Alle Stufen (1-5) voll funktionsfaehig — keine Feature-Gates

### Servicepaket-Modus (mit Key)

- **Fertige Installer:** EXE/DMG/AppImage — Download, installieren, fertig
- **Update-Checker:** "Version 1.3.0 verfuegbar — Changelog anzeigen?"
- **Vorlagen:** Satzungsvorlagen, DSGVO-Texte, Datenschutzerklaerung-Muster
- **Gebrandete PDFs:** Vereinslogo im Footer statt "Erstellt mit Code-Fabrik"
- **Cloud-Backup:** Verschluesselte Sicherung (optional)
- **Feature-Requests + Stimmrecht:** Neue Funktionen vorschlagen und abstimmen
- **Technische Hilfe:** Ticket ueber Portal, 48h Antwort

### Preismodell Mitglieder Lokal

```
Community:     0 EUR — alle Features, selbst kompilieren oder von GitHub Release
Servicepaket: 39 EUR/Jahr — fertige Installer + Updates + Vorlagen + technische Hilfe
```

Keine Staffelung nach Mitgliederzahl. Keine Staffelung nach Stufe.
Ein Preis, ein Paket, alles drin. Bestandskunden behalten ihren Preis.

---

## 5. Anwendung auf Finanz-Rechner (Makler-Toolbox)

### Community-Modus (GitHub, kostenlos)

Jeder einzelne Rechner ist als eigenstaendiges Tool auf GitHub verfuegbar:
- BeitragsAnpassungsRechner
- StornoHaftungsRechner
- RatenzuschlagRechner
- CourtagenBarwertRechner
- SpartenDeckungsGrad

Jedes Tool funktioniert vollstaendig: Berechnung, PDF-Export, Transparenz-Box.
Kein Wasserzeichen, keine Einschraenkung, kein "nur Bildschirm-Anzeige".

### Servicepaket-Modus (mit Key): Finanz-Rechner-Toolbox

- **Alle Rechner in einer App:** Statt 5 einzelne Tools eine integrierte Toolbox
- **Fertige EXE/DMG:** Download, installieren, fertig
- **Update-Checker:** Neue Rechner automatisch verfuegbar
- **Vorlagen:** Branchenspezifische Report-Vorlagen
- **Gebrandete PDFs:** Makler-Logo statt "Code-Fabrik"
- **Feature-Requests + Stimmrecht:** Neue Rechner und Funktionen vorschlagen und abstimmen
- **Technische Hilfe:** Ticket ueber Portal, 48h Antwort

### Preismodell Finanz-Rechner

```
Community:     0 EUR — einzelne Rechner von GitHub, selbst kompilieren
Servicepaket: 39 EUR/Jahr — alle Rechner als App + Updates + Vorlagen + technische Hilfe
```

Kein Einmalkauf. Die Software ist Open Source — es gibt nur Servicepakete.

---

## 6. GitHub-Strategie

### Zwei Phasen: Privat bis v1.0, dann Public

GitHub-Organisation: `github.com/codefabrik/` (Team-Plan, bezahlt).

```
Phase 1 — Bis v1.0 (jetzt):
  Private Repos in der GitHub-Organisation
  GitHub Actions fuer CI/CD (Build + Test, Windows/macOS/Linux)
  Build-Artefakte (EXE/DMG) als Actions Artifacts (intern)
  Forgejo bleibt paralleler interner Git-Server
  Referenzkunden bekommen Builds direkt (per Mail oder Portal)

Phase 2 — Ab v1.0 (Go-Live):
  Repos auf Public umschalten (ein Klick pro Repo)
  GPL 3.0 Lizenz in jeder Repo
  GitHub Releases mit Quellcode (kein Binary)
  README mit "So rechnet dieses Tool" + Build-Anleitung
  Issues offen fuer Bug-Reports (auch ohne Key)
```

### GitHub Actions fuer CI/CD

GitHub Actions funktioniert fuer private Repos im Team-Plan (inkl. Build-Minuten).
Beim Umschalten auf Public werden die Actions kostenlos.

```
GitHub Actions:
  Push auf main → Build + Test (Linux, Windows, macOS)
  Build-Artefakte → Actions Artifacts (temporaer, intern)
  Binaries → Portal-Download (mit Key) oder direkt an Referenzkunden
  Ab v1.0: Tag → GitHub Release mit Quellcode-Archiv
```

Forgejo bleibt als interner Git-Server fuer die Fabrik-Infrastruktur.
Produkt-Repos werden auf GitHub gespiegelt (Push-Mirror von Forgejo).

### Was auf GitHub NICHT liegt

- Keine Binaries in GitHub Releases — nur ueber Portal
- Keine Infrastruktur-Repos (Ansible, Vault, Portal)
- Keine Secrets, keine Env-Dateien
- Keine KeePass-Datenbanken

---

## 7. Auswirkungen auf die vier Versprechen

Die GPL-Strategie **staerkt** alle vier Versprechen:

| Versprechen | Vorher (MIT) | Nachher (GPL 3.0) |
|-------------|-------------|-------------------|
| Kein Geheimnis | Code einsehbar | Code einsehbar + Fork-Schutz |
| Keine Cloud | Unveraendert | Unveraendert |
| Kein Kaefig | MIT = jeder kann forken | GPL = Fork muss auch frei bleiben |
| Kein Kontakt noetig | Key = Produktschluessel | Key = Service-Zugang (optional) |

"Kein Kaefig" wird staerker: Bei MIT koennte jemand den Code nehmen und proprietaer
machen — der Nutzer waere dann doch im Kaefig. GPL verhindert das.

"Kein Kontakt noetig" wird ehrlicher: Die Software funktioniert wirklich ohne Key.
Der Key ist ein optionaler Service-Zugang, kein Muss.

---

## 8. Open-Core-Option: Proprietaere Zusatzmodule

### 8.1 Prinzip

GPL 3.0 gilt fuer den Kern der Software. Fuer **zukuenftige Zusatzfunktionen** mit hohem
Entwicklungsaufwand besteht die Option, diese als **separate proprietaere Module** anzubieten.
Das ist ein gaengiges und bewaehrtes Modell ("Open Core"), das von WordPress, GitLab,
Nextcloud und vielen anderen GPL-Projekten genutzt wird.

```
GPL 3.0 Core (frei):                     Proprietaere Module (mit Key):
─────────────────────                     ──────────────────────────────
Alle aktuellen Features                   Zusatz-Plugins / Module
MitgliederSimple komplett                 z.B. Cloud-Backup-Modul
Finanz-Rechner komplett                   z.B. DATEV-Schnittstelle
PDF, CSV, SEPA-XML                        z.B. automatischer MT940-Import
Event-Log, Hash-Kette                     z.B. Premium-Report-Vorlagen
DSGVO-Funktionen                          z.B. Multi-Mandanten-Erweiterung
```

### 8.2 Rechtliche Voraussetzungen

Damit Zusatzmodule proprietaer angeboten werden koennen:

1. **Separater Code:** Das Modul lebt in einem eigenen Repository mit eigener Lizenz.
   Kein GPL-Code wird kopiert oder eingebettet.
2. **Definierte Schnittstelle:** Core und Modul kommunizieren ueber eine dokumentierte
   API (Events, Hooks, Plugin-Interface). Keine direkte Code-Abhaengigkeit.
3. **Core bleibt vollstaendig:** Der GPL-Core muss ohne jedes Modul voll funktionsfaehig
   bleiben. Module erweitern, sie ersetzen nichts.
4. **Klare Kennzeichnung:** Jedes Modul traegt seine eigene Lizenz (z.B. "Code-Fabrik
   Commercial License"). Nutzer wissen was GPL ist und was nicht.

### 8.3 Moegliche Zusatzmodule (Beispiele, nicht geplant)

| Modul | Produkt | Warum proprietaer? |
|-------|---------|-------------------|
| DATEV-Schnittstelle | MitgliederSimple | Hoher Entwicklungsaufwand, Nischen-Feature |
| MT940-Import (Kontoauszug) | MitgliederSimple | Banking-Format-Parsing, regelmaessige Updates |
| Cloud-Backup-Service | Alle | Erfordert Server-Infrastruktur |
| Multi-Mandanten | MitgliederSimple | Dachverband-Feature, komplexe DB-Aenderung |
| Premium-Report-Vorlagen | Finanz-Rechner | Design-Aufwand, branchenspezifisch |
| Bestandsuebertragungs-Assistent | Finanz-Rechner | BiPRO-Schnittstelle, regulatorisch komplex |

### 8.4 Aktueller Status

**Kein Handlungsbedarf jetzt.** Alle aktuellen Features beider Produkte sind und bleiben
GPL 3.0. Die Open-Core-Option ist eine strategische Reserve fuer spaeter, wenn:
- Ein Feature hohen Entwicklungsaufwand erfordert UND
- Es nur fuer einen Teil der Nutzer relevant ist UND
- Es sich sauber vom Core trennen laesst

Entscheidung ob ein konkretes Feature GPL oder proprietaer wird: Einzelfallentscheidung
zum Zeitpunkt der Entwicklung.

---

## 9. Auswirkungen auf das Geschaeftsmodell

### Was sich aendert

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Lizenz | MIT | GPL 3.0 |
| Veroeffentlichung | Delayed (Tag 90+) | Privat bis v1.0, dann Public auf GitHub |
| Key-Funktion | Portal-Zugang (Downloads, Support) | Service-Zugang (Updates, Support, Vorlagen) |
| Probe-Lizenz | 30 Mitglieder, Wasserzeichen | Entfaellt — alles frei |
| Stufen-Preise | 29-219 EUR/Jahr je nach Stufe+Groesse | 29 EUR/Jahr Support-Abo (kein Einmalkauf) |
| Feature-Gates | Stufen schalten Features frei | Keine — alle Features verfuegbar |
| Binaries | Nur ueber Portal | Nur ueber Portal (Quellcode auf GitHub) |

### Was gleich bleibt

- Digistore24 als Zahlungsabwickler
- Portal als zentraler Service-Hub
- Key als einzige Kunden-Identitaet
- Kein Account, kein Login, kein E-Mail noetig
- Sendungsverfolgungsprinzip
- Strict no-email in den Tools
- Referenzkunden-Validierung vor Skalierung

### Revenue-Streams

```
1. Support-Abo (einziger Produkt-Revenue-Stream):
   → 29 EUR/Jahr pro Produkt
   → Fertige Installer + Updates + Support + Vorlagen
   → Kein Einmalkauf — Software ist Open Source, verkauft wird nur der Service

2. Consulting (optional, spaeter):
   → Einrichtungshilfe, Datenmigration, Schulung
   → Auf Anfrage, kein Standardprodukt
```

---

## 10. Kommunikation nach aussen

### Auf der Verkaufsseite

| Nicht sagen | Stattdessen sagen |
|-------------|-------------------|
| "GPL 3.0" | "Der Quellcode ist frei verfuegbar — fuer immer" |
| "Open Source" | "Nachpruefbar — Ihr Kassenprufer kann reinschauen" |
| "GitHub" | "Der Quellcode ist oeffentlich, jeder kann reinschauen" |
| "Support-Abo" | "Rundum-Sorglos-Paket: Updates, Support, Vorlagen" |
| "Community-Modus" | "Sie koennen die Software auch ohne Schluessel nutzen" |

### Auf der GitHub-Seite

```
README.md:
  # MitgliederSimple — Vereinsverwaltung

  Kostenlose Mitgliederverwaltung fuer kleine bis grosse Vereine.
  Lokal installiert, keine Cloud, keine Daten die das Haus verlassen.

  ## Features
  [vollstaendige Feature-Liste]

  ## Build
  [Anleitung zum Selbstkompilieren]

  ## Support-Abo
  Sie moechten fertige Installer, automatische Updates und persoenlichen Support?
  → codefabrik.de/vereins-toolbox

  ## Lizenz
  GPL 3.0 — siehe LICENSE
```

---

## 11. Entscheidungsprotokoll

| # | Entscheidung | Gewaehlt | Begruendung | Datum |
|---|-------------|----------|-------------|-------|
| L1 | Lizenztyp | GPL 3.0 | Fork-Schutz, Community-Effekt, staerker als MIT | 2026-03-06 |
| L2 | Veroeffentlichung | Private Repos bis v1.0, dann Public | Kein Delayed OS, aber kontrollierter Zeitpunkt | 2026-03-06 |
| L3 | Key-Rolle | Service-Zugang | Kein Produktschluessel, keine Feature-Gates | 2026-03-06 |
| L4 | Probe-Lizenz | Abgeschafft | Alle Features frei, Key nur fuer Service | 2026-03-06 |
| L5 | Stufen-Preise | Abgeschafft | Ein Preis pro Bundle, alle Features inklusive | 2026-03-06 |
| L6 | CI/CD oeffentlich | GitHub Actions | Kostenlos fuer Public Repos, kein CircleCI noetig | 2026-03-06 |
| L7 | GitHub-Organisation | codefabrik | Zentrale Anlaufstelle fuer alle oeffentlichen Repos | 2026-03-06 |
| L8 | Open-Core-Option | Vorgesehen | Proprietaere Zusatzmodule moeglich, aktuell kein Bedarf | 2026-03-06 |
| L9 | Einmalkauf | Abgeschafft | Software ist Open Source, kein Produktverkauf, nur Support-Abos | 2026-03-07 |
