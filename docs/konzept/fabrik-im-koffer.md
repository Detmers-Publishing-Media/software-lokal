# Fabrik im Koffer — Installationskonzept

## Ueberblick

Die "Fabrik im Koffer" ist der portable, stateless Installer fuer die gesamte
Code-Fabrik-Infrastruktur. Alles was man braucht: ein USB-Stick mit drei Dateien.

### USB-Stick Inhalt

```
/mnt/usb/
  install.sh           — Installer-Script
  codefabrik.tar.gz    — Komplettes Repo (Source + Infra + Docs + Scripts)
  vault.kdbx           — KeePass-Datenbank (Secrets)
```

Der Tarball enthaelt das gesamte Repository — Ansible-Rollen, Portal, Produkt-Quellcode,
Dokumentation, Roadmap, Scripts und CLAUDE.md. Ausgeschlossen sind nur Secrets
(`.env`-Dateien, `vault.yml`), Build-Artefakte (`dist/`, `target/`, `node_modules/`)
und temporaere Dateien (Logs, PIDs, SQLite-WAL).

Nach jeder Installation oder Aenderung wird ein neuer Tarball gebaut
(`scripts/build-installer.sh`), sodass der USB-Stick immer den aktuellen Stand enthaelt.

### Persistenter Drive (Binaries)

Kompilierte Desktop-Apps (Tauri-Builds: EXE, DMG, AppImage) liegen separat
auf einem persistenten Drive — nicht im Tarball:

```
/persistent/
  binaries/
    mitglieder-simple/
      v0.4.0/
        MitgliederSimple-0.4.0-setup.exe
        MitgliederSimple-0.4.0.dmg
        MitgliederSimple-0.4.0.AppImage
    finanz-rechner/
      v0.1.0/
        FinanzRechner-0.1.0-setup.exe
        ...
```

**Grund:** Binaries sind gross (50-100 MB pro Plattform) und aendern sich nur bei
Releases. Der Tarball enthaelt den Quellcode — die Binaries koennen jederzeit
aus dem Source neu gebaut werden (via CircleCI oder lokal mit `cargo tauri build`).

## Prinzipien

### Stateless

Der Installer speichert keinen lokalen Zustand. Bei jedem Start:

1. Secrets werden aus KeePass geladen (einmalig, in RAM)
2. Der Ist-Zustand wird direkt bei den Cloud-APIs abgefragt (UpCloud, Cloudflare)
3. Entscheidungen werden dem Benutzer vorgelegt

Es gibt keine Config-Dateien, keine gespeicherten IPs, keine lokale Datenbank.

### Sicher

- Alle Secrets leben im RAM (`/dev/shm/`), nie auf der Festplatte
- Bei Beendigung wird alles geschreddert (`shred -u`)
- KeePass + YubiKey fuer Zwei-Faktor
- Runtime-Daten (Server-IPs, Tokens) werden zurueck in KeePass geschrieben

### Portabel

- Laeuft auf jedem Linux mit Docker + KeePassXC
- Ansible laeuft im Docker-Container (kein lokales Setup noetig)
- Alle Abhaengigkeiten im Tarball enthalten

## Installations-Flow

### Phase 0: Installationsmodus

```
UpCloud API abfragen: Existiert 'codefabrik-prod'?

Server vorhanden → Anzeige: "Server existiert (UUID) — wird abgerissen"
Kein Server      → Anzeige: "Kein Server gefunden — Neuinstallation"

Benutzer-Abfrage:
  1) Neuinstallation (bestehenden Server abreissen falls vorhanden)
  2) Update (Server bleibt stehen, nur bei bestehendem Server)
  3) Abbrechen
```

**Neuinstallation (Option 1)**: Idempotent — wenn Server existiert wird er
gestoppt, geloescht, DNS aufgeraeumt. Wenn kein Server existiert werden die
Aufraeum-Schritte uebersprungen. Danach Phase 1-5 komplett.

**Update (Option 2)**: Nur moeglich wenn Server existiert. Phase 1
(Provisionierung) und Phase 1b (DNS) werden uebersprungen.
Server bleibt stehen, Konfiguration wird aktualisiert (Phase 2-5).

