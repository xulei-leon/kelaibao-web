ALTER TABLE content_revisions
  ADD COLUMN slug VARCHAR(191) NULL;

-- statement-breakpoint
ALTER TABLE content_items
  ADD COLUMN draft_revision_id BIGINT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE content_items
  ADD COLUMN published_revision_id BIGINT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE content_items
  ADD COLUMN case_authorization_revision_id BIGINT UNSIGNED NULL;

-- statement-breakpoint
ALTER TABLE content_items
  ADD KEY idx_content_items_draft_revision (draft_revision_id);

-- statement-breakpoint
ALTER TABLE content_items
  ADD KEY idx_content_items_published_revision (published_revision_id);

-- statement-breakpoint
ALTER TABLE content_items
  ADD KEY idx_content_items_case_authorization_revision (case_authorization_revision_id);

-- statement-breakpoint
ALTER TABLE content_items
  ADD CONSTRAINT fk_content_items_draft_revision
    FOREIGN KEY (draft_revision_id) REFERENCES content_revisions(id)
    ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE content_items
  ADD CONSTRAINT fk_content_items_published_revision
    FOREIGN KEY (published_revision_id) REFERENCES content_revisions(id)
    ON DELETE RESTRICT;

-- statement-breakpoint
ALTER TABLE content_items
  ADD CONSTRAINT fk_content_items_case_authorization_revision
    FOREIGN KEY (case_authorization_revision_id) REFERENCES content_revisions(id)
    ON DELETE RESTRICT;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS cache_purge_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  idempotency_key CHAR(64) NOT NULL,
  content_item_id BIGINT UNSIGNED NOT NULL,
  content_revision_id BIGINT UNSIGNED NOT NULL,
  action ENUM('publish', 'offline', 'republish') NOT NULL,
  urls_json JSON NOT NULL,
  status ENUM('pending', 'processing', 'succeeded', 'retry', 'failed') NOT NULL DEFAULT 'pending',
  attempt_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_error_code VARCHAR(64) NULL,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  completed_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cache_purge_jobs_idempotency (idempotency_key),
  KEY idx_cache_purge_jobs_ready (status, next_attempt_at),
  KEY idx_cache_purge_jobs_content (content_item_id, content_revision_id),
  CONSTRAINT fk_cache_purge_jobs_content
    FOREIGN KEY (content_item_id) REFERENCES content_items(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cache_purge_jobs_revision
    FOREIGN KEY (content_revision_id) REFERENCES content_revisions(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_cache_purge_jobs_admin
    FOREIGN KEY (created_by) REFERENCES admins(id)
    ON DELETE RESTRICT,
  CONSTRAINT chk_cache_purge_jobs_attempts CHECK (attempt_count <= 3),
  CONSTRAINT chk_cache_purge_jobs_urls CHECK (JSON_TYPE(urls_json) = 'ARRAY')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
