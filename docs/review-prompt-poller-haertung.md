# Review-Prompt: OpenClaw Poller Haertung — Patch-Validierung + Testkonzept

## Kontext

Der OpenClaw Poller (`openclaw-poller.sh.j2`, Ansible-Template) steuert eine 5-Phasen CI/CD-Pipeline als systemd-Timer (30s). Ein externer Review hat 11 kritische Stabilitaets- und Sicherheitsprobleme identifiziert. Die Fixes wurden manuell auf dem PROD-Server validiert und sollen jetzt in das Ansible-Template (Source of Truth) uebertragen werden.

**Ziel dieses Reviews:** Validierung der Patches, Identifikation weiterer Haertungsmassnahmen in Phase 2-4, und Empfehlung eines Testkonzepts fuer ein Bash-basiertes CI/CD-Script.

## Architektur-Uebersicht

```
systemd Timer (30s) → openclaw-poller.sh
  ├── Phase 1: DISPATCH (Inbox → Backlog)
  ├── Phase 2: BRIDGE (Backlog → Feature-Branch + _task.md)
  ├── Phase 3: OPENCLAW (Claude Code implementiert)
  ├── Phase 3b: REVIEW (Claude Code Opus reviewt)
  ├── Phase 4: PR-CHECK (PR erstellen, Auto-Merge oder Founder-Gate)
  └── Retention Cleanup (Events > 30 Tage loeschen)

Abhaengigkeiten:
  - PostgreSQL (Docker: factory-postgres)
  - Forgejo (Docker: factory-forgejo, Git + API)
  - OpenClaw (Docker: factory-openclaw, Claude Code CLI)
```

## Die 11 Patches (bereits auf PROD validiert)

### Patch 1: ERR-Trap fuer Crash-Visibility

**Vorher:**
```bash
set -euo pipefail
```

**Nachher:**
```bash
set -Eeuo pipefail

on_err() {
  local rc=$?
  log "ERR rc=$rc line=$1 cmd=${2:-unknown}" 2>/dev/null || true
  exit "$rc"
}
trap 'on_err "$LINENO" "$BASH_COMMAND"' ERR
```

**Begründung:** Ohne ERR-Trap war nicht erkennbar, WO das Script crashte. `set -E` propagiert den Trap in Subshells/Funktionen.

### Patch 2: log() ohne tee-Pipe

**Vorher:**
```bash
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}
```

**Nachher:**
```bash
log() {
  local ts msg
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  msg="[$ts] $*"
  printf '%s\n' "$msg" >&2
  printf '%s\n' "$msg" >> "$LOGFILE" || true
}
```

**Begründung:** `echo | tee` erzeugt eine Pipe. Wenn tee fehlschlaegt (z.B. volle Disk), gibt die Pipe unter `pipefail` Exit-Code != 0 zurueck — was in einer Log-Funktion nie passieren darf.

### Patch 3: SQL/Docker-Helfer

**Neu hinzugefuegt:**
```bash
sql_escape() {
  printf "%s" "$1" | sed "s/'/''/g"
}

run_psql() {
  docker exec factory-postgres psql -U forgejo -d forgejo -v ON_ERROR_STOP=1 -tAq "$@"
}

get_scalar_sql() {
  local sql="$1"
  local out
  if ! out="$(run_psql -c "$sql" 2>/tmp/openclaw-psql.err)"; then
    log "FEHLER: psql fehlgeschlagen: $(head -c 300 /tmp/openclaw-psql.err 2>/dev/null)"
    return 1
  fi
  printf '%s' "$out" | tr -d '[:space:]'
}
```

**Begründung:** DRY-Prinzip und SQL-Injection-Schutz. `ON_ERROR_STOP=1` sorgt dafuer dass SQL-Fehler nicht stumm ignoriert werden.

### Patch 4: read_story_field() mit explizitem return 0

