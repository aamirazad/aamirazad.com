-- Postgres schema for aamirazad.com. The Neon database is shared with other projects, so every
-- table, index, function, and trigger carries the `aamirazad_` prefix. Timestamps are stored as
-- ISO-8601 text, matching the application's string comparisons.

CREATE TABLE aamirazad_posts (
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
  is_listed INTEGER NOT NULL DEFAULT 1 CHECK (is_listed IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1,
  current_revision_id TEXT,
  published_revision_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT,
  deleted_at TEXT
);

CREATE UNIQUE INDEX aamirazad_posts_live_canonical_path_idx
  ON aamirazad_posts (canonical_path)
  WHERE canonical_path IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX aamirazad_posts_status_published_idx
  ON aamirazad_posts (status, published_at DESC, id DESC);
CREATE INDEX aamirazad_posts_series_published_idx
  ON aamirazad_posts (series, published_at DESC, id DESC);
CREATE INDEX aamirazad_posts_format_idx ON aamirazad_posts (format, updated_at DESC, id DESC);
CREATE INDEX aamirazad_posts_published_revision_idx ON aamirazad_posts (published_revision_id)
  WHERE status = 'published' AND deleted_at IS NULL;

CREATE TABLE aamirazad_post_revisions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES aamirazad_posts (id) ON DELETE RESTRICT,
  series TEXT NOT NULL CHECK (series IN ('on', 'today', 'built', 'found')),
  format TEXT NOT NULL CHECK (format IN ('article', 'note', 'link', 'quote', 'photo')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  canonical_path TEXT,
  summary TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  html TEXT,
  source_url TEXT,
  source_title TEXT,
  source_description TEXT,
  quote_text TEXT,
  quote_attribution TEXT,
  is_listed INTEGER NOT NULL DEFAULT 1 CHECK (is_listed IN (0, 1)),
  content_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('manual', 'publish', 'restore', 'import')),
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL
);

CREATE INDEX aamirazad_post_revisions_post_idx
  ON aamirazad_post_revisions (post_id, created_at DESC, id DESC);
CREATE UNIQUE INDEX aamirazad_post_revisions_hash_idx
  ON aamirazad_post_revisions (post_id, content_hash, reason);

CREATE FUNCTION aamirazad_reject_revision_change() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'post revisions are immutable';
END;
$$;

CREATE TRIGGER aamirazad_post_revisions_immutable
BEFORE UPDATE OR DELETE ON aamirazad_post_revisions
FOR EACH ROW EXECUTE FUNCTION aamirazad_reject_revision_change();

CREATE TABLE aamirazad_assets (
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

CREATE INDEX aamirazad_assets_sha256_idx ON aamirazad_assets (sha256) WHERE deleted_at IS NULL;

CREATE TABLE aamirazad_asset_variants (
  asset_id TEXT NOT NULL REFERENCES aamirazad_assets (id) ON DELETE RESTRICT,
  variant TEXT NOT NULL,
  storage_key TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL CHECK (byte_size >= 0),
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (asset_id, variant, content_hash)
);

CREATE TABLE aamirazad_post_assets (
  post_id TEXT NOT NULL REFERENCES aamirazad_posts (id) ON DELETE RESTRICT,
  asset_id TEXT NOT NULL REFERENCES aamirazad_assets (id) ON DELETE RESTRICT,
  role TEXT NOT NULL CHECK (role IN ('cover', 'inline', 'gallery', 'attachment')),
  position INTEGER NOT NULL DEFAULT 0,
  caption TEXT,
  PRIMARY KEY (post_id, asset_id, role)
);

CREATE INDEX aamirazad_post_assets_order_idx
  ON aamirazad_post_assets (post_id, role, position, asset_id);

CREATE TABLE aamirazad_slug_aliases (
  path TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES aamirazad_posts (id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);

CREATE INDEX aamirazad_slug_aliases_post_idx ON aamirazad_slug_aliases (post_id);

CREATE TABLE aamirazad_sessions (
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

CREATE INDEX aamirazad_sessions_owner_idx
  ON aamirazad_sessions (oidc_issuer, oidc_subject, absolute_expires_at);
CREATE INDEX aamirazad_sessions_expiry_idx
  ON aamirazad_sessions (absolute_expires_at, idle_expires_at);

CREATE TABLE aamirazad_oidc_transactions (
  state_hash TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  nonce TEXT NOT NULL,
  return_to TEXT NOT NULL DEFAULT '/admin',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX aamirazad_oidc_transactions_expiry_idx ON aamirazad_oidc_transactions (expires_at);

CREATE TABLE aamirazad_audit_events (
  id TEXT PRIMARY KEY,
  actor_subject TEXT,
  event_type TEXT NOT NULL,
  target_id TEXT,
  correlation_id TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX aamirazad_audit_events_type_idx
  ON aamirazad_audit_events (event_type, created_at DESC);

CREATE TABLE aamirazad_rate_limits (
  key_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  window_started_at TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_hash, action)
);

CREATE TABLE aamirazad_site_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('project', 'link', 'homelab')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  href TEXT,
  github TEXT,
  code_url TEXT,
  badge TEXT,
  is_wip INTEGER NOT NULL DEFAULT 0 CHECK (is_wip IN (0, 1)),
  position INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX aamirazad_site_items_kind_position_idx
  ON aamirazad_site_items (kind, position, created_at)
  WHERE deleted_at IS NULL;

CREATE TABLE aamirazad_redirect_links (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  target_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE UNIQUE INDEX aamirazad_redirect_links_live_path_idx
  ON aamirazad_redirect_links (path)
  WHERE deleted_at IS NULL;

CREATE TABLE aamirazad_redirect_link_clicks (
  id TEXT PRIMARY KEY,
  redirect_link_id TEXT NOT NULL REFERENCES aamirazad_redirect_links (id) ON DELETE RESTRICT,
  clicked_at TEXT NOT NULL
);

CREATE INDEX aamirazad_redirect_link_clicks_link_clicked_idx
  ON aamirazad_redirect_link_clicks (redirect_link_id, clicked_at DESC);
