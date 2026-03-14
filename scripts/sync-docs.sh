#!/bin/bash
# sync-docs.sh — Alle .md-Dokumente aus Forgejo nach AnythingLLM synchronisieren
# Liest Server-IP und Forgejo-Token aus KeePass (1x Passwort).
# Klont alle Repos, laedt alle .md-Dateien in den Workspace hoch.
set -euo pipefail

KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"

# --- KeePass pruefen ---
[ -f "$KEEPASS_DB" ] || { echo "FEHLER: KeePass-DB nicht gefunden: $KEEPASS_DB" >&2; exit 1; }

echo "=== Dokumente nach AnythingLLM synchronisieren ==="
echo ""

# --- Alle Secrets mit einem einzigen XML-Export lesen ---
echo "KeePass lesen (1x Passwort)..."
TMPXML=$(mktemp /dev/shm/sync-XXXXXX.xml)
trap 'shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"' EXIT

keepassxc-cli export "$KEEPASS_DB" -f xml > "$TMPXML" 2>/dev/null \
    || { echo "FEHLER: KeePass-Export fehlgeschlagen" >&2; exit 1; }

eval "$(python3 - "$TMPXML" << 'PYEOF'
import sys, xml.etree.ElementTree as ET, base64, re

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

def decode_runtime(group, name):
    raw = get_password(group, name)
    if not raw:
        return ""
    try:
        return base64.b64decode(raw).decode("utf-8")
    except Exception:
        return raw

db_root = root.find(".//Root/Group")
rt = find_group(db_root, ["Studio Ops", "00-Vault", "Code-Fabrik", "Runtime"])
cf = find_group(db_root, ["Studio Ops", "00-Vault", "Code-Fabrik"])

server_env = decode_runtime(rt, "server-env")
tokens_env = decode_runtime(rt, "tokens-env")

server_ip = ""
m = re.search(r"SERVER_IP=(.+)", server_env)
if m: server_ip = m.group(1).strip()

forgejo_token = ""
m = re.search(r"FORGEJO_API_TOKEN=(.+)", tokens_env)
if m: forgejo_token = m.group(1).strip()

ssh_key = get_password(cf, "ssh-deploy-key")

print(f'SERVER_IP="{server_ip}"')
print(f'FORGEJO_TOKEN="{forgejo_token}"')
if ssh_key:
    print(f'SSH_KEY_CONTENT="{ssh_key}"')
PYEOF
)"

shred -u "$TMPXML" 2>/dev/null; rm -f "$TMPXML"

[ -n "$SERVER_IP" ] || { echo "FEHLER: SERVER_IP nicht gefunden" >&2; exit 1; }
[ -n "$FORGEJO_TOKEN" ] || { echo "FEHLER: FORGEJO_API_TOKEN nicht gefunden" >&2; exit 1; }

echo "  Server: $SERVER_IP"
echo "  Token:  ${FORGEJO_TOKEN:0:8}..."
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

# --- Auf Server: alle Repos klonen + alle .md hochladen ---
echo "Verbinde mit Server..."
echo ""

SSH_ASKPASS="" ssh -o StrictHostKeyChecking=accept-new \
    -o UserKnownHostsFile=/dev/null \
    -o LogLevel=ERROR \
    -i "$SSH_KEY" root@"$SERVER_IP" bash -s "$FORGEJO_TOKEN" << 'REMOTE'
FORGEJO_TOKEN="$1"
REPOS_DIR="/mnt/data/repos"
WORKSPACE_SLUG="codefabrik-docs"
ANYTHINGLLM_URL="http://localhost:3001"
ANYTHINGLLM_DB="/var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db"
EXCLUDE_PATTERN="(vault\.yml|\.env$|\.env\.example$|\.kdbx$|node_modules)"

# Pakete sicherstellen
for pkg in sqlite3 jq curl; do
    if ! command -v "$pkg" >/dev/null 2>&1; then
        echo "$pkg installieren..."
        apt-get update -qq && apt-get install -y -qq "$pkg" >/dev/null 2>&1
    fi
done

# AnythingLLM API-Key aus SQLite
ANYTHINGLLM_API_KEY=""
if [ -f "$ANYTHINGLLM_DB" ]; then
    ANYTHINGLLM_API_KEY=$(sqlite3 "$ANYTHINGLLM_DB" 'SELECT secret FROM api_keys LIMIT 1;' 2>/dev/null || echo "")
fi
if [ -z "$ANYTHINGLLM_API_KEY" ]; then
    echo "FEHLER: Kein AnythingLLM API-Key."
    echo "Bitte in AnythingLLM UI: Settings > Tools > Developer API > Key erstellen"
    exit 1
fi
echo "AnythingLLM API-Key: ${ANYTHINGLLM_API_KEY:0:8}..."
echo ""

