ALTER TABLE content_items
  ADD COLUMN deleted_at TEXT;

-- statement-breakpoint
INSERT OR IGNORE INTO schema_versions(version, applied_at)
VALUES (3, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
