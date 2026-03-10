# Review-Prompt: Install/Deploy-Infrastruktur — Stabilitaetsanalyse

## Kontext

Die Code-Fabrik ist eine Software-Manufaktur mit einer selbst-gehosteten CI/CD-Pipeline. Die gesamte Infrastruktur (PROD-Server + Portal-Server) wird ueber ein Ansible-basiertes Installer-System aufgebaut, das in einem Docker-Container laeuft und Secrets aus einer KeePass-Datenbank laedt.

Bei einem Neuaufbau (Bootstrap) am 2026-03-09/10 traten mehrere Probleme auf, die auf strukturelle Schwaechen im Install/Deploy-System hinweisen. Dieser Review soll die Ursachen analysieren und Verbesserungen vorschlagen.

## Architektur-Uebersicht

```
KeePass-DB (lokal)
    |
    v
install.sh (Einstiegspunkt, interaktiv)
    ├── lib/common.sh    (Config, Logging, Cleanup)
    ├── lib/secrets.sh   (KeePass → /dev/shm, Writeback)
    ├── lib/docker.sh    (Workspace, Docker-Image, run_ansible)
    ├── lib/upcloud.sh   (Nuke, Server-Suche)
    └── lib/release.sh   (Tarball bauen, Sichern)
    |
    v
codefabrik.tar.gz (Tarball, entpackt nach /dev/shm)
    |
    v
Docker-Container (codefabrik-ansible:local)
    ├── Ansible Playbooks (install.yml, reconcile.yml, ...)
    ├── 26 Rollen (base, caddy, dns, forgejo, poller, ...)
    └── Secrets (secrets.yml, SSH-Keys, Runtime-Dateien)
    |
    v
UpCloud API → PROD-Server (VPS) + Portal-Server (VPS)
Cloudflare API → DNS-Records
```

### Betriebsmodi

| Modus | Beschreibung |
|-------|-------------|
| **bootstrap** | Nuke → PROD → Portal → Seed (kompletter Neuaufbau) |
| **upgrade** | PROD + Portal aktualisieren (Server bleibt) |
| **reconcile** | Drift-Korrektur (idempotent, kein Neustart) |
| **teardown** | Alles abreissen |

### Tarball-Flow

```
scripts/build-installer.sh
    → Lint-Checks (Migrationen, Ansible-Rollen, Shellcheck)
    → tar czf dist/codefabrik-v0.8.0.tar.gz (gesamtes Repo, ohne .git/secrets)
    → dist/codefabrik.tar.gz (Symlink)
    → dist/install.sh + dist/control.sh (Kopien)
    → dist/CHECKSUM (SHA256 + Timestamp)

install.sh
    → TARBALL="${TARBALL:-$SCRIPT_DIR/codefabrik.tar.gz}"
    → tar xzf $TARBALL -C /dev/shm/codefabrik-secrets/workspace
    → docker build (Ansible-Image aus Workspace)
    → docker run (Playbooks aus Workspace)
```

## Aufgetretene Probleme (Bootstrap 2026-03-09/10)

### Problem 1: DNS-Domainnamen falsch konfiguriert

**Symptom:** DNS-Records wurden als `git-codefabrik.detmers-publish.de`, `gateway-codefabrik.detmers-publish.de` und `ops-codefabrik.detmers-publish.de` angelegt. Korrekt waere: `git.detmers-publish.de` und `gateway.detmers-publish.de` (ohne `ops`).

**Root Cause:** Falsche Werte in `ansible/inventory/group_vars/all/vars.yml`:
```yaml
# FALSCH (alt)
dns_records:
  - { name: "git-codefabrik", target: "{{ server_ip }}" }
  - { name: "gateway-codefabrik", target: "{{ server_ip }}" }
  - { name: "ops-codefabrik", target: "{{ server_ip }}", proxied: false }

# RICHTIG (korrigiert)
dns_records:
  - { name: "git", target: "{{ server_ip }}", proxied: true }
  - { name: "gateway", target: "{{ server_ip }}", proxied: true }
```

**Erschwerend:** Die Korrektur wurde im Git-Repo committed, aber der Installer benutzt den **Tarball**, nicht das Git-Repo. Der Tarball wurde nicht neu gebaut, daher liefen alle nachfolgenden Bootstrap/Reconcile-Versuche mit den alten Werten.

