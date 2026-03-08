#!/bin/bash
# setup-openclaw-story.sh — Erstellt mitglieder-lokal Repo auf Forgejo + schiebt Story in Inbox
# Ausfuehren NACH erfolgreichem Install (PROD-Server muss laufen)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Server-IP aus .server-env lesen
SERVER_ENV="$PROJECT_DIR/.server-env"
if [ ! -f "$SERVER_ENV" ]; then
  echo "FEHLER: $SERVER_ENV nicht gefunden. Install zuerst ausfuehren." >&2
  exit 1
fi
source "$SERVER_ENV"
SERVER_IP="${PROD_SERVER_IP:-}"
if [ -z "$SERVER_IP" ]; then
  echo "FEHLER: PROD_SERVER_IP nicht in .server-env" >&2
  exit 1
fi

SSH_KEY="$HOME/.ssh/codefabrik_deploy"
SSH_CMD="ssh -i $SSH_KEY -o StrictHostKeyChecking=no root@$SERVER_IP"

echo "=== OpenClaw Story Setup ==="
echo "Server: $SERVER_IP"

# 1. Forgejo API Token aus Server holen
echo ""
echo "--- Schritt 1: Forgejo API Token lesen ---"
FORGEJO_TOKEN=$($SSH_CMD "grep 'forgejo_api_token' /opt/codefabrik/.tokens-env 2>/dev/null | cut -d= -f2 | tr -d '\"'" 2>/dev/null || echo "")
if [ -z "$FORGEJO_TOKEN" ]; then
  echo "FEHLER: Forgejo API Token nicht gefunden auf Server" >&2
  echo "Versuche alternatives Format..."
  FORGEJO_TOKEN=$($SSH_CMD "cat /opt/codefabrik/.tokens-env 2>/dev/null" | grep -i token | head -1 | cut -d= -f2 | tr -d '"' || echo "")
fi
if [ -z "$FORGEJO_TOKEN" ]; then
  echo "FEHLER: Konnte Forgejo API Token nicht lesen" >&2
  exit 1
fi
echo "Token gefunden: ${FORGEJO_TOKEN:0:8}..."

FORGEJO_URL="http://$SERVER_IP:3000"

# 2. mitglieder-lokal Repo erstellen
echo ""
echo "--- Schritt 2: mitglieder-lokal Repo auf Forgejo erstellen ---"
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Authorization: token $FORGEJO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"mitglieder-lokal","private":true,"auto_init":true}' \
  "$FORGEJO_URL/api/v1/orgs/factory/repos" 2>/dev/null || echo "000")

case "$HTTP_CODE" in
  201) echo "Repo erstellt" ;;
  409) echo "Repo existiert bereits" ;;
  *)   echo "WARNUNG: Unerwarteter HTTP-Code: $HTTP_CODE" ;;
esac

# 3. Deploy Key registrieren (aus dem OpenClaw Container holen)
echo ""
echo "--- Schritt 3: Deploy Key registrieren ---"
DEPLOY_KEY=$($SSH_CMD "docker exec factory-openclaw cat /root/.ssh/openclaw_deploy_key.pub 2>/dev/null" 2>/dev/null || echo "")
if [ -n "$DEPLOY_KEY" ]; then
  curl -sf -o /dev/null \
    -X POST \
    -H "Authorization: token $FORGEJO_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"openclaw-deploy\",\"key\":\"$DEPLOY_KEY\",\"read_only\":false}" \
    "$FORGEJO_URL/api/v1/repos/factory/mitglieder-lokal/keys" 2>/dev/null || true
  echo "Deploy Key registriert"
else
  echo "WARNUNG: Deploy Key nicht gefunden — OpenClaw kann eventuell nicht pushen"
fi

# 4. Produktcode auf Forgejo pushen
echo ""
echo "--- Schritt 4: mitglieder-lokal Code auf Forgejo pushen ---"
TMPDIR=$(mktemp -d)
cd "$TMPDIR"

# Nur die relevanten Dateien kopieren (kein node_modules, kein .git)
mkdir -p mitglieder-lokal
rsync -a --exclude='node_modules' --exclude='.git' --exclude='release' --exclude='dist' \
  "$PROJECT_DIR/products/mitglieder-lokal/" mitglieder-lokal/

# Auch die shared packages kopieren (OpenClaw braucht sie fuer Tests)
mkdir -p packages
for pkg in shared app-shared electron-platform; do
  rsync -a --exclude='node_modules' --exclude='.git' \
    "$PROJECT_DIR/packages/$pkg/" "packages/$pkg/" 2>/dev/null || true
done

# Root-Dateien
cp "$PROJECT_DIR/package.json" . 2>/dev/null || true
cp "$PROJECT_DIR/pnpm-workspace.yaml" . 2>/dev/null || true
cp "$PROJECT_DIR/pnpm-lock.yaml" . 2>/dev/null || true
cp "$PROJECT_DIR/CLAUDE.md" . 2>/dev/null || true

cd mitglieder-lokal
git init
git config user.name "Factory Setup"
git config user.email "setup@factory.local"

# Alles adden und committen
cd "$TMPDIR"
git init
git config user.name "Factory Setup"
git config user.email "setup@factory.local"
git add -A
git commit -m "Initial: mitglieder-lokal v0.5.0 + shared packages"

# Force push zu Forgejo (ueberschreibt auto_init)
git remote add origin "http://factory-admin:${FORGEJO_TOKEN}@${SERVER_IP}:3000/factory/mitglieder-lokal.git"
git push --force origin main 2>/dev/null

echo "Code gepusht"
cd /
rm -rf "$TMPDIR"

# 5. Backlog-Verzeichnis fuer mitglieder-lokal im Process-Repo erstellen
echo ""
echo "--- Schritt 5: Backlog-Verzeichnis erstellen ---"
TMPDIR2=$(mktemp -d)
cd "$TMPDIR2"
git clone "http://factory-admin:${FORGEJO_TOKEN}@${SERVER_IP}:3000/factory/process-repo.git" 2>/dev/null
cd process-repo
git config user.name "Factory Setup"
git config user.email "setup@factory.local"

mkdir -p "work/03-backlog/by-product/mitglieder-lokal"
touch "work/03-backlog/by-product/mitglieder-lokal/.gitkeep"

# 6. Story in Inbox kopieren
echo ""
echo "--- Schritt 6: DSGVO-Story in Inbox einstellen ---"
cp "$PROJECT_DIR/.stories/FEAT-001-dsgvo-auskunft.yml" "work/01-inbox/FEAT-001.yml"

git add -A
git commit -m "Setup: mitglieder-lokal Backlog + FEAT-001 Story" 2>/dev/null || echo "Keine Aenderungen"
git push origin main 2>/dev/null

echo "Story FEAT-001 in Inbox eingestellt"
cd /
rm -rf "$TMPDIR2"

echo ""
echo "=== Fertig ==="
echo "Der Poller wird FEAT-001 beim naechsten Durchlauf (30s) aufnehmen."
echo ""
echo "Monitoring:"
echo "  ssh -i $SSH_KEY root@$SERVER_IP 'journalctl -u openclaw-poller -f'"
echo "  ssh -i $SSH_KEY root@$SERVER_IP 'cat /var/log/openclaw-poller.log | tail -50'"
