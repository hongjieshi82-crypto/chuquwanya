-- 已注册用户头像补齐：对仍未设置头像的记录，使用主页左上角 logo 占位。
UPDATE users
SET avatar_uri = '/assets/home-brand-logo.png'
WHERE auth_type = 'registered'
  AND (avatar_uri IS NULL OR avatar_uri = '');
