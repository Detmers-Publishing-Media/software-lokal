#!/bin/bash
# build-installer.sh — Paketiert ansible/ + portal/ fuer USB-Stick
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

echo "=== Code-Fabrik Installer bauen ==="

mkdir -p "$DIST_DIR"

# Tarball erstellen (ohne Secrets, ohne Git, ohne Logs)
echo "Tarball erstellen..."
tar czf "$DIST_DIR/codefabrik.tar.gz" \
    -C "$PROJECT_DIR" \
    --exclude='vault.yml' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='*.pid' \
    --exclude='.server-env' \
    --exclude='.tokens-env' \
    --exclude='.factory-passwords.env' \
    --exclude='.portal-env' \
    --exclude='.portal-passwords.env' \
    --exclude='.portal-smoke-results.env' \
    --exclude='dist' \
    --exclude='scripts' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    ansible/ portal/ .gitignore teardown-remote.sh

# install.sh kopieren
cp "$SCRIPT_DIR/install.sh" "$DIST_DIR/install.sh"
chmod +x "$DIST_DIR/install.sh"

echo ""
echo "Fertig:"
echo "  $DIST_DIR/install.sh"
echo "  $DIST_DIR/codefabrik.tar.gz ($(du -h "$DIST_DIR/codefabrik.tar.gz" | cut -f1))"
echo ""
echo "USB-Stick bestücken:"
echo "  cp $DIST_DIR/install.sh $DIST_DIR/codefabrik.tar.gz /mnt/usb/"
echo "  cp <vault.kdbx> /mnt/usb/vault.kdbx"
