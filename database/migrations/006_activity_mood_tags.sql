ALTER TABLE activities
  ADD COLUMN mood_tags JSON NOT NULL DEFAULT (JSON_ARRAY()) AFTER mood;

UPDATE activities
SET mood_tags = JSON_ARRAY(mood)
WHERE JSON_LENGTH(mood_tags) = 0;
