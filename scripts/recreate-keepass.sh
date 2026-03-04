#!/bin/bash
# recreate-keepass.sh — Korrupte KeePass-DB ersetzen und mit seed-keepass.sh befuellen
set -euo pipefail

DB_PATH="/home/ldetmers/seafile/ipe-security/Code-Fabrik-V1-0.kdbx"
BACKUP_PATH="${DB_PATH}.corrupt.$(date +%Y%m%d-%H%M%S)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VAULT_FILE="$HOME/studio-ops/infra/ansible/vault.yml"

echo "=== KeePass-DB neu erstellen ==="
echo ""

# 1. Korrupte DB sichern
if [ -f "$DB_PATH" ]; then
    echo "Korrupte DB sichern → $BACKUP_PATH"
    mv "$DB_PATH" "$BACKUP_PATH"
fi

# 2. Neue DB erstellen
echo ""
echo "Neues KeePass-Passwort festlegen:"
read -rs NEW_PASS
echo
echo "Passwort bestaetigen:"
read -rs NEW_PASS2
echo
if [ "$NEW_PASS" != "$NEW_PASS2" ]; then
    echo "FEHLER: Passwoerter stimmen nicht ueberein"
    exit 1
fi

echo "Erstelle neue KeePass-DB..."
printf '%s\n%s\n' "$NEW_PASS" "$NEW_PASS" | keepassxc-cli db-create "$DB_PATH" -p \
    || { echo "FEHLER: DB-Erstellung fehlgeschlagen"; exit 1; }
echo "OK: $DB_PATH"

# 3. Gruppenstruktur anlegen
echo "Gruppenstruktur anlegen..."
for grp in \
    "Studio Ops" \
    "Studio Ops/00-Vault" \
    "Studio Ops/00-Vault/Code-Fabrik" \
    "Studio Ops/00-Vault/Code-Fabrik/Runtime"; do
    echo "$NEW_PASS" | keepassxc-cli mkdir "$DB_PATH" "$grp" 2>/dev/null || true
done
echo "OK: Gruppen erstellt"

# 4. seed-keepass.sh ausfuehren
echo ""
echo "=== Seed starten ==="
echo "(Wenn nach dem KeePass-Passwort gefragt wird: dasselbe Passwort eingeben)"
echo ""

# Export KEEPASS_PASS damit seed-keepass.sh es nicht nochmal fragt? Nein,
# seed-keepass.sh fragt selbst — der User muss es nochmal eingeben.
bash "$SCRIPT_DIR/seed-keepass.sh" "$DB_PATH" "$VAULT_FILE"

echo ""
echo "=== Fertig ==="
echo "Neue DB: $DB_PATH"
echo "Backup:  $BACKUP_PATH"
echo ""
echo "Testen: keepassxc-cli ls \"$DB_PATH\" \"Studio Ops/00-Vault/Code-Fabrik\""
