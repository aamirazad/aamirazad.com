ALTER TABLE posts ADD COLUMN is_listed INTEGER NOT NULL DEFAULT 1
  CHECK (is_listed IN (0, 1));

ALTER TABLE post_revisions ADD COLUMN is_listed INTEGER NOT NULL DEFAULT 1
  CHECK (is_listed IN (0, 1));
