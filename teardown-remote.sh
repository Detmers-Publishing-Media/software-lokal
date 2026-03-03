#!/bin/bash
# Code-Fabrik v0.3.1 Remote Teardown — Server + DNS löschen
set -euo pipefail

DRY_RUN=false
DO_BACKUP=false
for arg in "$@"; do
  case $arg in
    --dry-run) DRY_RUN=true ;;
    --backup) DO_BACKUP=true ;;
  esac
done

log() { echo "[$(date -Iseconds)] $1"; }

source ~/code-fabrik/.tokens-env
source ~/code-fabrik/.server-env

log "=== Code-Fabrik v0.3.1 Remote Teardown ==="

# 1. Server-Teardown (remote)
SSH_CMD_LOCAL="ssh -o ConnectTimeout=10 -i ~/.ssh/codefabrik_deploy root@$SERVER_IP"

if $DO_BACKUP; then
  $SSH_CMD_LOCAL '/opt/codefabrik/teardown.sh --backup' 2>/dev/null || log "Backup fehlgeschlagen"
else
  $SSH_CMD_LOCAL '/opt/codefabrik/teardown.sh' 2>/dev/null || log "Server nicht erreichbar"
fi

# 2. Server löschen (UpCloud API)
if [ -n "$SERVER_UUID" ]; then
  log "Server stoppen: $SERVER_UUID"
  if ! $DRY_RUN; then
    curl -sf -X POST       -H "Authorization: Bearer $UPCLOUD_API_TOKEN"       "https://api.upcloud.com/1.3/server/$SERVER_UUID/stop"       -d '{"stop_server":{"stop_type":"soft","timeout":"60"}}' || true
    sleep 30
    curl -sf -X DELETE       -H "Authorization: Bearer $UPCLOUD_API_TOKEN"       "https://api.upcloud.com/1.3/server/$SERVER_UUID?storages=1&backups=delete" &&       log "Server $SERVER_UUID gelöscht" || log "Server-Löschung fehlgeschlagen"
  else
    log "DRY-RUN: Würde Server $SERVER_UUID löschen"
  fi
fi

# 3. DNS-Records löschen (Cloudflare)
CF_ZONE="b9525ee2fa8f0e14ce58b1f1b184c597"
CF_API="https://api.cloudflare.com/client/v4"

for RECORD_NAME in "git.codefabrik.detmers-publish.de" "gateway.codefabrik.detmers-publish.de" "codefabrik.detmers-publish.de"; do
  RECORD_ID=$(curl -sf     -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"     "$CF_API/zones/$CF_ZONE/dns_records?name=$RECORD_NAME&type=A" |     python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('result',[]); print(r[0]['id'] if r else '')" 2>/dev/null)

  if [ -n "$RECORD_ID" ]; then
    if $DRY_RUN; then
      log "DRY-RUN: Würde DNS $RECORD_NAME löschen"
    else
      curl -sf -X DELETE         -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"         "$CF_API/zones/$CF_ZONE/dns_records/$RECORD_ID" | python3 -c "import sys,json; print('DNS gelöscht: $RECORD_NAME' if json.load(sys.stdin).get('success') else 'WARN: Löschung fehlgeschlagen')" 2>/dev/null
    fi
  fi
done

# 4. Lokale Temp-Dateien
rm -f /tmp/codefabrik_deploy_key /tmp/codefabrik_deploy_key.pub

log "=== Teardown komplett. Keine Server, kein DNS. ==="