**Vorher:**
```bash
read_story_field() {
  local story_file="$1"
  local field="$2"
  grep "^${field}:" "$story_file" 2>/dev/null | head -1 | \
    sed "s/^${field}:[[:space:]]*//" | tr -d '"'"'" | tr -d '[:space:]'
}
```

**Nachher:**
```bash
read_story_field() {
  local story_file="$1"
  local field="$2"
  local out
  out="$(
    (grep "^${field}:" "$story_file" 2>/dev/null || true) \
      | head -1 \
      | sed "s/^${field}:[[:space:]]*//" \
      | tr -d '"'"'" \
      | tr -d '[:space:]'
  )"
  printf '%s' "$out"
  return 0
}
```

**Begründung:** `grep` gibt Exit 1 bei "kein Treffer" — unter `pipefail` terminiert das die gesamte Pipe und damit das Script. `(grep ... || true)` und explizites `return 0` verhindern das.

### Patch 5: read_story_governance() mit := Defaults (ROOT CAUSE)

**Vorher:**
```bash
read_story_governance() {
  local story_file="$1"
  STORY_TYPE=$(read_story_field "$story_file" "story_type")
  # ...
  [ -z "$FOUNDER_GATE" ] && FOUNDER_GATE="false"
}
```

**Nachher:**
```bash
read_story_governance() {
  local story_file="$1"
  STORY_TYPE="$(read_story_field "$story_file" "story_type" || printf '')"
  # ...
  : "${STORY_TYPE:=product-fast}"
  : "${STORY_LANE:=fast}"
  : "${FORCE_APPROVE:=true}"
  : "${AUTO_MERGE:=true}"
  : "${FOUNDER_GATE:=false}"
  return 0
}
```

**Begründung:** Dies war der ROOT CAUSE des urspruenglichen Crashs. `[ -z "$VAR" ] && VAR="default"` gibt Exit 1 zurueck wenn `$VAR` NICHT leer ist (weil `&&` nicht ausgefuehrt wird). Als letzte Zeile der Funktion wird dieser Exit-Code zum Rueckgabewert. Unter `set -e` beendet das sofort das Script. `: "${VAR:=default}"` ist idiomatisch und gibt immer Exit 0.

### Patch 6-8: SQL-Funktionen mit sql_escape

`update_poller_state()`, `get_poller_state()`, `log_poller_event()` verwenden jetzt `run_psql` und `sql_escape()` statt direkter String-Interpolation.

### Patch 9: record_metric() mit Feld-Whitelist

**Neu hinzugefuegt:**
```bash
is_allowed_metric_field() {
  case "$1" in
    product|dispatched_at|in_progress_at|pr_created_at|merged_at|blocked_at|\
    total_duration_minutes|dev_duration_minutes|retry_count|blocked_reason|\
    review_iterations|review_started_at|review_completed_at|review_verdict|\
    story_type|lane|completed_at)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

record_metric() {
  local object_id="$1"
  local field="$2"
  local value="${3:-NOW()}"
  if ! is_allowed_metric_field "$field"; then
    log "WARN: unzulaessiges pipeline_metrics-Feld: $field"
    return 0
  fi
  run_psql -c "..." >/dev/null 2>&1 || {
    log "WARN: record_metric fehlgeschlagen fuer $object_id/$field"
    return 0
  }
}
```

**Begründung:** `record_metric "$id" "$field" "$value"` interpoliert `$field` direkt als SQL-Spaltenname. Ohne Whitelist kann ein manipulierter Feldname beliebiges SQL ausfuehren.

### Patch 10: Phase-1 grep ohne pipefail

```bash
# Vorher
produkt=$(grep '^produkt:' "$story_file" | awk '{print $2}' | ...)

# Nachher
produkt=$( (grep '^produkt:' "$story_file" 2>/dev/null || true) | awk '{print $2}' | ...)
```

### Patch 11: FORGEJO_API_TOKEN Pflichtpruefung

