#!/bin/bash
# diagnose.sh — Server-Diagnose (PROD + Portal)
# Liest alle Infos aus KeePass (1x Passwort), dann SSH-Diagnose.
set -euo pipefail

KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"

# --- KeePass ---
[ -f "$KEEPASS_DB" ] || { echo "FEHLER: KeePass-DB nicht gefunden: $KEEPASS_DB" >&2; exit 1; }

echo "=== Code-Fabrik Diagnose ==="
echo ""

# --- Alle Secrets mit einem einzigen XML-Export lesen ---
echo "KeePass lesen (1x Passwort)..."
TMPXML=$(mktemp /dev/shm/diag-XXXXXX.xml)
trap 'shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"' EXIT

keepassxc-cli export "$KEEPASS_DB" -f xml > "$TMPXML" 2>/dev/null \
    || { echo "FEHLER: KeePass-Export fehlgeschlagen" >&2; exit 1; }

# Python parst alles auf einmal
eval "$(python3 - "$TMPXML" << 'PYEOF'
import sys, xml.etree.ElementTree as ET, base64

xml_file = sys.argv[1]
tree = ET.parse(xml_file)
root = tree.getroot()

def find_group(parent, path_parts):
    if not path_parts:
        return parent
    for group in parent.findall("Group"):
        name_el = group.find("Name")
        if name_el is not None and name_el.text == path_parts[0]:
            return find_group(group, path_parts[1:])
    return None

def get_password(group, entry_name):
    if group is None:
        return ""
    for entry in group.findall("Entry"):
        title = password = None
        for s in entry.findall("String"):
            k, v = s.find("Key"), s.find("Value")
            if k is not None and v is not None:
                if k.text == "Title": title = v.text
                elif k.text == "Password": password = v.text
        if title == entry_name and password:
            return password
    return ""

db_root = root.find(".//Root/Group")
rt = find_group(db_root, ["Studio Ops", "00-Vault", "Code-Fabrik", "Runtime"])
cf = find_group(db_root, ["Studio Ops", "00-Vault", "Code-Fabrik"])

def decode_runtime(name):
    raw = get_password(rt, name)
    if not raw:
        return ""
    try:
        return base64.b64decode(raw).decode("utf-8")
    except Exception:
        return raw

server_env = decode_runtime("server-env")
tokens_env = decode_runtime("tokens-env")
portal_env = decode_runtime("portal-env")

import re
server_ip = ""
m = re.search(r"SERVER_IP=(.+)", server_env)
if m: server_ip = m.group(1).strip()

forgejo_token = ""
m = re.search(r"FORGEJO_API_TOKEN=(.+)", tokens_env)
if m: forgejo_token = m.group(1).strip()

portal_ip = ""
m = re.search(r"PORTAL_IP=(.+)", portal_env)
if m: portal_ip = m.group(1).strip()

# SSH-Key
ssh_key = get_password(cf, "ssh-deploy-key")

# Shell-kompatible Ausgabe
print(f'SERVER_IP="{server_ip}"')
print(f'FORGEJO_TOKEN="{forgejo_token}"')
print(f'PORTAL_IP="{portal_ip}"')
if ssh_key:
    # Escaped fuer eval
    print(f'SSH_KEY_CONTENT="{ssh_key}"')
PYEOF
)"

# XML sofort loeschen
shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"

echo "  PROD:   ${SERVER_IP:-NICHT GEFUNDEN}"
echo "  Portal: ${PORTAL_IP:-NICHT GEFUNDEN}"
echo "  Token:  ${FORGEJO_TOKEN:+${FORGEJO_TOKEN:0:8}...}"
echo ""

# --- SSH-Key sicherstellen ---
if [ ! -f "$SSH_KEY" ]; then
    if [ -n "${SSH_KEY_CONTENT:-}" ]; then
        echo "SSH-Key aus KeePass extrahiert."
        echo "$SSH_KEY_CONTENT" > "$SSH_KEY"
        chmod 600 "$SSH_KEY"
    else
        echo "FEHLER: SSH-Key nicht verfuegbar" >&2
        exit 1
    fi
fi

# --- PROD Server Diagnose ---
if [ -n "$SERVER_IP" ]; then
    echo "=== PROD Server ($SERVER_IP) ==="
    echo ""
    SSH_ASKPASS="" ssh -o StrictHostKeyChecking=accept-new \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ConnectTimeout=10 \
        -i "$SSH_KEY" root@"$SERVER_IP" bash -s "$FORGEJO_TOKEN" << 'REMOTE'
FORGEJO_TOKEN="$1"

echo "--- System ---"
echo "  Uptime:    $(uptime -p)"
echo "  RAM:       $(free -h | awk '/Mem:/{print $3"/"$2}')"
echo "  Disk:      $(df -h / | awk 'NR==2{print $3"/"$2" ("$5" belegt)"}')"
echo "  CPU:       $(nproc) Kerne"
echo ""

echo "--- Docker Container ---"
docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Docker nicht erreichbar"
echo ""

echo "--- Nicht laufende Container ---"
STOPPED=$(docker ps -a --filter "status=exited" --format "  {{.Names}}: {{.Status}}" 2>/dev/null)
[ -n "$STOPPED" ] && echo "$STOPPED" || echo "  (keine)"
echo ""

echo "--- Systemd Timer ---"
for timer in openclaw-poller codefabrik-nightstop codefabrik-nightstart; do
    STATUS=$(systemctl is-active "${timer}.timer" 2>/dev/null || echo "nicht gefunden")
    echo "  ${timer}: $STATUS"
