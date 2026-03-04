# ADR-009: Dedizierter Test-Server (Entwurf)

**Status:** Idee, kommt nach v0.5.3 (Phase 0 laeuft erstmal auf PROD)

## Problem

Tests laufen aktuell im host-Modus direkt auf dem PROD-Server.
Der Forgejo Runner fuehrt pytest, npm test, bats mit vollen Server-Rechten aus.
Solange nur eigener Code getestet wird: akzeptabel.
Sobald Agents (OpenClaw, Claude Code) autonomen Code generieren
und auto-test.yml diesen Code testet: gefaehrlich.

Szenarien:
- Agent generiert `os.system("rm -rf /")` in einem Test
- Agent schreibt Test der Port 5432 oeffnet -> Kollision mit Forgejo-DB
- Endlosschleife im Test -> PROD-Server wird langsam
- Test braucht 8 GB RAM -> OOM-Kill trifft Forgejo

## Kernidee

Kleiner, billiger Test-Server. Forgejo Runner darauf, Label `test`.
PROD-Runner behaelt Label `ubuntu-latest` fuer Pipeline-Steuerung
(dispatch, bridge, release). Echte Tests laufen auf dem Test-Server.

```
PROD-VPS (Fabrik)                    Test-VPS (Wegwerf)
+-- Forgejo Server                   +-- Forgejo Runner
+-- Runner (ubuntu-latest)           |   Label: "test"
|   -> dispatch, bridge, release     |   -> pytest, npm test, bats
|   -> KEINE Tests mehr              |   -> Darf kaputtgehen
+-- OpenClaw                         |   -> Rebuild in 5 Min
+-- PostgreSQL                       +-- Python, Node, pwsh, bats
+-- Caddy
```

## Varianten

### A: Permanenter Mini-Server (~3-5 EUR/Monat)

UpCloud/Hetzner 1 CPU, 1-2 GB RAM. Laeuft 24/7.
Runner pollt Forgejo, nimmt Jobs mit Label `test` an.

- Einfachste Variante
- Kein Start/Stop-Overhead
- Kosten auch wenn keine Tests laufen
- Reicht fuer Python/Node Tests locker

### B: On-Demand (Nightstop-Pattern)

Wie PROD-Nightstop: Test-Server nur tagsueber.
Oder: nur hochfahren wenn Job in der Queue.
Portal/Dispatcher koennte das triggern (Pattern existiert schon).

- Spart ~50% Kosten bei Nacht-Stopp
- Komplexer (Start/Stop-Logik)
- Verzoegerung bei erstem Test (~2 Min Bootzeit)

### C: Docker-Isolation auf PROD (kein extra Server)

Runner-Label von `host` auf `docker` umstellen.
Tests laufen in Wegwerf-Containern auf PROD.

- 0 EUR Zusatzkosten
- Tests koennen PROD nicht beschaedigen
- ABER: teilen sich CPU/RAM mit Forgejo
- Runner-Setup wird komplexer (Docker-in-Docker oder Socket)

## Empfehlung (vorlaeufig)

Variante A fuer den Anfang. 3-5 EUR/Monat fuer einen Server
der kaputtgehen darf ist billiger als ein PROD-Ausfall.
Ansible-Rolle existiert schon (Runner-Setup), nur anderes
Label und anderer Server.

Variante C als Zwischenschritt wenn Kosten ein Problem sind.

## Was sich aendert

- auto-test.yml: `runs-on: test` statt `runs-on: ubuntu-latest`
- Runner-Rolle: zweite Instanz mit anderem Label
- Ansible Inventory: neuer Host `test-vps`
- Teardown: Test-VPS mit abreissen (oder stehen lassen, ist billig)

## Was sich NICHT aendert

- Forgejo bleibt auf PROD
- Pipeline-Steuerung (dispatch, bridge, release) bleibt auf PROD
- Test-Konventionen (tests/, tests/windows/) bleiben gleich
- Workflows aendern nur das Label, nicht die Steps

## Voraussetzungen

- v0.5.3 Phase 0 laeuft (Workflow-Template, Konventionen)
- Bestandsaufnahme: wie viel CPU/RAM brauchen Tests typischerweise?
- Entscheidung: Variante A, B oder C

## Bezug zu ADR-008 (Multi-Provider)

Wenn ADR-008 (Provider-Abstraktion) umgesetzt wird, kann der
Test-Server auf einem anderen Provider laufen als PROD.
Test-VPS auf Hetzner (billig), PROD auf UpCloud (bekannt).
Doppelter Nutzen: Test-Isolation + Provider-Diversifizierung.

## Referenz-Produkt: Fruehwarnreport

Das Fruehwarnreport-Script (studio-ops, Python, 730 Zeilen, 24 Tests)
dient als Referenz-Produkt fuer Phase 0 Testing:
- Reine Datenverarbeitung (CSV -> HTML Report)
- Keine Windows-APIs, keine Internetverbindung
- pytest + unittest, tempfile-basiert
- Laeuft auf Linux ohne Einschraenkungen
- Zeigt das Pattern: src/ + tests/ + sample_data/ + requirements.txt
