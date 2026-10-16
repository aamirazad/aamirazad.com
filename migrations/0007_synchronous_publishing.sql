-- Publishing now writes the rendered revision directly to D1 instead of projecting it into R2
-- through a Workflow, so the job queue is no longer needed.
ALTER TABLE post_revisions ADD COLUMN html TEXT;

DROP TABLE IF EXISTS publish_jobs;
ALTER TABLE posts DROP COLUMN publish_job_id;

UPDATE posts SET status = CASE WHEN published_revision_id IS NULL THEN 'draft' ELSE 'published' END
WHERE status IN ('publishing', 'failed', 'scheduled');

CREATE INDEX posts_published_revision_idx ON posts(published_revision_id)
  WHERE status = 'published' AND deleted_at IS NULL;
