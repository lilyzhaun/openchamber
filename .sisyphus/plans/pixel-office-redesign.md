# Pixel Office 多房间场景重新设计 (v2 — 基于当前代码)

## TL;DR
> **Summary**: 将 PixelOffice 从单房间 224×176 场景重新设计为 2×2 多房间网格布局（Stardew Valley 风格），包含深色十字走廊、每房间独立配色、利用已生成的 18 种家具精灵 PNG 替换 CSS `<Furn>` div、以及每房间 6-8 个家具实例。
> **Deliverables**: 重写的 PixelOffice.tsx（多房间网格+走廊+per-room 墙地背景+精灵家具）
> **Effort**: Large
> **Parallel**: YES - 2 waves

## 当前代码状态分析 (v2 基线)

### PixelOffice.tsx (984 lines)
- **场景**: SCENE_W=224, SCENE_H=176, SCALE=1.6, TILE=16
- **家具渲染**: `<Furn>` CSS div 组件 (71 次使用) — 无 sprite 家具
- **Sprite 使用**: 仅 worker (4), computer (4 screens), watercooler (1)
- **布局**: 单房间，墙面 top=0-26, 踢脚线 top=100, 地板 100-176
- **Zone 数据**: ZONES constant (desk: 6 anchors, bookshelf: 3, commons: 4)
- **无**: FurnitureKey, FURNITURE_SPRITES, LAYOUT_BACKGROUND, LAYOUT_SCENE_OBJECTS, SceneObject

### 已生成的资产 (未提交, 可用)
- 18 张家具精灵 PNG (128×32, 4帧×32px): desk_large, chair_office, bookshelf_tall, sofa_modular, whiteboard_wall, plant_pot, clock_wall, chart_board, printer, filing_cabinet, conference_table, wall_frame, wall_monitor, coffee_machine, rug, small_table, trash_can, ceiling_lamp
- 升级的 generate-furniture-sprites.mjs (750 lines, 18 draw functions)

### 关键架构决策
**方案: 混合渲染** — 恢复 sprite 家具系统 + 保留 `<Furn>` 用于纯背景层
- 理由: 18 张高质量精灵 PNG 已存在，比 CSS div 视觉效果更好
- 背景/墙/地板/走廊: 用 `<Furn>` div（纯色/渐变，适合 CSS）
- 家具/装饰: 用 `SceneFurnitureSprite` + sprite sheets（像素艺术，需要精灵）
- Computer/watercooler: 保持现有 SpriteDiv 逻辑

### 场景尺寸决策
**扩大场景至 400×280** 以容纳 2×2 房间网格
- 当前 224×176 太小，放不下 4 个有意义的房间
- 4 房间 + 6px 走廊: 每房间约 197×137
- 保持 `sceneScale` 自适应缩放（popover 容器会自动缩放）

## Work Objectives

### Core Objective
将 Pixel Office 从单房间场景重新设计为多房间网格像素办公室。

### Deliverables
1. 重写的 `PixelOffice.tsx` — 2×2 多房间网格 + 走廊 + per-room 背景 + 精灵家具
2. 恢复的精灵家具系统（import + types + render component）

### Must Have
- 2×2 房间网格 + 十字深色走廊（6px 宽）
- 每房间独立墙色 + 地板色 + 踢脚线
- 恢复 sprite 家具渲染（使用已生成的 18 张 PNG）
- 每房间 6-8 个家具实例
- commons zone → 会议室(右上) + 休息室(右下) 确定性映射
- 保持 `imageRendering: pixelated`
- 所有颜色使用 theme token
- 不修改 usePixelOfficeState.ts

### Must NOT Have
- 不修改 usePixelOfficeState.ts
- 不修改 worker 精灵
- 不引入路径寻路、碰撞、拖拽
- 不引入新 npm 依赖
- 不使用硬编码 hex 颜色
- 不在走廊放家具
- 每房间家具不超过 8 个

## Execution Strategy

### Wave 1: 基础架构 + 精灵系统恢复 (1 task)

**T1: 完整重写 PixelOffice.tsx**

由于所有改动都在同一个文件且高度耦合，拆分为多个并行任务会导致合并冲突。
改为单一大型任务，按顺序完成以下子步骤：

1. **扩大场景**: SCENE_W=400, SCENE_H=280
2. **恢复精灵系统**: 添加 18 个家具 PNG import + FurnitureKey type + FURNITURE_SPRITES record + SceneFurnitureSprite 组件
3. **添加多房间数据**: RoomId type, RoomLayout interface, ROOMS array, CORRIDOR constant, ZONE_ROOM_MAP
4. **添加房间化家具布局**: ROOM_OBJECTS: Record<RoomId, SceneObject[]>
5. **重写 OfficeScene 渲染**:
   - 走廊层（z:0, 深色十字）
   - 4 个房间的墙面+踢脚线+地板（各自独立颜色）
   - 按房间遍历 ROOM_OBJECTS 渲染精灵家具
   - Agent 渲染保持现有 AgentSprite
6. **重算 Zone anchors**: 基于新房间坐标
7. **删除旧的 `<Furn>` 内联家具** (保留 `<Furn>` 组件定义供背景使用)

### Wave 2: 验证 (1 task)

**T2: 构建验证**
- `bun run type-check && bun run lint && bun run build`

## Room Specifications

### workspace (左上): x=0, y=0, w=197, h=137, zone='desk'
- wallColor: warm tan (status-warning-background)
- floorColor: light wood (status-info-background)
- 家具: 2× desk_large, 2× chair_office, 2× computer, 1× filing_cabinet, 1× printer (8个)

### conference (右上): x=203, y=0, w=197, h=137, zone='commons' (anchors 0-2)
- wallColor: green (status-success-background)
- floorColor: light green (status-success-background lighter)
- 家具: 1× conference_table, 3× chair_office, 1× whiteboard_wall, 1× wall_monitor, 1× plant_pot (7个)

### library (左下): x=0, y=143, w=197, h=137, zone='bookshelf'
- wallColor: purple (primary-background)
- floorColor: light purple (primary-background lighter)
- 家具: 2× bookshelf_tall, 1× small_table, 1× chair_office, 1× wall_frame, 1× clock_wall, 1× plant_pot (7个)

### breakroom (右下): x=203, y=143, w=197, h=137, zone='commons' (anchors 3-4)
- wallColor: warm brown (status-warning)
- floorColor: warm light (status-warning-background)
- 家具: 1× sofa_modular, 1× coffee_machine, 1× small_table, 1× watercooler, 1× rug, 1× trash_can, 1× chart_board (7个)

## Success Criteria
1. 场景从单房间变为 4 个独立主题房间 + 走廊分隔
2. 每房间有独立墙色+地板色+踢脚线
3. 使用已生成的精灵 PNG 渲染家具（而非 CSS div）
4. 每房间 6-8 个家具实例
5. commons zone 正确分裂映射到 conference + breakroom
6. type-check / lint / build 全部通过