**Zweiter Fehler:** Caddyfile hatte ebenfalls einen falschen Domain-Namen:
```
# FALSCH
gateway.codefabrik.detmers-publish.de { ... }

# RICHTIG
gateway.detmers-publish.de { ... }
```

Und `forgejo_domain` war ebenfalls falsch:
```yaml
# FALSCH
forgejo_domain: "git-codefabrik.detmers-publish.de"
# RICHTIG
forgejo_domain: "git.detmers-publish.de"
```

### Problem 2: Tarball-Disconnect — Aenderungen im Git wirken nicht

**Symptom:** Nach Git-Commits mit Korrekturen liefen Bootstrap und Reconcile weiterhin mit den alten Werten.

**Root Cause:** `install.sh` liegt in `scripts/` und sucht den Tarball als `$SCRIPT_DIR/codefabrik.tar.gz`, also `scripts/codefabrik.tar.gz`. `build-installer.sh` legt den neuen Tarball aber in `dist/codefabrik-v0.8.0.tar.gz` ab. In `scripts/` lag noch ein alter Tarball (230 MB vom 8. Maerz) waehrend der neue (582 MB) in `dist/` lag.

**Kein Feedback:** Der Installer hat eine Alter-Warnung (>1 Stunde), die aber den alten Tarball nicht blockiert. Es gibt keine Checksummen-Validierung ob der Tarball zu den Git-Commits passt.

### Problem 3: DNS-Rolle nicht idempotent

**Symptom:** Beim Reconcile schlug die DNS-Rolle fehl mit `81058: An identical record already exists.`

**Root Cause:** Die DNS-Rolle (`dns/tasks/main.yml`) benutzt `POST` zum Erstellen von Records. Wenn der Record schon existiert, gibt Cloudflare 400 zurueck. Die Rolle akzeptiert nur `[200, 201]`.

```yaml
# Aktuell: Nur POST, schlaegt bei existierenden Records fehl
- name: "DNS Records erstellen"
  ansible.builtin.uri:
    url: ".../dns_records"
    method: POST
    status_code: [200, 201]  # 400 = "already exists" → FAIL
```

### Problem 4: DNS-Cleanup loescht nur "codefabrik"-Records

**Root Cause:** `cleanup.yml` filtert mit `selectattr('name', 'search', 'codefabrik')`. Nach der Korrektur zu `git.detmers-publish.de` werden die neuen Records beim Cleanup nicht mehr gefunden (weil sie kein "codefabrik" im Namen haben). Alte falsche Records (`git-codefabrik`) werden korrekt geloescht, aber die neuen (`git`) koennten bei einem erneuten Bootstrap stehen bleiben.

```yaml
# cleanup.yml - loescht nur Records mit "codefabrik" im Namen
loop: "{{ dns_records_result.json.result | selectattr('name', 'search', 'codefabrik') | list }}"
```

### Problem 5: UpCloud API Timeout bei Portal-Storage

**Symptom:** `Downloads-Storage erstellen (erstmalig)` scheiterte mit `The read operation timed out` nach 30 Sekunden.

**Root Cause:** UpCloud API hat 30s Default-Timeout in der `uri`-Aufgabe. Fuer Storage-Erstellung (die bei UpCloud laenger dauern kann) gibt es keinen erhoehten Timeout und keinen Retry.

```yaml
# Kein timeout, kein retry
- name: "Downloads-Storage erstellen (erstmalig)"
  ansible.builtin.uri:
    url: "https://api.upcloud.com/1.3/storage"
    # timeout: fehlt → Default 30s
    # retries: fehlt → kein Retry
```

### Problem 6: HTTP 526 — SSL-Zertifikat passt nicht zur Domain

**Symptom:** Externer HTTPS-Zugriff auf Forgejo schlug fehl mit HTTP 526 (Invalid SSL Certificate).

**Root Cause:** Cloudflare-Proxy war aktiv (proxied: true), aber das Caddyfile hatte die falsche Domain (`git-codefabrik.detmers-publish.de` statt `git.detmers-publish.de`). Caddy konnte das Origin CA Zertifikat (Wildcard `*.detmers-publish.de`) nicht fuer die falsche Domain zuordnen.

### Problem 7: Smoke-Test Variable `server_ip` nicht verfuegbar

