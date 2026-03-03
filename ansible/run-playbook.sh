#!/bin/bash
# run-playbook.sh — Ansible im Docker-Container ausführen
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SSH_KEY="$HOME/.ssh/codefabrik_deploy"
VAULT_PASS="$HOME/.vault_pass"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")"

# Voraussetzungen prüfen
for f in "$SSH_KEY" "$SSH_KEY.pub" "$VAULT_PASS"; do
    if [ ! -f "$f" ]; then
        echo "❌ Datei fehlt: $f"
        exit 1
    fi
done

# Env-Vars sammeln (nur gesetzte weiterleiten)
ENV_ARGS=()
for var in UPCLOUD_API_TOKEN CLOUDFLARE_API_TOKEN OLLAMA_API_KEY; do
    if [ -n "${!var:-}" ]; then
        ENV_ARGS+=(-e "$var")
    fi
done

# Optionale Paket-Dateien mounten
PACKAGE_MOUNTS=()
for pkg_file in \
    "$HOME/start-v040.sh" \
    "$HOME/v0.4.0-install-prompt.md" \
    "$HOME/v0.4.0-monitor-prompt.md" \
    "$HOME/teardown-v030.sh"; do
    if [ -f "$pkg_file" ]; then
        PACKAGE_MOUNTS+=(-v "$pkg_file:/package-inputs/$(basename "$pkg_file"):ro")
    fi
done

# Portal-Quellcode mounten (fuer install-portal.yml)
PORTAL_DIR="$(dirname "$SCRIPT_DIR")/portal"
PORTAL_MOUNTS=()
if [ -d "$PORTAL_DIR" ]; then
    PORTAL_MOUNTS=(-v "$PORTAL_DIR:/portal:ro")
fi

docker run --rm \
    --network host \
    -v "$SCRIPT_DIR:/ansible:ro" \
    -v "$SSH_KEY:/root/.ssh/codefabrik_deploy:ro" \
    -v "$SSH_KEY.pub:/root/.ssh/codefabrik_deploy.pub:ro" \
    -v "$VAULT_PASS:/root/.vault_pass:ro" \
    -v "$OUTPUT_DIR:/output:rw" \
    "${ENV_ARGS[@]}" \
    "${PACKAGE_MOUNTS[@]}" \
    "${PORTAL_MOUNTS[@]}" \
    codefabrik-ansible:local \
    "$@"
