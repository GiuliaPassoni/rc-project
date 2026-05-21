CREATE TABLE IF NOT EXISTS events
(
    id          TEXT PRIMARY KEY,
    cell_id     TEXT        NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL,
    event_type  TEXT        NOT NULL,
    state_after TEXT        NOT NULL,
    payload     JSONB,
    raw         JSONB
);

CREATE INDEX IF NOT EXISTS idx_events_cell_timestamp
    ON events (cell_id, timestamp);

CREATE TABLE IF NOT EXISTS data_quality_log
(
    id          SERIAL PRIMARY KEY,
    ingested_at TIMESTAMPTZ DEFAULT now(),
    cell_id     TEXT,
    reason      TEXT NOT NULL,
    raw         JSONB
);