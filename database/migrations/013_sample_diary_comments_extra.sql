INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 1, 71, NULL, '第一次去这条轮渡线，没想到晚上风景这么安静，适合拍照打卡。', '2026-06-25 18:10:00', '2026-06-25 18:10:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 1
    AND user_id = 71
    AND content = '第一次去这条轮渡线，没想到晚上风景这么安静，适合拍照打卡。'
);
SET @comment_1_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 1
    AND user_id = 71
    AND content = '第一次去这条轮渡线，没想到晚上风景这么安静，适合拍照打卡。'
  LIMIT 1
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 1, 55, @comment_1_1, '是啊，尤其是傍晚那段天很美，建议带一条轻薄外套。', '2026-06-25 18:22:00', '2026-06-25 18:22:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 1
    AND user_id = 55
    AND parent_comment_id = @comment_1_1
    AND content = '是啊，尤其是傍晚那段天很美，建议带一条轻薄外套。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 2, 72, NULL, '广东博物馆展陈舒服，行程插在上午更好，孩子也没太累。', '2026-06-25 10:05:00', '2026-06-25 10:05:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 2
    AND user_id = 72
    AND content = '广东博物馆展陈舒服，行程插在上午更好，孩子也没太累。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 3, 89, NULL, '这条小吃线确实有好吃的，但店家间隔距离有点近，早点去会更顺。', '2026-06-25 12:05:00', '2026-06-25 12:05:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 3
    AND user_id = 89
    AND content = '这条小吃线确实有好吃的，但店家间隔距离有点近，早点去会更顺。'
);
SET @comment_3_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 3
    AND user_id = 89
    AND content = '这条小吃线确实有好吃的，但店家间隔距离有点近，早点去会更顺。'
  LIMIT 1
);
INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 3, 91, @comment_3_1, '我按这个节奏去了，果然人少又能慢慢吃。', '2026-06-25 12:18:00', '2026-06-25 12:18:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 3
    AND user_id = 91
    AND parent_comment_id = @comment_3_1
    AND content = '我按这个节奏去了，果然人少又能慢慢吃。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 4, 1, NULL, '灵隐寺的人流一般，下午去会更从容，风也不大。', '2026-06-26 14:20:00', '2026-06-26 14:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 4
    AND user_id = 1
    AND content = '灵隐寺的人流一般，下午去会更从容，风也不大。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 4, 147, NULL, '同感，寺里如果带个小伞更安心，不用怕突发小雨。', '2026-06-26 14:35:00', '2026-06-26 14:35:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 4
    AND user_id = 147
    AND content = '同感，寺里如果带个小伞更安心，不用怕突发小雨。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 5, 55, NULL, '五台山店的书店氛围很有质感，文创区也很值得慢慢逛。', '2026-06-26 16:00:00', '2026-06-26 16:00:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 5
    AND user_id = 55
    AND content = '五台山店的书店氛围很有质感，文创区也很值得慢慢逛。'
);
SET @comment_5_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 5
    AND user_id = 55
    AND content = '五台山店的书店氛围很有质感，文创区也很值得慢慢逛。'
  LIMIT 1
);
INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 5, 72, @comment_5_1, '逛完书店出来还可以顺着小巷喝点东西，刚好休息会。', '2026-06-26 16:18:00', '2026-06-26 16:18:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 5
    AND user_id = 72
    AND parent_comment_id = @comment_5_1
    AND content = '逛完书店出来还可以顺着小巷喝点东西，刚好休息会。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 6, 80, NULL, '小南门早市早上人气高但有秩序，买点早点很舒服。', '2026-06-26 08:50:00', '2026-06-26 08:50:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 6
    AND user_id = 80
    AND content = '小南门早市早上人气高但有秩序，买点早点很舒服。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 7, 61, NULL, '版本馆信息说明做得很清楚，第一次去也能很快看懂。', '2026-06-26 10:30:00', '2026-06-26 10:30:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 7
    AND user_id = 61
    AND content = '版本馆信息说明做得很清楚，第一次去也能很快看懂。'
);
SET @comment_7_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 7
    AND user_id = 61
    AND content = '版本馆信息说明做得很清楚，第一次去也能很快看懂。'
  LIMIT 1
);
INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 7, 1, @comment_7_1, '我也是第一次去，真的没想到有这么多互动装置。', '2026-06-26 10:44:00', '2026-06-26 10:44:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 7
    AND user_id = 1
    AND parent_comment_id = @comment_7_1
    AND content = '我也是第一次去，真的没想到有这么多互动装置。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 8, 89, NULL, '杜甫草堂外景拍照点很舒服，建议避开中午。', '2026-06-26 11:20:00', '2026-06-26 11:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 8
    AND user_id = 89
    AND content = '杜甫草堂外景拍照点很舒服，建议避开中午。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 9, 91, NULL, '南京眼夜景真的值得专门预留20分钟拍全景。', '2026-06-27 19:05:00', '2026-06-27 19:05:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 9
    AND user_id = 91
    AND content = '南京眼夜景真的值得专门预留20分钟拍全景。'
);
SET @comment_9_1 := (
  SELECT id
  FROM diary_comments
  WHERE diary_id = 9
    AND user_id = 91
    AND content = '南京眼夜景真的值得专门预留20分钟拍全景。'
  LIMIT 1
);
INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 9, 55, @comment_9_1, '人多的时候站位更早占，前面留点空隙会拍得更自由。', '2026-06-27 19:20:00', '2026-06-27 19:20:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 9
    AND user_id = 55
    AND parent_comment_id = @comment_9_1
    AND content = '人多的时候站位更早占，前面留点空隙会拍得更自由。'
);

INSERT INTO diary_comments (diary_id, user_id, parent_comment_id, content, created_at, updated_at)
SELECT 10, 72, NULL, '轮渡版反复去都不腻，沿线风景和光线变化挺明显。', '2026-06-27 18:00:00', '2026-06-27 18:00:00'
WHERE NOT EXISTS (
  SELECT 1
  FROM diary_comments
  WHERE diary_id = 10
    AND user_id = 72
    AND content = '轮渡版反复去都不腻，沿线风景和光线变化挺明显。'
);

