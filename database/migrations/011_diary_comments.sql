CREATE TABLE IF NOT EXISTS diary_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  diary_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  parent_comment_id BIGINT UNSIGNED NULL,
  content VARCHAR(500) NOT NULL,
  likes_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_diary_comments_diary_parent_created (diary_id, parent_comment_id, created_at),
  KEY idx_diary_comments_parent_created (parent_comment_id, created_at),
  CONSTRAINT fk_diary_comments_diary
    FOREIGN KEY (diary_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_comments_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_comments_parent
    FOREIGN KEY (parent_comment_id) REFERENCES diary_comments (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diary_comment_likes (
  comment_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id),
  KEY idx_diary_comment_likes_user (user_id),
  CONSTRAINT fk_diary_comment_likes_comment
    FOREIGN KEY (comment_id) REFERENCES diary_comments (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_comment_likes_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
