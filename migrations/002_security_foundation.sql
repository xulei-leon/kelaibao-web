ALTER TABLE admins
  ADD COLUMN singleton_key TINYINT UNSIGNED NOT NULL DEFAULT 1;

-- statement-breakpoint
ALTER TABLE admins
  ADD COLUMN disabled_at DATETIME(6) NULL;

-- statement-breakpoint
ALTER TABLE admins
  ADD UNIQUE KEY uq_admins_singleton (singleton_key);

-- statement-breakpoint
ALTER TABLE admins
  ADD CONSTRAINT chk_admins_singleton CHECK (singleton_key = 1);

-- statement-breakpoint
ALTER TABLE admin_sessions
  ADD COLUMN csrf_token_hash BINARY(32) NULL;

-- statement-breakpoint
ALTER TABLE content_items
  ADD COLUMN sanitizer_policy_version VARCHAR(64) NOT NULL DEFAULT 'm2-legacy-unversioned';

-- statement-breakpoint
ALTER TABLE content_items
  ADD COLUMN sanitizer_diagnostics_json JSON NULL;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN sanitizer_policy_version VARCHAR(64) NOT NULL DEFAULT 'm2-legacy-unversioned';

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN sanitizer_diagnostics_json JSON NULL;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS media_upload_intents (
  id CHAR(36) NOT NULL,
  admin_id BIGINT UNSIGNED NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  mime_type ENUM('image/jpeg', 'image/png', 'image/webp') NOT NULL,
  max_byte_size BIGINT UNSIGNED NOT NULL,
  expected_sha256 CHAR(64) NOT NULL,
  nonce_hash BINARY(32) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  media_asset_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_media_upload_intents_object_key (object_key),
  UNIQUE KEY uq_media_upload_intents_asset (media_asset_id),
  KEY idx_media_upload_intents_admin_expiry (admin_id, expires_at),
  CONSTRAINT fk_media_upload_intents_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE RESTRICT,
  CONSTRAINT fk_media_upload_intents_asset
    FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT,
  CONSTRAINT chk_media_upload_intents_size
    CHECK (max_byte_size > 0 AND max_byte_size <= 10485760),
  CONSTRAINT chk_media_upload_intents_expiry CHECK (expires_at > created_at),
  CONSTRAINT chk_media_upload_intents_consumed CHECK (
    (consumed_at IS NULL AND media_asset_id IS NULL)
    OR (consumed_at IS NOT NULL AND media_asset_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- statement-breakpoint
ALTER TABLE media_upload_intents
  ADD COLUMN confirmation_token_hash BINARY(32) NULL;

-- statement-breakpoint
ALTER TABLE media_upload_intents
  ADD COLUMN confirmation_expires_at DATETIME(6) NULL;

-- statement-breakpoint
ALTER TABLE media_upload_intents
  ADD CONSTRAINT chk_media_upload_intents_confirmation CHECK (
    (
      confirmation_token_hash IS NULL
      AND confirmation_expires_at IS NULL
    )
    OR (
      confirmation_token_hash IS NOT NULL
      AND confirmation_expires_at IS NOT NULL
    )
  );
