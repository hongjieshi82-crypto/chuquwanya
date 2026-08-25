# 懒得动 · 当前 APP 页面设计稿（系统风格 v0.6）

根据当前 `apps/client` 已实现页面整理，只保留现有核心页面；已移除启动向导、目的地专题、路线详情、预约咨询、外部分享落地等多余画板。

| Token | 值 |
|-------|-----|
| 主色 primary | `#7565F6` |
| 页面底色 canvas | `#F3F0FF` |
| 卡片底色 surface | `#FFFFFF` |
| 辅助文字 muted | `#7C77A3` |

## 当前保留画板

- `home`：APP 首页
- `activity`：玩法详情
- `preferences`：填写出行偏好
- `draw`：智能推荐结果
- `todos`：我的行程
- `map`：地图探索
- `profile`：我的
- `favorites`：我的收藏
- `about`：关于懒得动

## 预览

```bash
python3 -m http.server 8765 --directory design/exploration-h5
# http://localhost:8765/index.html?screen=home
```
