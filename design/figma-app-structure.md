# 懒得动 · APP 11 页 Figma 结构标注

> 当前风格：**携程 Zelda Inspired v0.5**（携程蓝 #0086F6 + 灰底白卡片 + 橙色促销）

> 画板基准：**390 × 844 px**（iPhone 14）  
> 设计 Token 来源：`apps/client/src/theme.ts`  
> 网格：8px 基准，边距 16px（大屏 20px）  
> Auto Layout 方向：纵向 Frame 为主，横向 Scroll 区域独立成组
> CTA 节奏补充：卡片与其直接关联的按钮组件之间以 375px 宽为设计基准，垂直间距 40px；卡片与卡片之间不套用该值。

---

## 全局 Frame 规范

### 页面根 Frame
| 属性 | 值 |
|------|-----|
| 名称 | `[PageName] / Default` |
| 尺寸 | W 390 × H 844（固定） |
| Fill | `#F4F4F4` canvas |
| Clip content | ON |
| Layout | Vertical, gap 0, padding 0 |

### Safe Area · 灵动岛（必读）

**设计稿默认机型：iPhone 14 Pro / 15 / 16（390×844，灵动岛）**

```
┌─────────────── 390 ───────────────┐  Y=0
│         ┌─────────────┐           │
│         │  灵动岛胶囊  │           │  Y=11, 126×37
│         └─────────────┘           │
│ ░░░░░░░ 顶部安全区 59px ░░░░░░░░ │  ← 禁止放按钮/文字
│  懒得动 · 发现…        [行程]    │  Y=59–115（Nav 56px）
│  上海 ▾                           │  Y=115+ 首屏可交互内容
│  🔍 搜索…                         │
│  [今日探索 Hero]                  │
└───────────────────────────────────┘
```

| 区域 | 高度 | 说明 |
|------|------|------|
| 灵动岛胶囊 | 126×37 px，距顶 11px | 仅装饰层，不可交互 |
| 顶部安全区 `safe-top` | **59 px** | 含状态栏；内容不得侵入 |
| Top Bar 内容区 | **56 px** | 品牌 + 操作按钮，在 safe-top 之下 |
| 首屏内容起点 | **Y = 115** | `59 + 56` |
| Bottom Home Indicator | **34 px** | 固定 CTA / Tab 之上留空 |
| Fixed CTA Bar | 64px + safe-bottom | |

**Figma 必建 Frame 变体：**
- `[Page] / iPhone-14-Pro-Dynamic-Island` — 默认交付
- `[Page] / iPhone-SE-No-Island` — safe-top 47px，无胶囊层

**布局规则：**
1. Logo / 标题 / 按钮不得与灵动岛胶囊垂直重叠
2. 导航左右分布，品牌靠左（≤68% 宽），操作靠右
3. 全屏 Hero 顶部渐变加深，确保 island 区域可读
4. H5 微信内：`viewport-fit=cover` + `env(safe-area-inset-*)`

Token 见 `theme.ts` → `safeArea`。

### 底部 Tab（4 Tab，与 bottom-tab-bar.tsx 一致）
```
Frame: BottomTab / 390×(48+safe-bottom)
├── Layout: Horizontal, space-around
├── TabItem × 4
│   ├── Icon 20px emoji / SF Symbol
│   └── Label 11px / Bold / muted or #0086F6
└── Fill: #FFFFFF, border-top 1px #EEEEEE
    Tabs: 发现 | 地图 | 行程 | 我的
```

---

## APP 核心流程页（携程 v0.5 · 已实现）

与 `preferences.tsx` / `draw.tsx` / `activity/[id].tsx` / `todos.tsx` 对齐。

### A · 填写偏好（preferences）
```
Preferences / 390×844 · Fill #F4F4F4
├── AppShell 白顶栏
├── InnerPageHeader：返回 +「填写出行偏好」+ 步骤「第 2/3 步」
├── StepProgress 66%
├── Panel 白卡片 ×2（必填 / 可选）
│   └── ChoiceGroup：方角 pill，选中 #EAF3FE + #0086F6 边框
├── TipBanner #FFF3E8 橙底提示
└── FixedBottomBar：Primary「开始智能推荐」
```

