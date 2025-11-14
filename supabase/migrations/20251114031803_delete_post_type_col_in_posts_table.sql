BEGIN;

ALTER TABLE posts
  DROP COLUMN post_type;

DROP TYPE post_type;

COMMIT;