# Alle Repos von Forgejo auflisten
echo "=== Forgejo Repos abrufen ==="
REPOS_JSON=$(curl -sf "http://localhost:3000/api/v1/repos/search?limit=50" \
    -H "Authorization: token $FORGEJO_TOKEN" 2>/dev/null || echo "")

if [ -z "$REPOS_JSON" ]; then
    echo "FEHLER: Forgejo API nicht erreichbar"
    exit 1
fi

REPO_NAMES=$(echo "$REPOS_JSON" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
for r in data.get('data', []):
    print(r['name'])
" 2>/dev/null)

echo "Repos: $(echo "$REPO_NAMES" | wc -l)"
echo ""

# Repos klonen/aktualisieren
echo "=== Repos synchronisieren ==="
mkdir -p "$REPOS_DIR"

for REPO in $REPO_NAMES; do
    REPO_PATH="$REPOS_DIR/$REPO"
    if [ ! -d "$REPO_PATH/.git" ]; then
        echo "  Klone $REPO..."
        git clone -q "http://factory-admin:${FORGEJO_TOKEN}@localhost:3000/factory/$REPO.git" "$REPO_PATH" 2>/dev/null || {
            echo "    WARNUNG: Klon fehlgeschlagen"
            continue
        }
    else
        echo "  Update $REPO..."
        git -C "$REPO_PATH" pull -q 2>/dev/null || echo "    WARNUNG: Pull fehlgeschlagen"
    fi
done
echo ""

# Alle .md-Dateien sammeln
echo "=== .md-Dateien hochladen ==="
SYNCED=0
ERRORS=0
SKIPPED=0

for REPO in $REPO_NAMES; do
    REPO_PATH="$REPOS_DIR/$REPO"
    [ -d "$REPO_PATH" ] || continue

    # .md-Dateien finden (exkl. Secrets)
    MD_FILES=$(find "$REPO_PATH" -name '*.md' -not -path '*/node_modules/*' \
        | grep -vE "$EXCLUDE_PATTERN" 2>/dev/null || true)

    [ -z "$MD_FILES" ] && continue

    FILE_COUNT=$(echo "$MD_FILES" | wc -l)
    echo "  $REPO: $FILE_COUNT .md-Dateien"

    while IFS= read -r filepath; do
        [ -z "$filepath" ] && continue

        # Relativer Pfad mit Repo-Prefix
        REL_PATH="$REPO/$(echo "$filepath" | sed "s|$REPO_PATH/||")"
        # Sanitize: / -> --
        SANITIZED=$(echo "$REL_PATH" | sed 's|/|--|g')

        # Dateigroesse pruefen (max 1MB)
        SIZE=$(stat -c%s "$filepath" 2>/dev/null || echo 0)
        if [ "$SIZE" -gt 1048576 ]; then
            SKIPPED=$((SKIPPED + 1))
            continue
        fi

        # Upload (mit Retry)
        RESPONSE=""
        for attempt in 1 2 3; do
            RESPONSE=$(curl -sf -X POST \
                -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
                "$ANYTHINGLLM_URL/api/v1/document/upload" \
                -F "file=@${filepath};filename=${SANITIZED}" 2>/dev/null || echo "")
            [ -n "$RESPONSE" ] && break
            sleep 3
        done

        if [ -z "$RESPONSE" ]; then
            ERRORS=$((ERRORS + 1))
            echo "    FEHLER: $REL_PATH"
            continue
        fi

        # Document-Location aus Antwort
        DOC_LOCATION=$(echo "$RESPONSE" | jq -r '.documents[0].location // empty' 2>/dev/null)
        if [ -z "$DOC_LOCATION" ]; then
            ERRORS=$((ERRORS + 1))
            echo "    FEHLER (keine location): $REL_PATH"
            continue
        fi

        # In Workspace einbetten
        EMBED_RESULT=$(curl -sf -X POST \
            -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
            -H "Content-Type: application/json" \
            "$ANYTHINGLLM_URL/api/v1/workspace/$WORKSPACE_SLUG/update-embeddings" \
            -d "{\"adds\": [\"$DOC_LOCATION\"]}" 2>/dev/null || echo "")

        if [ -z "$EMBED_RESULT" ]; then
            ERRORS=$((ERRORS + 1))
            echo "    FEHLER (embedding): $REL_PATH"
            continue
        fi

        SYNCED=$((SYNCED + 1))
        # Pause zwischen Uploads (AnythingLLM Embedding braucht Zeit)
        sleep 2
    done <<< "$MD_FILES"
done

echo ""
echo "=== Ergebnis ==="
echo "  Hochgeladen:  $SYNCED"
echo "  Fehler:       $ERRORS"
echo "  Uebersprungen: $SKIPPED"
REMOTE

echo ""
echo "Fertig."
