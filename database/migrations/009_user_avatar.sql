-- 用户头像：保存后端上传后的公开访问地址。
ALTER TABLE users ADD COLUMN avatar_uri VARCHAR(500) NULL AFTER nickname;