**Symptom:** DNS-Smoke-Test schlug fehl mit `'server_ip' is undefined`.

**Root Cause:** `server_ip` wird in Phase 0 (auf `localhost`) gesetzt, aber der Smoke-Test laeuft in Phase 3 (auf `factory-prod`). Ansible-Variablen sind nicht automatisch zwischen Plays mit verschiedenen Hosts geteilt.

### Problem 8: Deep-Smoke Pipeline-Timeout

**Symptom:** `STORY-000099 did not complete in 200 seconds (stage=)` — die Poller-Pipeline verarbeitet die Smoke-Story nicht.

**Unklar:** Mehrere moegliche Ursachen:
- Poller-Script hat Fehler (obwohl gehaertete Version deployt wurde)
- OpenClaw-Container hat kein `claude` CLI installiert (npm install beim ersten Lauf)
- Anthropic API Key nicht korrekt konfiguriert
- Process-Repo hat keine Smoke-Story in der Inbox

## Zu analysierende Dateien

### 1. Installer-Einstiegspunkt

```bash
# scripts/install.sh (Auszug)
TARBALL="${TARBALL:-$SCRIPT_DIR/codefabrik.tar.gz}"  # SCRIPT_DIR = scripts/

run_bootstrap() {
    nuke_all_servers
    run_ansible "playbooks/install.yml" -e ops_mode=bootstrap
    writeback_runtime
    run_ansible "playbooks/install-portal.yml" -e ops_mode=bootstrap
    writeback_runtime
    run_ansible "playbooks/seed-products.yml"
    writeback_runtime
    rebuild_tarball
}
```

### 2. DNS-Rolle

```yaml
# ansible/roles/dns/tasks/main.yml
- name: "DNS Records erstellen"
  ansible.builtin.uri:
    url: "https://api.cloudflare.com/client/v4/zones/{{ cloudflare_zone_id }}/dns_records"
    method: POST
    body:
      type: A
      name: "{{ item.name }}"
      content: "{{ server_ip }}"
      proxied: "{{ item.proxied | default(true) }}"
    status_code: [200, 201]
  loop: "{{ dns_records }}"

# ansible/roles/dns/tasks/cleanup.yml
- name: "Codefabrik DNS Records loeschen"
  ansible.builtin.uri:
    url: ".../dns_records/{{ item.id }}"
    method: DELETE
  loop: "{{ dns_records_result.json.result | selectattr('name', 'search', 'codefabrik') | list }}"
```

### 3. Variablen-Konfiguration

```yaml
# ansible/inventory/group_vars/all/vars.yml
cloudflare_zone: detmers-publish.de
cloudflare_zone_id: b9525ee2fa8f0e14ce58b1f1b184c597
dns_records:
  - { name: "git", target: "{{ server_ip }}", proxied: true }
  - { name: "gateway", target: "{{ server_ip }}", proxied: true }

forgejo_domain: "git.detmers-publish.de"
factory_version: "0.6.3"
```

### 4. Caddy-Rolle

```yaml
# ansible/roles/caddy/tasks/main.yml
- name: "Caddyfile erstellen"
  ansible.builtin.copy:
    content: |
      {{ forgejo_domain }} {
          tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin-key.pem
          reverse_proxy forgejo:3000
      }
      gateway.{{ cloudflare_zone }} {
          tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin-key.pem
          reverse_proxy gateway:3100
      }
    dest: "{{ docker_compose_dir }}/Caddyfile"
```

### 5. Portal-Server-Rolle (UpCloud API Timeout)

```yaml
# ansible/roles/portal-server/tasks/main.yml (Auszug)
- name: "Downloads-Storage erstellen (erstmalig)"
  ansible.builtin.uri:
    url: "https://api.upcloud.com/1.3/storage"
    method: POST
    body: { storage: { zone, title, size, tier } }
    status_code: [200, 201]
    # FEHLT: timeout, retries
```

### 6. Smoke-Test-Rolle

```yaml
# ansible/roles/smoke-test/tasks/main.yml (DNS-Test)
- name: "Smoke-Test: DNS Records korrekt (IP + Proxied)"
  delegate_to: localhost
  ansible.builtin.uri:
    url: ".../dns_records?name={{ item.name }}.{{ cloudflare_zone }}&type=A"
  loop: "{{ dns_records }}"
  failed_when: >
    dns_smoke.json.result | length == 0 or
    dns_smoke.json.result[0].content != ansible_host or
    dns_smoke.json.result[0].proxied != (item.proxied | default(true))
```

