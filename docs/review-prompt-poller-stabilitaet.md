# Review-Prompt: OpenClaw Poller Stabilitaetsanalyse

## Kontext

Der OpenClaw Poller (`openclaw-poller.sh`, 729 Zeilen) ist ein Bash-Script, das als systemd-Timer alle 30 Sekunden laeuft und eine 5-Phasen CI/CD-Pipeline steuert:

1. **DISPATCH** — Stories aus Forgejo Process-Repo Inbox → Backlog verschieben
2. **BRIDGE** — Erste Backlog-Story → Feature-Branch + `_task.md` erstellen
3. **OPENCLAW** — Claude Code (Sonnet) implementiert die Story auf dem Feature-Branch
4. **REVIEW** — Claude Code (Opus) reviewed den Diff, APPROVED/NEEDS_FIX/force-approve
5. **PR-CHECK** — PR erstellen, Fast-Lane auto-merge oder Slow-Lane Founder-Gate

Das Script laeuft auf einem UpCloud VPS (DEV-1xCPU-2GB, Ubuntu 24.04) und interagiert mit:
- Forgejo (Git-Server, Docker-Container `factory-forgejo`)
- PostgreSQL (Docker-Container `factory-postgres`, DB `forgejo`)
- OpenClaw (Docker-Container `factory-openclaw`, enthaelt Claude Code CLI)

## Aktuelles Problem

Der Poller crasht in Phase 1 (DISPATCH) beim Verarbeiten der zweiten Story (FEAT-009) und nimmt nie Phase 2+ auf. Der Absturz passiert nach dem Log `dispatch: FEAT-009 → backlog`, bevor die Governance-Felder geloggt werden.

### Beobachtetes Verhalten

```
[2026-03-09 20:41:16] === Poller v0.6.3 gestartet ===
[2026-03-09 20:41:16] Leader Lock erworben
[2026-03-09 20:41:16] --- Phase 1: dispatch ---
[2026-03-09 20:41:16] [clone:process-repo] Erfolg nach Versuch 1
[2026-03-09 20:41:16] dispatch: BUG-000001 → backlog
[2026-03-09 20:41:16] dispatch: BUG-000001 — type=product-fast lane=fast founder_gate=false
[2026-03-09 20:41:16] dispatch: BUG-000001 → work/03-backlog/by-product/mitglieder-lokal
[2026-03-09 20:41:16] dispatch: FEAT-009 → backlog
(EXIT CODE 1, keine weitere Ausgabe)
```

### Bereits durchgefuehrte Fixes

1. **Forgejo-Token erneuert** — alter Token war nach Server-Rebuild ungueltig
   - Fix: neuer Token in `/opt/codefabrik/.poller-secrets.env`

2. **`read_story_field()` grep pipefail** — `grep` gibt Exit-Code 1 wenn Feld nicht existiert, `set -eo pipefail` beendet Script
   - Fix: `(grep ... || true)` statt `grep ...`

3. **Leader-Lock Cleanup im EXIT-Trap** — Script crasht, aber Leader-Lock bleibt 5 Minuten in DB, blockiert alle folgenden Laeufe
   - Fix: `DELETE FROM leader_lock WHERE holder_id=...` im Trap hinzugefuegt

### Was NICHT der Fehler ist (geprueft)

- Kein OOM Kill (1.1 GB available, kein dmesg-Eintrag)
- Kein Disk-Problem (17 GB frei)
- `pipeline_metrics`-Tabelle existiert und funktioniert (manueller INSERT ok)
- `record_metric()` hat `|| true` — sollte nicht crashen
- FEAT-009.yml hat alle Governance-Felder (story_type, lane, etc.)
- Auch ohne `set -e` (nur `set -uo pipefail`) bricht der Output an der gleichen Stelle ab
- Log-Datei ist beschreibbar und hat korrekte Permissions

### Verdacht

Der Crash passiert moeglicherweise in einer Subshell oder Pipe nach `read_story_governance` fuer FEAT-009 — moeglicherweise ein `pipefail`-Problem in einer der Governance-Feld-Lesungen trotz `|| true` Fix, oder ein Encoding-Problem (FEAT-009 enthaelt deutsche Umlaute als ae/oe/ue, BUG-000001 nicht).

## Zu analysierende Dateien

### 1. Poller-Script (vollstaendig, 729 Zeilen)

