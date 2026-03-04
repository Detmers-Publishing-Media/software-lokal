CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    type        TEXT NOT NULL,
    timestamp   TEXT NOT NULL,
    actor       TEXT NOT NULL DEFAULT 'app',
    version     INTEGER NOT NULL DEFAULT 1,
    data        TEXT NOT NULL,
    hash        TEXT NOT NULL,
    prev_hash   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE TABLE IF NOT EXISTS _schema_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL DEFAULT 1,
    app_version TEXT NOT NULL,
    last_migration TEXT,
    event_replay_at TEXT
);
