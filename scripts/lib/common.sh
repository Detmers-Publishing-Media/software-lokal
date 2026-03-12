#!/bin/bash
# common.sh — Shared functions for install.sh modules
# Sourced, not executed directly.

# --- Konfiguration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
KEEPASS_DB="${KEEPASS_DB:-}"
TARBALL="${TARBALL:-$(cd "$SCRIPT_DIR/.." && pwd)/dist/codefabrik.tar.gz}"
SHM_BASE="/dev/shm/codefabrik-secrets"
SHM_SECRETS="$SHM_BASE/secrets"
SHM_WORKSPACE="$SHM_BASE/workspace"
SHM_OUTPUT="$SHM_BASE/output"
DOCKER_IMAGE="codefabrik-ansible:local"

# --- Logging ---
# Logs persistieren in ~/code-fabrik/logs/ (werden NICHT beim Cleanup geloescht)
LOG_DIR="${LOG_DIR:-$HOME/code-fabrik/logs}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/install-$(date '+%Y%m%d-%H%M%S').log"

# Alles parallel nach Logdatei schreiben (stdout + stderr)
exec > >(tee -a "$LOG_FILE") 2>&1

log_header() {
    echo "================================================================"
    echo "Code-Fabrik Installer — $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Logdatei: $LOG_FILE"
    echo "================================================================"

    # Alte Logs aufraeumen (maximal 20 behalten)
    local count
    count=$(find "$LOG_DIR" -name 'install-*.log' -o -name 'ansible-*.log' | wc -l)
    if [ "$count" -gt 20 ]; then
        find "$LOG_DIR" -name 'install-*.log' -o -name 'ansible-*.log' \
            | sort | head -n "$((count - 20))" | xargs rm -f
    fi
}

KEEPASS_GROUP="Studio Ops/00-Vault/Code-Fabrik"
RUNTIME_GROUP="$KEEPASS_GROUP/Runtime"

# KeePass-Eintrag -> Ansible-Variable
declare -A SECRET_MAP=(
    [upcloud-api-token]=vault_upcloud_api_token
    [cloudflare-api-token]=vault_cloudflare_api_token
    [anthropic-api-key]=vault_anthropic_api_key
    [ollama-api-key]=vault_ollama_api_key
    [ollama-host]=vault_ollama_host
    [ollama-model]=vault_ollama_model
    [digistore-ipn-passphrase]=vault_digistore_ipn_passphrase
    [cloudflare-origin-ca-cert]=vault_origin_ca_cert
    [cloudflare-origin-ca-key]=vault_origin_ca_key
    [github-push-token]=vault_github_push_token
)

# Runtime-Eintraege -> Dateinamen
declare -A RUNTIME_MAP=(
    [factory-passwords]=.factory-passwords.env
    [server-env]=.server-env
    [tokens-env]=.tokens-env
    [portal-passwords]=.portal-passwords.env
    [portal-env]=.portal-env
)

# --- Hilfsfunktionen ---
die() { echo "FEHLER: $*" >&2; exit 1; }
warn() { echo "WARNUNG: $*" >&2; }

check_cmd() {
    for cmd in "$@"; do
        command -v "$cmd" &>/dev/null || die "$cmd nicht installiert"
    done
}

# GitHub-Repo fuer Portal-Secrets (SCP-Upload)
GITHUB_REPO="${GITHUB_REPO:-Detmers-Publishing-Media/software-lokal}"

# --- Env-Dateien lokal persistieren ---
# Kopiert Env-Dateien aus /dev/shm nach ~/code-fabrik/,
# damit sie nach dem Cleanup-Trap noch verfuegbar sind.
persist_env_files() {
    local target_dir
    target_dir="$(cd "$SCRIPT_DIR/.." && pwd)"
    local found=0
    for f in .server-env .portal-env .tokens-env .factory-passwords.env .portal-passwords.env; do
        if [ -f "$SHM_OUTPUT/$f" ]; then
            cp "$SHM_OUTPUT/$f" "$target_dir/$f"
            chmod 600 "$target_dir/$f"
            found=1
        fi
    done
    [ "$found" -eq 1 ] && echo "  Env-Dateien lokal persistiert."
}

# --- GitHub Secrets aktualisieren ---
# Liest Portal-IP aus .portal-env und aktualisiert PORTAL_HOST
# in GitHub Actions Secrets, damit CI-Deploys funktionieren.
sync_github_secrets() {
    local portal_ip=""
    if [ -f "$SHM_OUTPUT/.portal-env" ]; then
        portal_ip=$(grep -m1 'PORTAL_IP=' "$SHM_OUTPUT/.portal-env" | cut -d= -f2 | tr -d '[:space:]')
    fi
    [ -n "$portal_ip" ] || return 0

    if ! command -v gh &>/dev/null; then
        echo "  HINWEIS: gh nicht installiert. GitHub Secret manuell setzen: PORTAL_HOST=$portal_ip"
        return 0
    fi

    echo "  GitHub Secret PORTAL_HOST=$portal_ip -> $GITHUB_REPO"
    echo "$portal_ip" | gh secret set PORTAL_HOST --repo "$GITHUB_REPO" 2>/dev/null || \
        echo "  WARNUNG: Konnte PORTAL_HOST nicht setzen. Manuell: gh secret set PORTAL_HOST -b '$portal_ip' --repo $GITHUB_REPO"
}

# --- Cleanup-Trap ---
cleanup() {
    local exit_code=$?
    echo ""
    echo "Secrets aufraeumen..."
    if [ -d "$SHM_BASE" ]; then
        find "$SHM_BASE" -type f -exec shred -u {} \; 2>/dev/null
        rm -rf "$SHM_BASE"
    fi
    if [ "$exit_code" -ne 0 ]; then
        echo "FEHLGESCHLAGEN (Exit-Code: $exit_code)"
    else
        echo "ERFOLGREICH"
    fi
    echo "Logdatei: $LOG_FILE"
    echo "Fertig."
}
