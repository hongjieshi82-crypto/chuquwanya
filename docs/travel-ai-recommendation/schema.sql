-- ============================================================
-- 旅游 AI 推荐系统 — MySQL 8.0+ 完整建表脚本
-- 向量数据存储在 Qdrant，MySQL 仅存 embedding_point_id 引用
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS travel_ai
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE travel_ai;

-- ------------------------------------------------------------
-- 用户与偏好
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email         VARCHAR(128) NULL,
  phone         VARCHAR(20)  NULL,
  password_hash VARCHAR(255) NOT NULL,
  nickname      VARCHAR(64)  NOT NULL DEFAULT '旅行者',
  avatar_url    VARCHAR(500) NULL,
  gender        ENUM('male','female','other','unknown') NOT NULL DEFAULT 'unknown',
  age_group     ENUM('18-25','26-35','36-45','46-60','60+','unknown') NOT NULL DEFAULT 'unknown',
  city          VARCHAR(64)  NULL COMMENT '所在城市',
  status        ENUM('active','banned','deleted') NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMP    NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profiles (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  bio             VARCHAR(500) NULL,
  budget_min      INT UNSIGNED NULL COMMENT '单次出行预算下限（元）',
  budget_max      INT UNSIGNED NULL COMMENT '单次出行预算上限（元）',
  trip_types      JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '出行类型：情侣游/亲子游等',
  preference_tags JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '偏好标签 ID 或名称',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_profiles_user (user_id),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_embeddings (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  embedding_point_id  VARCHAR(64)  NOT NULL COMMENT 'Qdrant point UUID',
  model               VARCHAR(64)  NOT NULL DEFAULT 'text-embedding-3-small',
  dimensions          SMALLINT UNSIGNED NOT NULL DEFAULT 1536,
  source_text_hash    CHAR(64)     NOT NULL COMMENT '偏好文本 SHA256，用于缓存失效',
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_embeddings_user (user_id),
  KEY idx_user_embeddings_point (embedding_point_id),
  CONSTRAINT fk_user_embeddings_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 标签体系
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tags (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(32)  NOT NULL,
  category    ENUM('scene','audience','season','theme','food','other') NOT NULL DEFAULT 'theme',
  icon        VARCHAR(64)  NULL,
  sort_order  SMALLINT     NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tags_name (name),
  KEY idx_tags_category (category, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 目的地
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS destinations (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(64)  NOT NULL,
  province        VARCHAR(64)  NULL,
  country         VARCHAR(64)  NOT NULL DEFAULT '中国',
  summary         VARCHAR(500) NOT NULL,
  description     TEXT         NULL,
  cover_image     VARCHAR(500) NULL,
  best_seasons    JSON         NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '["春","夏"]',
  avg_cost_per_day INT UNSIGNED NULL COMMENT '人均每日消费（元）',
  rating          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count    INT UNSIGNED NOT NULL DEFAULT 0,
  popularity      INT UNSIGNED NOT NULL DEFAULT 0,
  embedding_point_id VARCHAR(64) NULL COMMENT '目的地语义向量 ID',
  is_hot          BOOLEAN      NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_destinations_hot (is_hot, popularity DESC),
  KEY idx_destinations_rating (rating DESC),
  FULLTEXT KEY ft_destinations_search (name, summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destination_tags (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id  BIGINT UNSIGNED NOT NULL,
  tag_id          BIGINT UNSIGNED NOT NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_destination_tag (destination_id, tag_id),
  KEY idx_destination_tags_tag (tag_id),
  CONSTRAINT fk_destination_tags_dest FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE CASCADE,
  CONSTRAINT fk_destination_tags_tag  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 景点
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attractions (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  destination_id      BIGINT UNSIGNED NOT NULL,
  name                VARCHAR(120) NOT NULL,
  summary             VARCHAR(500) NOT NULL,
  description         TEXT         NULL,
  cover_image         VARCHAR(500) NULL,
  images              JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  address             VARCHAR(255) NOT NULL,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  open_time           VARCHAR(128) NULL COMMENT '如 08:00-18:00',
  ticket_price_min    INT UNSIGNED NOT NULL DEFAULT 0,
  ticket_price_max    INT UNSIGNED NOT NULL DEFAULT 0,
  suggested_duration  SMALLINT UNSIGNED NOT NULL DEFAULT 120 COMMENT '建议游玩分钟数',
  suitable_audiences  JSON NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '["情侣","亲子"]',
  best_seasons        JSON NOT NULL DEFAULT (JSON_ARRAY()),
  rating              DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count        INT UNSIGNED NOT NULL DEFAULT 0,
  popularity          INT UNSIGNED NOT NULL DEFAULT 0,
  embedding_point_id  VARCHAR(64)  NULL COMMENT 'Qdrant 向量点 ID',
  embedding_model     VARCHAR(64)  NULL DEFAULT 'text-embedding-3-small',
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attractions_destination (destination_id, is_active),
  KEY idx_attractions_rating (rating DESC),
  KEY idx_attractions_popularity (popularity DESC),
  KEY idx_attractions_price (ticket_price_max),
  KEY idx_attractions_embedding (embedding_point_id),
  FULLTEXT KEY ft_attractions_search (name, summary),
  CONSTRAINT fk_attractions_destination FOREIGN KEY (destination_id) REFERENCES destinations (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attraction_tags (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attraction_id BIGINT UNSIGNED NOT NULL,
  tag_id        BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_attraction_tag (attraction_id, tag_id),
  KEY idx_attraction_tags_tag (tag_id),
  CONSTRAINT fk_attraction_tags_attr FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE,
  CONSTRAINT fk_attraction_tags_tag  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 收藏 / 评价 / 浏览
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS favorites (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  target_type   ENUM('destination','attraction') NOT NULL,
  target_id     BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_favorites_user_target (user_id, target_type, target_id),
  KEY idx_favorites_target (target_type, target_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  attraction_id BIGINT UNSIGNED NOT NULL,
  rating        TINYINT UNSIGNED NOT NULL COMMENT '1-5',
  content       TEXT         NULL,
  images        JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  visit_date    DATE         NULL,
  is_recommended BOOLEAN     NOT NULL DEFAULT TRUE,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_attraction (attraction_id, status),
  KEY idx_reviews_user (user_id),
  CONSTRAINT fk_reviews_user       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_attraction FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS browse_history (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  target_type   ENUM('destination','attraction') NOT NULL,
  target_id     BIGINT UNSIGNED NOT NULL,
  dwell_seconds INT UNSIGNED NULL COMMENT '停留时长（秒）',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_browse_user_time (user_id, created_at DESC),
  KEY idx_browse_target (target_type, target_id),
  CONSTRAINT fk_browse_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 行程
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS trips (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NOT NULL,
  destination_id  BIGINT UNSIGNED NULL,
  title           VARCHAR(120) NOT NULL,
  start_date      DATE         NULL,
  end_date        DATE         NULL,
  days            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  travelers       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  budget          INT UNSIGNED NULL,
  trip_type       VARCHAR(32)  NULL,
  preferences     JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  notes           TEXT         NULL,
  source          ENUM('manual','ai_generated') NOT NULL DEFAULT 'manual',
  ai_task_id      CHAR(36)     NULL,
  status          ENUM('draft','planned','ongoing','completed','cancelled') NOT NULL DEFAULT 'draft',
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trips_user (user_id, status),
  KEY idx_trips_destination (destination_id),
  CONSTRAINT fk_trips_user        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_trips_destination FOREIGN KEY (destination_id) REFERENCES destinations (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trip_items (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  trip_id       BIGINT UNSIGNED NOT NULL,
  day_no        TINYINT UNSIGNED NOT NULL,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  item_type     ENUM('attraction','meal','transport','note') NOT NULL DEFAULT 'attraction',
  attraction_id BIGINT UNSIGNED NULL,
  name          VARCHAR(120) NOT NULL,
  duration      VARCHAR(64)  NULL,
  price         VARCHAR(64)  NULL,
  tips          TEXT         NULL,
  theme         VARCHAR(64)  NULL COMMENT '当天主题，冗余便于查询',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_trip_items_trip_day (trip_id, day_no, sort_order),
  CONSTRAINT fk_trip_items_trip       FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE,
  CONSTRAINT fk_trip_items_attraction FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- AI 日志
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NULL,
  request_params  JSON         NOT NULL,
  attraction_id   BIGINT UNSIGNED NOT NULL,
  final_score     DECIMAL(6,4) NOT NULL,
  rough_score     DECIMAL(6,4) NULL,
  rec_strategies  JSON         NOT NULL DEFAULT (JSON_ARRAY()) COMMENT '["semantic","tag"]',
  match_tags      JSON         NOT NULL DEFAULT (JSON_ARRAY()),
  ai_reason       VARCHAR(500) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rec_logs_user (user_id, created_at DESC),
  KEY idx_rec_logs_attraction (attraction_id),
  CONSTRAINT fk_rec_logs_user       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_rec_logs_attraction FOREIGN KEY (attraction_id) REFERENCES attractions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ai_generation_logs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id         BIGINT UNSIGNED NULL,
  task_id         CHAR(36)     NOT NULL,
  task_type       ENUM('trip_generate','recommend_reason','semantic_search') NOT NULL,
  input_params    JSON         NOT NULL,
  output_result   JSON         NULL,
  model           VARCHAR(64)  NULL,
  status          ENUM('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
  error_message   TEXT         NULL,
  latency_ms      INT UNSIGNED NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ai_logs_task (task_id),
  KEY idx_ai_logs_user (user_id, created_at DESC),
  CONSTRAINT fk_ai_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 管理员（可选）
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(64)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('super','editor','viewer') NOT NULL DEFAULT 'editor',
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admins_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
