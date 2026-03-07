# Externer Review-Prompt: Code-Fabrik Entwicklungsprozess

*Erstellt: 2026-03-07*
*Zweck: Externer Review des gesamten Entwicklungs- und Betriebsprozesses*

---

## Auftrag an den Reviewer

Bitte bewerte den Entwicklungsprozess, die Agentenstruktur, die Dokumentenablage und die Selbstinstallationsroutine der Code-Fabrik — einer Ein-Personen-Software-Manufaktur fuer fokussierte Desktop-Tools.

Bewerte aus der Perspektive eines erfahrenen Software-Architekten / DevOps-Engineers:

1. **Ist der Prozess tragfaehig fuer einen Solo-Gruender mit ~20 geplanten Produkten?**
2. **Wo sind die groessten Risiken und Luecken?**
3. **Was wuerdest du als erstes aendern oder absichern?**
4. **Ist die Dokumentenstruktur nachvollziehbar und wartbar?**
5. **Ist die Selbstinstallation robust genug fuer Disaster Recovery?**

---

## 1. Kontext: Was ist Code-Fabrik?

### Geschaeftsmodell

- Solo-Gruender, keine Angestellten
- ~20 geplante Desktop-Produkte (Electron + Svelte + SQLite)
- GPL 3.0 Open Source, Einnahmen ueber Support-Abo via Digistore24
- Zielgruppe: Kleine Vereine, Traeger, Dienstleister im DACH-Raum
- Lizenzschluessel als einzige Kundenidentitaet (kein Account, kein Login, kein E-Mail-Zwang)
- KI-gestuetzter Support (Produkt diagnostiziert → KI analysiert → Gruender nur bei Eskalation)

### Vier Versprechen

1. **Keine Geheimnisse** — Code offen, Berechnungen nachvollziehbar
2. **Keine Cloud** — Daten bleiben lokal, kein Telemetrie, kein E-Mail
3. **Kein Kaefig** — Export in offenen Formaten, volle Datenportabilitaet
4. **Kein Kontaktzwang** — Lizenzschluessel wie Paketnummer, kein Account noetig

### Aktueller Stand

- 1 Produkt in Entwicklung: MitgliederSimple (Vereinsverwaltung), v0.4.0
- 1 weiteres Produkt: FinanzRechner (5 Rechner), v0.1.0
- Plattform-Migration: Tauri v2 → Electron (wegen Windows 10 Kompatibilitaet)
- Infrastruktur: UpCloud VPS + Forgejo + Portal, selbstinstallierend

---

## 2. Agentenstruktur und Rollenverteilung

### Drei Rollen

| Rolle | Besetzt durch | Modell | Aufgabe |
|---|---|---|---|
| **Product Owner / Architekt** | Claude Code (lokal, CLI) | Claude Opus | Plant, reviewt, entscheidet. Schreibt Spezifikationen und Arbeitspakete. |
| **Entwickler** | OpenClaw (Server, Docker) | Claude Sonnet (impl) + Claude Opus (review) | Setzt Arbeitspakete um. Schreibt Code, fuehrt Tests aus. |
| **Gruender** | Mensch | — | Strategische Entscheidungen, Eskalationen, externe Reviews, KeePass-Verwaltung. |

### Workflow: Claude Code ↔ OpenClaw

```
Gruender gibt Auftrag
        ↓
Claude Code (lokal) plant:
  - Detaillierter Entwicklungsplan
  - Genaue Dateiliste (neu/geaendert)
  - Code-Snippets fuer jede Aenderung
  - Akzeptanzkriterien und Testfaelle
  - Verifikationsschritte
        ↓
Plan wird als Story-YAML in Forgejo-Repo committed
        ↓
Poller (systemd Timer, 30s) erkennt neue Story
        ↓
5-Phasen-Pipeline (automatisch):

  Phase 1: DISPATCH
    Story aus Inbox → Backlog (nach Produkt sortiert)

  Phase 2: BRIDGE
    Backlog → Feature-Branch im Produkt-Repo
    _task.md mit Aufgabenbeschreibung erstellt

  Phase 3: OPENCLAW
    Docker exec → Claude Code (Sonnet) implementiert
    git add → commit → push
    Bei Fehler: Retry mit Backoff (3x: 10s → 30s → 90s)

  Phase 3b: REVIEW
    Claude Opus prueft Implementation gegen _task.md
    Bei Maengeln: _review.md erstellt → zurueck an OpenClaw
    Nach max N Iterationen: Force-Approve

  Phase 4: PR-CHECK
    Pull Request erstellt → CI laeuft → Auto-Merge bei gruen
    Story nach "done" verschoben
        ↓
Claude Code (lokal) reviewt Ergebnis
  - Stimmt Code mit Vorgaben ueberein?
  - Bestehen alle Tests?
  - Architektur-Pflichten eingehalten?
        ↓
Bei Abweichungen: Neuer Zyklus
```

