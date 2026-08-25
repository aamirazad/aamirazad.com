CREATE TABLE redirect_links (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  target_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX redirect_links_live_path_idx
  ON redirect_links(path)
  WHERE deleted_at IS NULL;

CREATE TABLE redirect_link_clicks (
  id TEXT PRIMARY KEY,
  redirect_link_id TEXT NOT NULL REFERENCES redirect_links(id) ON DELETE RESTRICT,
  clicked_at TEXT NOT NULL
);

CREATE INDEX redirect_link_clicks_link_clicked_idx
  ON redirect_link_clicks(redirect_link_id, clicked_at DESC);
