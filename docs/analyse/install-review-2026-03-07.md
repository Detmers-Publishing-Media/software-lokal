# Install-Review — 2026-03-07

## Anlass

Installation laeuft "ohne Fehler" durch, aber Services sind von aussen nicht
erreichbar. Forgejo HTTPS (Origin-CA-Bug), Portal DNS (falscher Name),
Nightstop-Timer (nicht deployt) — alles unentdeckt.

---

## P0 — Installation kann unbemerkt fehlschlagen

| # | Problem | Datei | Beschreibung |
|---|---------|-------|-------------|
| 1 | **Kein externer HTTPS-Test** | `roles/smoke-test/tasks/main.yml`, `roles/portal-validate/tasks/main.yml` | Smoke-Tests pruefen nur `http://localhost:PORT`. Caddy/TLS/DNS-Fehler bleiben unsichtbar. |
| 2 | **DNS-Fehler verschluckt** | `roles/dns/tasks/main.yml:19`, `roles/portal-dns/tasks/main.yml:18` | `ignore_errors: true` — alle DNS-Records koennen fehlschlagen, Installation geht weiter. |
| 3 | **Smoke-Test Pipeline-Timeout kein Fehler** | `roles/smoke-test/tasks/main.yml:62` | STORY-000099 Timeout gibt `exit 0` — nachfolgende Phasen laufen, obwohl Pipeline kaputt. |
| 4 | **UFW-Regeln werden nie angewendet** | `roles/portal-setup/tasks/main.yml:53` | `creates: /etc/ufw/ufw.conf` — Datei existiert bei Ubuntu 24.04 bereits. Firewall ist offen. |

## P1 — Sicherheit

| # | Problem | Datei | Beschreibung |
|---|---------|-------|-------------|
| 5 | **Credentials im Log** | `roles/forgejo/tasks/main.yml`, `roles/repos/tasks/main.yml`, `roles/push-infra/tasks/main.yml`, `roles/product-seed/tasks/main.yml` | Passwoerter, API-Tokens in Ansible-Ausgabe bei `-vv`. `no_log: true` fehlt. |
| 6 | **Forgejo-API-Token im Logfile** | `roles/product-seed/tasks/main.yml` (Tarball-Upload) | Token `b078...7898` steht im Klartext in `install-20260307-2244.log`. Token rotieren! |
| 7 | **ANTHROPIC_API_KEY auf Disk** | `roles/poller/templates/openclaw-poller.sh.j2:416,566` | API-Key permanent im Klartext in `/opt/codefabrik/openclaw-poller.sh`. Besser: EnvironmentFile. |
| 8 | **FORGEJO_API_TOKEN in systemd Unit** | `roles/poller/tasks/main.yml:38` | Token im Klartext in systemd Unit. Besser: EnvironmentFile mit mode 0600. |
| 9 | **Git-Clone-URLs mit Passwort** | `roles/repos/tasks/main.yml:53,117`, `roles/push-infra/tasks/main.yml:36` | `forgejo_admin_password` in URL, sichtbar in Log + Shell-History + `.git/config`. |

## P2 — Robustheit

| # | Problem | Datei | Beschreibung |
|---|---------|-------|-------------|
| 10 | **30s Pause statt Health-Check** | `install.yml` (Phase 2 post_tasks), `install-portal.yml` (Phase 4) | Blinde Pause nach `docker compose up`. Wenn Postgres langsamer startet, schlagen Folge-Tasks fehl. |
| 11 | **Nightstop-Timer nicht validiert** | `roles/smoke-test/tasks/main.yml` | Smoke-Test prueft `openclaw-poller.timer`, aber NICHT `codefabrik-nightstop.timer` / `nightstart.timer`. |
| 12 | **prod_status UPDATE ohne Pruefung** | `roles/portal-db/tasks/main.yml:56-63` | `UPDATE WHERE id=1` kann 0 Rows treffen ohne Fehler. Kein `failed_when`. |
| 13 | **Legacy-DNS-Records** | `roles/dns/tasks/cleanup.yml` | Nur `*-codefabrik.*` Records werden geloescht. `git.`, `gateway.`, `test-git.`, `test-ops.` auf alten IPs bleiben. |
| 14 | **Portal-Env Permissions** | `roles/portal-server/tasks/main.yml` | `.portal-env` mit Default `0644` statt `0600`. |
| 15 | **Heredoc-Spaces in Secrets** | `install-portal.yml:76-79` | Fuehrende Spaces im Heredoc. Funktioniert zufaellig, aber fragil. |
| 16 | **docker-compose version obsolet** | `templates/docker-compose.yml.j2:1` | Docker warnt: `version` wird ignoriert. |
| 17 | **Schema-Validierung unvollstaendig** | `roles/portal-db/tasks/main.yml`, `roles/portal-validate/tasks/main.yml` | Nur 4 Spalten in `licenses` geprueft. Andere Tabellen nicht validiert. |
| 18 | **Smoke-Test-Daten nicht bereinigt** | `roles/portal-validate/tasks/main.yml` | Kauf-Flow erzeugt echte Daten in Prod-DB. Kein Cleanup. |