### 7. Reconcile-Playbook

```yaml
# ansible/playbooks/reconcile.yml
# Phase 0: localhost — setzt server_ip
# Phase 1: factory-prod — base, caddy, gateway + docker compose
# Phase 2: factory-prod — postgres, forgejo, secrets, poller, nightstop
# Phase 3: factory-prod — smoke-test (server_ip nicht mehr verfuegbar!)
```

## Aufgaben fuer den Reviewer

### A. Tarball-Disconnect: Git-Repo vs. Installer

1. Wie kann verhindert werden, dass der Installer mit einem veralteten Tarball laeuft?
2. Sollte der Installer den Tarball automatisch neu bauen wenn aelter als X Minuten?
3. Gibt es eine bessere Architektur als "Tarball in scripts/ und dist/"?
4. Sollte eine Git-Commit-ID im Tarball gespeichert werden fuer Traceability?

### B. DNS-Rolle: Idempotenz

1. Wie macht man die DNS-Rolle idempotent (PUT statt POST? Erst GET dann entscheiden?)
2. Cloudflare hat eine "PUT DNS Record"-API — sollte die Rolle darauf umsteigen?
3. Wie sollte `cleanup.yml` funktionieren wenn die DNS-Namen sich aendern?
4. Sollte Cleanup alle DNS-Records mit der aktuellen Server-IP loeschen statt nach Name zu filtern?

### C. UpCloud API Resilienz

1. Welche UpCloud-API-Aufrufe brauchen erhoehte Timeouts?
2. Wo fehlen Retries (Storage-Erstellung, Server-Erstellung)?
3. Wie geht man mit teilweise erstellten Ressourcen um (Storage erstellt, aber Server-Erstellung scheitert)?
4. Sollte es einen "Resume"-Modus geben der nach einem Fehler weitermacht?

### D. Variable-Scoping zwischen Ansible-Plays

1. Wie kann `server_ip` zwischen Plays geteilt werden (fact-caching, include_vars, set_fact in group)?
2. Ist `ansible_host` ein zuverlaessiger Ersatz fuer `server_ip`?
3. Welche anderen Variablen koennten zwischen Plays verloren gehen?

### E. Konsistenz zwischen Konfigurationsstellen

1. DNS-Namen, Caddy-Domains und `forgejo_domain` muessen konsistent sein. Wie erzwingt man das?
2. Sollte es eine einzige Quelle geben (z.B. `services` dict) aus der alle Domains abgeleitet werden?
3. Wie kann ein Smoke-Test pruefen ob Caddy die richtigen Domains bedient?

### F. Deep-Smoke Pipeline

1. Was sind moegliche Ursachen wenn STORY-000099 nicht verarbeitet wird?
2. Sollte der Deep-Smoke diagnostische Infos sammeln bei Timeout (Poller-Log, Container-Status)?
3. Ist 200 Sekunden realistisch fuer einen vollen Pipeline-Durchlauf (Dispatch → OpenClaw → Review → PR)?

### G. Gesamtarchitektur

1. Ist die Trennung "Tarball + Docker + Ansible" die richtige Wahl?
2. Welche Teile koennten vereinfacht werden?
3. Gibt es eine bessere Strategie als "Bootstrap = Nuke + Neuaufbau"?
4. Wie kann die Feedback-Schleife verkuerzt werden (aktuell: Fix → Commit → Tarball → Deploy → Test)?

## Erwartetes Ergebnis

1. **Fix-Liste**: Priorisiert nach Schweregrad und Aufwand
2. **DNS-Idempotenz**: Konkreter Vorschlag fuer PUT-basierte DNS-Rolle
3. **Tarball-Strategie**: Empfehlung fuer sicheren Umgang mit Tarball-Versionen
4. **Variable-Scoping**: Loesung fuer Play-uebergreifende Variablen
5. **Resilienz**: Timeout/Retry-Empfehlungen fuer UpCloud-API-Aufrufe
6. **Konsistenz-Checks**: Vorschlag fuer automatische Validierung der Domain-Konfiguration
