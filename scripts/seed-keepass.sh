#!/bin/bash
# seed-keepass.sh — Einmalige Migration: vault.yml + SSH-Keys + Env-Dateien → KeePass
# Voraussetzung: KeePass-Gruppen muessen bereits existieren (manuell angelegt)
set -euo pipefail

KEEPASS_DB="${1:?Usage: $0 <vault.kdbx> [vault.yml]}"
VAULT_FILE="${2:-$(dirname "$0")/../ansible/inventory/group_vars/all/vault.yml}"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"
OUTPUT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

GROUP="Studio Ops/00-Vault/Code-Fabrik"
RUNTIME_GROUP="$GROUP/Runtime"

# --- Preflight ---
for cmd in keepassxc-cli ansible-vault; do
    if ! command -v "$cmd" &>/dev/null; then
        echo "Fehlt: $cmd"
        exit 1
    fi
done

if [ ! -f "$KEEPASS_DB" ]; then
    echo "KeePass-DB nicht gefunden: $KEEPASS_DB"
    exit 1
fi

if [ ! -f "$VAULT_FILE" ]; then
    echo "vault.yml nicht gefunden: $VAULT_FILE"
    exit 1
fi

# --- KeePass-Passwort abfragen ---
echo "KeePass-Passwort eingeben (YubiKey bereithalten):"
read -rs KEEPASS_PASS
echo

# --- vault.yml entschluesseln auf tmpfs ---
TMPDIR=$(mktemp -d /dev/shm/seed-keepass.XXXXXX)
trap 'shred -u "$TMPDIR"/* 2>/dev/null; rm -rf "$TMPDIR"' EXIT INT TERM

echo "Ansible Vault entschluesseln..."
if [ -f "$HOME/.vault_pass" ]; then
    ansible-vault decrypt "$VAULT_FILE" --output "$TMPDIR/vault-plain.yml" \
        --vault-password-file "$HOME/.vault_pass"
else
    echo "Ansible Vault Passwort:"
    read -rs VAULT_PASS
    echo
    echo "$VAULT_PASS" > "$TMPDIR/.vault_pass"
    ansible-vault decrypt "$VAULT_FILE" --output "$TMPDIR/vault-plain.yml" \
        --vault-password-file "$TMPDIR/.vault_pass"
    shred -u "$TMPDIR/.vault_pass"
fi

# --- vault_* Variablen parsen ---
echo "Vault-Variablen nach KeePass migrieren..."

# Mapping: vault-variable → KeePass-Eintragsname
declare -A VAR_MAP=(
    [vault_upcloud_api_token]="upcloud-api-token"
    [vault_cloudflare_api_token]="cloudflare-api-token"
    [vault_anthropic_api_key]="anthropic-api-key"
    [vault_ollama_api_key]="ollama-api-key"
    [vault_ollama_host]="ollama-host"
    [vault_ollama_model]="ollama-model"
)

for var in "${!VAR_MAP[@]}"; do
    entry="${VAR_MAP[$var]}"
    # YAML-Wert extrahieren (einfach: key: value oder key: "value")
    value=$(grep "^${var}:" "$TMPDIR/vault-plain.yml" | sed 's/^[^:]*: *//' | sed 's/^"//' | sed 's/"$//')
    if [ -z "$value" ]; then
        echo "  SKIP: $var (nicht in vault.yml gefunden)"
        continue
    fi
    echo "  $var → $GROUP/$entry"
    echo "$KEEPASS_PASS" | keepassxc-cli add "$KEEPASS_DB" "$GROUP/$entry" \
        --password-prompt --no-password 2>/dev/null <<< "$value" || \
    echo "$KEEPASS_PASS" | keepassxc-cli edit "$KEEPASS_DB" "$GROUP/$entry" \
        --password-prompt --no-password 2>/dev/null <<< "$value" || \
    echo "  WARNUNG: Konnte $entry nicht schreiben (existiert evtl. schon)"
done

shred -u "$TMPDIR/vault-plain.yml"

# --- SSH-Keys migrieren ---
echo "SSH-Keys migrieren..."
if [ -f "$SSH_KEY" ]; then
    echo "  $SSH_KEY → $GROUP/ssh-deploy-key"
    echo "$KEEPASS_PASS" | keepassxc-cli add "$KEEPASS_DB" "$GROUP/ssh-deploy-key" \
        --password-prompt --no-password 2>/dev/null < "$SSH_KEY" || \
    echo "  WARNUNG: ssh-deploy-key existiert evtl. schon"
else
    echo "  SKIP: $SSH_KEY nicht gefunden"
fi

if [ -f "$SSH_KEY.pub" ]; then
    echo "  $SSH_KEY.pub → $GROUP/ssh-deploy-key-pub"
    echo "$KEEPASS_PASS" | keepassxc-cli add "$KEEPASS_DB" "$GROUP/ssh-deploy-key-pub" \
        --password-prompt --no-password 2>/dev/null < "$SSH_KEY.pub" || \
    echo "  WARNUNG: ssh-deploy-key-pub existiert evtl. schon"
else
    echo "  SKIP: $SSH_KEY.pub nicht gefunden"
fi

# --- Runtime-Dateien migrieren (falls vorhanden) ---
echo "Runtime-Dateien migrieren..."

declare -A RUNTIME_MAP=(
    [factory-passwords]="$OUTPUT_DIR/.factory-passwords.env"
    [server-env]="$OUTPUT_DIR/.server-env"
    [tokens-env]="$OUTPUT_DIR/.tokens-env"
    [portal-passwords]="$OUTPUT_DIR/.portal-passwords.env"
    [portal-env]="$OUTPUT_DIR/.portal-env"
)

for entry in "${!RUNTIME_MAP[@]}"; do
    file="${RUNTIME_MAP[$entry]}"
    if [ -f "$file" ]; then
        echo "  $file → $RUNTIME_GROUP/$entry"
        content=$(cat "$file")
        echo "$KEEPASS_PASS" | keepassxc-cli add "$KEEPASS_DB" "$RUNTIME_GROUP/$entry" \
            --password-prompt --no-password 2>/dev/null <<< "$content" || \
        echo "$KEEPASS_PASS" | keepassxc-cli edit "$KEEPASS_DB" "$RUNTIME_GROUP/$entry" \
            --password-prompt --no-password 2>/dev/null <<< "$content" || \
        echo "  WARNUNG: Konnte $entry nicht schreiben"
    else
        echo "  SKIP: $file nicht vorhanden"
    fi
done

echo ""
echo "Migration abgeschlossen."
echo "Pruefen: keepassxc-cli ls \"$KEEPASS_DB\" \"$GROUP\""
