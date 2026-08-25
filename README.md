# 粗去玩鸭 Chuqu Wanya

一个同时覆盖手机 H5 和 PC Web 的 AI 周末旅行盲盒：根据出发地、时间、预算和心情，生成一个现在就能执行的出游方案。

核心原则：少做选择题，只给一个当下可执行的出门方案。

## 当前保留的主闭环

```text
选择城市 / 位置、时间、预算和心情
  -> 生成一个可执行方案
  -> 查看地点、路线和推荐理由
  -> 加入本周计划
  -> 开始 / 完成 / 取消
  -> 留下简单完成反馈
```

## 跨端界面

- 桌面浏览器访问 `/`：进入新版 PC 宽屏首页。
- 手机浏览器访问同一个 `/`：进入同一套产品的响应式移动布局。
- iOS / Android：共用 Expo + React Native 手机界面。
- PC 主要页面：`/pc`、`/box/config`、`/destinations`、`/trips`。

## 城市覆盖

当前内置 18 座城市，按“AI 产业城市 + 省会城市 + 强旅游城市”组合：

- 既有城市：北京、上海、杭州、深圳、天津、烟台
- 扩充城市：青岛、南京、武汉、成都、西安、长沙、广州、合肥、重庆、厦门、济南、昆明

每座城市都包含城市实景封面、经纬度和至少一条可执行玩法；Web 端支持手动切换城市和浏览器定位。未收录城市会明确切换为全国探索，不会静默回退成北京。

## 暂缓能力

以下功能暂不出现在新版前端中：

- 登录注册与多端账号同步
- 签到、等级、成长和积分
- VIP、支付和订阅
- 社区、点赞、评论、关注和内容审核
- 复杂的预订、协作和商业化链路

后端中部分历史数据表与兼容代码仍保留，但不作为当前产品入口，避免破坏旧数据和迁移脚本。

## 项目结构

```text
apps/client   Expo + React Native + React Native Web
apps/api      Node.js + Express + TypeScript
database      MySQL 建表、迁移和演示数据
design        手机高保真稿与品牌视觉资产
docs          PRD 和 AI 推荐设计资料
```

## 本地运行

需要 Node.js 24、npm 11 和 MySQL 8。

```bash
npm --prefix apps/client ci
npm --prefix apps/api ci
npm run db:migrate
npm run dev:api
npm run dev:web
```

API 默认地址为 `http://localhost:3001/api/v1`，Web 默认由 Expo 开发服务提供。

## ECS 部署

仓库已提供 API + MySQL + 可选 Chroma 的 Docker Compose 生产配置。详见 [ECS 后端部署手册](docs/ECS_BACKEND_DEPLOYMENT.md)。

## 视觉方向

- 以“粗去玩鸭”为对外品牌，保留紫色、奶油白和大圆角的轻游戏化视觉。
- 手机端强调“一键帮我决定”，减少信息密度。
- PC 端使用宽屏图片、导航和分栏内容，但与手机端共用品牌颜色和核心文案。
