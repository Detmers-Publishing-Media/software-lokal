#!/bin/bash
# update-ollama-key.sh — Ollama API-Key aus KeePass auf PROD deployen
set -euo pipefail

KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"
SERVER_ENV="$HOME/code-fabrik/.server-env"

# KeePass-DB pruefen
[ -f "$KEEPASS_DB" ] || { echo "FEHLER: KeePass-DB nicht gefunden: $KEEPASS_DB" >&2; exit 1; }

# SSH-Key pruefen, ggf. aus KeePass extrahieren
if [ ! -f "$SSH_KEY" ]; then
    echo "SSH-Key nicht lokal vorhanden, extrahiere aus KeePass..."
    keepassxc-cli show -s -a Password "$KEEPASS_DB" \
        "Studio Ops/00-Vault/Code-Fabrik/ssh-deploy-key" > "$SSH_KEY"
    chmod 600 "$SSH_KEY"
fi

# Server-IP ermitteln
if [ -f "$SERVER_ENV" ]; then
    SERVER_IP=$(grep -oP 'SERVER_IP=\K.*' "$SERVER_ENV")
else
    echo "FEHLER: $SERVER_ENV nicht gefunden" >&2
    exit 1
fi

# Ollama API-Key aus KeePass lesen
echo "Ollama API-Key aus KeePass lesen..."
NEW_KEY=$(keepassxc-cli show -s -a Password "$KEEPASS_DB" \
    "Studio Ops/00-Vault/Code-Fabrik/ollama-api-key")

[ -n "$NEW_KEY" ] || { echo "FEHLER: Key leer" >&2; exit 1; }
echo "OK (${NEW_KEY:0:8}...)"

# Auf Server deployen
echo "Deploye auf $SERVER_IP..."
ssh -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR \
    -i "$SSH_KEY" root@"$SERVER_IP" bash -s "$NEW_KEY" << 'REMOTE'
NEW_KEY="$1"
DB=/var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db

# anythingllm.env aktualisieren
sed -i "s|^GENERIC_OPEN_AI_API_KEY=.*|GENERIC_OPEN_AI_API_KEY=$NEW_KEY|" /opt/codefabrik/anythingllm.env

# AnythingLLM DB aktualisieren
sqlite3 "$DB" "INSERT OR REPLACE INTO system_settings (label, value) VALUES ('GenericOpenAiKey', '$NEW_KEY');"

# Container neustarten
docker restart factory-anythingllm >/dev/null

echo "AnythingLLM Key aktualisiert + Container neu gestartet"

# Schnelltest
sleep 5
source /opt/codefabrik/anythingllm.env
RESULT=$(curl -sf -H "Authorization: Bearer $NEW_KEY" \
    -H "Content-Type: application/json" \
    "$GENERIC_OPEN_AI_BASE_PATH/chat/completions" \
    -d '{"model":"'"$GENERIC_OPEN_AI_MODEL_PREF"'","messages":[{"role":"user","content":"hi"}],"max_tokens":5}' 2>&1 | head -c 100)
if echo "$RESULT" | grep -q "unauthorized"; then
    echo "WARNUNG: API gibt weiterhin 401 — Key-Berechtigung pruefen"
elif [ -n "$RESULT" ]; then
    echo "API-Test: OK"
else
    echo "WARNUNG: Keine Antwort von API"
fi
REMOTE

echo "Fertig."