```bash
HOLDER_ID="poller-$(hostname)-$$"

# Pflicht-Variablen pruefen
: "${FORGEJO_API_TOKEN:?FORGEJO_API_TOKEN fehlt — EnvironmentFile pruefen}"
```

## Noch offene Haertung (Phase 2-4)

Die folgenden Stellen im Ansible-Template sind NOCH NICHT gepatcht und muessen ebenfalls gehaertet werden:

### Phase 2 (BRIDGE) — Zeilen 254-348

```bash
# Zeile 260: find ohne mkdir -p
IN_PROGRESS_COUNT=$(find work/04-in-progress -name "*.yml" 2>/dev/null | wc -l | tr -d '[:space:]')

# Zeile 278-282: grep ohne || true
story_title=$(grep '^title:' "work/04-in-progress/$story_id.yml" | cut -d'"' -f2 | head -1)
story_beschreibung=$(awk '/^beschreibung:/,/^[a-z]/' "work/04-in-progress/$story_id.yml" | ...)
story_produkt=$(grep '^produkt:' "work/04-in-progress/$story_id.yml" | awk '{print $2}' | ...)
[ -z "$story_produkt" ] && story_produkt="$PRODUCT_REPO"  # ← selbes [ -z ] && Pattern!

# Zeile 296-297: awk/grep ohne || true
AKZEPTANZKRITERIEN=$(awk '/^akzeptanzkriterien:/,/^[a-z]/' "$WORK_DIR/..." | grep '^\s*-' | ... || echo "- Siehe Story")

# Zeile 355: for-Schleife mit 2>/dev/null (Syntaxfehler)
for story_file in "$WORK_DIR/process/work/04-in-progress"/*.yml 2>/dev/null; do
```

### Phase 3 (OPENCLAW) — Zeilen 350-447

```bash
# Zeile 363: grep ohne || true
story_produkt=$(grep '^produkt:' "$story_file" | awk '{print $2}' | ...)
[ -z "$story_produkt" ] && story_produkt="$PRODUCT_REPO"

# Zeile 367-368: docker exec psql ohne run_psql
BRANCH_NAME=$(docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c \
  "SELECT commit_hash FROM poller_state WHERE object_id='$story_id'" 2>/dev/null | tr -d '[:space:]')
```

### Phase 3b (REVIEW) — Zeilen 449-615

```bash
# Zeile 461-462: grep ohne || true
story_produkt=$(grep '^produkt:' "$story_file" | awk '{print $2}' | ...)

# Zeile 464-465: docker exec psql ohne run_psql
BRANCH_NAME=$(docker exec factory-postgres psql ...)

# Zeile 472-473: docker exec psql ohne run_psql
REVIEW_ITERS=$(docker exec factory-postgres psql ...)

# Zeile 579: grep -oP (Perl-Regex, nicht portabel)
VERDICT=$(echo "$REVIEW_OUTPUT" | grep -oP 'VERDICT:\s*\K\S+' | tail -1 || echo "")
```

### Phase 4 (PR-CHECK) — Zeilen 617-723

```bash
# Zeile 629: grep ohne || true
story_produkt=$(grep '^produkt:' "$story_file" | awk '{print $2}' | ...)

# Zeile 634-635: docker exec psql ohne run_psql
BRANCH_NAME=$(docker exec factory-postgres psql ...)

# Zeile 658-659: story_title direkt in JSON (Injection-Risiko)
-d "{\"title\": \"$story_id: $story_title\", ...}"
```

### EXIT-Trap — Zeile 171

```bash
# Aktuell:
trap 'rm -rf "$WORK_DIR"; rm -f "$LOCK_FILE"' EXIT

# Fehlt: Leader-Lock aus DB loeschen
# Noetig:
trap 'rm -rf "$WORK_DIR"; rm -f "$LOCK_FILE"; docker exec factory-postgres psql -U forgejo -d forgejo -tAq -c "DELETE FROM leader_lock WHERE holder_id='"'"'$HOLDER_ID'"'"'" 2>/dev/null || true' EXIT
```