### Prinzipien

- **Mehr Schleifen, weniger Eigenarbeit**: Claude Code plant/reviewt, OpenClaw programmiert
- **Detailgrad**: Plaene so detailliert, dass OpenClaw ohne Rueckfragen umsetzen kann
- **Kleine Arbeitspakete**: 5 kleine Schleifen statt 1 grosses Paket
- **Test-Gate**: Kein AP abgeschlossen ohne gruene Tests

### Sicherheitsmechanismen

- **Kill Switch**: `runtime_control.jobs_enabled` — Poller stoppt sofort
- **Leader Lock**: 5-Minuten-Lease in PostgreSQL — verhindert Doppelverarbeitung
- **Nacht-Stopp**: systemd Timer 22:00-08:00, Docker-Container gestoppt (Kostenoptimierung)
- **Max Retries**: 3 Versuche mit Exponential Backoff, danach `openclaw-error`
- **Max Review-Iterationen**: Force-Approve nach N Runden
- **Handoff-Regel**: OpenClaw stoppt vor manuellen Schritten, listet diese auf, wartet auf Bestaetigung
- **Credential-Regel**: Niemals Credentials in Chat/Code — nur auf Speicherort verweisen

---

## 3. Selbstinstallationsroutine

### Konzept: "Fabrik im Koffer"

Die gesamte Infrastruktur ist aus einem Tarball + KeePass-DB reproduzierbar.
Kein manuelles Server-Setup, kein Konfigurationsmanagement ausserhalb des Repos.

### Komponenten

| Komponente | Beschreibung |
|---|---|
| `install.sh` | Hauptinstaller (~700 Zeilen, portabel) |
| `codefabrik.tar.gz` | Tarball mit Ansible, Portal, Products, Scripts |
| `Code-Fabrik-V1-0.kdbx` | KeePass-DB mit allen Credentials |
| `~/.ssh/codefabrik_deploy` | SSH-Key (Ed25519, ohne Passphrase) |

### Ablauf

```
install.sh startet
  ↓
Phase 0: Preflight
  Prueft: keepassxc-cli, python3, docker vorhanden?
  Prueft: KeePass-DB und Tarball vorhanden?
  ↓
Phase 1: KeePass oeffnen
  Master-Passwort abfragen
  XML-Export nach /dev/shm (RAM-Disk, nie auf Festplatte)
  ↓
Phase 2: Secrets extrahieren
  Python3 parst KeePass-XML → secrets.yml fuer Ansible
  SSH-Key extrahiert
  Runtime-Dateien extrahiert (Base64-encoded von vorherigem Install)
  Alles in /dev/shm/codefabrik-secrets/
  ↓
Phase 3: Workspace entpacken
  Tarball → /dev/shm/codefabrik-secrets/workspace/
  ↓
Phase 4: Docker-Image bauen
  Ansible-Container (Python 3.12 + Ansible 2.17)
  ↓
Phase 5: Ansible ausfuehren
  docker run mit Mounts:
    - Ansible-Code (read-only)
    - SSH-Keys (read-only)
    - secrets.yml (read-only)
    - /output (read-write fuer State)
  ↓
Phase 6: Writeback
  Runtime-Dateien → Base64 → zurueck in KeePass
  Ermoeglicht idempotente Reinstalls (Passwoerter bleiben erhalten)
  ↓
Phase 7: Cleanup
  shred -u auf alle Dateien in /dev/shm
  Lock-File entfernt (EXIT/INT/TERM Trap)
```