### B · 推荐结果（draw）
```
Draw / 390×844
├── InnerPageHeader + StepProgress 100%
├── ResultCard 白卡片
│   ├── Cover 140h + 橙标「智能推荐」
│   ├── 标题 + 摘要 + 价格行（#0086F6）
│   └── MetaGrid 3 格 + 换一换次数点
└── FixedBottomBar：Secondary 38%「换一换」+ Primary「查看详情」
```

### C · 玩法详情（activity）
```
ActivityDetail / 390×844
├── Hero 200h 渐变顶图 + light 返回
├── InfoCard 负 margin 上浮白卡片（摘要 + 4 格 meta）
├── Section 白卡片 ×3（介绍 / 步骤 / 地点）
├── TipSection #FFF3E8
└── FixedBottomBar：左侧价格 + Primary「加入我的行程」
```

### D · 我的行程（todos）
```
Todos / 390×844
├── Header「我的行程」+ 蓝按钮「＋ 新推荐」
├── OrderCard：左图 56 + 文案 + 状态 pill
├── 操作行：Primary + Ghost
└── BottomTab（行程 selected）
```

### E · 地图探索（map）
```
Map / 390×844 · 地图区 flex 1 + 底部 Sheet
├── 浮动搜索条（白底 shadow）
├── MapPins 彩色圆点 + 选中 label
├── 定位按钮右下角
├── Sheet：Filter chips + 附近列表 + Primary CTA
└── BottomTab（地图 selected）
```

### F · 我的（profile）
```
Profile / 390×844
├── Header：Avatar 64 + 昵称 + 编辑
├── StatsRow 3 格（目的地/路线/km）
├── PromoCard 智能推荐入口
├── MenuPanel 列表行（收藏/足迹/行程/帮助/关于）
└── BottomTab（我的 selected）
```

### G · 启动引导（onboarding）
```
Onboarding / 390×844 · Fill #F4F4F4
├── TopBar：Logo「懒得动」+ 跳过
├── SlidePager ×3（Horizontal snap）
│   ├── ArtBlock 280h 圆角16 + emoji
│   ├── Title H1 + Body 14px muted
│   └── Dots 8px / active 20px #0086F6
└── FixedPrimary「下一步 / 开始探索」
```

### H · 我的收藏（favorites）
```
Favorites / 390×844
├── InnerPageHeader + 副文案
├── Tab chips：全部 | 路线 | 目的地
└── ProductCard 列表（左图110 + 价格蓝）
```

### I · 关于懒得动（about）
```
About / 390×844
├── InnerPageHeader
├── Hero 蓝底 Logo + version + slogan
├── Panel 产品介绍
└── MenuPanel 隐私 / 协议
```

---

### Frame 结构
```
Splash / 390×844
├── BgImage [Fill container, gradient overlay bottom 40%]
│   └── Fill: 目的地大图 + linear-gradient(180deg, transparent, rgba(26,26,46,0.65))
├── ContourPattern [absolute, opacity 15%, 等高线 SVG tile]
├── Content [Vertical, center, padding 24]
│   ├── LogoMark 48×48 #0891B2, rotate -4°
│   ├── Title Display 40px Bold "懒得动"
│   ├── Slogan Body 15px "世界很大，马上出发。"
│   └── RouteLine SVG animation 120px W
└── (引导页额外)
    ├── OnboardPager [3 slides, Horizontal scroll snap]
    │   ├── Slide: 插画/图 + H1 24px + Body 15px
    │   └── Dots: 3×8px, active #0891B2
    └── CTA Primary 52px "下一步" / "允许定位"
```

### 变体
- `Splash / Default` — 1.5s 自动跳转
- `Onboard / Step-1|2|3`
- `Onboard / Location-Permission`

### 标注
| 元素 | 规格 |
|------|------|
| 主按钮 | H 52, radius 12, fill #0891B2, shadow primaryButton |
| 跳过 | Ghost 13px #7A7A8C, top-right padding 16 |
| 路线动画 | stroke 2px #0891B2, dashoffset 800ms |

### 卡片与按钮间距

| 场景 | 设计基准 | 间距 | 说明 |
|------|----------|------|------|
| 卡片 + 直接关联 CTA 按钮 | 375px 宽 | 40px | 适用于确认卡、结果卡、提示卡下方紧跟主/次操作按钮的场景 |
| 卡片 + 卡片 | 当前页面 Auto Layout | 使用页面 `spacing` token | 不使用 40px，避免列表与表单组过松 |

