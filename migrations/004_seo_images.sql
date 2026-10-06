ALTER TABLE media_assets
  ADD COLUMN width_px INT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN height_px INT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN public_usage_confirmed_at DATETIME(6) NULL;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN public_usage_confirmed_by BIGINT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD KEY idx_media_assets_public_usage (public_usage_confirmed_at, id);

-- statement-breakpoint
ALTER TABLE media_assets
  ADD CONSTRAINT fk_media_assets_public_usage_admin
    FOREIGN KEY (public_usage_confirmed_by) REFERENCES admins(id)
    ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD CONSTRAINT chk_media_assets_dimensions
    CHECK (
      (width_px IS NULL AND height_px IS NULL)
      OR (width_px > 0 AND height_px > 0)
    );

-- statement-breakpoint
ALTER TABLE media_assets
  ADD CONSTRAINT chk_media_assets_public_usage
    CHECK (
      (public_usage_confirmed_at IS NULL AND public_usage_confirmed_by IS NULL)
      OR (public_usage_confirmed_at IS NOT NULL AND public_usage_confirmed_by IS NOT NULL)
    );

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN cover_media_asset_id BIGINT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN cover_alt VARCHAR(240) NULL;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD KEY idx_content_revisions_cover_media (cover_media_asset_id);

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD CONSTRAINT fk_content_revisions_cover_media
    FOREIGN KEY (cover_media_asset_id) REFERENCES media_assets(id)
    ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD CONSTRAINT chk_content_revisions_cover_pair
    CHECK (
      (cover_media_asset_id IS NULL AND cover_alt IS NULL)
      OR (cover_media_asset_id IS NOT NULL AND CHAR_LENGTH(TRIM(cover_alt)) BETWEEN 1 AND 240)
    );
