#!/bin/bash
# common.sh — Shared functions for install.sh modules
# Sourced, not executed directly.

# --- Konfiguration ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
KEEPASS_DB="${KEEPASS_DB:-}"
TARBALL="${TARBALL:-$SCRIPT_DIR/codefabrik.tar.gz}"
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
    [circleci-api-token]=vault_circleci_api_token
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
