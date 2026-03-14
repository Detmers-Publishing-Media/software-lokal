# Review-Prompt: AnythingLLM — Vollstaendig headless konfigurieren (kein UI-Setup)

## Kontext

Die Code-Fabrik betreibt AnythingLLM als Private-RAG auf einem UpCloud VPS (Docker). Das Ziel ist eine **vollstaendig automatisierte Konfiguration via Ansible** — kein manuelles UI-Setup.

Aktuell: LLM-Chat ohne RAG funktioniert (DeepSeek via Ollama Cloud). Aber Embedding scheitert persistent, und nach jedem Container-Restart gehen Settings verloren.

## Setup

```
Docker Host (Ubuntu 24.04)
│
├── factory-anythingllm (mintplexlabs/anythingllm:latest)
│     ├── env_file: anythingllm.env
│     ├── Volume: anythingllm_storage:/app/server/storage
│     │     ├── anythingllm.db (SQLite: system_settings, api_keys, workspaces)
│     │     └── .env (intern generiert — EXISTIERT NICHT nach fresh deploy)
│     └── Port: 127.0.0.1:3001:3001
│
└── Ollama Cloud: https://ollama.com/v1 (DeepSeek v3.1:671b)
```

## Gewuenschte Konfiguration

| Setting | Wert |
|---------|------|
| LLM Provider | generic-openai |
| LLM Base Path | https://ollama.com/v1 |
| LLM Model | deepseek-v3.1:671b |
| LLM Max Tokens | 4096 |
| Embedding Engine | native (eingebaut, kein externer Service) |
| Vector DB | lancedb (Default) |

## anythingllm.env (Docker env_file)

```env
SERVER_PORT=3001
STORAGE_DIR=/app/server/storage
LLM_PROVIDER=generic-openai
GENERIC_OPEN_AI_BASE_PATH=https://ollama.com/v1
GENERIC_OPEN_AI_API_KEY=<key>
GENERIC_OPEN_AI_MODEL_PREF=deepseek-v3.1:671b
GENERIC_OPEN_AI_MAX_TOKENS=4096
EMBEDDING_ENGINE=native
```

## Chronologie — 10 gescheiterte Versuche

| # | Was | Ergebnis |
|---|-----|----------|
| 1 | `EMBEDDING_ENGINE=generic-openai` + `EMBEDDING_BASE_PATH` in env_file | "GenericOpenAI must have a valid base path" |
| 2 | Gleiche Vars in docker-compose `environment:` Sektion | Gleicher Fehler |
| 3 | `docker exec env` zeigt EMBEDDING_BASE_PATH korrekt | process.env im Node-Prozess hat den Wert trotzdem nicht |
| 4 | Volume geloescht + Container neu erstellt | Gleicher Fehler |
| 5 | `EMBEDDING_ENGINE=ollama` (wie in funktionierendem studio-ops) | "No embedding base path was set" (kein lokaler Ollama) |
| 6 | Native Embedder in UI manuell eingestellt | Funktionierte, nach Container-Restart weg |
| 7 | `EMBEDDING_ENGINE=native` in env_file + `docker restart` | Container sieht noch `ollama` in process.env |
| 8 | `EMBEDDING_ENGINE=native` in env_file + `docker compose up --force-recreate` | "No OpenAI API key was set" (LLM-Key weg) |
| 9 | LLM + Embedding Settings direkt in SQLite geschrieben | "No OpenAI API key was set" |
| 10 | Settings per `POST /api/system/update-env` API setzen | Container haengt nach force-recreate, API nicht erreichbar |

## Beobachtungen

1. **`docker exec env | grep VAR`** zeigt korrekte Werte — aber **`docker exec node -e "console.log(process.env.VAR)"`** zeigt andere/leere Werte
2. **Interne `.env` (`/app/server/.env` und `/app/server/storage/.env`)** existiert nach Fresh Deploy NICHT
3. **Container-Startup-Log** zeigt: `Environment variables loaded from .env` — welche `.env`?
4. **process.env.EMBEDDING_ENGINE** zeigt `ollama` obwohl env_file `native` hat und `docker compose up --force-recreate` lief
5. **Nach Versuch 8**: Embedding-Fix (`native`) griff, aber LLM-Key ging verloren — als haette die env_file nur teilweise geladen

## Kernfragen

### 1. Wie laedt AnythingLLM seine Konfiguration?

Der Startup-Log zeigt `Environment variables loaded from .env`. Wo liegt diese `.env`? Optionen:
- `/app/server/.env` (App-Root)
- `/app/server/storage/.env` (im Volume)
- Die Docker env_file wird gar nicht als `.env` geladen sondern nur als Docker-env

Hypothese: AnythingLLM hat einen eigenen dotenv-Lademechanismus der die Docker-env_file NICHT respektiert. Die Meldung "loaded from .env" bezieht sich auf eine andere Datei.

### 2. Warum sieht `docker exec env` andere Werte als `docker exec node -e "process.env"`?

`docker exec env` zeigt die Docker-Umgebungsvariablen. Aber der laufende Node.js-Prozess hat moeglicherweise seine eigenen Werte — z.B. wenn `dotenv` mit `override: true` aufgerufen wird.

### 3. Wie konfiguriert man AnythingLLM headless?

Ohne UI-Setup. Moegliche Ansaetze:
- **A)** Nur env_file (funktioniert nicht zuverlaessig)
- **B)** SQLite pre-seed (welche Tabellen/Labels genau?)
- **C)** API nach Container-Start (`POST /api/system/update-env`)
- **D)** Custom entrypoint der die interne `.env` vor App-Start schreibt
- **E)** Volume-Mount der internen `.env` als separate Datei

### 4. Welche SQLite system_settings Labels braucht AnythingLLM?

Bekannte Labels (aus AnythingLLM Quellcode oder Doku):
- `LLMProvider`, `GenericOpenAiBasePath`, `GenericOpenAiKey`, `GenericOpenAiModelPref`
- `EmbeddingEngine`, `EmbeddingBasePath`, `EmbeddingModelPref`
- Aber: Stimmen diese Label-Namen? Sind sie case-sensitive?

### 5. Erste-Nutzung-Problem

AnythingLLM zeigt beim ersten Zugriff einen Setup-Wizard (Admin-Passwort, LLM-Provider, etc.). Kann man diesen Wizard ueberspringen, indem man die DB pre-seeded? Oder muss man ihn einmal durchlaufen?

## Referenzen

- AnythingLLM GitHub Issue #3151: Settings springen nach Restart zurueck
- AnythingLLM `updateENV.js`: `dumpENV()` schreibt process.env nach `/app/server/.env`
- AnythingLLM offizielles Docker-Setup mountet `.env` separat als Volume

## Erwartetes Ergebnis

1. **Schritt-fuer-Schritt-Anleitung**: Wie konfiguriert man AnythingLLM vollstaendig headless (LLM + Embedding + Workspace + API-Key)?
2. **Ansible-Rolle**: Konkretes Playbook-Fragment das nach `docker compose up` die Settings zuverlaessig setzt
3. **Verifikations-Befehle**: Wie prueft man ob alles korrekt konfiguriert ist?
4. **Container-Restart-Sicherheit**: Wie stellt man sicher dass Settings nach Restart erhalten bleiben?
