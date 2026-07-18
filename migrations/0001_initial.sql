PRAGMA foreign_keys = ON;

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  series TEXT NOT NULL CHECK (series IN ('on', 'today', 'built', 'found')),
  format TEXT NOT NULL CHECK (format IN ('article', 'note', 'link', 'quote', 'photo')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'publishing', 'published', 'scheduled', 'archived', 'failed')),
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  canonical_path TEXT,
  summary TEXT NOT NULL DEFAULT '',
  body_markdown TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  source_title TEXT,
  source_description TEXT,
  quote_text TEXT,
  quote_attribution TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  current_revision_id TEXT,
  published_revision_id TEXT,
  publish_job_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  deleted_at TEXT
);

CREATE UNIQUE INDEX posts_live_canonical_path_idx
  ON posts(canonical_path)
  WHERE canonical_path IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX posts_status_published_idx ON posts(status, published_at DESC, id DESC);
CREATE INDEX posts_series_published_idx ON posts(series, published_at DESC, id DESC);
CREATE INDEX posts_format_idx ON posts(format, updated_at DESC, id DESC);

CREATE TABLE post_revisions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  series TEXT NOT NULL CHECK (series IN ('on', 'today', 'built', 'found')),
  format TEXT NOT NULL CHECK (format IN ('article', 'note', 'link', 'quote', 'photo')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  canonical_path TEXT,
  summary TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  source_url TEXT,
  source_title TEXT,
  source_description TEXT,
  quote_text TEXT,
  quote_attribution TEXT,
  content_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('manual', 'publish', 'restore', 'import')),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX post_revisions_post_idx ON post_revisions(post_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX post_revisions_hash_idx ON post_revisions(post_id, content_hash, reason);

CREATE TRIGGER post_revisions_immutable_update
BEFORE UPDATE ON post_revisions
BEGIN
  SELECT RAISE(ABORT, 'post revisions are immutable');
END;

CREATE TRIGGER post_revisions_immutable_delete
BEFORE DELETE ON post_revisions
BEGIN
  SELECT RAISE(ABORT, 'post revisions are immutable');
END;

CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  original_key TEXT NOT NULL UNIQUE,
  sha256 TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  extension TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  width INTEGER,
  height INTEGER,
  orientation INTEGER,
  alt_text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX assets_sha256_idx ON assets(sha256) WHERE deleted_at IS NULL;

CREATE TABLE asset_variants (
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  variant TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (asset_id, variant, content_hash)
);

CREATE TABLE post_assets (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('cover', 'inline', 'gallery', 'attachment')),
  position INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  PRIMARY KEY (post_id, asset_id, role)
);

CREATE INDEX post_assets_order_idx ON post_assets(post_id, role, position, asset_id);

CREATE TABLE slug_aliases (
  path TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);

CREATE INDEX slug_aliases_post_idx ON slug_aliases(post_id);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  oidc_issuer TEXT NOT NULL,
  oidc_subject TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  idle_expires_at TEXT NOT NULL,
  absolute_expires_at TEXT NOT NULL,
  revoked_at TEXT,
  user_agent_family TEXT,
  ip_prefix_hash TEXT
);

CREATE INDEX sessions_owner_idx ON sessions(oidc_issuer, oidc_subject, absolute_expires_at);
CREATE INDEX sessions_expiry_idx ON sessions(absolute_expires_at, idle_expires_at);

CREATE TABLE oidc_transactions (
  state_hash TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  return_to TEXT NOT NULL DEFAULT '/admin',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX oidc_transactions_expiry_idx ON oidc_transactions(expires_at);

CREATE TABLE publish_jobs (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE RESTRICT,
  revision_id TEXT NOT NULL REFERENCES post_revisions(id) ON DELETE RESTRICT,
  correlation_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'rendering', 'projecting', 'purging', 'complete', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TEXT,
  error_code TEXT,
  error_message TEXT,
  snapshot_key TEXT,
  content_hash TEXT,
  created_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT
);

CREATE INDEX publish_jobs_status_idx ON publish_jobs(status, next_retry_at, created_at);
CREATE UNIQUE INDEX publish_jobs_revision_active_idx
  ON publish_jobs(post_id, revision_id)
  WHERE status != 'failed';

CREATE TABLE backup_jobs (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('d1', 'portable', 'off_provider', 'restore_drill')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  object_key TEXT,
  content_hash TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX backup_jobs_status_idx ON backup_jobs(kind, status, created_at DESC);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_subject TEXT,
  event_type TEXT NOT NULL,
  target_id TEXT,
  correlation_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX audit_events_type_idx ON audit_events(event_type, created_at DESC);

CREATE TABLE rate_limits (
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, action)
);
