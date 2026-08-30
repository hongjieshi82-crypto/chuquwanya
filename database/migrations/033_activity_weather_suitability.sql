ALTER TABLE activities
  ADD COLUMN rain_friendly ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown' AFTER environment,
  ADD COLUMN heat_sensitive ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown' AFTER rain_friendly,
  ADD COLUMN wind_sensitive ENUM('yes', 'no', 'unknown') NOT NULL DEFAULT 'unknown' AFTER heat_sensitive,
  ADD COLUMN weather_notes VARCHAR(255) NULL AFTER wind_sensitive,
  ADD COLUMN last_verified_at DATETIME NULL AFTER weather_notes;

-- 为全部现有城市建立保守且可解释的初始规则；后续内容运营可逐条覆盖。
UPDATE activities
SET
  rain_friendly = CASE WHEN environment IN ('indoor', 'either') THEN 'yes' ELSE 'no' END,
  heat_sensitive = CASE WHEN environment = 'outdoor' THEN 'yes' ELSE 'no' END,
  wind_sensitive = CASE
    WHEN environment = 'outdoor' AND CONCAT(title, ' ', summary, ' ', description) REGEXP '海|湖|江|河|山|骑行|露营|登高|公园|步道'
      THEN 'yes'
    ELSE 'no'
  END,
  weather_notes = CASE
    WHEN environment = 'indoor' THEN '室内活动，普通降雨天气下可优先考虑'
    WHEN environment = 'either' THEN '包含室内或有遮蔽空间，恶劣天气仍需出发前确认'
    ELSE '户外活动，降雨、高温或大风时需谨慎安排'
  END,
  last_verified_at = CURRENT_TIMESTAMP;
