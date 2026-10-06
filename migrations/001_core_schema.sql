CREATE TABLE IF NOT EXISTS admins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  failed_login_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  failed_login_window_started_at DATETIME(6) NULL,
  locked_until DATETIME(6) NULL,
  password_changed_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_username (username),
  CONSTRAINT chk_admins_failed_login_count CHECK (failed_login_count <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  session_token_hash BINARY(32) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_admin_sessions_token_hash (session_token_hash),
  KEY idx_admin_sessions_admin_expires (admin_id, expires_at),
  CONSTRAINT fk_admin_sessions_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
  CONSTRAINT chk_admin_sessions_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_type ENUM('news', 'case') NOT NULL,
  status ENUM('draft', 'published', 'offline') NOT NULL DEFAULT 'draft',
  slug VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  source_html MEDIUMTEXT NOT NULL,
  sanitized_html MEDIUMTEXT NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  first_published_at DATETIME(6) NULL,
  published_at DATETIME(6) NULL,
  offline_at DATETIME(6) NULL,
  case_authorization_confirmed_at DATETIME(6) NULL,
  case_authorization_admin_id BIGINT UNSIGNED NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  updated_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_content_items_type_slug (content_type, slug),
  KEY idx_content_items_publication (content_type, status, published_at),
  CONSTRAINT fk_content_items_created_by
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_content_items_updated_by
    FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_content_items_case_authorization_admin
    FOREIGN KEY (case_authorization_admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT chk_content_items_version CHECK (version >= 1),
  CONSTRAINT chk_content_items_case_authorization CHECK (
    (
      content_type <> 'case'
      AND case_authorization_confirmed_at IS NULL
      AND case_authorization_admin_id IS NULL
    ) OR (
      content_type = 'case'
      AND (
        (
          status <> 'published'
          AND case_authorization_confirmed_at IS NULL
          AND case_authorization_admin_id IS NULL
        ) OR (
          case_authorization_confirmed_at IS NOT NULL
          AND case_authorization_admin_id IS NOT NULL
        )
      )
    )
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS content_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_item_id BIGINT UNSIGNED NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  source_html MEDIUMTEXT NOT NULL,
  sanitized_html MEDIUMTEXT NOT NULL,
  status ENUM('draft', 'published', 'offline') NOT NULL,
  actor_admin_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_content_revisions_item_number (content_item_id, revision_number),
  CONSTRAINT fk_content_revisions_item
    FOREIGN KEY (content_item_id) REFERENCES content_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_revisions_actor
    FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT chk_content_revisions_number CHECK (revision_number >= 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS media_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  object_key VARCHAR(512) NOT NULL,
  mime_type ENUM('image/jpeg', 'image/png', 'image/webp') NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_assets_object_key (object_key),
  CONSTRAINT fk_media_assets_created_by
    FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT chk_media_assets_size CHECK (byte_size > 0 AND byte_size <= 10485760)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_admin_id BIGINT UNSIGNED NULL,
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(191) NULL,
  request_id VARCHAR(64) NOT NULL,
  metadata_json JSON NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_audit_logs_actor_created (actor_admin_id, created_at),
  KEY idx_audit_logs_entity_created (entity_type, entity_id, created_at),
  CONSTRAINT fk_audit_logs_actor
    FOREIGN KEY (actor_admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