## Vollstaendiges Ansible-Template (730 Zeilen, UNGEPATCHT)

Das vollstaendige Template befindet sich in:
`ansible/roles/poller/templates/openclaw-poller.sh.j2`

Es enthaelt Jinja2-Variablen: `{{ factory_org }}`, `{{ process_repo }}`, `{{ product_repo }}`, `{{ factory_version }}`, `{{ vault_anthropic_api_key }}`, `{{ impl_model }}`, `{{ review_model }}`, `{{ max_review_iterations }}`.

## Aufgaben fuer den Reviewer

### A. Patch-Validierung

1. Sind alle 11 Patches korrekt und vollstaendig?
2. Gibt es Edge-Cases die uebersehen wurden?
3. Ist die ERR-Trap-Implementierung robust (Subshells, Pipes, Hintergrundprozesse)?
4. Ist `sql_escape()` (Single-Quote-Verdopplung) ausreichend oder braucht es parametrisierte Queries?

### B. Phase-2-4-Haertung

1. Vollstaendige Liste aller noch ungesicherten grep/awk/docker-exec-Aufrufe mit Zeilennummern
2. Alle `[ -z "$VAR" ] && VAR="..."` Muster die noch existieren
3. Alle `for ... 2>/dev/null; do` Konstrukte (Syntaxfehler unter Bash)
4. Alle Stellen wo User-Daten direkt in SQL oder JSON interpoliert werden
5. grep -oP (Perl-Regex) Portabilitaet — Alternative?

### C. Testkonzept

Empfehlung fuer ein Testkonzept fuer ein Bash-CI/CD-Script:

1. **Unit-Tests**: Wie koennen einzelne Funktionen (read_story_field, sql_escape, is_allowed_metric_field) isoliert getestet werden?
2. **Integration-Tests**: Wie kann der Poller gegen eine Test-DB + Test-Forgejo laufen?
3. **Regression-Tests**: Wie stellen wir sicher, dass die `[ -z ] &&`-Falle nie wieder auftritt?
4. **Smoke-Tests**: Minimaler Test der nach jedem Deploy prueft ob der Poller einen Zyklus ueberlebt
5. **Framework-Empfehlung**: bats-core, shunit2, oder reines Bash?

### D. Logging und Monitoring

1. Welche Metriken sollte der Poller exponieren (fuer spaeteres Gateway /metrics)?
2. Reicht der ERR-Trap oder braucht es strukturiertes Logging (JSON)?
3. Alerting: Wie erkennt man "Poller laeuft, aber macht nichts" (z.B. Leader-Lock-Deadlock)?
4. Log-Rotation: Aktuell waechst `/var/log/openclaw-poller.log` unbegrenzt

### E. Sicherheit (Vertiefung)

1. Forgejo-Token in git-Clone-URLs — sichtbar in `ps aux` und `.git/config`
2. Anthropic API-Key wird als Klartext in Container-Script geschrieben (Zeile 416)
3. `story_title` direkt in Forgejo-API-JSON (Injection bei boeswilligen Story-Titeln)
4. Docker-Socket-Zugriff — was passiert wenn ein Container kompromittiert wird?

## Erwartetes Ergebnis

1. **Patch-Bewertung**: Bestaetigung oder Korrekturen fuer alle 11 Patches
2. **Offene-Stellen-Liste**: Vollstaendige, zeilengenaue Liste aller noch zu haertenden Stellen
3. **Testkonzept**: Konkreter Vorschlag mit Beispielen (bevorzugt bats-core oder reines Bash)
4. **Logging-Empfehlung**: Strukturiertes Logging + Log-Rotation + Metriken
5. **Sicherheits-Massnahmen**: Priorisiert nach Aufwand/Wirkung