### Was wird installiert?

**PROD-Server** (UpCloud DEV-1xCPU-4GB):

| Service | Container | Port | Zweck |
|---|---|---|---|
| PostgreSQL 16 | factory-postgres | 5432 | System-DB (Forgejo, Poller, Metriken) |
| Forgejo 1.22 | factory-forgejo | 3000 | Git-Server mit Actions |
| OpenClaw | factory-openclaw | — | Claude Code Executor (Docker-in-Docker) |
| Caddy 2 | factory-caddy | 80, 443 | Reverse Proxy + HTTPS |
| Gateway | factory-gateway | 3100 | System-API (/health, /ready, /metrics) |
| Poller | systemd Timer | — | 30s Pipeline-Orchestrator |
| Nacht-Stopp | systemd Timer | — | 22:00 Stop / 08:00 Start |

**Portal-Server** (UpCloud DEV-1xCPU-1GB):

| Service | Container | Port | Zweck |
|---|---|---|---|
| Portal-App | portal-app | 3200 | Express.js (Buy, Support, Ideas, Requests) |
| Dispatcher | portal-dispatcher | — | Background-Worker (Queue → Forgejo) |
| PostgreSQL | portal-db | 5432 | Portal-DB (Lizenzen, IPN-Log, Dispatch) |
| Caddy | portal-caddy | 80, 443 | HTTPS + Routing |
| Watchdog | systemd Timer | — | 5min PROD-Health-Check |

### PostgreSQL-Schema (PROD)

```sql
runtime_control     — Kill Switch, Modus (OFF/PRELIVE/LIVE/MAINTENANCE)
leader_lock         — Poller-Leader-Election (5-Minuten-Lease)
poller_state        — Story-Tracking (Stage: inbox → backlog → ... → done)
poller_events       — Event-Log (append-only, 30 Tage Retention)
pipeline_metrics    — Dauer, Timestamps, Review-Iterationen
```

### PostgreSQL-Schema (Portal)

```sql
licenses            — Lizenzschluessel (Digistore24 + manuell)
digistore_ipn_log   — Alle Digistore24-Webhooks
dispatch_queue      — YAML-Dateien fuer Forgejo-Commits
```

### Teardown

- Remote: Docker compose down, Services stoppen
- UpCloud API: Server + Storage loeschen
- Cloudflare API: DNS-Eintraege entfernen
- Lokal: SSH known_hosts bereinigen, State-Dateien entfernen
- Erhalten: SSH-Key, KeePass-DB, Setup-Logs

---

## 4. Dokumentenstruktur

### Verzeichnisbaum

