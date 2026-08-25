ALTER TABLE diary_comments
  ADD COLUMN reply_to_comment_id BIGINT UNSIGNED NULL AFTER parent_comment_id,
  ADD KEY idx_diary_comments_reply_to (reply_to_comment_id),
  ADD CONSTRAINT fk_diary_comments_reply_to
    FOREIGN KEY (reply_to_comment_id) REFERENCES diary_comments (id) ON DELETE SET NULL;

UPDATE diary_comments
SET reply_to_comment_id = parent_comment_id
WHERE parent_comment_id IS NOT NULL
  AND reply_to_comment_id IS NULL;
