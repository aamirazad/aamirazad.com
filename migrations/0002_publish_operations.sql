ALTER TABLE publish_jobs ADD COLUMN operation TEXT NOT NULL DEFAULT 'publish'
  CHECK (operation IN ('publish', 'archive'));

DROP INDEX publish_jobs_revision_active_idx;
CREATE UNIQUE INDEX publish_jobs_revision_active_idx
  ON publish_jobs(post_id, revision_id, operation)
  WHERE status IN ('queued', 'rendering', 'projecting', 'purging');