```
code-fabrik/
  CLAUDE.md                              Agent-Anweisungen (Root)
  docs/
    test-conventions.md                  Test-Konventionen (Phase 0/1/2)
    adr/
      ADR-009-dedizierter-test-server.md Architecture Decision Record
    konzept/
      gesamtkonzept-v3.md               Masterreferenz: 4 Versprechen, Geschaeftsmodell
      grundanker-strategie-philosophie.md Mission, Vision, Architekturprinzipien
      gruenderprinzipien-intern.md       10 interne Entscheidungsregeln, 3 rote Linien
      lizenzstrategie.md                 GPL 3.0, Key-as-Service, Open-Core-Option
      aussendarstellung.md               Externe Kommunikation, Variante C
      positionierung-oss-modelle.md      OSS-Geschaeftsmodell-Analyse
      naechste-schritte.md               Roadmap v0.6.1 → v1.0
      architektur-integritaet-tests.md   Pflicht fuer alle DB-Produkte (775 Zeilen)
      electron-plattform-architektur.md  Plattform-Architektur v6 (2500+ Zeilen)
      architektur-review-protokoll.md    4 externe Reviews dokumentiert
      support-betriebsmodell.md          KI-gestuetzter Support (14 Kapitel)
      ki-support-architektur-dsgvo.md    DSGVO-sichere KI-Support-Architektur
      umsetzungsplan-electron-plattform.md  34 Arbeitspakete in 6 Phasen
      desktop-framework-review.md        Tauri vs. Electron Bewertung
      windows-builds.md                  Windows-Build-Spezifikation
      fabrik-im-koffer.md                Reproduzierbares Deployment
      mehrbenutzerbetrieb.md             Multi-User-Betriebsmodell
      lizenzen-mehrsitz.md               Multi-Site-Lizenzierung
      finanz-rechner-mvp.md              FinanzRechner-Spezifikation
      produktidee-nachweis-simple.md     Produktidee: NachweisSimple
      produktidee-teilnehmer-simple.md   Produktidee: TeilnehmerSimple
    runbooks/
      installation.md                    Install-Runbook (KeePass, Tarball, Ansible)
      digistore24-test.md                Digistore24 IPN-Testprozedur
    roadmap/
      ROADMAP-v0.6.md                   Detaillierte Roadmap
      RELEASES.md                        Release-History + Infra-Status
  products/mitglieder-simple/
    CLAUDE.md                            Produkt-spezifische Agent-Anweisungen
    docs/
      produktspec.md                     Produktspezifikation (5 Stufen)
      RELEASES.md                        Produkt-Release-History
      FAQ.md                             Haeufige Fragen
  ansible/                               Infrastruktur-Code
    playbooks/                           7 Playbooks
    roles/                               23 Rollen
    templates/                           Docker-Compose, Poller, Nacht-Stopp
  portal/                                Portal-App (Express.js, 25 Dateien)
  scripts/                               install.sh, build-installer.sh, seed-keepass.py
```

### Dokumentenhierarchie

```
Strategische Ebene (warum?)
├── gesamtkonzept-v3.md          — Integriert alles
├── grundanker-strategie-philosophie.md
├── gruenderprinzipien-intern.md
└── lizenzstrategie.md

Architektur-Ebene (wie?)
├── architektur-integritaet-tests.md  — Verbindlich fuer alle Produkte
├── electron-plattform-architektur.md — Plattform-Spezifikation v6
├── support-betriebsmodell.md         — Support-Prozess
├── ki-support-architektur-dsgvo.md   — DSGVO-sichere KI
└── architektur-review-protokoll.md   — Externe Review-Ergebnisse

Umsetzungs-Ebene (was konkret?)
├── umsetzungsplan-electron-plattform.md — 34 Arbeitspakete
├── naechste-schritte.md                 — Roadmap
└── ROADMAP-v0.6.md                      — Release-Planung

Betriebs-Ebene (wie betreiben?)
├── runbooks/installation.md             — Install-Runbook
├── test-conventions.md                  — Test-Struktur
├── fabrik-im-koffer.md                  — Disaster Recovery
└── CLAUDE.md (Root + Produkt)           — Agent-Regeln

Produkt-Ebene (je Produkt)
├── produktspec.md                       — Features + Stufen
├── RELEASES.md                          — Versionshistorie
└── CLAUDE.md                            — Produkt-spezifische Regeln
```

### CLAUDE.md als zentrales Steuerungsinstrument

Die CLAUDE.md-Dateien sind die operative Schnittstelle zwischen Mensch und KI-Agenten:

**Root CLAUDE.md** enthalt:
- Sprachregeln (Code: Englisch, UI: Deutsch, Docs: Deutsch)
- Architektur-Pflichten (Event-Log, Schema-Versionierung, 7 Testkategorien, Fixtures)
- Tech-Stack-Definition
- Workflow-Regeln (Claude Code plant → OpenClaw fuehrt aus → Claude Code reviewt)
- Stil-Regeln (kein Over-Engineering, MVP-Fokus, jeder Bug wird zum Test)

**Produkt CLAUDE.md** enthalt:
- Produkt-spezifische Architektur
- DB-Layer-Patterns
- Svelte-Konventionen
- Aktuelle Version und Teststand

---

## 5. Qualitaetssicherung

### 7 Pflicht-Testkategorien (fuer jedes Produkt mit DB)

