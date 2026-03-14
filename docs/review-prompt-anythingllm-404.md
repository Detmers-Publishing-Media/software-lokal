# Review-Prompt: AnythingLLM 404-Fehler beim Streaming im Web-UI

Stand: 2026-03-11

## Problem

AnythingLLM zeigt im Web-UI beim Chatten den Fehler:
> "An error occurred while streaming response. Code 404"

## Bereits verifiziert

| Pruefung | Ergebnis |
|----------|----------|
| PROD-Server erreichbar | Ja (85.9.207.209) |
| AnythingLLM Container | Up, healthy |
| Ollama.com API (curl vom Server) | 200 OK, Modell antwortet |
| Modell `deepseek-v3.1:671b` in Modellliste | Ja, vorhanden |
| AnythingLLM .env korrekt | Ja (GenericOpenAI, Ollama.com/v1, richtiger Key) |
| AnythingLLM DB-Settings korrekt | Ja (alle 5 Keys geprueft) |
| Workspace `codefabrik-docs` | Existiert, keine eigene LLM-Config |
| `/api/v1/workspace/codefabrik-docs/chat` (non-stream) | 200 OK, korrekte Antwort |
| `/api/v1/workspace/codefabrik-docs/stream-chat` (stream) | 200 OK, korrekte Antwort |
| `/api/ping` via SSH-Tunnel | 200 OK |
| SSH-Tunnel `localhost:3001` | Aktiv, API erreichbar |

## Konfiguration

```
Server: 85.9.207.209 (UpCloud, DEV-1xCPU-2GB)
Container: mintplexlabs/anythingllm:latest
Port: 127.0.0.1:3001 (nur loopback)
Zugang: SSH-Tunnel (ssh -L 3001:localhost:3001)

LLM_PROVIDER=generic-openai
GENERIC_OPEN_AI_BASE_PATH=https://ollama.com/v1
GENERIC_OPEN_AI_MODEL_PREF=deepseek-v3.1:671b
GENERIC_OPEN_AI_MAX_TOKENS=4096
EMBEDDING_ENGINE=native
VECTOR_DB=lancedb
```

## Offene Hypothesen

### H1: Frontend-Routing-Problem (wahrscheinlichste)
Das Web-UI (React SPA) wird nicht korrekt ausgeliefert. Der 404 kommt nicht
vom API-Backend, sondern vom Frontend-Router. Moeglich wenn:
- Der Container ein Image-Update hatte und statische Dateien fehlen
- Der Browser ein gecachtes altes Frontend hat
- SPA-Routing ueber den SSH-Tunnel nicht korrekt funktioniert

**Pruefschritte:**
```bash
# Pruefe ob Frontend-Dateien vorhanden sind
ssh root@85.9.207.209 'docker exec factory-anythingllm ls /app/frontend/dist/index.html'

# Pruefe ob die Hauptseite HTML liefert (nicht 404)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/

# Pruefe ob Assets geladen werden
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/assets/ 2>&1
```

### H2: Browser-Cache / Service Worker
AnythingLLM registriert einen Service Worker. Nach Container-Neustart kann
der gecachte Service Worker 404 liefern.

**Pruefschritte:**
- Browser DevTools → Application → Service Workers → Unregister
- Hard Refresh: Ctrl+Shift+R
- Inkognito-Fenster testen

### H3: Web-UI sendet falschen Stream-Endpoint
Das Frontend koennte einen anderen Endpoint aufrufen als die API.
Moeglich bei Version-Mismatch zwischen Frontend und Backend.

**Pruefschritte:**
```bash
# Browser DevTools → Network Tab → Chat senden → 404-Request inspizieren
# Genau die URL und den Response-Body notieren

# AnythingLLM-Version pruefen
ssh root@85.9.207.209 'docker exec factory-anythingllm cat /app/package.json | grep version'
```

### H4: Onboarding nicht abgeschlossen
AnythingLLM leitet auf einen Setup-Wizard um wenn `hasSetup` nicht gesetzt ist.
Die Ansible-Rolle setzt es per SQLite, aber der Wert koennte fehlen.

**Pruefschritte:**
```bash
ssh root@85.9.207.209 'sqlite3 /var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db \
  "SELECT label, value FROM system_settings WHERE label = \"hasSetup\";"'
```

Erwartetes Ergebnis: `hasSetup|true`

### H5: Multi-User-Mode blockiert Web-UI
Wenn AnythingLLM im Multi-User-Mode ist aber kein User angelegt wurde,
wird das Chat-UI blockiert und liefert 404/403.

**Pruefschritte:**
```bash
ssh root@85.9.207.209 'sqlite3 /var/lib/docker/volumes/codefabrik_anythingllm_storage/_data/anythingllm.db \
  "SELECT label, value FROM system_settings WHERE label IN (\"multi_user_mode\", \"limit_user_messages\");"'
```

Erwartetes Ergebnis: Kein Eintrag oder `multi_user_mode|false`

## Ergebnis (2026-03-11)

**Root Cause:** Browser-Cache (H2). Nach Container-Neustart/Redeploy hatte der Browser
(Vivaldi) ein gecachtes altes Frontend. Chrome funktionierte sofort, danach auch Vivaldi.

**Fix:** Hard Refresh (Ctrl+Shift+R) oder Inkognito-Fenster nach jedem Redeploy.

**Ansible-Aenderung noetig:** Nein.

**Merke:** Nach jedem AnythingLLM-Redeploy Browser-Cache leeren.

---

## Auftrag (erledigt)

1. Pruefe die Hypothesen H1–H5 in der angegebenen Reihenfolge
2. Notiere bei jedem Schritt das exakte Ergebnis
3. Wenn der Fehler gefunden wird: Fix vorschlagen und testen
4. Wenn der Fix in der Ansible-Rolle verankert werden muss: Aenderung an
   `ansible/roles/anythingllm/tasks/main.yml` oder `anythingllm.env.j2` dokumentieren
5. Ergebnis: Kurze Zusammenfassung mit Root Cause + Fix + ob Ansible-Aenderung noetig
