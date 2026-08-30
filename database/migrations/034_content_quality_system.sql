ALTER TABLE activities
  ADD COLUMN opening_hours JSON NULL AFTER last_verified_at,
  ADD COLUMN reservation_required ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown' AFTER opening_hours,
  ADD COLUMN reservation_url VARCHAR(500) NULL AFTER reservation_required,
  ADD COLUMN content_status ENUM('draft', 'review', 'published', 'archived') NOT NULL DEFAULT 'published' AFTER reservation_url,
  ADD COLUMN content_score TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER content_status,
  ADD COLUMN quality_issues JSON NOT NULL DEFAULT (JSON_ARRAY()) AFTER content_score,
  ADD COLUMN source_type VARCHAR(32) NULL AFTER quality_issues,
  ADD COLUMN source_url VARCHAR(500) NULL AFTER source_type,
  ADD KEY idx_activities_content_admission (city_id, is_active, content_status, content_score);

UPDATE activities
SET
  source_type = COALESCE(source_type, 'manual'),
  reservation_required = CASE WHEN reservation_required = 'unknown' THEN 'no' ELSE reservation_required END,
  content_score =
    10
    + CASE WHEN address <> '' AND latitude IS NOT NULL AND longitude IS NOT NULL THEN 15 ELSE 0 END
    + CASE WHEN duration_minutes > 0 AND budget_yuan >= 0 THEN 15 ELSE 0 END
    + CASE WHEN rain_friendly <> 'unknown' AND heat_sensitive <> 'unknown' AND wind_sensitive <> 'unknown' THEN 15 ELSE 0 END
    + CASE WHEN JSON_LENGTH(steps) > 0 AND JSON_LENGTH(tips) > 0 THEN 15 ELSE 0 END
    + CASE WHEN navigation_url IS NOT NULL AND navigation_url <> '' THEN 5 ELSE 0 END
    + CASE WHEN cover_image IS NOT NULL AND cover_image <> '' THEN 5 ELSE 0 END
    + CASE WHEN opening_hours IS NOT NULL THEN 5 ELSE 0 END
    + 5
    + 5
    + CASE WHEN last_verified_at IS NOT NULL THEN 5 ELSE 0 END,
  quality_issues = JSON_ARRAY(),
  content_status = 'published'
WHERE content_status = 'published';
