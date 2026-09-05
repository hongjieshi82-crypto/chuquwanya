ALTER TABLE users
  ADD COLUMN supabase_user_id VARCHAR(36) NULL AFTER id,
  ADD UNIQUE KEY uk_users_supabase_user_id (supabase_user_id);