**Wichtig**: Die Neuinstallation ist stateless — sie darf nie daran scheitern,
dass nichts zu loeschen ist. Server da → loeschen. Kein Server → weitermachen.

### Phase 1: Server provisionieren (nur Neuinstallation)

- UpCloud API: Server erstellen (`codefabrik-prod`)
- Warten auf SSH-Erreichbarkeit
- Server-UUID + IP in `.server-env` speichern

### Phase 1b: DNS erstellen (nur Neuinstallation)

- Cloudflare API: DNS-Records fuer alle Subdomains
- `git-codefabrik.detmers-publish.de` → Server-IP (proxied)
- `gateway-codefabrik.detmers-publish.de` → Server-IP (proxied)
- `ops-codefabrik.detmers-publish.de` → Server-IP (nicht proxied, fuer SSH-Zugang)

### Phase 2: Server konfigurieren

- Passwoerter laden (Reinstall) oder generieren (Erstinstallation)
- Base-Packages, Caddy, Gateway installieren
- Docker-Compose Stack deployen und starten

### Phase 3: Services konfigurieren

- PostgreSQL, Forgejo, Act-Runner, OpenClaw
- Git-Repos, Deploy-Secrets, Poller

### Phase 4: Smoke-Test + Nacht-Stopp

- Funktionstest aller Services
- Nacht-Stopp Timer einrichten

### Phase 5: Infra nach Forgejo pushen

- Ansible-Code + Konfiguration ins Forgejo-Repo

## Installer-Menue

```
=== Code-Fabrik Installer ===
  1) install          — Alles installieren (PROD + Portal + Seed)
  2) upgrade-portal   — Portal aktualisieren
  3) fabrik           — PROD Status abfragen
  4) nacht-stopp      — Jobs-Verarbeitung stoppen
  5) teardown         — Alles abreissen (PROD + Portal)
  9) status           — Lokalen Docker-Status pruefen
  q) Beenden
```

### Install (1)

Komplett-Installation: fuehrt `install.yml` → `install-portal.yml` → `seed-products.yml`
nacheinander aus. Ein Befehl fuer alles.

### Betrieb (2-4)

Laufende Infrastruktur aktualisieren, ueberwachen und steuern.

### Teardown (5)

Alles abreissen: fuehrt `teardown-portal.yml` → `teardown.yml` nacheinander aus.
Server bei Cloud-Anbieter loeschen, DNS-Records aufraeumen.

**Bekannte Luecke**: Managed PostgreSQL (UpCloud) wird nicht automatisch geloescht.
Muss manuell oder per API entfernt werden.

### Lokal (9)

Lokalen Docker-Status und geladene Secrets pruefen (kein Remote-Zugriff).

## Playbook-Architektur

### Standalone-Playbooks

Jedes Playbook das einzeln aufrufbar ist (nicht als Teil von `install.yml`)
hat ein Pre-Play das die Server-IP dynamisch ermittelt:

```yaml
- name: "Inventory laden"
  hosts: localhost
  connection: local
  gather_facts: false
  tasks:
    - name: "Server-IP aus .server-env laden"
      ansible.builtin.shell: cat /output/.server-env
      register: server_env_raw

    - name: "factory-prod registrieren"
      ansible.builtin.add_host:
        name: factory-prod
        ansible_host: "{{ ... regex_search ... }}"
        ansible_user: root
        ansible_ssh_private_key_file: "~/.ssh/codefabrik_deploy"
        groups: [prod]
```

Keine hartcodierten IPs, kein statisches Inventory fuer Remote-Server.

### Delegate-Regel: localhost vs. Server

**Wichtig:** Ansible-Tasks die auf Server-Dienste (Forgejo, PostgreSQL, Gateway) zugreifen
muessen **auf dem Server** laufen, NICHT mit `delegate_to: localhost`.

