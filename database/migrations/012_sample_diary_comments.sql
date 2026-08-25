INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  100,
  1,
  NULL,
  '【测试】这条轮渡线真的很适合下午散步，安静又不失惊喜。',
  '2026-06-24 12:10:00',
  '2026-06-24 12:10:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 100
    AND user_id = 1
    AND content = '【测试】这条轮渡线真的很适合下午散步，安静又不失惊喜。'
);
SET @comment_100_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 100
    AND user_id = 1
    AND content = '【测试】这条轮渡线真的很适合下午散步，安静又不失惊喜。'
  LIMIT 1
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 100, 55, @comment_100_1, '【测试】同感，拍了不少照片，夕阳时分特别好看。', '2026-06-24 12:20:00', '2026-06-24 12:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 100
    AND user_id = 55
    AND parent_comment_id = @comment_100_1
    AND content = '【测试】同感，拍了不少照片，夕阳时分特别好看。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 100, 61, @comment_100_1, '【测试】我们下次也想试试这条线，路线人流不算太多。', '2026-06-24 12:30:00', '2026-06-24 12:30:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 100
    AND user_id = 61
    AND parent_comment_id = @comment_100_1
    AND content = '【测试】我们下次也想试试这条线，路线人流不算太多。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  99,
  2,
  NULL,
  '【测试】浴鹄湾的巷子设计很好，走起来很安心。',
  '2026-06-23 09:05:00',
  '2026-06-23 09:05:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 99
    AND user_id = 2
    AND content = '【测试】浴鹄湾的巷子设计很好，走起来很安心。'
);
SET @comment_99_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 99
    AND user_id = 2
    AND content = '【测试】浴鹄湾的巷子设计很好，走起来很安心。'
  LIMIT 1
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 99, 61, @comment_99_1, '【测试】确实非常适合散步和聊天，尤其是下雨天。', '2026-06-23 09:18:00', '2026-06-23 09:18:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 99
    AND user_id = 61
    AND parent_comment_id = @comment_99_1
    AND content = '【测试】确实非常适合散步和聊天，尤其是下雨天。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  98,
  55,
  NULL,
  '【测试】海上世界晚间灯光很舒服，顺路逛起来很舒服。',
  '2026-06-23 10:20:00',
  '2026-06-23 10:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 98
    AND user_id = 55
    AND content = '【测试】海上世界晚间灯光很舒服，顺路逛起来很舒服。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  98,
  61,
  NULL,
  '【测试】人太少了，拍夜景和拍照都很轻松。',
  '2026-06-23 10:35:00',
  '2026-06-23 10:35:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 98
    AND user_id = 61
    AND content = '【测试】人太少了，拍夜景和拍照都很轻松。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  97,
  71,
  NULL,
  '【测试】版本馆这次线索说明很清楚，适合没什么计划的人。',
  '2026-06-22 18:20:00',
  '2026-06-22 18:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 97
    AND user_id = 71
    AND content = '【测试】版本馆这次线索说明很清楚，适合没什么计划的人。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  96,
  72,
  NULL,
  '【测试】青龙寺的绿化真的很赞，走完后心情都轻松了。',
  '2026-06-21 20:40:00',
  '2026-06-21 20:40:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 96
    AND user_id = 72
    AND content = '【测试】青龙寺的绿化真的很赞，走完后心情都轻松了。'
);
SET @comment_96_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 96
    AND user_id = 72
    AND content = '【测试】青龙寺的绿化真的很赞，走完后心情都轻松了。'
  LIMIT 1
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 96, 89, @comment_96_1, '【测试】我也去过，傍晚那段路特别适合散步。', '2026-06-21 20:48:00', '2026-06-21 20:48:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 96
    AND user_id = 89
    AND parent_comment_id = @comment_96_1
    AND content = '【测试】我也去过，傍晚那段路特别适合散步。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  95,
  1,
  NULL,
  '【测试】西湾红树林公园很适合带朋友去，环境一整天都舒服。',
  '2026-06-21 20:05:00',
  '2026-06-21 20:05:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 95
    AND user_id = 1
    AND content = '【测试】西湾红树林公园很适合带朋友去，环境一整天都舒服。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 95, 55, (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 95
    AND user_id = 1
    AND content = '【测试】西湾红树林公园很适合带朋友去，环境一整天都舒服。'
  LIMIT 1
), '【测试】这波描述太对了，真的太舒适了！', '2026-06-21 20:12:00', '2026-06-21 20:12:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments dc
  INNER JOIN (
    SELECT id
    FROM diary_comments
    WHERE diary_id = 95
      AND user_id = 1
      AND content = '【测试】西湾红树林公园很适合带朋友去，环境一整天都舒服。'
    LIMIT 1
  ) AS parent_comment ON parent_comment.id = dc.parent_comment_id
  WHERE dc.diary_id = 95
    AND dc.user_id = 55
    AND dc.content = '【测试】这波描述太对了，真的太舒适了！'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  94,
  61,
  NULL,
  '【测试】老门东这条街的人情味很特别，逛完后很满足。',
  '2026-06-21 19:22:00',
  '2026-06-21 19:22:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 94
    AND user_id = 61
    AND content = '【测试】老门东这条街的人情味很特别，逛完后很满足。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  94,
  89,
  (
    SELECT id
    FROM diary_comments
    WHERE diary_id = 94
      AND user_id = 61
      AND content = '【测试】老门东这条街的人情味很特别，逛完后很满足。'
    LIMIT 1
  ),
  '【测试】下次可以早点去，人气会更自然一点。',
  '2026-06-21 19:35:00',
  '2026-06-21 19:35:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 94
    AND user_id = 89
    AND parent_comment_id = (
      SELECT id
      FROM diary_comments
      WHERE diary_id = 94
        AND user_id = 61
        AND content = '【测试】老门东这条街的人情味很特别，逛完后很满足。'
      LIMIT 1
    )
    AND content = '【测试】下次可以早点去，人气会更自然一点。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  93,
  71,
  NULL,
  '【测试】南京眼步行桥风景线清晰，适合拍照。',
  '2026-06-21 18:55:00',
  '2026-06-21 18:55:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 93
    AND user_id = 71
    AND content = '【测试】南京眼步行桥风景线清晰，适合拍照。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  92,
  72,
  NULL,
  '【测试】西安城墙的日落真的很值得留意，天慢慢变色很漂亮。',
  '2026-06-21 17:40:00',
  '2026-06-21 17:40:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 92
    AND user_id = 72
    AND content = '【测试】西安城墙的日落真的很值得留意，天慢慢变色很漂亮。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT
  91,
  55,
  NULL,
  '【测试】楚河汉街的夜景氛围太好，适合拉着朋友慢慢看。',
  '2026-06-17 20:20:00',
  '2026-06-17 20:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 91
    AND user_id = 55
    AND content = '【测试】楚河汉街的夜景氛围太好，适合拉着朋友慢慢看。'
);

SET @comment_91_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 91
    AND user_id = 55
    AND content = '【测试】楚河汉街的夜景氛围太好，适合拉着朋友慢慢看。'
  LIMIT 1
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 91, 147, @comment_91_1, '【测试】这个时段去正好有灯光秀，值得再来一趟。', '2026-06-17 20:35:00', '2026-06-17 20:35:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 91
    AND user_id = 147
    AND parent_comment_id = @comment_91_1
    AND content = '【测试】这个时段去正好有灯光秀，值得再来一趟。'
);