---

## Abhaengigkeitskette PROD

```
Phase 0 (Modus) — UpCloud + DNS Cleanup
  └─ Phase 1 (Server) — UpCloud Server erstellen, SSH warten
       └─ Phase 1b (DNS) — Cloudflare Records [ignore_errors!]
            └─ Phase 2 (Config) — Docker, Caddy, Gateway, Origin-CA
                 └─ Phase 3 (Services) — Postgres, Forgejo, Runner, OpenClaw, Repos, Secrets, Poller
                      └─ Phase 4 (Nightstop) — systemd Timer
                           └─ Phase 4b (Smoke) — localhost-Tests + Pipeline-Wait [exit 0 bei Timeout!]
                                └─ Phase 5 (Push-Infra) — Code nach Forgejo pushen
```

### Implizite, ungepruefte Abhaengigkeiten

- **DNS → Caddy**: Wenn DNS fehlschlaegt (ignore_errors), konfiguriert Caddy Domains die nicht aufloesen. Stille Fehlerkette.
- **repos → openclaw**: `deploy_key_pub` wird in openclaw-Rolle gesetzt, repos-Rolle braucht sie. Reihenfolge in roles-Liste ist implizit.
- **Phase 2 → Phase 3**: 30s Pause statt Health-Gate zwischen docker-compose-up und Postgres-Zugriff.

## Abhaengigkeitskette Portal

```
Phase 0 (Check) — Portal-Server darf nicht existieren
  └─ Phase 1 (Server) — UpCloud Portal-Server erstellen
       └─ Phase 2 (DNS) — portal-codefabrik Record [ignore_errors!]
            └─ Phase 3 (Setup) — Docker, UFW [BROKEN!]
                 └─ Phase 3b (Secrets) — Passwoerter generieren
                      └─ Phase 4 (Deploy) — Portal-App, Caddy, Origin-CA
                           └─ Phase 5 (DB) — Schema + Migrationen
                                └─ Phase 6 (Watchdog) — systemd Timer [|| true!]
                                     └─ Phase 7 (Validate) — Smoke-Tests [nur localhost!]
```

### Portal → PROD Abhaengigkeiten

| Portal braucht | Quelle | Bei Fehlen |
|---------------|--------|-----------|
| `SERVER_UUID`, `SERVER_IP` | `/output/.server-env` | Ansible bricht ab |
| `FORGEJO_API_TOKEN` | `/output/.tokens-env` | Ansible bricht ab |
| PROD Gateway erreichbar | `http://<PROD_IP>:3100/ready` | Watchdog meldet "down", Installation laeuft weiter |

---

## Fix-Plan (priorisiert)

### Sofort (P0)

1. **Externen HTTPS-Smoke-Test hinzufuegen**
   - `curl -sf https://git-codefabrik.detmers-publish.de/api/v1/version` nach Smoke-Test
   - `curl -sf https://portal-codefabrik.detmers-publish.de/api/status` nach Portal-Validate
   - Mit `retries: 6, delay: 10` fuer DNS-Propagation

2. **DNS ignore_errors entfernen**
   - `status_code: [200, 201]` statt `ignore_errors: true`
   - Validierungs-Task danach: `dig +short <domain> @1.1.1.1`

3. **Smoke-Test Pipeline-Timeout als Fehler**
   - `exit 0` → `exit 1` bei STORY-000099 Timeout
   - Oder `failed_when: "'SMOKE_TIMEOUT' in smoke_result.stdout"`

4. **UFW-Regeln fixen**
   - `creates: /etc/ufw/ufw.conf` entfernen
   - Idempotente UFW-Konfiguration (Marker-Datei oder ansible.builtin.ufw Modul)

### Zeitnah (P1)

5. **no_log: true an allen Secrets-Tasks**
   - forgejo (teilweise done), repos, push-infra, product-seed, openclaw
   - Bestehenden Token aus Log `install-20260307-2244.log` rotieren

6. **Secrets aus Scripts/Units in EnvironmentFile**
   - Poller: ANTHROPIC_API_KEY + FORGEJO_API_TOKEN → `/opt/codefabrik/.poller-secrets.env` (mode 0600)
   - systemd Unit: `EnvironmentFile=` statt `Environment=`

7. **Git-URLs ohne Passwort**
   - Token-basierte Auth statt Basic-Auth in URLs
   - `no_log: true` auf alle Shell-Tasks mit Git-URLs

### Naechste Iteration (P2)

8. **Health-Check statt 30s Pause** nach docker-compose-up
9. **Nightstop-Timer im Smoke-Test validieren**
10. **prod_status UPSERT statt UPDATE**
11. **Portal-Env Permissions 0600**
12. **docker-compose version entfernen**
13. **Smoke-Test-Daten bereinigen** nach Validierung
14. **Legacy-DNS-Records bereinigen** (git., gateway., test-*)
