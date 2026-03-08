# Externer Review-Prompt — Code-Fabrik Installation & Infrastruktur

**Erstellt:** 2026-03-07
**Version:** 0.8.0
**Zweck:** Unabhaengige Pruefung der Installations-Infrastruktur durch externen Reviewer

---

## Dein Auftrag

Du bist ein erfahrener DevOps/Infrastructure-Reviewer. Pruefe die folgende Installations-Infrastruktur eines Software-Projekts auf:

1. **Zuverlaessigkeit** — Kann die Installation unbemerkt fehlschlagen? Gibt es stille Fehler?
2. **Sicherheit** — Werden Secrets korrekt gehandhabt? Gibt es Credential-Leaks?
3. **Idempotenz** — Kann die Installation wiederholt ausgefuehrt werden ohne Seiteneffekte?
4. **Fehlerbehandlung** — Werden Fehler korrekt erkannt, gemeldet und behandelt?
5. **Abhaengigkeiten** — Sind alle Abhaengigkeiten explizit? Gibt es Race Conditions?
6. **Wartbarkeit** — Ist die Struktur verstaendlich, dokumentiert, erweiterbar?

Gib dein Review als priorisierte Liste (P0 = kritisch, P1 = wichtig, P2 = Verbesserung) zurueck. Fuer jedes Finding: Problem, Datei/Zeile, Impact, Fix-Vorschlag.

---

## Projekt-Kontext

**Code-Fabrik** ist eine Software-Manufaktur fuer fokussierte Desktop-Tools (Electron + Svelte 5 + SQLite). Die Infrastruktur besteht aus:

- **PROD-Server** (UpCloud VPS, DEV-1xCPU-2GB): Forgejo (Git), OpenClaw (KI-Agent), Gateway, Caddy, PostgreSQL
- **Portal-Server** (UpCloud VPS, DEV-1xCPU-1GB): Express.js API, Dispatcher, Watchdog, Caddy, PostgreSQL
- **Ansible** (26 Rollen, 11 Playbooks): Automatisierte Installation beider Server
- **install.sh**: Orchestriert KeePass → Secrets → Docker → Ansible → Writeback

**Architektur-Prinzipien:**
- Strict no-email, Headless/API-first
- License-Key-only (kein Kundenkonto)
- Forgejo self-hosted (kein GitHub fuer CI/CD)
- Cloudflare Origin CA fuer HTTPS (Full Strict)

---

## Installations-Flow

```
install.sh
├─ [1] Preflight: keepassxc-cli, docker, tarball pruefen
├─ [2] KeePass-Passwort abfragen (read -rs, kein Echo)
├─ [3] KeePass Export → XML → Python3 Parse → secrets.yml + SSH-Keys
│       Ziel: /dev/shm/codefabrik-secrets/ (RAM-Disk)
│       XML wird mit shred -u geloescht
├─ [4] Runtime-Writeback (falls Reinstall): KeePass → .env-Dateien
├─ [5] Optional: Nuke (alle codefabrik-* Server via UpCloud API loeschen)
├─ [6] Tarball entpacken + Docker-Image bauen (codefabrik-ansible:local)
├─ [7] Ansible im Docker ausfuehren (--network host)
│   ├─ install.yml (PROD, 5 Phasen)
│   ├─ install-portal.yml (Portal, 7 Phasen)
│   └─ seed-products.yml (Produkt-Repos)
├─ [8] Writeback: Runtime-Secrets → KeePass (Base64-enkodiert)
└─ [9] Cleanup-Trap: shred -u auf alle Secrets in /dev/shm/
```

### PROD-Installation (install.yml — 5 Phasen)

```
Phase 0 (Modus) — Pruefe ob Server existiert, ggf. DNS Cleanup
  └─ Phase 1 (Server) — UpCloud Server erstellen, SSH warten (5 Min Timeout)
       └─ Phase 1b (DNS) — Cloudflare A-Records erstellen + dig-Validierung
            └─ Phase 2 (Config) — Base-Packages, Docker, Caddy (Origin CA), Gateway
            │    post_tasks: docker compose up -d + 30s Pause
                 └─ Phase 3 (Services) — PostgreSQL, Forgejo, Runner, OpenClaw, Repos, Secrets, Poller
                      └─ Phase 4 (Nightstop) — systemd Timer (22:00 stop, 08:00 start)
                           └─ Phase 4b (Smoke) — 11 Tests (lokal + extern HTTPS) + Pipeline-Wait
                                └─ Phase 5 (Push-Infra) — Ansible-Code nach Forgejo pushen
```

