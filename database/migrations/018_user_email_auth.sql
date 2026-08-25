-- 邮箱验证码登录：保留旧手机号字段，新增邮箱作为新的登录账号标识
ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER phone;
ALTER TABLE users ADD UNIQUE KEY uk_users_email (email);
