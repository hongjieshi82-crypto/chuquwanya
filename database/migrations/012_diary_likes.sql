CREATE TABLE IF NOT EXISTS diary_likes (
  diary_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (diary_id, user_id),
  KEY idx_diary_likes_user (user_id),
  CONSTRAINT fk_diary_likes_diary
    FOREIGN KEY (diary_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_likes_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