### Portal-Installation (install-portal.yml — 7 Phasen)

```
Phase 0 (Check) — Portal-Server darf nicht existieren
  └─ Phase 1 (Server) — UpCloud Portal-Server erstellen
       └─ Phase 2 (DNS) — portal-codefabrik Record + dig-Validierung
            └─ Phase 3 (Setup) — Docker, UFW, Arbeitsverzeichnis
                 └─ Phase 3b (Secrets) — Passwoerter generieren (openssl rand)
                      └─ Phase 4 (Deploy) — Portal-App + Caddy + Origin CA + docker compose up
                           └─ Phase 5 (DB) — Schema + Migrationen (init.sql + migrate-v*.sql)
                                └─ Phase 6 (Watchdog) — systemd Timer (5 Min Interval)
                                     └─ Phase 7 (Validate) — 13 Smoke-Tests + externer HTTPS-Test
```

---

## Alle 23 Ansible-Rollen (Kurzreferenz)

### PROD-Rollen

| Rolle | Zweck | Input-Variablen | Output | Idempotent |
|-------|-------|-----------------|--------|------------|
| **base** | Ubuntu Setup (Docker, Node.js, UFW) | `docker_compose_dir` | Docker laeuft, `/opt/codefabrik/` | Ja |
| **server** | UpCloud Server erstellen | `vault_upcloud_api_token`, Plan, Zone | `.server-env` (UUID+IP), Inventory | Nein |
| **dns** | Cloudflare A-Records | `vault_cloudflare_api_token`, `dns_records`, `server_ip` | DNS aufloesbar | Ja |
| **caddy** | Reverse-Proxy + TLS | `vault_origin_ca_cert/key`, `forgejo_domain` | Caddyfile, Certs (0600) | Ja |
| **gateway** | Health/Ready/Metrics API (Port 3100) | `factory_version` | Gateway-Container | Ja |
| **postgres** | DB-Init (7 Tabellen, 1 Trigger) | `postgres_password` | Schema, runtime_control | Teil |
| **forgejo** | Admin + API Token | `forgejo_admin_password`, `factory_org` | `.tokens-env`, Admin-User, Org | Teil |
| **runner** | Forgejo Actions Runner | (implizit: Forgejo laeuft) | act-runner Service | Ja |
| **openclaw** | KI-Agent Container + SSH-Keys | `vault_ollama_*` | OpenClaw konfiguriert | Teil |
| **repos** | Process-Repo + Product-Repo + Deploy-Keys | `forgejo_api_token`, `forgejo_admin_password` | 2 Repos, Verzeichnis-Strukturen | Teil |
| **secrets** | Forgejo Actions Org-Secrets | `vault_anthropic_api_key`, Token | 4 Secrets in Forgejo | Ja |
| **poller** | 5-Phasen-Pipeline (30s Timer) | `forgejo_api_token` | openclaw-poller.sh, systemd Timer | Ja |
| **nightstop** | Nacht-Pause (22:00-08:00) | `nightstop_hour`, `nightstart_hour` | 2 Scripts, 2 systemd Timer | Ja |
| **smoke-test** | 11 Validierungstests | `forgejo_domain`, `cloudflare_zone` | Debug-Ausgabe | Nein |
| **push-infra** | Ansible-Code → Forgejo | `forgejo_admin_password`, Token | infra-local Repo | Nein |

### Portal-Rollen

