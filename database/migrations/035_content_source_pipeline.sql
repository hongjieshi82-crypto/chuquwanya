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

ALTER TABLE activities
  ADD COLUMN place_key VARCHAR(180) NULL AFTER source_url,
  ADD COLUMN suitable_periods JSON NOT NULL DEFAULT (JSON_ARRAY()) AFTER place_key,
  ADD COLUMN source_confidence TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER suitable_periods,
  ADD KEY idx_activities_place_key (city_id, place_key);

UPDATE activities
SET
  place_key = LOWER(REPLACE(CONCAT(city_id, ':', COALESCE(address, title)), ' ', '')),
  suitable_periods = CASE
    WHEN environment = 'indoor' THEN JSON_ARRAY('morning', 'afternoon')
    ELSE JSON_ARRAY('morning', 'afternoon', 'evening')
  END,
  source_confidence = CASE
    WHEN source_type = 'manual' THEN 80
    WHEN source_type IN ('amap', 'dianping_import') THEN 65
    ELSE 50
  END
WHERE place_key IS NULL;
