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
