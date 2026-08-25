UPDATE user_memberships
SET expires_at = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 MONTH)
WHERE tier = 'vip'
  AND status = 'active'
  AND expires_at IS NULL;
