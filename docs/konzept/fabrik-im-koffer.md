# Fabrik im Koffer — Installationskonzept

## Ueberblick

Die "Fabrik im Koffer" ist der portable, stateless Installer fuer die gesamte
Code-Fabrik-Infrastruktur. Alles was man braucht: ein USB-Stick mit drei Dateien.

### USB-Stick Inhalt

```
/mnt/usb/
  install.sh           — Installer-Script
  codefabrik.tar.gz    — Ansible + Portal + Products
  vault.kdbx           — KeePass-Datenbank (Secrets)
```

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

### Secrets-Handling in Playbooks

- **Vault-Secrets** (API-Tokens etc.): via `-e @/root/secrets.yml` aus KeePass
- **Runtime-Secrets** (Passwoerter, Server-IPs): aus `/output/.*.env` Dateien
- **Forgejo-Token**: aus `/output/.tokens-env`

## Tarball-Inhalt

```
codefabrik.tar.gz
  ansible/        — Playbooks, Roles, Templates
  portal/         — Portal-Anwendung (Express.js)
  products/       — Produkt-Quellcode (fuer seed-products)
  .gitignore
  teardown-remote.sh
```

Ausgeschlossen: `node_modules/`, `target/`, `dist/`, `scripts/`, `.git/`,
alle `*.env`-Dateien, Vault-Dateien.

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