Hintergrund: Der Ansible-Docker-Container laeuft auf dem lokalen Rechner (`--network host`).
Port 3000 (Forgejo) ist auf dem Server per UFW blockiert (nur 22, 80, 443 offen).
Ein `delegate_to: localhost`-Task kann `http://<server-ip>:3000` nicht erreichen.

**Regel:**
- Tasks die `localhost:3000` (Forgejo API) oder `localhost:5432` (PostgreSQL) brauchen →
  auf dem Server ausfuehren (kein `delegate_to`)
- Tasks die lokale Dateien lesen/schreiben (`/output/`, `/ansible/`) →
  `delegate_to: localhost` (Ansible-Container)
- Wenn beides noetig (z.B. push-infra: Dateien vom Container + Forgejo API auf Server) →
  Dateien per `synchronize` auf den Server kopieren, dann dort ausfuehren

**Beispiel (push-infra):**
```yaml
# Schritt 1: Dateien vom Ansible-Container auf den Server kopieren
- name: "Ansible-Dateien auf Server kopieren"
  ansible.builtin.synchronize:
    src: /ansible/
    dest: /tmp/infra-push/
  delegate_to: localhost

# Schritt 2: Auf dem Server gegen localhost:3000 pushen
- name: "Nach Forgejo pushen"
  ansible.builtin.shell: |
    cd /tmp/infra-push
    git push origin main
```

### Stateless-Passwort-Regel

Bei jedem Install/Update werden Passwoerter idempotent erzwungen, unabhaengig vom
Zustand der Volumes oder vorheriger Installationen:

- **PostgreSQL:** `ALTER USER forgejo PASSWORD '...'` nach jedem Start
  (in `roles/postgres/tasks/main.yml`)
- **Forgejo Admin:** `forgejo admin user change-password --must-change-password=false`
  nach jedem Start (in `roles/forgejo/tasks/main.yml`)
- **Docker-Output:** `chmod -R a+r $SHM_OUTPUT` nach jedem `docker run`
  (in `install.sh`, damit Writeback nach KeePass funktioniert)

Grund: `POSTGRES_PASSWORD` wirkt nur beim ersten Start einer Volume.
`forgejo admin user create` ueberspringt existierende User. Ohne explizites
Erzwingen kommt es bei Reinstalls zu Passwort-Mismatch.

### Base64-Regel fuer KeePass-Writeback

Runtime-Dateien (`.factory-passwords.env`, `.server-env` etc.) sind mehrzeilig.
`keepassxc-cli add -p` liest aber nur **eine Zeile** als Passwort aus stdin.

**Loesung:** Writeback kodiert den Dateiinhalt als Base64 (einzeilig), Load dekodiert.

```bash
# Writeback (install.sh)
encoded=$(base64 -w0 < "$filepath")
printf '%s\n%s' "$KEEPASS_PASS" "$encoded" | keepassxc-cli add ... -p

# Load (Python in install.sh)
import base64
decoded = base64.b64decode(content).decode("utf-8")
```

Rueckwaertskompatibel: Beim Laden wird `base64.b64decode()` versucht, bei Fehler
wird der Rohinhalt genommen (fuer alte Eintraege, die noch nicht Base64-kodiert sind).

### Secrets-Handling in Playbooks

- **Vault-Secrets** (API-Tokens etc.): via `-e @/root/secrets.yml` aus KeePass
- **Runtime-Secrets** (Passwoerter, Server-IPs): aus `/output/.*.env` Dateien (Base64 in KeePass)
- **Forgejo-Token**: aus `/output/.tokens-env`

## Tarball-Inhalt

```
codefabrik.tar.gz          — Komplettes Repo
  ansible/                 — Playbooks, Roles, Templates, Dockerfile
  portal/                  — Portal-Anwendung (Express.js)
  products/                — Produkt-Quellcode (fuer seed-products)
  scripts/                 — Installer, Build-Scripts, KeePass-Tools
  docs/                    — Konzepte, Runbooks, Roadmap, ADRs
  CLAUDE.md                — Agent-Anweisungen
  .forgejo/                — CI/CD Workflows
  .gitignore
  teardown-remote.sh
```