```bash
#!/bin/bash
# OpenClaw Poller v0.6.0 — 5-Phasen Pipeline mit Review-Loop + Governance
set -euo pipefail

LOGFILE=/var/log/openclaw-poller.log
LOCK_FILE=/tmp/openclaw-poller.lock
FORGEJO_URL="http://localhost:3000"
FORGEJO_ORG="factory"
PROCESS_REPO="process-repo"
PRODUCT_REPO="factory-gateway"
FACTORY_VERSION="0.6.3"
HOLDER_ID="poller-$(hostname)-$$"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}

# ─── PID-Lock ──────────────────────────────────────────────────────────────
if [ -f "$LOCK_FILE" ]; then
  OLD_PID=$(cat "$LOCK_FILE" 2>/dev/null || echo "0")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    log "Poller laeuft bereits (PID $OLD_PID) — ueberspringe"
    exit 0
  else
    log "Veraltetes Lock-File (PID $OLD_PID tot) — entferne"
    rm -f "$LOCK_FILE"
  fi
fi
echo $$ > "$LOCK_FILE"
trap 'rm -f "$LOCK_FILE"' EXIT

log "=== Poller v$FACTORY_VERSION gestartet (PID $$) ==="

# ─── DB-Verfuegbarkeit (fail-closed) ────────────────────────────────────────
if ! docker exec factory-postgres pg_isready -U forgejo -q 2>/dev/null; then
  log "FEHLER: PostgreSQL nicht erreichbar — fail-closed"
  exit 1
fi

# ─── Kill Switch (runtime_control) ─────────────────────────────────────────
JOBS_ENABLED=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c \
  "SELECT jobs_enabled FROM runtime_control WHERE env_name='prod'" 2>/dev/null | tr -d '[:space:]')

if [ "$JOBS_ENABLED" != "t" ]; then
  log "Kill Switch aktiv (jobs_enabled=$JOBS_ENABLED) — ueberspringe"
  exit 0
fi

# ─── Leader Lock (5 Min Lease) ─────────────────────────────────────────────
LOCK_ACQUIRED=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "
  INSERT INTO leader_lock (lock_name, holder_id, expires_at)
  VALUES ('poller', '$HOLDER_ID', NOW() + INTERVAL '5 minutes')
  ON CONFLICT (lock_name) DO UPDATE
    SET holder_id = '$HOLDER_ID',
        acquired_at = NOW(),
        expires_at = NOW() + INTERVAL '5 minutes'
  WHERE leader_lock.expires_at < NOW()
  RETURNING holder_id;" 2>/dev/null | tr -d '[:space:]')

if [ "$LOCK_ACQUIRED" != "$HOLDER_ID" ]; then
  log "Kein Leader Lock erworben — anderer Poller aktiv"
  exit 0
fi
log "Leader Lock erworben: $HOLDER_ID"

# ─── Hilfsfunktionen ───────────────────────────────────────────────────────
forgejo_api() {
  curl -sf \
    -H "Authorization: token $FORGEJO_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

update_poller_state() {
  local object_id="$1"
  local stage="$2"
  local commit_hash="${3:-}"
  docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "
    INSERT INTO poller_state (object_id, stage, commit_hash, updated_at)
    VALUES ('$object_id', '$stage', '$commit_hash', NOW())
    ON CONFLICT (object_id) DO UPDATE
      SET stage = EXCLUDED.stage,
          commit_hash = EXCLUDED.commit_hash,
          updated_at = NOW();" 2>/dev/null || true
}

get_poller_state() {
  local object_id="$1"
  docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c \
    "SELECT stage FROM poller_state WHERE object_id='$object_id'" 2>/dev/null | tr -d '[:space:]'
}

# ─── Retry mit Exponential Backoff ───────────────────────────────────────────
retry_with_backoff() {
  local max_retries=$1
  local description=$2
  shift 2
  local attempt=0
  local wait_seconds=10
  while [ $attempt -lt $max_retries ]; do
    attempt=$((attempt + 1))
    log "[$description] Versuch $attempt/$max_retries"
    if "$@"; then
      log "[$description] Erfolg nach Versuch $attempt"
      return 0
    fi
    if [ $attempt -lt $max_retries ]; then
      log "[$description] Fehlgeschlagen. Warte ${wait_seconds}s..."
      sleep $wait_seconds
      wait_seconds=$((wait_seconds * 3))
    fi
  done
  log "[$description] Fehlgeschlagen nach $max_retries Versuchen"
  return 1
}

log_poller_event() {
  local object_id="$1"
  local event="$2"
  local details="${3:-}"
  docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "
    INSERT INTO poller_events (object_id, event, details)
    VALUES ('$object_id', '$event', '$(echo "$details" | head -c 500)');" 2>/dev/null || true
}

record_metric() {
  local object_id="$1"
  local field="$2"
  local value="${3:-NOW()}"
  docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "
    INSERT INTO pipeline_metrics (object_id, $field)
    VALUES ('$object_id', $value)
    ON CONFLICT (object_id)
    DO UPDATE SET $field = $value;" 2>/dev/null || true
}

# ─── Story-Governance-Felder lesen ───────────────────────────────────────────
read_story_field() {
  local story_file="$1"
  local field="$2"
  (grep "^${field}:" "$story_file" 2>/dev/null || true) | head -1 | \
    sed "s/^${field}:[[:space:]]*//" | tr -d '"'"'" | tr -d '[:space:]'
}

read_story_governance() {
  local story_file="$1"
  STORY_TYPE=$(read_story_field "$story_file" "story_type")
  STORY_LANE=$(read_story_field "$story_file" "lane")
  FORCE_APPROVE=$(read_story_field "$story_file" "force_approve_allowed")
  AUTO_MERGE=$(read_story_field "$story_file" "auto_merge_allowed")
  FOUNDER_GATE=$(read_story_field "$story_file" "founder_gate_required")
  [ -z "$STORY_TYPE" ] && STORY_TYPE="product-fast"
  [ -z "$STORY_LANE" ] && STORY_LANE="fast"
  [ -z "$FORCE_APPROVE" ] && FORCE_APPROVE="true"
  [ -z "$AUTO_MERGE" ] && AUTO_MERGE="true"
  [ -z "$FOUNDER_GATE" ] && FOUNDER_GATE="false"
}
```

