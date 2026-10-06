ALTER TABLE media_assets
  ADD COLUMN width_px INTEGER;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN height_px INTEGER;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN public_usage_confirmed_at TEXT;

-- statement-breakpoint
ALTER TABLE media_assets
  ADD COLUMN public_usage_confirmed_by INTEGER REFERENCES admins(id) ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN cover_media_asset_id INTEGER REFERENCES media_assets(id) ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE content_revisions
  ADD COLUMN cover_alt TEXT;

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_media_assets_public_usage
  ON media_assets(public_usage_confirmed_at, id);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_content_revisions_cover_media
  ON content_revisions(cover_media_asset_id);

-- statement-breakpoint
INSERT OR IGNORE INTO schema_versions(version, applied_at)
VALUES (2, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