| Rolle | Zweck | Input-Variablen | Output | Idempotent |
|-------|-------|-----------------|--------|------------|
| **portal-server** | UpCloud Portal-Server | wie server | `.portal-env` (UUID+IP) | Nein |
| **portal-dns** | Cloudflare portal-codefabrik Record | `portal_ip` | DNS aufloesbar | Ja |
| **portal-setup** | Docker, UFW, Verzeichnis | `portal_docker_compose_dir` | Docker laeuft, `/opt/portal/` | Ja |
| **portal-deploy** | Express.js + Caddy + Docker Compose | DB-Passwort, PROD-IP, Tokens | Portal laeuft auf 443 | Ja |
| **portal-db** | Schema + Migrationen | `portal_docker_compose_dir` | DB initialisiert | Teil |
| **portal-watchdog** | PROD-Status Monitor (5 Min) | (keine) | systemd Timer | Ja |
| **portal-validate** | 13 Smoke-Tests + HTTPS | `portal_domain` | `.portal-smoke-results.env` | Nein |
| **product-seed** | Produkt-Source → Forgejo + Releases | `seed_products`, Token | Repos + Releases | Teil |

---

## Kritische Code-Abschnitte (zum Review)

### 1. install.sh — Secrets-Extraktion (Python-Block)

```python
# Vereinfacht — extrahiert 11 Secrets aus KeePass XML
SECRET_MAP = {
    "upcloud-api-token": "vault_upcloud_api_token",
    "cloudflare-api-token": "vault_cloudflare_api_token",
    "anthropic-api-key": "vault_anthropic_api_key",
    "origin-ca-cert": "vault_origin_ca_cert",      # PEM, mehrzeilig
    "origin-ca-key": "vault_origin_ca_key",         # PEM, mehrzeilig
    # ... 6 weitere
}

# secrets.yml Generierung:
for var, val in secrets.items():
    if "\n" in val:
        # YAML Block Scalar fuer PEM-Certs
        f.write(f"{var}: |\n")
        for line in val.splitlines():
            f.write(f"  {line}\n")
    else:
        escaped = val.replace("\\", "\\\\").replace('"', '\\"')
        f.write(f'{var}: "{escaped}"\n')
```

**Bekanntes Problem:** Frueherer Bug schrieb PEM-Certs als Einzeiler (`\n` escaped statt Block Scalar). Caddy-Fehler: "failed to find any PEM data". Wurde gefixt.

### 2. DNS-Erstellung (roles/dns/tasks/main.yml)

```yaml
- name: "DNS Records erstellen"
  ansible.builtin.uri:
    url: "https://api.cloudflare.com/client/v4/zones/{{ cloudflare_zone_id }}/dns_records"
    method: POST
    headers:
      Authorization: "Bearer {{ vault_cloudflare_api_token }}"
    body_format: json
    body:
      type: A
      name: "{{ item.name }}"
      content: "{{ server_ip }}"
      ttl: 1
      proxied: "{{ item.proxied | default(true) }}"
    status_code: [200, 201]
  loop: "{{ dns_records }}"
  register: dns_results

- name: "DNS-Validierung"
  ansible.builtin.shell: |
    for i in $(seq 1 6); do
      RESULT=$(dig +short {{ item.name }}.{{ cloudflare_zone }} @1.1.1.1 2>/dev/null | head -1)
      if [ -n "$RESULT" ]; then
        echo "OK: {{ item.name }}.{{ cloudflare_zone }} -> $RESULT"
        exit 0
      fi
      sleep 5
    done
    echo "FAIL: {{ item.name }}.{{ cloudflare_zone }} nicht aufloesbar"
    exit 1
  delegate_to: localhost
  loop: "{{ dns_records }}"
```

**Frage an Reviewer:** Reicht `dig @1.1.1.1` als Validierung? Cloudflare-Proxy-Records loesen anders auf als erwartet (CNAME statt A-Record). Kann der Check bei `proxied: true` fehlschlagen?

### 3. Smoke-Test — Pipeline-Wait (roles/smoke-test/tasks/main.yml)