---

## 02 · 首页（发现）

### Frame 结构
```
Home / 390×844
├── TopBar [Fixed, 56+safe, blur bg white 90%]
│   ├── CityPicker: 15px Bold "上海 ▾"
│   ├── SearchTrigger: 44h pill #E0F4FA "搜索目的地、路线"
│   └── IconButton 44×44 通知
├── ScrollBody [Vertical, gap 16, padding H 16, bottom 120]
│   ├── HeroCard [280h, radius 20]
│   │   ├── BgImage + gradient
│   │   ├── Tag "今日探索" sunset chip
│   │   ├── Title H1 24px "莫干山竹林小径"
│   │   ├── Meta Caption "16km · 轻松 · 2.5h"
│   │   ├── RouteMini SVG bottom
│   │   └── Ghost CTA "开始看看 →"
│   ├── SectionHeader "附近探索" + Link "全部"
│   ├── HorizontalScroll [gap 12, snap]
│   │   └── POIChipCard × 3 [140w × 160h]
│   ├── SectionHeader "主题目的地"
│   ├── HorizontalScroll
│   │   └── ThemeCard × 4 [120w, 图片+标签]
│   ├── SectionHeader "季节推荐"
│   ├── DestinationCard [Full width] × N
│   └── RouteCard [Full width] × N
└── BottomTab
```

### HeroCard 组件
| 属性 | 值 |
|------|-----|
| 尺寸 | W Fill × H 280 |
| Radius | 20 |
| Padding | 16 |
| Shadow | card |
| 标题 | H1 24px / `#FFFFFF` |
| 标签 | H 24, bg `#FEF6E4`, text `#FF8A65` |

### DestinationCard
```
DestinationCard / Fill×auto
├── Image [4:3, radius top 16]
│   ├── HeartBtn absolute top-right 32×32
│   └── TagStack bottom-left
├── Body padding 12
│   ├── Title H3 17px Bold
│   ├── Tags Row gap 6
│   └── Meta "📍 湖州 · ⭐ 4.8 · 2h"
```

### 交互标注
- 下拉刷新：等高线 compass 旋转
- Hero 卡片：点击进入路线详情
- 横滑模块：scroll-snap center

---

## 03 · 探索地图页

### Frame 结构
```
MapExplore / 390×844
├── MapCanvas [Fill absolute 0,0]
│   ├── CustomMapStyle 降饱和
│   ├── RoutePolylines 3px #0891B2
│   ├── Pins [分类色 8px + 24px halo]
│   └── UserLocation pulse animation
├── TopOverlay [padding 16, safe-top]
│   ├── SearchBar 44h
│   └── FilterBtn 44×44
├── SideFABs [right 16, vertical gap 12]
│   ├── Locate 48×48
│   └── Layer 48×48
├── BottomSheet [Collapsed 120h / Expanded 65%]
│   ├── Handle 4×32 #E5E5EA center
│   ├── Title H2 "附近 12 个地点"
│   ├── FilterChips [Horizontal scroll]
│   └── POIList [Vertical gap 10]
│       └── RouteCard compact × N
└── BottomTab (地图 Tab selected)
```

### BottomSheet 状态
| 状态 | 高度 | 地图可见 |
|------|------|----------|
| Collapsed | 120px | 78% |
| Half | 50% | 50% |
| Full | 88% | 12% |

### 地图 Pin
- 自然 `#2DD4BF` / 城市 `#0891B2` / 美食 `#FF8A65`
- Selected: scale 1.3 + Tooltip 名称

---

## 04 · 目的地详情页

### Frame 结构
```
DestinationDetail / 390×844
├── HeroImage [360h parallax]
│   ├── TopActions [back | share | heart] 44×44 glass
│   └── TitleOverlay bottom
│       ├── Tag row
│       └── H1 24px White
├── ScrollBody [padding 16, gap 16, bottom 100]
│   ├── QuickFacts [Horizontal, paper bg #E0F4FA, radius 16, padding 12]
│   │   └── FactItem × 3 "⭐4.8 | 📍湖州 | 🏷徒步"
│   ├── Intro Body 15px, max 3 lines + "展开"
│   ├── Section "精选路线" + HorizontalScroll RouteCard
│   ├── Section "附近体验" + ExperienceCard list
│   ├── Section "评价" + ReviewCard × 3
│   └── Section "相关目的地" + HorizontalScroll
└── FixedBottomBar [64h + safe]
    ├── IconBtn 收藏
    ├── Secondary "加入行程"
    └── Primary "在地图中查看"
```

