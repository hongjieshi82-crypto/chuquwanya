CREATE TABLE IF NOT EXISTS user_checkins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  checkin_date DATE NOT NULL,
  status ENUM('signed') NOT NULL DEFAULT 'signed',
  source ENUM('auto_login','manual') NOT NULL DEFAULT 'auto_login',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_checkins_user_date (user_id, checkin_date),
  KEY idx_user_checkins_user_date (user_id, checkin_date),
  CONSTRAINT fk_user_checkins_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
