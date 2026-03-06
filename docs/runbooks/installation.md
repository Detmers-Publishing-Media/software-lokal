# Installation — Runbook

## Voraussetzungen

### Lokaler Rechner

- Linux mit Docker (laeuft und erreichbar)
- `keepassxc-cli` installiert (Teil von KeePassXC)
- `python3` installiert
- KeePass-Datenbank mit befuellten Secrets (siehe Abschnitt "KeePass-Struktur")

### KeePass-Struktur

Die KeePass-DB muss folgende Eintraege enthalten:

```
Studio Ops/00-Vault/Code-Fabrik/
  upcloud-api-token          — UpCloud API Bearer Token (ucat_...)
  cloudflare-api-token       — Cloudflare API Token (DNS:Edit, Zone Settings:Read)
  anthropic-api-key           — Anthropic API Key
  ollama-api-key              — Ollama API Key
  ollama-host                 — Ollama Host URL
  ollama-model                — Ollama Modellname
  digistore-ipn-passphrase   — Digistore24 IPN Kennwort
  cloudflare-origin-ca-cert  — Cloudflare Origin CA Zertifikat
  cloudflare-origin-ca-key   — Cloudflare Origin CA Private Key
  circleci-api-token         — CircleCI API Token
  github-push-token          — GitHub Push Token (Fine-Grained, Admin:R/W)
  ssh-deploy-key             — SSH Private Key (Ed25519, ohne Passphrase)
  ssh-deploy-key-pub         — SSH Public Key

Studio Ops/00-Vault/Code-Fabrik/Runtime/
  factory-passwords          — .factory-passwords.env (Base64-kodiert bei Reinstall)
  server-env                 — .server-env (Base64-kodiert bei Reinstall)
  tokens-env                 — .tokens-env (Base64-kodiert bei Reinstall)
  portal-passwords           — .portal-passwords.env (Base64-kodiert bei Reinstall)
  portal-env                 — .portal-env (Base64-kodiert bei Reinstall)
```

Die Runtime-Eintraege sind bei einer Erstinstallation leer und werden nach
dem Install automatisch zurueckgeschrieben (Writeback).

### KeePass befuellen

Falls die KeePass-DB neu erstellt werden muss:

```bash
cd ~/code-fabrik
python3 scripts/seed-keepass.py
```

## Tarball bauen

Vor jeder Installation muss ein aktueller Tarball erstellt werden:

```bash
cd ~/code-fabrik
bash scripts/build-installer.sh
```

Ergebnis in `dist/`:

```
dist/
  install.sh           — Installer-Script (Kopie aus scripts/)
  codefabrik.tar.gz    — Ansible-Rollen, Portal, Products (ohne Secrets)
```

### Tarball-Inhalt

```
codefabrik.tar.gz
  ansible/        — Playbooks, Roles, Templates, Dockerfile
  portal/         — Portal-Anwendung (Express.js)
  products/       — Produkt-Quellcode (fuer seed-products)
  .gitignore
  teardown-remote.sh
```

Ausgeschlossen: `node_modules/`, `target/`, `dist/`, `scripts/`, `.git/`,
alle `*.env`-Dateien, Vault-Dateien, Logs.

## Installation starten

### Schritt 1: In das dist-Verzeichnis wechseln

```bash
cd ~/code-fabrik/dist
```

### Schritt 2: Installer starten

```bash
./install.sh
```

Der Installer fragt interaktiv:

1. **KeePass-Pfad** — Absoluten Pfad zur `.kdbx`-Datei eingeben,
   z.B. `~/seafile/ipe-security/Code-Fabrik-V1-0.kdbx`
2. **KeePass-Passwort** — Masterpasswort eingeben (Eingabe unsichtbar).
   Falls YubiKey konfiguriert: YubiKey beruehren.

Danach erscheint das Menue:

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

Fuer eine Komplett-Installation: `1` waehlen.

### Alternativ: Direkt-Modus (ohne Menue)

```bash
cd ~/code-fabrik/dist && ./install.sh install
```

### Alternativ: KeePass-Pfad als Umgebungsvariable

```bash
cd ~/code-fabrik/dist
KEEPASS_DB=~/seafile/ipe-security/Code-Fabrik-V1-0.kdbx ./install.sh
```

**Achtung**: Falls `KEEPASS_DB` oder `TARBALL` als Umgebungsvariable
aus einer frueheren Session gesetzt sind, werden die Defaults ueberschrieben.
Im Zweifel vorher pruefen:

```bash
echo "KEEPASS_DB=$KEEPASS_DB  TARBALL=$TARBALL"
```

