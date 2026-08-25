-- 旅游 AI 推荐模块（方案 B：复用 lazyde 库与 users 表）

CREATE TABLE IF NOT EXISTS travel_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) NOT NULL,
  category ENUM('scene','audience','season','theme','food','other') NOT NULL DEFAULT 'theme',
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_travel_tags_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destinations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id BIGINT UNSIGNED NULL,
  name VARCHAR(64) NOT NULL,
  province VARCHAR(64) NULL,
  country VARCHAR(64) NOT NULL DEFAULT '中国',
  summary VARCHAR(500) NOT NULL,
  description TEXT NULL,
  cover_image VARCHAR(500) NULL,
  best_seasons JSON NOT NULL DEFAULT (JSON_ARRAY()),
  avg_cost_per_day INT UNSIGNED NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  popularity INT UNSIGNED NOT NULL DEFAULT 0,
  embedding_point_id VARCHAR(64) NULL,
  is_hot BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_destinations_city (city_id),
  KEY idx_destinations_hot (is_hot, popularity DESC),
  CONSTRAINT fk_destinations_city FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attractions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id BIGINT UNSIGNED NOT NULL,
  activity_id BIGINT UNSIGNED NULL COMMENT '关联原 activities 表',
  name VARCHAR(120) NOT NULL,
  summary VARCHAR(500) NOT NULL,
  description TEXT NULL,
  cover_image VARCHAR(500) NULL,
  address VARCHAR(255) NOT NULL DEFAULT '',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  open_time VARCHAR(128) NULL,
  ticket_price_min INT UNSIGNED NOT NULL DEFAULT 0,
  ticket_price_max INT UNSIGNED NOT NULL DEFAULT 0,
  suggested_duration SMALLINT UNSIGNED NOT NULL DEFAULT 120,
  suitable_audiences JSON NOT NULL DEFAULT (JSON_ARRAY()),
  best_seasons JSON NOT NULL DEFAULT (JSON_ARRAY()),
  rating DECIMAL(3,2) NOT NULL DEFAULT 4.50,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  popularity INT UNSIGNED NOT NULL DEFAULT 0,
  embedding_point_id VARCHAR(64) NULL,
  embedding_model VARCHAR(64) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attractions_destination (destination_id, is_active),
  KEY idx_attractions_activity (activity_id),
  CONSTRAINT fk_attractions_destination FOREIGN KEY (destination_id) REFERENCES destinations (id),
  CONSTRAINT fk_attractions_activity FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destination_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_destination_tag (destination_id, tag_id),
  CONSTRAINT fk_dt_dest FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE CASCADE,
  CONSTRAINT fk_dt_tag FOREIGN KEY (tag_id) REFERENCES travel_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attraction_tags (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attraction_id BIGINT UNSIGNED NOT NULL,
  tag_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_attraction_tag (attraction_id, tag_id),
  CONSTRAINT fk_at_attr FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE,
  CONSTRAINT fk_at_tag FOREIGN KEY (tag_id) REFERENCES travel_tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  budget_min INT UNSIGNED NULL,
  budget_max INT UNSIGNED NULL,
  trip_types JSON NOT NULL DEFAULT (JSON_ARRAY()),
  preference_tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_profiles_user (user_id),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_embeddings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  embedding_point_id VARCHAR(64) NOT NULL,
  model VARCHAR(64) NOT NULL DEFAULT 'text-embedding-3-small',
  source_text_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_embeddings_user (user_id),
  CONSTRAINT fk_user_embeddings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS travel_favorites (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('destination','attraction') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_travel_fav (user_id, target_type, target_id),
  CONSTRAINT fk_travel_fav_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS travel_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  attraction_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  content TEXT NULL,
  is_recommended BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_travel_reviews_attr (attraction_id),
  CONSTRAINT fk_travel_reviews_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_travel_reviews_attr FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS browse_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  target_type ENUM('destination','attraction') NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  dwell_seconds INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_browse_user (user_id, created_at DESC),
  CONSTRAINT fk_browse_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trips (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  destination_id BIGINT UNSIGNED NULL,
  title VARCHAR(120) NOT NULL,
  days TINYINT UNSIGNED NOT NULL DEFAULT 1,
  travelers TINYINT UNSIGNED NOT NULL DEFAULT 1,
  budget INT UNSIGNED NULL,
  trip_type VARCHAR(32) NULL,
  preferences JSON NOT NULL DEFAULT (JSON_ARRAY()),
  source ENUM('manual','ai_generated') NOT NULL DEFAULT 'manual',
  ai_task_id CHAR(36) NULL,
  status ENUM('draft','planned','ongoing','completed','cancelled') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trips_user (user_id),
  CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_trips_dest FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id BIGINT UNSIGNED NOT NULL,
  day_no TINYINT UNSIGNED NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  item_type ENUM('attraction','meal','transport','note') NOT NULL DEFAULT 'attraction',
  attraction_id BIGINT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  duration VARCHAR(64) NULL,
  price VARCHAR(64) NULL,
  tips TEXT NULL,
  theme VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trip_items (trip_id, day_no),
  CONSTRAINT fk_trip_items_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_items_attr FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  request_params JSON NOT NULL,
  attraction_id BIGINT UNSIGNED NOT NULL,
  final_score DECIMAL(6,4) NOT NULL,
  rec_strategies JSON NOT NULL DEFAULT (JSON_ARRAY()),
  match_tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  ai_reason VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rec_logs_user (user_id),
  CONSTRAINT fk_rec_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_rec_logs_attr FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  task_id CHAR(36) NOT NULL,
  task_type ENUM('trip_generate','recommend_reason','semantic_search') NOT NULL,
  input_params JSON NOT NULL,
  output_result JSON NULL,
  model VARCHAR(64) NULL,
  status ENUM('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_logs_task (task_id),
  CONSTRAINT fk_ai_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
