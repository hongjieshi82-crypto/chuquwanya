CREATE TABLE IF NOT EXISTS cities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  supabase_user_id VARCHAR(36) NULL,
  name VARCHAR(64) NOT NULL,
  code VARCHAR(32) NOT NULL,
  province VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cities_code (code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  device_id VARCHAR(128) NULL,
  phone VARCHAR(20) NULL,
  email VARCHAR(255) NULL,
  password_hash VARCHAR(255) NULL,
  auth_type ENUM('guest', 'registered') NOT NULL DEFAULT 'guest',
  nickname VARCHAR(64) NOT NULL DEFAULT '出门体验官',
  avatar_uri VARCHAR(500) NULL,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_device_id (device_id),
  UNIQUE KEY uk_users_supabase_user_id (supabase_user_id),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(120) NOT NULL,
  summary VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(32) NOT NULL,
  mood VARCHAR(32) NOT NULL,
  mood_tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  environment ENUM('indoor', 'outdoor', 'either') NOT NULL DEFAULT 'either',
  rain_friendly ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown',
  heat_sensitive ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown',
  wind_sensitive ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown',
  weather_notes VARCHAR(255) NULL,
  last_verified_at DATETIME NULL,
  opening_hours JSON NULL,
  reservation_required ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown',
  reservation_url VARCHAR(500) NULL,
  content_status ENUM('draft', 'review', 'published', 'archived') NOT NULL DEFAULT 'published',
  content_score TINYINT UNSIGNED NOT NULL DEFAULT 0,
  quality_issues JSON NOT NULL DEFAULT (JSON_ARRAY()),
  source_type VARCHAR(32) NULL,
  source_url VARCHAR(500) NULL,
  place_key VARCHAR(180) NULL,
  suitable_periods JSON NOT NULL DEFAULT (JSON_ARRAY()),
  source_confidence TINYINT UNSIGNED NOT NULL DEFAULT 0,
  min_party_size TINYINT UNSIGNED NOT NULL DEFAULT 1,
  max_party_size TINYINT UNSIGNED NOT NULL DEFAULT 6,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  budget_yuan SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  city_distance_km DECIMAL(5,2) NOT NULL DEFAULT 0,
  district VARCHAR(64) NOT NULL,
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  navigation_url VARCHAR(500) NULL,
  cover_image VARCHAR(500) NULL,
  steps JSON NOT NULL,
  tips JSON NOT NULL,
  accent_color CHAR(7) NOT NULL DEFAULT '#7357FF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activities_match (
    city_id,
    is_active,
    category,
    mood,
    environment,
    duration_minutes,
    budget_yuan
  ),
  KEY idx_activities_content_admission (city_id, is_active, content_status, content_score),
  KEY idx_activities_place_key (city_id, place_key),
  CONSTRAINT fk_activities_city
    FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS content_sources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  platform ENUM('official', 'amap', 'xiaohongshu', 'douyin', 'bilibili', 'wechat', 'user', 'manual') NOT NULL,
  source_url VARCHAR(700) NULL,
  source_title VARCHAR(255) NULL,
  author_name VARCHAR(120) NULL,
  published_at DATETIME NULL,
  captured_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  usage_role ENUM('fact', 'inspiration', 'both') NOT NULL DEFAULT 'inspiration',
  verification_status ENUM('unverified', 'cross_checked', 'verified', 'rejected') NOT NULL DEFAULT 'unverified',
  rights_note VARCHAR(255) NULL,
  extracted_signals JSON NOT NULL DEFAULT (JSON_ARRAY()),
  PRIMARY KEY (id),
  KEY idx_content_sources_platform_status (platform, verification_status),
  UNIQUE KEY uk_content_source_url (source_url)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trip_support_pois (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  kind ENUM('restaurant','cafe','hotel','nightlife') NOT NULL,
  tier ENUM('budget','standard','premium','luxury') NOT NULL DEFAULT 'standard',
  address VARCHAR(255) NOT NULL,
  district VARCHAR(80) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  avg_price_yuan SMALLINT UNSIGNED NULL,
  tags JSON NOT NULL DEFAULT (JSON_ARRAY()),
  cover_image VARCHAR(500) NULL,
  source_type VARCHAR(32) NOT NULL DEFAULT 'amap',
  source_url VARCHAR(500) NULL,
  verification_status ENUM('unverified','source_checked','verified','rejected') NOT NULL DEFAULT 'source_checked',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_trip_support_city_kind_name (city_id, kind, name),
  KEY idx_trip_support_match (city_id, kind, tier, is_active),
  CONSTRAINT fk_trip_support_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_source_links (
  activity_id BIGINT UNSIGNED NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  relation_role ENUM('fact', 'inspiration', 'both') NOT NULL DEFAULT 'inspiration',
  notes VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (activity_id, source_id),
  CONSTRAINT fk_activity_source_activity FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_source_source FOREIGN KEY (source_id) REFERENCES content_sources(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS draw_sessions (
  id CHAR(36) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  city_id BIGINT UNSIGNED NOT NULL,
  attempts_used TINYINT UNSIGNED NOT NULL DEFAULT 0,
  preferences JSON NOT NULL,
  status ENUM('active', 'confirmed', 'abandoned') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_draw_sessions_user_created (user_id, created_at),
  CONSTRAINT fk_draw_sessions_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_draw_sessions_city
    FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS draw_results (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  draw_session_id CHAR(36) NOT NULL,
  activity_id BIGINT UNSIGNED NOT NULL,
  attempt_no TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_draw_result_attempt (draw_session_id, attempt_no),
  UNIQUE KEY uk_draw_result_activity (draw_session_id, activity_id),
  CONSTRAINT fk_draw_results_session
    FOREIGN KEY (draw_session_id) REFERENCES draw_sessions (id),
  CONSTRAINT fk_draw_results_activity
    FOREIGN KEY (activity_id) REFERENCES activities (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS todos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  activity_id BIGINT UNSIGNED NOT NULL,
  draw_session_id CHAR(36) NULL,
  scheduled_date DATE NOT NULL,
  week_start_date DATE NOT NULL,
  source ENUM('draw', 'manual') NOT NULL DEFAULT 'draw',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled')
    NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  cancelled_at TIMESTAMP NULL,
  submitted_at TIMESTAMP NULL,
  review_status ENUM('none', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'none',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_todos_user_status_created (user_id, status, created_at),
  KEY idx_todos_user_week_status (user_id, week_start_date, status, scheduled_date),
  CONSTRAINT fk_todos_user
    FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_todos_activity
    FOREIGN KEY (activity_id) REFERENCES activities (id),
  CONSTRAINT fk_todos_draw_session
    FOREIGN KEY (draw_session_id) REFERENCES draw_sessions (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_memberships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  tier ENUM('vip') NOT NULL,
  status ENUM('active', 'cancelled', 'expired') NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_memberships_active (user_id, status, starts_at, expires_at),
  CONSTRAINT fk_user_memberships_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS membership_orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  product_code VARCHAR(32) NOT NULL DEFAULT 'vip_month',
  provider ENUM('alipay') NOT NULL DEFAULT 'alipay',
  provider_trade_no VARCHAR(64) NULL,
  amount_cents INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CNY',
  status ENUM('pending', 'paid', 'closed', 'failed') NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  raw_notify_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_membership_orders_order_no (order_no),
  KEY idx_membership_orders_user_status (user_id, status, created_at),
  CONSTRAINT fk_membership_orders_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_weekly_todo_usage (
  user_id BIGINT UNSIGNED NOT NULL,
  week_start_date DATE NOT NULL,
  limit_count TINYINT UNSIGNED NOT NULL,
  used_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, week_start_date),
  CONSTRAINT fk_user_weekly_todo_usage_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS todo_completion_submissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  todo_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  feeling_text VARCHAR(500) NOT NULL,
  visibility ENUM('private', 'public_requested', 'public') NOT NULL DEFAULT 'private',
  review_status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_todo_completion_submissions_user (user_id, submitted_at),
  KEY idx_todo_completion_submissions_review (review_status, submitted_at),
  CONSTRAINT fk_todo_completion_submissions_todo
    FOREIGN KEY (todo_id) REFERENCES todos (id) ON DELETE CASCADE,
  CONSTRAINT fk_todo_completion_submissions_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS community_user_follows (
  follower_user_id BIGINT UNSIGNED NOT NULL,
  followed_user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_user_id, followed_user_id),
  KEY idx_community_user_follows_followed_created (followed_user_id, created_at),
  CONSTRAINT fk_community_user_follows_follower
    FOREIGN KEY (follower_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_community_user_follows_followed
    FOREIGN KEY (followed_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chk_community_user_follows_not_self
    CHECK (follower_user_id <> followed_user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS completion_attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id BIGINT UNSIGNED NOT NULL,
  object_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(80) NOT NULL,
  size_bytes INT UNSIGNED NOT NULL,
  checksum CHAR(64) NULL,
  status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_completion_attachments_submission (submission_id),
  CONSTRAINT fk_completion_attachments_submission
    FOREIGN KEY (submission_id) REFERENCES todo_completion_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;