**Phasen 1-4 und Retention-Cleanup folgen im Original (729 Zeilen gesamt). Siehe das vollstaendige Script fuer Details zu Phase 2 (BRIDGE), Phase 3 (OPENCLAW), Phase 3b (REVIEW), Phase 4 (PR-CHECK).**

### 2. Systemd Units

```ini
# openclaw-poller.service
[Unit]
Description=OpenClaw Poller
[Service]
Type=oneshot
ExecStart=/opt/codefabrik/openclaw-poller.sh
EnvironmentFile=/opt/codefabrik/.poller-secrets.env

# openclaw-poller.timer
[Unit]
Description=OpenClaw Poller Timer
[Timer]
OnBootSec=60
OnUnitActiveSec=30
AccuracySec=5
[Install]
WantedBy=timers.target
```

### 3. Story-Dateien im Inbox (die verarbeitet werden sollen)

**BUG-000001.yml** (Smoke-Test, KEINE Governance-Felder):
```yaml
id: BUG-000001
type: bug
title: 'SUP-000001: Smoke-Test Bug'
beschreibung: |-
  Kundenmeldung (Lizenz: mitglieder-lokal):
  Automatischer Smoke-Test Case
akzeptanzkriterien:
  - Problem ist behoben
  - Test existiert
produkt: mitglieder-lokal
prioritaet: normal
quelle: portal
portal_ref: SUP-000001
adr_refs: []
```

**FEAT-009.yml** (echte Story, MIT Governance-Felder):
```yaml
id: FEAT-009
type: story
title: "Automatisches Backup fuer Rechnung Lokal"
story_type: product-fast
lane: fast
platform_impact: none
founder_gate_required: false
force_approve_allowed: true
auto_merge_allowed: true
produkt: rechnung-lokal
beschreibung: |
  Rechnung Lokal soll das automatische Backup-System aus electron-platform nutzen.
  Die Logik ist bereits fertig implementiert in @codefabrik/electron-platform:
  - lib/backup-core.js (Backup erstellen, rotieren, validieren, wiederherstellen)
  - ipc/backup.js (IPC-Handler fuer Renderer)
  - Preload-Bridge exponiert window.electronAPI.backup
  (... weitere Zeilen ...)
akzeptanzkriterien:
  - "Backup wird automatisch bei App-Start erstellt (wenn letztes > 24h)"
  - "Backup-Rotation funktioniert (7 taeglich, 4 woechentlich, monatlich)"
  - "SupportView zeigt Backup-Status und ermoeglicht manuelles Backup"
  - "Wiederherstellung aus Backup funktioniert"
  - "Keine eigene Backup-Logik — nur @codefabrik/electron-platform genutzt"
  - "Tests vorhanden"
  - "spec.yml aktualisiert (backup Feature: status done)"
affected_files:
  - "products/rechnung-lokal/electron/main.cjs"
  - "products/rechnung-lokal/src/App.svelte"
  - "products/rechnung-lokal/spec.yml"
depends_on: []
prioritaet: normal
quelle: intern
estimated_effort: S
```

