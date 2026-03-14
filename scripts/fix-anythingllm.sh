#!/bin/bash
# fix-anythingllm.sh — AnythingLLM headless konfigurieren
# Strategie: .env als File-Mount + API-Setup + Onboarding skip
set -euo pipefail

KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"

[ -f "$KEEPASS_DB" ] || { echo "FEHLER: KeePass-DB nicht gefunden" >&2; exit 1; }

echo "=== AnythingLLM Headless Fix ==="
echo ""

# --- Secrets aus KeePass (1x Passwort) ---
echo "KeePass lesen..."
TMPXML=$(mktemp /dev/shm/fix-XXXXXX.xml)
trap 'shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"' EXIT

keepassxc-cli export "$KEEPASS_DB" -f xml > "$TMPXML" 2>/dev/null \
    || { echo "FEHLER: KeePass-Export fehlgeschlagen" >&2; exit 1; }

eval "$(python3 - "$TMPXML" << 'PYEOF'
import sys, xml.etree.ElementTree as ET, base64, re
tree = ET.parse(sys.argv[1])
root = tree.getroot()
def find_group(p, parts):
    if not parts: return p
    for g in p.findall("Group"):
        n = g.find("Name")
        if n is not None and n.text == parts[0]:
            return find_group(g, parts[1:])
    return None
def get_pw(group, name):
    if group is None: return ""
    for e in group.findall("Entry"):
        t = pw = None
        for s in e.findall("String"):
            k, v = s.find("Key"), s.find("Value")
            if k is not None and v is not None:
                if k.text == "Title": t = v.text
                elif k.text == "Password": pw = v.text
        if t == name and pw: return pw
    return ""
db = root.find(".//Root/Group")
rt = find_group(db, ["Studio Ops", "00-Vault", "Code-Fabrik", "Runtime"])
cf = find_group(db, ["Studio Ops", "00-Vault", "Code-Fabrik"])
raw = get_pw(rt, "server-env")
try: decoded = base64.b64decode(raw).decode()
except: decoded = raw
m = re.search(r"SERVER_IP=(.+)", decoded)
ip = m.group(1).strip() if m else ""
ollama_key = get_pw(cf, "ollama-api-key")
ollama_host = get_pw(cf, "ollama-host")
ollama_model = get_pw(cf, "ollama-model")
print(f'SERVER_IP="{ip}"')
print(f'OLLAMA_KEY="{ollama_key}"')
print(f'OLLAMA_HOST="{ollama_host}"')
print(f'OLLAMA_MODEL="{ollama_model}"')
PYEOF
)"

shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"

[ -n "$SERVER_IP" ] || { echo "FEHLER: SERVER_IP nicht gefunden" >&2; exit 1; }
[ -n "$OLLAMA_KEY" ] || { echo "FEHLER: Ollama API Key nicht gefunden" >&2; exit 1; }
echo "  Server: $SERVER_IP"
echo "  Ollama: ${OLLAMA_HOST}"
echo "  Model:  ${OLLAMA_MODEL}"
echo "  Key:    ${OLLAMA_KEY:0:8}..."
echo ""

[ -f "$SSH_KEY" ] || { echo "FEHLER: SSH-Key nicht vorhanden: $SSH_KEY" >&2; exit 1; }

# --- Alles auf dem Server ---
SSH_ASKPASS="" ssh -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
    -i "$SSH_KEY" root@"$SERVER_IP" bash -s "$OLLAMA_HOST" "$OLLAMA_KEY" "$OLLAMA_MODEL" << 'REMOTE'
OLLAMA_HOST="$1"
OLLAMA_KEY="$2"
OLLAMA_MODEL="$3"
ENV_FILE="/opt/codefabrik/anythingllm.env"
COMPOSE_DIR="/opt/codefabrik"

echo "=========================================="
echo "  SCHRITT 1: .env-Datei schreiben"
echo "=========================================="

cat > "$ENV_FILE" << ENVEOF
STORAGE_DIR='/app/server/storage'
SERVER_PORT='3001'
LLM_PROVIDER='generic-openai'
GENERIC_OPEN_AI_BASE_PATH='${OLLAMA_HOST}'
GENERIC_OPEN_AI_API_KEY='${OLLAMA_KEY}'
GENERIC_OPEN_AI_MODEL_PREF='${OLLAMA_MODEL}'
GENERIC_OPEN_AI_MAX_TOKENS='4096'
EMBEDDING_ENGINE='native'
VECTOR_DB='lancedb'
DISABLE_TELEMETRY='true'
ENVEOF
chmod 666 "$ENV_FILE"
echo "  OK: $ENV_FILE geschrieben"
echo ""

echo "=========================================="
echo "  SCHRITT 2: docker-compose.yml pruefen"
echo "=========================================="

# Pruefen ob .env als File-Mount vorhanden ist
if grep -q 'anythingllm.env:/app/server/.env' "$COMPOSE_DIR/docker-compose.yml"; then
    echo "  OK: .env File-Mount vorhanden"
else
    echo "  FIX: .env File-Mount hinzufuegen"
    # env_file entfernen, File-Mount + cap_add hinzufuegen
    cd "$COMPOSE_DIR"
    python3 << 'PYFIX'
import re

with open("docker-compose.yml", "r") as f:
    content = f.read()

# env_file Block entfernen
content = re.sub(r'\n\s+env_file:\s*\n\s+-\s+anythingllm\.env\n', '\n', content)