Falls gesetzt: `unset KEEPASS_DB TARBALL` vor dem Start.

## Was passiert bei "install" (Option 1)

Die Komplett-Installation fuehrt drei Playbooks nacheinander aus:

### Phase A: PROD-Server (`install.yml`)

1. **Server provisionieren** — UpCloud API: neuen Server erstellen (`codefabrik-prod`)
2. **DNS erstellen** — Cloudflare API: DNS-Records fuer alle Subdomains
3. **Server konfigurieren** — Base-Packages, Caddy, Docker, Gateway
4. **Services installieren** — PostgreSQL, Forgejo, Act-Runner, OpenClaw, Poller
5. **Smoke-Test** — Funktionstest aller Services
6. **Infra pushen** — Ansible-Code ins Forgejo-Repo
7. **Writeback** — Runtime-Secrets (IPs, Passwoerter) zurueck in KeePass

### Phase B: Portal-Server (`install-portal.yml`)

1. **Portal-Server provisionieren** — UpCloud API: Server erstellen
2. **DNS erstellen** — Cloudflare: Portal-Subdomains
3. **Portal deployen** — Express.js App, Caddy, PostgreSQL, Dispatcher, Watchdog
4. **DB-Schema anlegen** — Portal-Datenbank initialisieren
5. **Validierung** — Portal-Smoke-Tests
6. **Writeback** — Portal-Secrets zurueck in KeePass

### Phase C: Produkt-Seed (`seed-products.yml`)

1. **Repos anlegen** — Git-Repos in Forgejo fuer jedes Produkt
2. **Quellcode pushen** — Produkt-Code aus `products/` nach Forgejo
3. **Writeback** — Aktualisierte Tokens zurueck in KeePass

## Technischer Ablauf (intern)

```
install.sh
  |
  +-- [1] Preflight      Prueft: keepassxc-cli, python3, docker, KeePass-DB, Tarball
  +-- [2] KeePass oeffnen  Passwort abfragen, XML-Export nach /dev/shm
  +-- [3] Secrets laden   Python parst XML → secrets.yml + SSH-Key + Runtime-Dateien
  +-- [4] Workspace       Tarball nach /dev/shm entpacken
  +-- [5] Docker-Image    Ansible-Container bauen (aus Dockerfile im Tarball)
  +-- [6] Ansible         docker run → Playbook ausfuehren mit secrets.yml
  +-- [7] Writeback       Runtime-Dateien (Base64) zurueck in KeePass
  +-- [8] Cleanup         /dev/shm schreddern (shred -u), bei Exit/Fehler/Ctrl+C
```

Alle Secrets leben ausschliesslich in `/dev/shm/` (RAM) und werden bei
Beendigung automatisch geschreddert. Nichts landet auf der Festplatte.

## Teardown

Alles abreissen (PROD + Portal):

```bash
cd ~/code-fabrik/dist && ./install.sh teardown
```

Oder interaktiv: Option `5` im Menue.

Reihenfolge: Portal zuerst, dann PROD.

**Hinweis**: Die Managed PostgreSQL (UpCloud) wird NICHT automatisch geloescht.

## Einzelaktionen

| Aktion | Befehl | Beschreibung |
|--------|--------|-------------|
| Portal-Update | `./install.sh upgrade-portal` | Portal aktualisieren, Server bleibt stehen |
| PROD-Status | `./install.sh fabrik` | Status der PROD-Infrastruktur abfragen |
| Nacht-Stopp | `./install.sh nacht-stopp` | Jobs-Verarbeitung stoppen |
| Lokaler Status | `./install.sh status` | Docker + geladene Secrets pruefen |

## Troubleshooting

### "Tarball nicht gefunden"

Installer wurde nicht aus dem `dist/`-Verzeichnis gestartet, oder
`TARBALL` ist als Umgebungsvariable gesetzt:

```bash
unset TARBALL
cd ~/code-fabrik/dist && ./install.sh
```

### "KeePass-Export fehlgeschlagen"

Falsches Masterpasswort oder YubiKey nicht beruehrt. Nochmal starten.

### "Docker laeuft nicht"

```bash
sudo systemctl start docker
```

### Passwoerter stimmen nach Reinstall nicht

Der Installer erzwingt Passwoerter idempotent:
- PostgreSQL: `ALTER USER ... PASSWORD` nach jedem Start
- Forgejo Admin: `change-password` nach jedem Start

Falls trotzdem Mismatch: Runtime-Eintraege in KeePass pruefen
(Gruppe `Runtime/`). Bei Erstinstallation muessen diese leer sein.

### Umgebungsvariablen aus vorheriger Session

```bash
unset KEEPASS_DB TARBALL
```
