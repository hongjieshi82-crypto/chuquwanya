# 粗去玩鸭内容扩充流程

## 两类内容

- 事实来源：高德、场馆官网、政府文旅页面，用于确认名称、地址、坐标、营业和预约。
- 灵感来源：小红书、抖音、B站、公众号和用户投稿，只提炼路线结构、玩法趋势和真实踩坑。

不得复制来源正文、图片或视频。公开玩法需要重新创作，并保留来源链接和核验时间。

## 导入社交与官方来源

准备 JSON 数组：

```json
[
  {
    "platform": "xiaohongshu",
    "url": "https://www.xiaohongshu.com/example",
    "title": "上海雨天室内路线",
    "author": "来源作者",
    "usageRole": "inspiration",
    "signals": ["雨天", "室内", "美术馆", "步行距离短"]
  }
]
```

导入：

```bash
npm --prefix apps/api run content:import-sources -- --file ./sources.json
```

## 批量发现真实地点

配置 `AMAP_WEB_SERVICE_KEY` 后：

```bash
npm --prefix apps/api run data:sync:scenic -- \
  --types "风景名胜|科教文化服务|体育休闲服务" \
  --keywords "公园,博物馆,美术馆,图书馆,艺术区,老街,古镇,市集,植物园" \
  --page-limit 2 \
  --max-insert 30
```

自动导入内容统一进入 `review`，不会直接参与推荐。

对地址、坐标和来源完整的高德内容执行保守审核：

```bash
npm --prefix apps/api run content:review-amap
```

该步骤不会把营业时间和预约要求标成已确认，预算与时长也会继续保留为规则估算。

## 质量与覆盖检查

```bash
npm --prefix apps/api run content:report
```

报告中的 `uniquePlaces` 才代表多日行程容量。同一地点的不同玩法只增加单日抽卡丰富度，不增加多日天数容量。
