CREATE TABLE IF NOT EXISTS diary_favorites (
  diary_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (diary_id, user_id),
  KEY idx_diary_favorites_user_created (user_id, created_at),
  CONSTRAINT fk_diary_favorites_diary
    FOREIGN KEY (diary_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_favorites_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diary_hidden_posts (
  diary_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (diary_id, user_id),
  KEY idx_diary_hidden_posts_user_created (user_id, created_at),
  CONSTRAINT fk_diary_hidden_posts_diary
    FOREIGN KEY (diary_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_hidden_posts_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS diary_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  diary_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(32) NOT NULL,
  detail VARCHAR(300) NULL,
  status ENUM('pending', 'reviewed', 'dismissed') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_diary_reports_diary_user (diary_id, user_id),
  KEY idx_diary_reports_status_created (status, created_at),
  CONSTRAINT fk_diary_reports_diary
    FOREIGN KEY (diary_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_diary_reports_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;