done
echo ""

echo "--- Forgejo Repos ---"
if [ -n "$FORGEJO_TOKEN" ]; then
    REPOS_JSON=$(curl -sf "http://localhost:3000/api/v1/repos/search?limit=50" \
        -H "Authorization: token $FORGEJO_TOKEN" 2>/dev/null || echo "")
    if [ -n "$REPOS_JSON" ]; then
        echo "$REPOS_JSON" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
repos = data.get('data', [])
for r in repos:
    print(f'  {r[\"full_name\"]} ({r.get(\"size\",0)} KB)')
if not repos:
    print('  (keine Repos)')
" 2>/dev/null || echo "  JSON-Parse fehlgeschlagen"
    else
        echo "  API nicht erreichbar"
    fi
else
    echo "  (kein Token)"
fi
echo ""

echo "--- AnythingLLM ---"
ALM_STATUS=$(docker inspect -f '{{.State.Status}}' factory-anythingllm 2>/dev/null || echo "nicht vorhanden")
echo "  Container: $ALM_STATUS"
if [ "$ALM_STATUS" = "running" ]; then
    ALM_HEALTH=$(curl -sf http://localhost:3001/api/v1/auth 2>/dev/null && echo "erreichbar" || echo "nicht erreichbar")
    echo "  API: $ALM_HEALTH"

    ALM_DB="/var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db"
    if command -v sqlite3 >/dev/null 2>&1; then
        if [ -f "$ALM_DB" ]; then
            KEY_COUNT=$(sqlite3 "$ALM_DB" 'SELECT COUNT(*) FROM api_keys;' 2>/dev/null || echo "0")
            echo "  API-Keys: $KEY_COUNT"
            ALM_KEY=$(sqlite3 "$ALM_DB" 'SELECT secret FROM api_keys LIMIT 1;' 2>/dev/null || echo "")
            if [ -n "$ALM_KEY" ]; then
                WS_JSON=$(curl -sf -H "Authorization: Bearer $ALM_KEY" \
                    http://localhost:3001/api/v1/workspaces 2>/dev/null || echo "")
                if [ -n "$WS_JSON" ]; then
                    echo "$WS_JSON" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
for w in data.get('workspaces', []):
    docs = len(w.get('documents', []))
    print(f'  Workspace: {w[\"slug\"]} ({docs} Dokumente)')
if not data.get('workspaces'):
    print('  (keine Workspaces)')
" 2>/dev/null || echo "  Workspace-Parse fehlgeschlagen"
                fi
            fi
        else
            echo "  DB: nicht gefunden"
        fi
    else
        echo "  sqlite3: NICHT installiert"
    fi
fi
echo ""

echo "--- Repos unter /mnt/data/repos ---"
if [ -d /mnt/data/repos ]; then
    FOUND=false
    for d in /mnt/data/repos/*/; do
        [ -d "$d" ] || continue
        FOUND=true
        REPO_NAME=$(basename "$d")
        if [ -d "$d/.git" ]; then
            COMMIT=$(git -C "$d" log -1 --format='%h %s' 2>/dev/null || echo "?")
            echo "  $REPO_NAME: $COMMIT"
        else
            echo "  $REPO_NAME: (kein Git-Repo)"
        fi
    done
    $FOUND || echo "  (leer)"
else
    echo "  /mnt/data/repos existiert nicht"
fi
echo ""

echo "--- Gateway ---"
HEALTH=$(curl -sf http://localhost:3100/health 2>/dev/null || echo "nicht erreichbar")
echo "  /health: $HEALTH"
READY=$(curl -sf http://localhost:3100/ready 2>/dev/null || echo "nicht erreichbar")
echo "  /ready: $READY"
echo ""

echo "--- Poller Log (letzte 5 Zeilen) ---"
journalctl -u openclaw-poller.service --no-pager -n 5 2>/dev/null || echo "  (kein Log)"
echo ""

echo "--- Disk Usage (Docker) ---"
docker system df 2>/dev/null || echo "  nicht verfuegbar"
REMOTE

else
    echo "PROD Server-IP nicht gefunden"
fi

echo ""

# --- Portal Diagnose ---
if [ -n "$PORTAL_IP" ]; then
    echo "=== Portal Server ($PORTAL_IP) ==="
    echo ""
    SSH_ASKPASS="" ssh -o StrictHostKeyChecking=accept-new \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ConnectTimeout=10 \
        -i "$SSH_KEY" root@"$PORTAL_IP" bash << 'REMOTE'
echo "--- System ---"
echo "  Uptime:    $(uptime -p)"
echo "  RAM:       $(free -h | awk '/Mem:/{print $3"/"$2}')"
echo "  Disk:      $(df -h / | awk 'NR==2{print $3"/"$2" ("$5" belegt)"}')"
echo ""

echo "--- Docker Container ---"
docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null || echo "  Docker nicht erreichbar"
echo ""

echo "--- Portal API ---"
STATUS=$(curl -sf http://localhost:3000/api/status 2>/dev/null || echo "nicht erreichbar")
echo "  /api/status: $STATUS"
echo ""

echo "--- Watchdog ---"
WD_STATUS=$(systemctl is-active portal-watchdog.timer 2>/dev/null || echo "nicht gefunden")
echo "  Timer: $WD_STATUS"
journalctl -u portal-watchdog.service --no-pager -n 3 2>/dev/null || echo "  (kein Log)"
REMOTE

else
    echo "Portal-IP nicht gefunden"
fi

echo ""
echo "=== Diagnose abgeschlossen ==="