```yaml
- name: "Warte auf Poller-Verarbeitung von STORY-000099"
  ansible.builtin.shell: |
    for i in $(seq 1 60); do
      STATE=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c \
        "SELECT stage FROM poller_state WHERE object_id='STORY-000099'" 2>/dev/null | tr -d '[:space:]')
      if [ "$STATE" = "pr_created" ] || [ "$STATE" = "done" ]; then
        echo "SMOKE_SUCCESS: STORY-000099 reached stage $STATE"
        exit 0
      fi
      echo "Warte... stage=$STATE ($(($i * 10))s)"
      sleep 10
    done
    echo "SMOKE_TIMEOUT: STORY-000099 did not complete in 10 minutes"
    exit 1
  register: smoke_result
  changed_when: false
  failed_when: "'SMOKE_TIMEOUT' in smoke_result.stdout"
```

**Kontext:** STORY-000099 ist eine Test-Story die der Poller verarbeiten soll. Der Poller laeuft alle 30s, startet OpenClaw (Claude Code), das die Story implementiert, committed, Review durchlaeuft und PR erstellt. Wenn irgendein Schritt fehlschlaegt (Claude Timeout, Git-Fehler, Forgejo-API), bleibt die Story stecken.

### 4. UFW-Konfiguration (roles/portal-setup/tasks/main.yml)

```yaml
- name: "UFW konfigurieren"
  ansible.builtin.shell: |
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "y" | ufw enable
    touch /opt/.ufw-configured
  args:
    creates: /opt/.ufw-configured
```

**Bekanntes Problem:** Vorherige Version nutzte `creates: /etc/ufw/ufw.conf` — diese Datei existiert bei Ubuntu 24.04 bereits, daher wurden UFW-Regeln nie angewendet. Fix: Marker-Datei `/opt/.ufw-configured`.

**Frage an Reviewer:** Ist die Marker-Datei-Loesung robust genug? Was passiert wenn UFW-Regeln manuell geaendert werden? Sollte stattdessen `ansible.builtin.ufw` verwendet werden?

### 5. Forgejo Admin + Token (roles/forgejo/tasks/main.yml)

```yaml
- name: "Admin-Account erstellen"
  ansible.builtin.shell: |
    docker exec -u git factory-forgejo forgejo admin user create \
      --admin --username factory-admin \
      --password "{{ forgejo_admin_password }}" \
      --email admin@factory.local \
      --must-change-password=false 2>&1 || true
  no_log: true

- name: "Admin-Passwort erzwingen (idempotent bei Reinstall)"
  ansible.builtin.shell: |
    docker exec -u git factory-forgejo forgejo admin user change-password \
      --username factory-admin \
      --password "{{ forgejo_admin_password }}" \
      --must-change-password=false 2>&1
  no_log: true

- name: "API-Token generieren"
  ansible.builtin.shell: |
    curl -sf -X POST \
      -u "factory-admin:{{ forgejo_admin_password }}" \
      -H "Content-Type: application/json" \
      -d '{"name":"factory-automation","scopes":["all"]}' \
      "http://localhost:3000/api/v1/users/factory-admin/tokens" \
      | jq -r '.sha1'
  register: api_token_result
  retries: 5
  delay: 5
  until: api_token_result.stdout | length > 10
  no_log: true
```

**Frage an Reviewer:** `|| true` beim user create — damit wird sowohl "user exists" als auch echte Fehler verschluckt. Ist das akzeptabel?

### 6. Repos mit Passwort in Git-URL (roles/repos/tasks/main.yml)

```bash
git clone http://factory-admin:{{ forgejo_admin_password }}@localhost:3000/{{ factory_org }}/{{ process_repo }}.git
```

**Problem:** Passwort in Git-URL landet in:
- `.git/config` (im geklonten Repo)
- Shell-History (falls manuell)
- Ansible-Log (ohne `no_log: true`)

Fix: `no_log: true` wurde hinzugefuegt, aber `.git/config` im Temp-Verzeichnis ist nur durch `rm -rf $TMPDIR` geschuetzt.

### 7. Poller — Leader-Lock (openclaw-poller.sh.j2, vereinfacht)

