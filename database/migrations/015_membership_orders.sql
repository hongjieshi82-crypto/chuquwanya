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
