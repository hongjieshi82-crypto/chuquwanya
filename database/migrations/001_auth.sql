-- 登录注册：扩展 users 表（增量迁移，migrate 脚本会忽略已存在的列）
ALTER TABLE users MODIFY device_id VARCHAR(128) NULL;
ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER device_id;
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER phone;
ALTER TABLE users ADD COLUMN auth_type ENUM('guest', 'registered') NOT NULL DEFAULT 'guest' AFTER password_hash;
ALTER TABLE users ADD UNIQUE KEY uk_users_phone (phone);