### QuickFacts Bar
- Layout: Horizontal, space-evenly
- Divider: 1px `#E8E2D9` height 24

---

## 05 · 路线详情页

### Frame 结构
```
RouteDetail / 390×844
├── MapSection [45% height ~ 380px]
│   ├── Interactive map + animated route draw
│   └── StatsFloatCard [bottom 16, margin H 16]
│       └── "16km · 5h · 轻松 · ↑320m" tabular nums
├── ScrollBody
│   ├── Title H1 + Tag NO.023 mono
│   ├── Timeline [Vertical]
│   │   ├── Line left 2px #0891B2 continuous
│   │   └── Stop × N [circle 28 + title + time]
│   ├── Accordion "装备与贴士"
│   ├── Gallery [Horizontal scroll 1:1 images]
│   └── AuthorRow
└── FixedBottomBar
    ├── 收藏 | 加入行程 | Primary "开始导航"
```

### Timeline Item
```
Stop / Fill×auto
├── Dot 28×28 circle #E0F7FA, number 12px Bold
├── Content padding-left 12
│   ├── Title 14px Bold
│   └── Sub Caption 12px muted
```

---

## 06 · 路线规划页

### Frame 结构
```
RoutePlan / 390×844
├── TopBar back + Title "规划行程" + Save text btn
├── CalendarStrip [Horizontal, 56h, snap]
│   └── DayCell × 14 [44×52, selected primary fill]
├── RouteSummaryCard
│   ├── EditableTitle H2
│   ├── TransportChips [自驾|高铁|步行]
│   └── Meta row
├── DayTabs [Day1 | Day2]
├── TimelineEditable [drag handles]
│   └── PlanStop × N [drag icon + time + place + delete]
├── AddStopBtn dashed border
├── NotesField [textarea min 80h]
└── FixedPrimary "保存行程"
```

### 交互
- 长按 Stop 进入拖拽排序
- 保存成功：Toast + 路线线闭合动画

---

## 07 · 活动 / 体验页

### Frame 结构
```
ActivityDetail / 390×844
├── HeroImage 220h + Countdown badge + Hot tag
├── ScrollBody
│   ├── Title H1 + datetime Caption
│   ├── PriceRow 28px #FF8A65 + strikethrough
│   ├── ProgressBar 名额 "8/20"
│   ├── Section 亮点 / 日程 / 费用包含 / 主办方 / 须知
│   └── Review snippets
└── FixedBottom "立即报名 ¥299" Primary full width
```

---

## 08 · 收藏页

### Frame 结构
```
Favorites / 390×844
├── TopBar Title "收藏"
├── TabBar [目的地 | 路线 | 内容] underline indicator 2px primary
├── Content
│   ├── Tab-目的地: Grid 2 col, gap 12, DestinationCard compact
│   ├── Tab-路线: List RouteCard
│   └── Tab-内容: List ContentCard
└── BottomTab (我的 or 发现 — 按 IA 定)

Empty State Variant:
├── Illustration 120×120
├── H2 "还没有收藏"
├── Body muted
└── Primary "去发现页看看"
```

---

## 09 · 行程页

### Frame 结构
```
Trips / 390×844
├── TopBar "行程" + 日历icon
├── Segment [即将出发 | 进行中 | 已完成]
├── List gap 12 padding 16
│   └── TripCard × N
│       ├── Cover 16:9 mini + date badge
│       ├── Title H3
│       ├── RoutePreview line SVG
│       └── Progress ring optional
└── BottomTab (行程 selected)

TripCard: W Fill, radius 16, shadow card, swipe-delete hint
```

---

## 10 · 用户个人主页

### Frame 结构
```
Profile / 390×844
├── Header [paper bg contour pattern subtle]
│   ├── Avatar 72 circle
│   ├── Name H1 + Edit link
│   └── StatsRow "12 目的地 · 8 路线 · 156 km"
├── FootprintMap [200h mini map, visited pins filled]
├── TabBar [足迹 | 发布 | 收藏]
├── ContentGrid or List
└── BottomTab (我的 selected)
```

