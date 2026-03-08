#!/bin/bash
# upcloud.sh — UpCloud-Server-Management (Nuke)
# Sourced by install.sh. Requires common.sh.

# --- Nuke: Alle codefabrik-Server finden und verifiziert loeschen ---
nuke_all_servers() {
    echo ""
    echo "=== Nuke: Alle codefabrik-Server abreissen ==="

    # Token aus secrets.yml extrahieren
    local api_token
    api_token=$(grep 'vault_upcloud_api_token' "$SHM_SECRETS/secrets.yml" | cut -d'"' -f2)
    [ -n "$api_token" ] || die "UpCloud API-Token nicht in secrets.yml gefunden"

    # Alle Server auflisten
    local response
    response=$(curl -sf \
        -H "Authorization: Bearer $api_token" \
        "https://api.upcloud.com/1.3/server") || die "UpCloud API nicht erreichbar"

    # codefabrik-* Server filtern -> Temp-Datei (damit while-loop im Hauptprozess laeuft)
    local server_list="$SHM_SECRETS/nuke_servers.txt"
    echo "$response" | python3 -c "
import sys, json
data = json.load(sys.stdin)
servers = data.get('servers', {}).get('server', [])
cf = [s for s in servers if s.get('title', '').startswith('codefabrik-')]
for s in cf:
    print(f\"{s['uuid']}\t{s['title']}\t{s['state']}\")
" > "$server_list"

    if [ ! -s "$server_list" ]; then
        echo "Keine codefabrik-Server gefunden. Sauber."
        rm -f "$server_list" 2>/dev/null || true
        return 0
    fi

    echo "Gefundene Server:"
    while IFS=$'\t' read -r uuid title state; do
        echo "  $title ($uuid) — $state"
    done < "$server_list"
    echo ""
    read -rp "Alle abreissen? (ja/nein): " confirm
    [ "$confirm" = "ja" ] || { echo "Abgebrochen."; rm -f "$server_list"; return 1; }

    # Jeden Server stoppen + loeschen + verifiziert loeschen
    while IFS=$'\t' read -r uuid title state; do
        echo ""
        echo "--- $title ($uuid) ---"

        # Stoppen
        echo "  Stoppen..."
        curl -sf -X POST \
            -H "Authorization: Bearer $api_token" \
            -H "Content-Type: application/json" \
            -d '{"stop_server":{"stop_type":"soft","timeout":60}}' \
            "https://api.upcloud.com/1.3/server/$uuid/stop" >/dev/null 2>&1 || true

        # Warten auf stopped/gone
        local i srv_state
        for i in $(seq 1 20); do
            srv_state=$(curl -sf \
                -H "Authorization: Bearer $api_token" \
                "https://api.upcloud.com/1.3/server/$uuid" 2>/dev/null \
                | python3 -c "import sys,json; print(json.load(sys.stdin).get('server',{}).get('state','unknown'))" 2>/dev/null) || srv_state="gone"
            [ "$srv_state" = "gone" ] && break
            [ "$srv_state" = "stopped" ] && break
            echo "  Warte auf Stop... ($srv_state, Versuch $i/20)"
            sleep 5
        done

        if [ "$srv_state" = "gone" ]; then
            echo "  Bereits geloescht."
            continue
        fi

        # Loeschen
        echo "  Loeschen..."
        curl -sf -X DELETE \
            -H "Authorization: Bearer $api_token" \
            "https://api.upcloud.com/1.3/server/$uuid/?storages=1&backups=delete" >/dev/null 2>&1 || true

        # Verifizieren: Polling bis HTTP 404
        local http_code
        for i in $(seq 1 20); do
            http_code=$(curl -s -o /dev/null -w "%{http_code}" \
                -H "Authorization: Bearer $api_token" \
                "https://api.upcloud.com/1.3/server/$uuid") || true
            if [ "$http_code" = "404" ]; then
                echo "  Geloescht (verifiziert)."
                break
            fi
            if [ "$i" -eq 20 ]; then
                rm -f "$server_list" 2>/dev/null || true
                die "$title ($uuid) konnte nicht geloescht werden (nach 100s). Abbruch."
            fi
            echo "  Warte auf Loeschung... (HTTP $http_code, Versuch $i/20)"
            sleep 5
        done
    done < "$server_list"

    # Env-Dateien aufraeumen
    for f in .server-env .portal-env .tokens-env .factory-passwords.env .portal-passwords.env .portal-smoke-results.env; do
        rm -f "$SHM_OUTPUT/$f" 2>/dev/null || true
    done

    rm -f "$server_list" 2>/dev/null || true

    echo ""
    echo "Alle codefabrik-Server geloescht. Sauberer Zustand."
}