```bash
acquire_lock() {
    local HOLDER_ID="poller-$$-$(hostname)"
    local NOW=$(date -u +"%Y-%m-%d %H:%M:%S")

    # Versuche Lock zu erwerben (nur wenn expired oder nicht vorhanden)
    RESULT=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "
        INSERT INTO leader_lock (lock_name, holder_id, expires_at)
        VALUES ('poller', '$HOLDER_ID', '$NOW'::timestamp + interval '5 minutes')
        ON CONFLICT (lock_name) DO UPDATE
        SET holder_id = '$HOLDER_ID', expires_at = '$NOW'::timestamp + interval '5 minutes'
        WHERE leader_lock.expires_at < '$NOW'::timestamp
        RETURNING holder_id" 2>/dev/null | tr -d '[:space:]')

    if [ "$RESULT" = "$HOLDER_ID" ]; then
        return 0  # Lock erworben
    fi
    return 1  # Anderer Holder aktiv
}
```

**Frage an Reviewer:** Ist das Lock-Pattern korrekt? Kann es zu einem Split-Brain kommen wenn zwei Poller gleichzeitig starten und beide `expires_at < NOW` sehen?

### 8. Docker-Compose (templates/docker-compose.yml.j2)

```yaml
version: "3.8"  # Docker warnt: wird ignoriert

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: forgejo
      POSTGRES_PASSWORD: {{ postgres_password }}
      POSTGRES_DB: forgejo
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "forgejo"]
      interval: 10s
      timeout: 5s
      retries: 5

  forgejo:
    image: {{ forgejo_image }}
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - FORGEJO__database__DB_TYPE=postgres
      - FORGEJO__database__HOST=postgres:5432
      - FORGEJO__database__NAME=forgejo
      - FORGEJO__database__USER=forgejo
      - FORGEJO__database__PASSWD={{ postgres_password }}
      - FORGEJO__security__SECRET_KEY={{ jwt_secret }}
      - FORGEJO__server__DOMAIN={{ forgejo_domain }}
      - FORGEJO__server__SSH_PORT=2222
      - FORGEJO__actions__ENABLED=true
    ports:
      - "3000:3000"
      - "2222:22"
    volumes:
      - forgejo_data:/data

  openclaw:
    build: ./docker/openclaw
    volumes:
      - openclaw_data:/root/.openclaw
      - /mnt/data/repos:/repos

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./certs:/etc/caddy/certs:ro
      - caddy_data:/data
      - caddy_config:/config

  gateway:
    build: ./gateway
    ports:
      - "3100:3100"
    environment:
      - POSTGRES_PASSWORD={{ postgres_password }}
      - FACTORY_VERSION={{ factory_version }}

networks:
  default:
    name: factory-net

volumes:
  postgres_data:
  forgejo_data:
  openclaw_data:
  caddy_data:
  caddy_config:
```

### 9. Portal Docker-Compose (templates/portal-docker-compose.yml.j2)

```yaml
version: "3.8"

services:
  portal-app:
    build: .
    ports:
      - "127.0.0.1:3200:3200"
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy

  portal-dispatcher:
    build: .
    command: node src/dispatcher.js
    env_file: .env
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: portal
      POSTGRES_PASSWORD: {{ portal_db_password }}
      POSTGRES_DB: portal
    volumes:
      - portal_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "portal"]

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./certs:/etc/caddy/certs:ro
      - caddy_data:/data
      - caddy_config:/config
```

### 10. Nightstop/Nightstart (vereinfacht)

```bash
# nightstop.sh — 22:00 UTC
# 1. Kill-Switch setzen
docker exec factory-postgres psql -U forgejo -d forgejo -c \
  "UPDATE runtime_control SET mode='MAINTENANCE', jobs_enabled=false WHERE env_name='prod'"

# 2. Auf laufenden Poller warten (max 5 Min)
for i in $(seq 1 30); do
  HOLDER=$(docker exec factory-postgres psql ... "SELECT holder_id FROM leader_lock WHERE lock_name='poller'")
  if [ -z "$HOLDER" ]; then break; fi
  sleep 10
done

# 3. Docker-Services stoppen (Postgres bleibt!)
docker compose stop forgejo openclaw caddy gateway
```

```bash
# nightstart.sh — 08:00 UTC
docker compose up -d
# Warte auf PostgreSQL + Forgejo
# Setze mode='LIVE', jobs_enabled=true
# Smoke: curl /ready
```

---

## Bekannte Probleme (bereits identifiziert, teilweise gefixt)

