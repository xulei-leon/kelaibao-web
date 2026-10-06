PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  failed_login_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_login_count BETWEEN 0 AND 5),
  failed_login_window_started_at TEXT,
  locked_until TEXT,
  password_changed_at TEXT NOT NULL,
  disabled_at TEXT,
  singleton_key INTEGER NOT NULL DEFAULT 1 UNIQUE CHECK (singleton_key = 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE CHECK (length(session_token_hash) = 64),
  csrf_token_hash TEXT NOT NULL CHECK (length(csrf_token_hash) = 64),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  CHECK (expires_at > created_at)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_expires
  ON admin_sessions(admin_id, expires_at);

CREATE TABLE IF NOT EXISTS content_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT NOT NULL CHECK (content_type IN ('news', 'case')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'offline')),
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 1 AND 191 AND slug = lower(slug)),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 320),
  source_html TEXT NOT NULL CHECK (length(source_html) BETWEEN 1 AND 500000),
  sanitized_html TEXT NOT NULL,
  sanitizer_policy_version TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  draft_revision_id INTEGER,
  published_revision_id INTEGER,
  first_published_at TEXT,
  published_at TEXT,
  offline_at TEXT,
  case_authorization_confirmed_at TEXT,
  case_authorization_admin_id INTEGER REFERENCES admins(id) ON DELETE RESTRICT,
  case_authorization_revision_id INTEGER,
  created_by INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  updated_by INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(content_type, slug),
  CHECK (
    (content_type <> 'case'
      AND case_authorization_confirmed_at IS NULL
      AND case_authorization_admin_id IS NULL
      AND case_authorization_revision_id IS NULL)
    OR (content_type = 'case' AND (
      (status <> 'published'
        AND case_authorization_confirmed_at IS NULL
        AND case_authorization_admin_id IS NULL
        AND case_authorization_revision_id IS NULL)
      OR (case_authorization_confirmed_at IS NOT NULL
        AND case_authorization_admin_id IS NOT NULL
        AND case_authorization_revision_id IS NOT NULL)
    ))
  )
) STRICT;

CREATE TABLE IF NOT EXISTS content_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL CHECK (revision_number >= 1),
  slug TEXT NOT NULL CHECK (length(slug) BETWEEN 1 AND 191 AND slug = lower(slug)),
  title TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  summary TEXT NOT NULL CHECK (length(summary) BETWEEN 1 AND 320),
  source_html TEXT NOT NULL CHECK (length(source_html) BETWEEN 1 AND 500000),
  sanitized_html TEXT NOT NULL,
  sanitizer_policy_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'offline')),
  cover_media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE RESTRICT,
  cover_alt TEXT CHECK (cover_alt IS NULL OR length(trim(cover_alt)) BETWEEN 1 AND 240),
  actor_admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  UNIQUE(content_item_id, revision_number),
  CHECK ((cover_media_asset_id IS NULL) = (cover_alt IS NULL))
) STRICT;

CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 10485760),
  checksum_sha256 TEXT NOT NULL CHECK (length(checksum_sha256) = 64),
  width_px INTEGER CHECK (width_px IS NULL OR width_px > 0),
  height_px INTEGER CHECK (height_px IS NULL OR height_px > 0),
  public_usage_confirmed_at TEXT,
  public_usage_confirmed_by INTEGER REFERENCES admins(id) ON DELETE RESTRICT,
  created_by INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  CHECK ((width_px IS NULL) = (height_px IS NULL)),
  CHECK ((public_usage_confirmed_at IS NULL) = (public_usage_confirmed_by IS NULL))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_media_assets_public_usage
  ON media_assets(public_usage_confirmed_at, id);

CREATE INDEX IF NOT EXISTS idx_content_revisions_cover_media
  ON content_revisions(cover_media_asset_id);

CREATE TABLE IF NOT EXISTS media_upload_intents (
  id TEXT PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  max_byte_size INTEGER NOT NULL CHECK (max_byte_size BETWEEN 1 AND 10485760),
  expected_sha256 TEXT NOT NULL CHECK (length(expected_sha256) = 64),
  nonce_hash TEXT NOT NULL CHECK (length(nonce_hash) = 64),
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  media_asset_id INTEGER UNIQUE REFERENCES media_assets(id) ON DELETE RESTRICT,
  confirmation_token_hash TEXT,
  confirmation_expires_at TEXT,
  created_at TEXT NOT NULL,
  CHECK ((consumed_at IS NULL AND media_asset_id IS NULL) OR (consumed_at IS NOT NULL AND media_asset_id IS NOT NULL)),
  CHECK ((confirmation_token_hash IS NULL AND confirmation_expires_at IS NULL) OR (confirmation_token_hash IS NOT NULL AND confirmation_expires_at IS NOT NULL))
) STRICT;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_admin_id INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (length(action) BETWEEN 1 AND 128),
  entity_type TEXT NOT NULL CHECK (length(entity_type) BETWEEN 1 AND 64),
  entity_id TEXT,
  request_id TEXT NOT NULL CHECK (length(request_id) BETWEEN 1 AND 64),
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS cache_purge_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  idempotency_key TEXT NOT NULL UNIQUE CHECK (length(idempotency_key) = 64),
  content_item_id INTEGER NOT NULL REFERENCES content_items(id) ON DELETE RESTRICT,
  content_revision_id INTEGER NOT NULL REFERENCES content_revisions(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('publish', 'offline', 'republish')),
  urls_json TEXT NOT NULL CHECK (json_valid(urls_json) AND json_type(urls_json) = 'array'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'retry', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 3),
  next_attempt_at TEXT,
  last_error_code TEXT,
  created_by INTEGER NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_cache_purge_jobs_ready
  ON cache_purge_jobs(status, next_attempt_at, id);

INSERT OR IGNORE INTO schema_versions(version, applied_at)
VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