---

## 11 · 内容详情页（攻略/笔记）

### Frame 结构
```
ContentDetail / 390×844
├── TopBar transparent → solid on scroll
├── AuthorBar [avatar 40 + name + follow btn]
├── HeroImage optional full width
├── ArticleBody
│   ├── H2 headings
│   ├── Body 15px line-height 1.6
│   ├── InlineImage full bleed
│   └── PlaceQuoteCard [left border 3px #0891B2]
│       └── Linked destination mini card
├── RelatedSection horizontal scroll
└── FixedBottom [收藏 | 分享 Primary]
```

---

## 组件库 Figma 命名规范

```
Components/
├── Buttons/
│   ├── Button/Primary/Default|Pressed|Disabled
│   ├── Button/Secondary/...
│   └── Button/Ghost/...
├── Cards/
│   ├── DestinationCard/Default|Compact
│   ├── RouteCard/Default|Compact
│   └── HeroCard/Home
├── Navigation/
│   ├── TopBar/Default|Transparent|Solid
│   ├── BottomTab/Default
│   └── SearchBar/Default|Focused
├── Feedback/
│   ├── Toast/Success|Error
│   ├── Empty/Default
│   └── Skeleton/Card
└── Tags/
    ├── Tag/Hike|City|Food|Season
    └── Tag/Mono NO.xxx
```

---

## 组件尺寸速查

| 组件 | 宽 | 高 | 圆角 | 备注 |
|------|-----|-----|------|------|
| Primary Button | Fill−32 | 52 | 12 | APP |
| Primary Button H5 | Fill−32 | 48 | 12 | H5 |
| SearchBar | Fill−32 | 44 | 12 | bg paper |
| Chip | auto | 32 | pill | padding H 14 |
| Tag | auto | 24 | 8 | |
| DestinationCard | Fill−32 | auto | 16 | |
| TopBar | 390 | 56+safe | 0 | |
| BottomTab | 390 | 56+34 | 0 | |
| FAB | 56 | 56 | 28 | |
| IconButton | 44 | 44 | 12 | min touch |

---

## 页面跳转关系（Prototype 连线）

```
Splash → Onboard → Home
Home → DestinationDetail | RouteDetail | Search
Home → MapExplore (Tab)
MapExplore → DestinationDetail | RouteDetail | RoutePlan
DestinationDetail → RouteDetail → RoutePlan → Trips
RouteDetail → RoutePlan | ShareSheet
ActivityDetail → FormSheet → Success
Favorites ← (any detail heart action)
Profile → ContentDetail
ContentDetail → DestinationDetail
Any H5 deep link → RouteDetail | DestinationDetail
ShareSheet → 生成图片 → 系统分享
```

---

## 设计 Token → Figma Variables 映射

| Figma Variable | Value |
|----------------|-------|
| color/canvas | #F0FAFF |
| color/surface | #FFFFFF |
| color/paper | #E0F4FA |
| color/primary | #0891B2 |
| color/primary-dark | #0E7490 |
| color/primary-soft | #E0F7FA |
| color/sunset | #FF8A65 |
| color/dune | #F4C976 |
| color/ink | #0C3D5C |
| color/text | #1E5569 |
| color/muted | #6B9DAF |
| spacing/base | 8 |
| spacing/card-button-gap-375 | 40 |
| radius/card | 16 |
| radius/button | 12 |
| shadow/card | 0 4 20 rgba(28,24,51,0.08) |

### 风格演进对照
| Variable | v0.2 pine | v0.3 dusk | v0.4 coastal（当前） |
|----------|-----------|-----------|----------------------|
| color/primary | #2D6A4F | #5E4AE3 | #0891B2 |
| color/canvas | #FAF7F2 | #F8F7FF | #F0FAFF |
| color/accent | #FCBF49 | #FFB547 | #F4C976 |

---

## 交付检查清单

- [ ] 11 个页面 Default 态 + 关键 Empty/Loading 态
- [ ] 390×844 + 375×812 + 428×926 三档 Spot check
- [ ] 组件库与 Variables 绑定
- [ ] 原型连线覆盖 5 条核心用户流程
- [ ] 分享卡片 Frame：1:1 / 5:4 / 9:16 各 1 套
- [ ] Dark Mode 变体（P1，可选）