### Gefixt in dieser Session

| # | Problem | Fix |
|---|---------|-----|
| P0-1 | Kein externer HTTPS-Test | Externe `curl` Tests in smoke-test + portal-validate hinzugefuegt |
| P0-2 | DNS `ignore_errors: true` | Entfernt, `dig`-Validierung hinzugefuegt |
| P0-3 | Pipeline-Timeout = `exit 0` | Geaendert zu `exit 1` + `failed_when` |
| P0-4 | UFW `creates: /etc/ufw/ufw.conf` | Marker-Datei `/opt/.ufw-configured` |
| P1-5 | `no_log` fehlend | Hinzugefuegt bei repos, push-infra, product-seed |
| P2-11 | Nightstop-Timer nicht validiert | Smoke-Test prueft jetzt beide Timer |

### Noch offen

| # | Problem | Impact |
|---|---------|--------|
| P1-6 | ANTHROPIC_API_KEY + FORGEJO_API_TOKEN im Klartext in Scripts/Units | Secrets auf Disk lesbar |
| P1-7 | Geleakter Token im Install-Log | Token muss rotiert werden |
| P2-10 | 30s Pause statt Health-Check nach `docker compose up` | Race Condition bei langsamem Postgres-Start |
| P2-12 | `UPDATE WHERE id=1` ohne Row-Count-Pruefung | Stille Fehler bei fehlender Row |
| P2-14 | `.portal-env` mit 0644 statt 0600 | Credentials world-readable |
| P2-16 | `version: "3.8"` in docker-compose | Docker-Warning (harmlos) |
| P2-18 | Smoke-Test-Daten in Prod-DB | Testdaten verschmutzen Produktion |

---

## Spezifische Review-Fragen

1. **Secrets-Lifecycle:** Ist der Weg KeePass → `/dev/shm` → Docker → Ansible → Writeback sicher? Wo koennten Secrets persistieren?

2. **DNS-Validierung:** `dig @1.1.1.1` fuer proxied Cloudflare-Records — funktioniert das zuverlaessig? Proxied Records geben Cloudflare-IPs zurueck, nicht die Origin-IP.

3. **Leader-Lock PostgreSQL:** Ist das INSERT ... ON CONFLICT ... WHERE expires_at < NOW() Pattern race-condition-frei? Kann ein zweiter Poller den Lock uebernehmen waehrend der erste noch laeuft?

4. **Docker-Compose Restart-Policy:** `unless-stopped` — ist das korrekt fuer einen Server der naechtlich gestoppt wird? Werden Container nach `docker compose stop` beim naechsten `up -d` korrekt gestartet?

5. **Idempotenz bei Reinstall:** Wenn install.yml ein zweites Mal laeuft (Update-Modus), welche Rollen brechen? Forgejo-Token wird neu generiert — werden alle Abhaengigkeiten (Poller, Secrets, Portal) korrekt aktualisiert?

6. **Portal ↔ PROD Kopplung:** Portal braucht PROD Gateway `/ready`. Wenn PROD down ist (Nightstop), schlaegt der Watchdog fehl. Ist das korrekt modelliert?

7. **Poller STORY-000099 als Gate:** Die gesamte Installation wartet 10 Minuten auf eine KI-generierte Implementierung. Ist das ein sinnvolles Gate oder ein Flaschenhals?

8. **Git-URLs mit Credentials:** Repos werden mit `http://user:password@host` geklont. Selbst mit `no_log: true` und `rm -rf $TMPDIR` — gibt es weitere Stellen wo das Passwort persistiert?

9. **Cleanup bei Fehler:** Wenn install.yml in Phase 3 fehlschlaegt, bleibt ein halb-konfigurierter Server in UpCloud. Gibt es einen automatischen Rollback?

10. **Portal-App Binding:** `127.0.0.1:3200` — damit ist die Portal-App nur ueber Caddy (443) erreichbar. Ist das Absicht? Was passiert wenn Caddy ausfaellt?

---

## Dateistruktur (zum Nachschlagen)