Ausgeschlossen: `.git/`, `dist/`, `node_modules/`, `target/`, `__pycache__/`,
alle `*.env`-Dateien, `vault.yml`, `vault.kdbx`, Logs, PIDs, `*.zip`,
SQLite-WAL/SHM-Dateien.

## Geplant: Website-Server (Always-On)

Aktuell wird bei Option 1 (Install) alles abgerissen und neu aufgebaut — auch der
Portal-Server mit der oeffentlichen Website. Das bedeutet: waehrend eines Neuaufbaus
ist die Website offline.

### Ziel

Ein kleiner, guenstiger Server (z.B. DEV-1xCPU-1GB) der NUR die statische Website
hostet und beim Neuaufbau stehen bleibt. Der Installer muss unterscheiden:

- **PROD + Portal**: werden abgerissen und neu aufgebaut (wie bisher)
- **Website-Server**: bleibt immer stehen, wird nur bei `upgrade-website` aktualisiert

### Offene Fragen

- Eigener Server oder Cloudflare Pages / GitHub Pages (kostenlos, kein Server noetig)?
- Wenn eigener Server: eigenes Playbook `install-website.yml` + Teardown-Ausnahme
- DNS: `codefabrik.de` / `detmers-publish.de` zeigt auf Website-Server, nicht auf Portal
- Option 1 (Install) muss Website-Server explizit aussparen
- Option 5 (Teardown) braucht Sicherheitsabfrage: "Website-Server auch abreissen?"

---

## Geplant: DB-Backup + Umzug

### Problem

Die Managed PostgreSQL (UpCloud) enthaelt alle Lizenzen, Bestellungen, IPN-Logs
und Produktdaten. Bei einem Umzug (anderer Anbieter, anderes Rechenzentrum) oder
vor einem vollstaendigen Teardown muss die DB gesichert werden.

### Ziel: "Koffer packen"

Der USB-Stick soll alles enthalten um die Fabrik komplett woanders aufzubauen:

```
/mnt/usb/
  install.sh
  codefabrik.tar.gz
  vault.kdbx
  backup/                    ← NEU
    portal-db-YYYY-MM-DD.sql.gz   — PostgreSQL-Dump (komprimiert)
    forgejo-db-YYYY-MM-DD.sql.gz  — Forgejo-DB-Dump
```

### Geplante Menue-Erweiterung

```
  6) backup           — DB-Backup auf USB-Stick / lokales Verzeichnis
  7) teardown         — Alles abreissen (PROD + Portal + optional DB)
```

### Backup-Ablauf (geplant)

1. `pg_dump` auf Portal-Server ausfuehren (Portal-DB)
2. `pg_dump` auf PROD-Server ausfuehren (Forgejo-DB)
3. Dumps komprimieren und in `/output/backup/` ablegen
4. Optional: Dumps auf USB-Stick kopieren

### Teardown mit DB (geplant)

Erweiterung des Teardown-Playbooks:
1. Sicherheitsabfrage: "Managed PostgreSQL loeschen? (Daten gehen verloren)"
2. Nur wenn bestaetigt: UpCloud Managed-DB per API loeschen
3. Empfehlung: Vor Teardown immer `backup` ausfuehren

### Umzug-Szenario

```
Alter Standort:
  1. backup ausfuehren → Dumps auf USB-Stick
  2. teardown ausfuehren (inkl. DB)

Neuer Standort:
  1. install ausfuehren → neue Infrastruktur
  2. restore ausfuehren → Dumps einspielen (geplant)
```

## Erweiterung

Neues Playbook hinzufuegen:

1. Playbook unter `ansible/playbooks/` erstellen (mit Pre-Play fuer Inventory)
2. Einzelaktion: In `install.sh` → `playbook_for()` + `show_menu()` eintragen
3. Teil der Komplett-Installation: In `run_full_install()` eintragen
4. In `build-installer.sh` pruefen ob neue Dateien im Tarball noetig sind
5. Tests in `scripts/test_install.sh` ergaenzen
6. Dokumentation in `docs/konzept/fabrik-im-koffer.md` aktualisieren