### 4. DB-Schema (relevante Tabellen)

```sql
-- leader_lock
CREATE TABLE leader_lock (
  lock_name VARCHAR(50) PRIMARY KEY,
  holder_id VARCHAR(100) NOT NULL,
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- pipeline_metrics
CREATE TABLE pipeline_metrics (
  id SERIAL PRIMARY KEY,
  object_id TEXT NOT NULL UNIQUE,
  product TEXT,
  dispatched_at TIMESTAMPTZ,
  in_progress_at TIMESTAMPTZ,
  pr_created_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  total_duration_minutes INTEGER,
  dev_duration_minutes INTEGER,
  retry_count INTEGER DEFAULT 0,
  blocked_reason TEXT,
  review_iterations INTEGER DEFAULT 0,
  review_started_at TIMESTAMPTZ,
  review_completed_at TIMESTAMPTZ,
  review_verdict TEXT,
  story_type VARCHAR(30),
  lane VARCHAR(10),
  completed_at TIMESTAMPTZ
);
-- Hat Trigger: trg_pipeline_durations (update_pipeline_durations())

-- poller_state
CREATE TABLE poller_state (
  object_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  commit_hash TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- poller_events
CREATE TABLE poller_events (
  id SERIAL PRIMARY KEY,
  object_id TEXT NOT NULL,
  event TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Aufgaben fuer den Reviewer

### A. Root-Cause-Analyse des aktuellen Crashs

1. Identifiziere die exakte Zeile/Bedingung die den Exit-Code 1 verursacht
2. Erklaere warum BUG-000001 funktioniert aber FEAT-009 nicht
3. Schlage einen konkreten Fix vor

### B. Systematische Stabilitaetsanalyse

Pruefe das gesamte 729-Zeilen-Script auf weitere `set -euo pipefail`-Fallen:

1. **Alle grep-Aufrufe ohne `|| true`** — auch in Phase 2-4 (z.B. Zeile 206, 278-282, 363, 461, 629)
2. **Alle Command-Substitutions** `$(...)` die fehlschlagen koennten
3. **Alle Pipe-Chains** die bei leerem Input einen Non-Zero-Exit produzieren koennten
4. **docker exec Aufrufe** die bei Container-Neustart fehlschlagen
5. **git-Operationen** die bei Merge-Konflikten oder fehlenden Branches crashen

### C. Sicherheitsanalyse

1. **API-Key im Script (Zeile 416, 567)**: Der Anthropic API-Key steht im Klartext im Script, das auf den PROD-Server geschrieben wird
2. **SQL-Injection**: `$story_id`, `$HOLDER_ID` und andere Werte werden direkt in SQL-Strings interpoliert
3. **Forgejo-Token**: Token wird in git-Clone-URLs verwendet — sichtbar in `ps aux` und `.git/config`
4. **Script-Injection via YAML**: Boesartige YAML-Inhalte koennten Shell-Befehle einschleusen (z.B. in `story_title` bei PR-Erstellung)

### D. Architektur-Empfehlungen

1. Ist ein 729-Zeilen-Bash-Script die richtige Wahl fuer eine 5-Phasen-Pipeline? Alternativen?
2. Wie kann die Fehlerbehandlung systematisch verbessert werden?
3. Welche Monitoring/Alerting-Mechanismen fehlen?
4. Wie kann das Lock-System robuster werden?
5. Sollten die Phasen in separate Scripts/Prozesse aufgeteilt werden?

## Erwartetes Ergebnis

1. **Root-Cause**: Exakte Erklaerung des FEAT-009-Crashs
2. **Fix-Liste**: Priorisierte Liste aller `pipefail`-Fallen im Script (mit Zeilennummern)
3. **Sicherheits-Findings**: Priorisiert nach Schweregrad
4. **Architektur-Empfehlung**: Konkrete naechste Schritte fuer Stabilitaet (keine Komplett-Rewrites, pragmatische Verbesserungen)