```
code-fabrik/
├── ansible/
│   ├── playbooks/
│   │   ├── install.yml              # PROD 5-Phasen
│   │   ├── install-portal.yml       # Portal 7-Phasen
│   │   ├── install-phase3.yml       # Nur Services (Update)
│   │   ├── install-repos-poller.yml # Nur Repos+Poller
│   │   ├── seed-products.yml        # Produkt-Seeds
│   │   ├── teardown.yml             # PROD abreissen
│   │   ├── teardown-portal.yml      # Portal abreissen
│   │   ├── fabrik.yml               # Status-Abfrage
│   │   ├── nacht-stopp.yml          # Kill-Switch
│   │   ├── upgrade-portal.yml       # Portal-Code-Update
│   │   └── push-infra.yml           # Infra nach Forgejo
│   ├── roles/
│   │   ├── base/                    # Ubuntu + Docker + UFW
│   │   ├── server/                  # UpCloud Server erstellen
│   │   ├── dns/                     # Cloudflare DNS Records
│   │   ├── caddy/                   # Reverse-Proxy + TLS
│   │   ├── gateway/                 # Health/Ready/Metrics API
│   │   ├── postgres/                # DB Schema + Trigger
│   │   ├── forgejo/                 # Admin + API Token
│   │   ├── runner/                  # Forgejo Actions Runner
│   │   ├── openclaw/                # KI-Agent Container
│   │   ├── repos/                   # Process + Product Repos
│   │   ├── secrets/                 # Forgejo Actions Secrets
│   │   ├── poller/                  # 5-Phasen Pipeline (30s)
│   │   ├── nightstop/              # Nacht-Pause Timer
│   │   ├── smoke-test/             # Validierungstests
│   │   ├── push-infra/             # Infra → Forgejo
│   │   ├── portal-server/          # Portal UpCloud Server
│   │   ├── portal-dns/             # Portal DNS Record
│   │   ├── portal-setup/           # Portal Docker + UFW
│   │   ├── portal-deploy/          # Portal App + Caddy
│   │   ├── portal-db/              # Portal Schema + Migration
│   │   ├── portal-watchdog/        # PROD Monitor
│   │   ├── portal-validate/        # Portal Smoke-Tests
│   │   └── product-seed/           # Produkt-Source → Forgejo
│   ├── templates/
│   │   ├── docker-compose.yml.j2   # PROD Stack
│   │   ├── portal-docker-compose.yml.j2  # Portal Stack
│   │   ├── openclaw-poller.sh.j2   # Poller Script (730 Zeilen)
│   │   ├── nightstop.sh.j2         # Nacht-Pause
│   │   ├── nightstart.sh.j2        # Morgen-Start
│   │   └── portal-caddyfile.j2     # Portal Caddy Config
│   └── inventory/
│       └── group_vars/all/vars.yml # Globale Variablen
├── portal/
│   ├── src/
│   │   ├── server.js               # Express.js (Port 3200)
│   │   ├── dispatcher.js           # Order-Queue Worker
│   │   ├── watchdog.js             # Health-Monitor
│   │   ├── routes/                 # 8 API-Router
│   │   ├── services/               # License, Forgejo, UpCloud
│   │   └── db/                     # Pool, init.sql, Migrationen
│   └── Dockerfile
├── scripts/
│   ├── install.sh                  # Haupt-Installer
│   └── build-installer.sh          # Tarball bauen
├── docs/
│   ├── analyse/
│   │   └── install-review-2026-03-07.md  # 18 bekannte Probleme
│   ├── runbooks/
│   ├── konzept/
│   └── governance/
└── VERSION                         # 0.8.0
```

---

## Erwartetes Review-Format

```markdown
## P0 — Kritisch (Installation kann unbemerkt fehlschlagen)

### [R-001] Titel
**Datei:** `pfad/datei.yml:zeile`
**Problem:** Beschreibung
**Impact:** Was passiert wenn das eintritt
**Fix:** Konkreter Vorschlag

## P1 — Wichtig (Sicherheit, Datenintegritaet)

### [R-002] ...

## P2 — Verbesserung (Robustheit, Wartbarkeit)

### [R-003] ...

## Architektur-Feedback

Uebergreifende Beobachtungen zur Gesamtarchitektur.
```