# File-Mount hinzufuegen (nach anythingllm_storage Volume-Zeile)
content = content.replace(
    "      - anythingllm_storage:/app/server/storage\n",
    "      - anythingllm_storage:/app/server/storage\n      - ./anythingllm.env:/app/server/.env\n"
)

# cap_add hinzufuegen (nach restart: unless-stopped)
if "cap_add" not in content.split("factory-anythingllm")[1].split("factory-")[0]:
    content = content.replace(
        "    container_name: factory-anythingllm\n    restart: unless-stopped\n",
        "    container_name: factory-anythingllm\n    restart: unless-stopped\n    cap_add:\n      - SYS_ADMIN\n"
    )

# UID/GID environment entfernen (nicht noetig)
content = re.sub(r'\s+- UID=\d+\n', '\n', content)
content = re.sub(r'\s+- GID=\d+\n', '', content)

with open("docker-compose.yml", "w") as f:
    f.write(content)
PYFIX
    echo "  OK: docker-compose.yml aktualisiert"
fi
echo ""

echo "=========================================="
echo "  SCHRITT 3: Container neu erstellen"
echo "=========================================="
cd "$COMPOSE_DIR"
docker compose up -d --force-recreate anythingllm 2>&1 | tail -5
echo ""

echo "=========================================="
echo "  SCHRITT 4: Warte auf API"
echo "=========================================="
for i in $(seq 1 40); do
    if curl -sf http://localhost:3001/api/ping > /dev/null 2>&1; then
        echo "  API erreichbar nach $((i * 3)) Sekunden"
        break
    fi
    if [ "$i" -eq 40 ]; then
        echo "  TIMEOUT: API nicht erreichbar nach 120 Sekunden"
        echo "  Container-Logs:"
        docker logs factory-anythingllm 2>&1 | tail -10
        exit 1
    fi
    sleep 3
done
echo ""

echo "=========================================="
echo "  SCHRITT 5: Settings per API setzen"
echo "=========================================="
API_RESULT=$(curl -sf -X POST "http://localhost:3001/api/system/update-env" \
    -H "Content-Type: application/json" \
    -d "{
        \"LLMProvider\": \"generic-openai\",
        \"GenericOpenAiBasePath\": \"${OLLAMA_HOST}\",
        \"GenericOpenAiKey\": \"${OLLAMA_KEY}\",
        \"GenericOpenAiModelPref\": \"${OLLAMA_MODEL}\",
        \"GenericOpenAiMaxTokens\": 4096,
        \"EmbeddingEngine\": \"native\",
        \"VectorDB\": \"lancedb\"
    }" 2>&1 || echo "FEHLER")
echo "  API-Antwort: $(echo "$API_RESULT" | head -c 200)"
echo ""

echo "=========================================="
echo "  SCHRITT 6: Onboarding ueberspringen"
echo "=========================================="
# sqlite3 sicherstellen
command -v sqlite3 >/dev/null 2>&1 || apt-get install -y -qq sqlite3 >/dev/null 2>&1

ALM_DB="/var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db"
if [ -f "$ALM_DB" ]; then
    sqlite3 "$ALM_DB" "INSERT OR REPLACE INTO system_settings (label, value) VALUES ('hasSetup', 'true');"
    echo "  OK: Onboarding als erledigt markiert"
else
    echo "  WARNUNG: DB nicht gefunden, Onboarding manuell durchfuehren"
fi
echo ""

echo "=========================================="
echo "  VERIFIKATION"
echo "=========================================="
echo ""

echo "--- Container ---"
docker inspect -f '{{.State.Status}} ({{.State.Health.Status}})' factory-anythingllm 2>/dev/null

echo ""
echo "--- .env im Container ---"
docker exec factory-anythingllm cat /app/server/.env 2>/dev/null | grep -E '(EMBEDDING|LLM_PROVIDER|GENERIC_OPEN_AI)' | sed 's/API_KEY=.*/API_KEY=***/' || echo "  NICHT VORHANDEN"

echo ""
echo "--- process.env ---"
docker exec factory-anythingllm node -e "
    var keys = ['EMBEDDING_ENGINE','LLM_PROVIDER','GENERIC_OPEN_AI_BASE_PATH','GENERIC_OPEN_AI_API_KEY','GENERIC_OPEN_AI_MODEL_PREF'];
    keys.forEach(function(k) {
        var v = process.env[k] || '(leer)';
        if (k.indexOf('KEY') >= 0 && v.length > 8) v = v.substring(0,8) + '...';
        console.log('  ' + k + ': ' + v);
    });
" 2>/dev/null || echo "  Node-Exec fehlgeschlagen"

echo ""
echo "--- SQLite ---"
if [ -f "$ALM_DB" ]; then
    sqlite3 "$ALM_DB" "SELECT label || ' = ' || CASE WHEN value LIKE '%key%' OR label LIKE '%Key%' THEN substr(value,1,8)||'...' ELSE value END FROM system_settings WHERE label IN ('LLMProvider','EmbeddingEngine','GenericOpenAiBasePath','GenericOpenAiModelPref','hasSetup','VectorDB');" 2>/dev/null
fi

echo ""
echo "=========================================="
echo "  FERTIG"
echo "=========================================="
REMOTE

echo ""
echo "Fertig. Teste im Browser: http://localhost:3001"
