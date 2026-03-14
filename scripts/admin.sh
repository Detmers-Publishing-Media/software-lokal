#!/bin/bash
# admin.sh — Admin-Dashboard im Browser oeffnen
# Liest ADMIN_TOKEN aus KeePass oder fragt manuell ab
set -euo pipefail

KEEPASS_DB="${KEEPASS_DB:-$HOME/seafile/ipe-security/Code-Fabrik-V1-0.kdbx}"
KEEPASS_ENTRY="Studio Ops/00-Vault/Code-Fabrik/Runtime/portal-passwords"
PORTAL_IP="5.22.213.252"
PORTAL_URL="http://${PORTAL_IP}:3200"

# --- Token aus KeePass lesen ---
get_token_from_keepass() {
    if ! command -v keepassxc-cli &>/dev/null; then
        return 1
    fi
    if [ ! -f "$KEEPASS_DB" ]; then
        echo "KeePass-DB nicht gefunden: $KEEPASS_DB" >&2
        return 1
    fi

    echo "KeePass-Passwort:" >&2
    read -rs KEEPASS_PASS
    echo >&2

    # Portal-Passwords Eintrag lesen (Notes-Feld enthaelt die .env-Datei)
    local content
    content=$(echo "$KEEPASS_PASS" | keepassxc-cli show -s "$KEEPASS_DB" "$KEEPASS_ENTRY" -a Notes 2>/dev/null) || {
        # Fallback: Passwort-Feld
        content=$(echo "$KEEPASS_PASS" | keepassxc-cli show -s "$KEEPASS_DB" "$KEEPASS_ENTRY" -a Password 2>/dev/null) || {
            echo "KeePass-Eintrag nicht lesbar (falsches Passwort?)" >&2
            return 1
        }
    }

    # ADMIN_TOKEN aus dem Inhalt extrahieren
    local token
    token=$(echo "$content" | grep -m1 'ADMIN_TOKEN=' | cut -d= -f2 | tr -d '[:space:]') || true

    if [ -z "$token" ]; then
        # Wenn kein ADMIN_TOKEN= gefunden, ist vielleicht der ganze Wert der Token
        token=$(echo "$content" | head -1 | tr -d '[:space:]')
    fi

    if [ -z "$token" ]; then
        echo "ADMIN_TOKEN nicht im KeePass-Eintrag gefunden" >&2
        return 1
    fi

    echo "$token"
}

# --- Hauptlogik ---
echo "=== Code-Fabrik Admin ==="
echo ""

ADMIN_TOKEN=""

# KeePass
ADMIN_TOKEN=$(get_token_from_keepass) || true

# Fallback: Manuell
if [ -z "$ADMIN_TOKEN" ]; then
    echo "Token nicht aus KeePass lesbar."
    read -rsp "ADMIN_TOKEN manuell eingeben: " ADMIN_TOKEN
    echo
fi

if [ -z "$ADMIN_TOKEN" ]; then
    echo "Kein Token — Abbruch." >&2
    exit 1
fi

# Pruefen ob Portal erreichbar
echo "Pruefe Portal..."
if ! curl -sf --connect-timeout 5 "${PORTAL_URL}/api/products" >/dev/null 2>&1; then
    echo "Portal nicht erreichbar unter ${PORTAL_URL}" >&2
    echo "Server laeuft? SSH-Tunnel noetig?" >&2
    exit 1
fi

# Token validieren
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    "${PORTAL_URL}/api/admin/stats" 2>/dev/null) || true

if [ "$HTTP_CODE" != "200" ]; then
    echo "Token ungueltig (HTTP $HTTP_CODE)" >&2
    exit 1
fi

echo "Token gueltig."
echo ""

# Token in sessionStorage setzen und Browser oeffnen
# Erstelle temporaere HTML-Datei die den Token setzt und weiterleitet
TMPHTML=$(mktemp /tmp/cf-admin-XXXXXX.html)
cat > "$TMPHTML" << HTMLEOF
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Redirecting...</title></head>
<body>
<script>
  sessionStorage.setItem('admin_token', '${ADMIN_TOKEN}');
  window.location.href = '${PORTAL_URL}/admin';
</script>
<noscript><a href="${PORTAL_URL}/admin">Weiter zum Admin-Dashboard</a></noscript>
</body></html>
HTMLEOF

echo "Oeffne Admin-Dashboard..."
xdg-open "file://$TMPHTML" 2>/dev/null || open "file://$TMPHTML" 2>/dev/null || {
    echo "Browser konnte nicht geoeffnet werden."
    echo "URL: ${PORTAL_URL}/admin"
    echo "Token: ${ADMIN_TOKEN}"
}

# Aufraumen nach 5 Sekunden (Token nicht auf Platte lassen)
(sleep 5 && rm -f "$TMPHTML") &
