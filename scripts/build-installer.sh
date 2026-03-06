#!/bin/bash
# build-installer.sh — Paketiert das komplette Repo fuer "Fabrik im Koffer"
# Ergebnis: dist/install.sh + dist/codefabrik.tar.gz
# Zusammen mit vault.kdbx reicht das fuer einen kompletten Neuaufbau.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

echo "=== Code-Fabrik Installer bauen ==="

mkdir -p "$DIST_DIR"

# Tarball erstellen: komplettes Repo ohne Secrets, temporaere Dateien und Build-Artefakte
echo "Tarball erstellen..."
tar czf "$DIST_DIR/codefabrik.tar.gz" \
    -C "$PROJECT_DIR" \
    --exclude='dist' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='target' \
    --exclude='*.log' \
    --exclude='*.pid' \
    --exclude='*.zip' \
    --exclude='.server-env' \
    --exclude='.tokens-env' \
    --exclude='.factory-passwords.env' \
    --exclude='.portal-env' \
    --exclude='.portal-passwords.env' \
    --exclude='.portal-smoke-results.env' \
    --exclude='vault.yml' \
    --exclude='vault.kdbx' \
    --exclude='*.sqlite-shm' \
    --exclude='*.sqlite-wal' \
    .

# install.sh kopieren
cp "$SCRIPT_DIR/install.sh" "$DIST_DIR/install.sh"
chmod +x "$DIST_DIR/install.sh"

echo ""
echo "Fertig:"
echo "  $DIST_DIR/install.sh"
echo "  $DIST_DIR/codefabrik.tar.gz ($(du -h "$DIST_DIR/codefabrik.tar.gz" | cut -f1))"
echo ""
echo "Fabrik im Koffer:"
echo "  install.sh + codefabrik.tar.gz + vault.kdbx = kompletter Neuaufbau"