| # | Kategorie | Prueft | Werkzeug |
|---|---|---|---|
| 1 | Unit-Tests | Einzelne Funktionen | `node --test` |
| 2 | Integrations-Tests | DB + Events zusammen | `node --test` |
| 3 | Migrations-Tests | Jedes Fixture migrierbar | Fixtures aus `tests/fixtures/` |
| 4 | Ketten-Tests | v0.1 → v0.2 → ... → aktuell | Simulierte Nutzung pro Version |
| 5 | Replay-Tests | Zustand aus Events = normaler Zustand | Event-Replay vs. State-Tables |
| 6 | Integritaets-Tests | Hash-Kette erkennt Manipulation | HMAC-SHA256 Verifikation |
| 7 | Smoke-Tests | App startet, CRUD, PDFs | End-to-End |

### Fixture-System

- Jedes Minor-Release erzeugt `tests/fixtures/db_vX.Y.Z.sqlite`
- Definierter Testdatensatz (5 Standard-Mitglieder, Beitragsklassen, Vereinsprofil, Events)
- Alte Fixtures werden NIE geloescht
- Migrationstests muessen ALLE Fixtures auf aktuelle Version migrieren

### Event-Log mit HMAC-Kette

- Jede Schreiboperation → Event (append-only)
- Vollstaendiger Snapshot (nicht Diff)
- HMAC-SHA256 Hash-Kette: Event N referenziert Hash von Event N-1
- Manipulation oder Loeschung bricht die Kette → erkennbar

### Aktueller Teststand MitgliederSimple

- 11 Testdateien, 74 Tests, alle 7 Kategorien abgedeckt
- Keine externen Test-Frameworks (nur Node.js `node --test`)

---

## 6. Bekannte Einschraenkungen und offene Punkte

### Bewusst nicht umgesetzt

- Kein Fernzugriff auf Kundensysteme
- Kein E-Mail-Versand im gesamten System
- Keine Online-Anmeldung oder Kundenportal
- Kein Multi-User (v1.0 ist Single-User)
- Keine Telemetrie (optional Opt-in in spaeterer Phase)

### Offene Risiken (aus Sicht des Gruenders)

- Bus-Faktor 1: Alles haengt am Gruender
- KeePass als Single Point of Truth fuer alle Secrets
- OpenClaw-Qualitaet: Code-Review durch KI, nicht durch Menschen
- Noch kein Windows-Build der Electron-Plattform getestet
- Noch keine Code-Signierung (EV Certificate geplant)
- Noch kein Auto-Update-Mechanismus live

---

## Fragen an den Reviewer

1. **Prozess-Tragfaehigkeit**: Ist die Arbeitsteilung Claude Code (Planer) ↔ OpenClaw (Entwickler) ↔ Gruender (Entscheider) tragfaehig? Wo bricht sie?

2. **Automatisierungs-Risiken**: Der Poller fuehrt alle 30 Sekunden Code aus, der von einer KI geschrieben und von einer KI reviewt wurde. Welche Schutzmechanismen fehlen?

3. **Selbstinstallation**: Ist das KeePass + Tarball + Ansible-Modell robust genug fuer Disaster Recovery? Was passiert wenn die KeePass-DB verloren geht?

4. **Dokumentenstruktur**: 31 Dokumentdateien in 8 Kategorien fuer ein Ein-Personen-Unternehmen — ist das angemessen, zu viel, oder fehlt etwas Wesentliches?

5. **Skalierung auf 20 Produkte**: Die Plattform ist fuer ~20 Produkte ausgelegt. Wo werden die ersten Engpaesse auftreten?

6. **Sicherheit**: Secrets in RAM (/dev/shm), SSH-Key ohne Passphrase, KI mit Schreibzugriff auf Repos — wo sind die groessten Angriffsflaechen?

7. **Recovery**: Wenn der PROD-Server ausfaellt — wie schnell ist die Fabrik wieder arbeitsfaehig? Was fehlt fuer ein belastbares RTO/RPO?

8. **Qualitaetssicherung**: 7 Testkategorien, HMAC-Kette, Fixtures — ist das ausreichend oder fehlen wichtige Aspekte (z.B. Security-Tests, Performance-Tests, Accessibility)?

9. **Was wuerdest du als erstes aendern?** — Top 5 Massnahmen nach Prioritaet.

10. **Was ist unerwartet gut?** — Staerken die nicht offensichtlich sind.
