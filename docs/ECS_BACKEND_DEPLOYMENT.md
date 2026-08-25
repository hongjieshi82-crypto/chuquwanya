# 粗去玩鸭·ECS 后端部署

这套配置先上线与面试演示直接相关的主闭环：

- Node.js + Express API
- MySQL 8.4 持久化数据
- 硅基流动 LLM / Embedding 真实模型调用
- 高德 Web 服务地址解析与距离校验
- 可选 Chroma 语义召回（未启动时自动回退 MySQL 候选池）

VIP、支付、短信和社区不在第一版上线范围内。

## 1. ECS 最低建议

- Ubuntu 22.04 / 24.04 64 位
- 2 vCPU
- 2 GB 内存可运行低内存 API + MySQL；同时运行 Chroma 时建议 4 GB
- 40 GB 系统盘
- 安全组暂时只放行 SSH 22；有域名后再放行 80/443

MySQL 3306、API 3001 和 Chroma 8000 均不对公网开放。

2 GB 机型已在 Compose 中将 MySQL 限制为 512 MB、API 限制为 384 MB；请不要启动 `vector` profile。
生产模板默认设置 `CHROMA_ENABLED=false`，避免未运行 Chroma 时每次抽卡额外请求 Embedding 并等待超时。

## 2. 准备生产环境变量

```bash
cp deploy/production.env.example deploy/production.env
chmod 600 deploy/production.env
```

至少替换：

- `DB_PASSWORD`
- `MYSQL_PASSWORD`（与 `DB_PASSWORD` 保持一致）
- `MYSQL_ROOT_PASSWORD`
- `JWT_SECRET`
- `SILICONFLOW_API_KEY`
- `AMAP_WEB_SERVICE_KEY`

生成随机密钥可使用：

```bash
openssl rand -hex 32
```

不要把 `deploy/production.env` 上传到 GitHub，也不要在聊天截图中展示它。

## 3. 启动基础后端

```bash
docker compose \
  --env-file deploy/production.env \
  -f compose.ecs.yml \
  up -d --build mysql api
```

API 容器会等待 MySQL 健康，执行建表、种子数据和迁移，然后启动服务。

查看状态：

```bash
docker compose --env-file deploy/production.env -f compose.ecs.yml ps
docker compose --env-file deploy/production.env -f compose.ecs.yml logs -f api
curl http://127.0.0.1:3001/api/v1/health
curl http://127.0.0.1:3001/api/v1/travel/status
```

## 4. 启用向量召回（可选）

当 ECS 内存不小于 4 GB 时：

```bash
sed -i 's/^CHROMA_ENABLED=.*/CHROMA_ENABLED=true/' deploy/production.env
docker compose \
  --profile vector \
  --env-file deploy/production.env \
  -f compose.ecs.yml \
  up -d chroma api

docker compose \
  --profile vector \
  --env-file deploy/production.env \
  -f compose.ecs.yml \
  exec api node dist/scripts/syncActivityVectors.js
```

`/api/v1/travel/status` 中的 `chromaAvailable` 应为 `true`。

## 5. 域名和 HTTPS（后续）

域名备案通过后，由 Nginx 监听 443，将 `/api/` 反向代理到 `127.0.0.1:3001`。前端的 `EXPO_PUBLIC_API_URL` 再改为线上 HTTPS API 地址。

## 6. 备份与回滚

更新前先备份 MySQL：

```bash
docker compose --env-file deploy/production.env -f compose.ecs.yml \
  exec -T mysql sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction "$MYSQL_DATABASE"' \
  > "backup-$(date +%Y%m%d-%H%M%S).sql"
```

应用更新：

```bash
git pull --ff-only
docker compose --env-file deploy/production.env -f compose.ecs.yml up -d --build api
```

容器日志和健康检查通过后，再更新前端 API 地址。
