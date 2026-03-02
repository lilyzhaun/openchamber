# Pixel Office 场景升级

## TL;DR
> **Summary**: 将 Pixel Office 场景从 224px 扩展至 ~400px，升级家具精灵细节；并新增回归修复波次，解决“布局混乱、墙地背景层次不清、小屏显示拥挤”。
> **Deliverables**: 升级后的 PixelOffice.tsx、7-10 个新家具精灵表 PNG、修复动画 keyframe
> **Effort**: Medium
> **Parallel**: YES - 4 waves
> **Critical Path**: Task 1 (像素资产规范) → Task 2 (生成家具精灵表) → Task 4 (场景重基线+布局) → Task 5 (家具渲染替换) → Task 8 (最终验证)

## Context
### Original Request
用户反馈场景太拥挤、太简单：
1. 没有利用全部宽度
2. 人物和场景布局太拥挤
3. 场景和元素太简略，家具只用了几个像素块敷衍，应该像人物一样用多种颜色的像素块精细化

### Interview Summary
- **宽度策略**: 扩大到 ~400px 固定宽度（约现在的 1.8 倍）
- **精细化方式**: AI 代码生成精灵表 PNG（不是 div 组合）
- **布局设计**: 重新设计为更自然的办公室布局（打破对称）

### Metis Review (gaps addressed)
- 坐标迁移不完整风险 → 要求先建布局数据层再渲染，禁止散落硬编码
- Anchor 容量不足风险 → 扩宽后重算每个 zone anchors，给超量 fallback 规则
- AI 生成 PNG 质量风险 → 设定验收标准（调色板数量、透明背景、像素对齐）
- Scale 比例不匹配风险 → 人物/家具 scale 独立可调
- `pixelOfficePulse` 未定义 bug → 必须修复

## Work Objectives
### Core Objective
将 Pixel Office 从一个粗糙的概念演示升级为一个精细的像素风格办公室场景，视觉质量与人物精灵一致。

### Deliverables
1. 7-10 个新家具精灵表 PNG 文件（desk、chair、bookshelf、sofa、whiteboard、plant、clock、chart-board）
2. 升级后的 `PixelOffice.tsx`，包含新布局、新尺寸、精灵表渲染
3. 修复 `pixelOfficePulse` keyframe 定义

### Definition of Done (verifiable conditions with commands)
- `bun run type-check && bun run lint` 通过 (exit 0)
- `bun run build` 成功
- `grep "SCENE_W" PixelOffice.tsx` 显示 ~400 值
- 所有新 PNG 文件存在于 `packages/ui/src/assets/stardew-office/`
- `pixelOfficePulse` keyframe 已定义且引用闭环
- 场景在容器中完整显示，无溢出

### Must Have
- 场景宽度扩展到 ~400px
- 场景高度按比例调整（保持 ~16:9 或更宽的比例）
- 所有家具用精灵表 PNG 渲染，不再使用 Furn 组件做家具主体
- 每个家具精灵至少使用 8+ 种颜色，有黑色/深色轮廓线
- 布局重新设计：工位区、过道、休闲区自然分布
- Zone anchors 重新计算，支持最多 6 个 agent 不重叠
- `pixelOfficePulse` keyframe 修复
- 保持 `imageRendering: pixelated` 像素风格

### Must NOT Have (guardrails)
- 不修改 `usePixelOfficeState.ts` 的行为语义（zone 类型、card 结构等不变）
- 不修改人物精灵资源（worker_1-4.png）
- 不引入路径寻路、碰撞系统、拖拽编辑器等未请求功能
- 不改变 StatusRow.tsx 的弹出逻辑
- 不引入新的 npm 依赖
- 不使用抗锯齿/半透明边（保持像素风格纯粹性）
- 不使用 emoji 作为图标

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Test decision: No unit tests (纯视觉组件), type-check + lint + build 验证
- QA policy: 每个 task 有 agent-executed scenarios (type-check/grep/file existence/Playwright screenshots)
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves

Wave 1 (基础并行): [Task 1] 像素资产规格与生成脚本、[Task 2] 生成家具精灵表PNG、[Task 3] 修复 `pixelOfficePulse` bug
Wave 2 (场景重构): [Task 4] 场景尺寸与布局数据层重基线、[Task 6] 信息面板与装饰层适配
Wave 3 (核心渲染): [Task 5] 家具从 `Furn` 改为精灵渲染、[Task 7] Zone anchors 防重叠规则
Wave 4 (验证): [Task 8] 自动化验证与证据归档
Wave 5 (回归热修复): [Task 9] 自适应缩放容器、[Task 10] 像素风墙地背景、[Task 11] 家具锚点对齐、[Task 12] 回归验证

### Dependency Matrix
| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 (像素资产规格/脚本) | — | T2 |
| T2 (生成家具精灵表) | T1 | T5 |
| T3 (修复 pulse 动画) | — | T8 |
| T4 (场景尺寸+布局数据层) | — | T5, T7 |
| T5 (家具精灵渲染替换) | T2, T4 | T8 |
| T6 (信息层与装饰适配) | T4 | T8 |
| T7 (Zone anchor 防重叠) | T4 | T8 |
| T8 (最终验证) | T3, T5, T6, T7 | — |
| T9 (自适应缩放容器) | T4, T5 | T12 |
| T10 (像素风墙地背景) | T4 | T12 |
| T11 (家具锚点对齐修复) | T4, T5, T10 | T12 |
| T12 (回归验证) | T9, T10, T11 | — |

### Agent Dispatch Summary
| Wave | Tasks | Categories |
|------|-------|-----------|
| Wave 1 | 3 | artistry, quick |
| Wave 2 | 2 | visual-engineering |
| Wave 3 | 2 | visual-engineering |
| Wave 4 | 1 | unspecified-high |
| Wave 5 | 4 | visual-engineering, unspecified-high |

## TODOs

<!-- TASKS_START -->

- [ ] 1. 制定家具像素资产规范与生成脚本

  **What to do**: 创建 `packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs`，统一生成规则：16×16 或 32×32 网格、无抗锯齿、透明背景、每个家具 8-14 色、深色轮廓线、两级阴影。输出目标文件名（至少）：`desk_large.png`、`chair_office.png`、`bookshelf_tall.png`、`sofa_modular.png`、`whiteboard_wall.png`、`plant_pot.png`、`clock_wall.png`、`chart_board.png`。脚本支持重复执行覆盖同名文件。
  **Must NOT do**: 不修改 `worker_1.png`~`worker_4.png`、`computer.png`、`watercooler.png`；不引入新依赖；不生成 WebP/JPG。

  **Recommended Agent Profile**:
  - Category: `artistry` — Reason: 需要像素美术规则与程序化生成结合
  - Skills: [`ui-ux-pro-max`, `theme-system`] — 用于视觉一致性与主题令牌约束
  - Omitted: [`playwright`] — 本任务不涉及浏览器交互

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [2] | Blocked By: []

  **References** (executor has NO interview context — be exhaustive):
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:18-37` — 现有精灵帧尺寸与 SCALE 约束
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:254-271` — `SpriteDiv` 的贴图渲染方式
  - Asset: `packages/ui/src/assets/stardew-office/worker_1.png` — 目标细节基准（多色+轮廓+阴影）
  - Asset: `packages/ui/src/assets/stardew-office/computer.png` — 现有对象精灵风格参考

  **Acceptance Criteria** (agent-executable only):
  - [ ] `test -f packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs`
  - [ ] `node packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs --dry-run` 退出码为 0
  - [ ] `grep -n "desk_large.png\|chair_office.png\|bookshelf_tall.png\|sofa_modular.png\|whiteboard_wall.png\|plant_pot.png\|clock_wall.png\|chart_board.png" packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs`

  **QA Scenarios** (MANDATORY — task incomplete without these):
  ```
  Scenario: 生成脚本 dry-run 成功
    Tool: Bash
    Steps: 执行 node packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs --dry-run
    Expected: 退出码 0，输出包含 8 个目标 PNG 文件名
    Evidence: .sisyphus/evidence/task-1-sprite-spec-dryrun.txt

  Scenario: 非法参数失败
    Tool: Bash
    Steps: 执行 node .../generate-furniture-sprites.mjs --palette=invalid
    Expected: 非 0 退出码，输出明确错误信息（包含 "invalid palette"）
    Evidence: .sisyphus/evidence/task-1-sprite-spec-error.txt
  ```

  **Commit**: YES | Message: `feat(pixel-office): add furniture sprite generation script` | Files: [`packages/ui/src/assets/stardew-office/scripts/generate-furniture-sprites.mjs`]

- [ ] 2. 生成并落盘家具精灵表 PNG（替换粗糙家具）

  **What to do**: 使用 Task 1 脚本生成并写入 8 个家具 PNG 到 `packages/ui/src/assets/stardew-office/`。每个 PNG 至少包含 1 行动画帧（静态可重复帧），分辨率遵循 16x16 单元格；保证透明背景，边缘无半透明像素。
  **Must NOT do**: 不改已有 worker 精灵；不将家具继续保留为纯 `Furn` 主体。

  **Recommended Agent Profile**:
  - Category: `artistry` — Reason: 资产质量与风格一致性为主
  - Skills: [`ui-ux-pro-max`] — 校验像素视觉细节密度
  - Omitted: [`theme-system`] — PNG 资产不使用主题 token

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [5] | Blocked By: [1]

  **References**:
  - Asset: `packages/ui/src/assets/stardew-office/worker_1.png` — 目标细节标准
  - Asset: `packages/ui/src/assets/stardew-office/watercooler.png` — 16×16 行帧布局参考
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:803-812` — 物件精灵在场景中的使用方式

  **Acceptance Criteria** (agent-executable only):
  - [ ] `ls packages/ui/src/assets/stardew-office/{desk_large.png,chair_office.png,bookshelf_tall.png,sofa_modular.png,whiteboard_wall.png,plant_pot.png,clock_wall.png,chart_board.png}`
  - [ ] `python3 - <<'PY'` 检查 8 张图均为 PNG、RGBA、存在透明通道且边缘 alpha 非半透明（0 或 255）
  - [ ] `python3 - <<'PY'` 检查每张图颜色数 >= 8 且 <= 24

  **QA Scenarios**:
  ```
  Scenario: 8 张家具精灵图均生成
    Tool: Bash
    Steps: 执行 ls packages/ui/src/assets/stardew-office/*.png 并过滤 8 个新文件
    Expected: 8/8 文件存在，文件大小 > 0
    Evidence: .sisyphus/evidence/task-2-sprites-exist.txt

  Scenario: 透明像素不合规触发失败
    Tool: Bash
    Steps: 运行 alpha 校验脚本，若检测到 0<alpha<255 则退出 1
    Expected: 当前资产返回通过（无半透明）；若注入异常样本则正确失败
    Evidence: .sisyphus/evidence/task-2-alpha-check.txt
  ```

  **Commit**: YES | Message: `feat(pixel-office): add detailed furniture sprite sheets` | Files: [`packages/ui/src/assets/stardew-office/*.png`]

- [ ] 3. 修复 `pixelOfficePulse` 未定义动画

  **What to do**: 在 `PixelOffice.tsx` 的 `<style>` keyframes 中添加 `@keyframes pixelOfficePulse`，并确保第 761 行的 `animation: 'pixelOfficePulse ...'` 引用正常生效。
  **Must NOT do**: 不修改动画调用频率；不改其他组件动画命名。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 单文件小改动
  - Skills: [] — 无额外技能需求
  - Omitted: [`ui-ux-pro-max`] — 非设计决策任务

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [8] | Blocked By: []

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:761` — pulse 动画引用点
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:968-979` — keyframes 注入位置

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "pixelOfficePulse" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "@keyframes pixelOfficePulse" packages/ui/src/components/pixel-office/PixelOffice.tsx`

  **QA Scenarios**:
  ```
  Scenario: 动画定义与引用闭环
    Tool: Bash
    Steps: grep 引用和定义；统计命中数量
    Expected: 引用 >= 1 且定义 = 1
    Evidence: .sisyphus/evidence/task-3-pulse-grep.txt

  Scenario: 删除定义后校验失败（回归保护）
    Tool: Bash
    Steps: 在临时副本中移除 keyframes 再 grep 校验
    Expected: 校验脚本返回非 0 并提示 missing pixelOfficePulse
    Evidence: .sisyphus/evidence/task-3-pulse-negative.txt
  ```

  **Commit**: YES | Message: `fix(pixel-office): define missing pulse animation` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 4. 场景尺寸扩展与布局数据层重基线

  **What to do**: 将 `SCENE_W` 从 224 扩展到 400（固定宽度），`SCENE_H` 调整为 240（保持可读比例）。抽取布局对象为结构化数组（区域、坐标、z-index、sprite key），替代散落硬编码。保留 `maxWidth: SCENE_W` + 居中策略，但确保内容利用全宽。
  **Must NOT do**: 不修改 `usePixelOfficeState.ts` 数据结构；不改变 StatusRow 弹窗尺寸策略。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 大规模 UI 布局重构
  - Skills: [`theme-system`, `settings-ui-patterns`] — 保证主题 token 与项目 UI 一致
  - Omitted: [`ui-ux-pro-max`] — 设计策略已在上游决策

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [5,6,7] | Blocked By: []

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:38-44` — 当前场景常量
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:473-552` — 背景与地板层
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:171-175` — `ZONES` 定义
  - Pattern: `packages/ui/src/components/chat/StatusRow.tsx:273-289` — 容器弹出区域

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "const SCENE_W = 400" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "const SCENE_H = 240" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "const LAYOUT_" packages/ui/src/components/pixel-office/PixelOffice.tsx`（至少 1 个布局数据结构）

  **QA Scenarios**:
  ```
  Scenario: 场景常量更新成功
    Tool: Bash
    Steps: grep SCENE_W/SCENE_H 常量
    Expected: SCENE_W=400, SCENE_H=240 唯一命中
    Evidence: .sisyphus/evidence/task-4-scene-constants.txt

  Scenario: 布局数据缺失时失败
    Tool: Bash
    Steps: 运行校验脚本检查 LAYOUT_* 数据结构是否存在
    Expected: 若不存在则退出 1 并提示 missing layout data layer
    Evidence: .sisyphus/evidence/task-4-layout-validation.txt
  ```

  **Commit**: YES | Message: `refactor(pixel-office): rebaseline scene dimensions and layout data` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 5. 家具渲染从 `Furn` 迁移到精灵表组件

  **What to do**: 为 desk/chair/bookshelf/sofa/whiteboard/plant/clock/chart-board 创建 `FurnitureSprite` 渲染映射，统一走 `SpriteDiv`（或等价像素渲染组件），将主家具从矩形 div 改为 PNG 精灵。保留少量背景平面（墙、地板）可继续使用纯 div。
  **Must NOT do**: 不删除 `SpriteDiv` 机制；不改 agent 角色渲染逻辑。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 组件渲染路径替换
  - Skills: [`theme-system`, `ui-ux-pro-max`] — 视觉一致性与主题约束
  - Omitted: [`settings-ui-patterns`] — 非 settings 页面

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [8] | Blocked By: [2,4]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:416-443` — `Furn` 现有实现
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:613-849` — 当前家具热区（重点替换段）
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:254-271` — `SpriteDiv` 能力
  - Asset: `packages/ui/src/assets/stardew-office/*.png` — 新家具精灵资产

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "FurnitureSprite\|FURNITURE_SPRITES" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "desk_large\|chair_office\|bookshelf_tall\|sofa_modular\|whiteboard_wall\|plant_pot\|clock_wall\|chart_board" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `python3 - <<'PY'` AST/文本检查：Task 5 范围内主家具不再由 `Furn left=...` 直接构建

  **QA Scenarios**:
  ```
  Scenario: 主家具全部走精灵渲染
    Tool: Bash
    Steps: grep 家具 key 与渲染映射；统计 8 类家具均被引用
    Expected: 8/8 家具 key 命中且至少各出现 1 次
    Evidence: .sisyphus/evidence/task-5-furniture-sprite-mapping.txt

  Scenario: 回退到 Furn 主体时失败
    Tool: Bash
    Steps: 运行规则检查脚本，检测 desk/chair/bookshelf/sofa 等是否仍由 Furn 主体绘制
    Expected: 若命中则退出 1 并输出违规对象名
    Evidence: .sisyphus/evidence/task-5-furn-regression-check.txt
  ```

  **Commit**: YES | Message: `feat(pixel-office): render furniture with detailed sprite sheets` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 6. 信息面板与装饰层适配新宽度和新布局

  **What to do**: 调整顶部面板、地板网格、光照渐变、卡片列表与 speech bubble 的坐标/大小，使 400×240 新场景视觉平衡；确保装饰层不遮挡人物/家具。
  **Must NOT do**: 不改变 `PixelOfficePanel` 的业务文案与 i18n key。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 视觉层级和可读性优化
  - Skills: [`theme-system`, `ui-ux-pro-max`] — 颜色层次与可读性
  - Omitted: [`playwright`] — 本任务只做实现，不做最终验证

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [8] | Blocked By: [4]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:554-612` — 顶部元素
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:930-967` — `PixelOfficePanel` 下方信息区
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:887-920` — AgentCards 现有尺寸

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "maxWidth: SCENE_W" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "maxHeight: 36" packages/ui/src/components/pixel-office/PixelOffice.tsx`（若调整需有替代值并通过视觉快照）

  **QA Scenarios**:
  ```
  Scenario: 新布局下信息区可读
    Tool: Playwright
    Steps: 打开 Pixel Office 面板；定位文本 "Pixel Office"、zone 标签、agent 卡片
    Expected: 以上元素均可见且无重叠；截图通过视觉基线比对
    Evidence: .sisyphus/evidence/task-6-info-layer.png

  Scenario: 窄容器下装饰遮挡失败保护
    Tool: Playwright
    Steps: 将视口设为 1024x768，打开面板并检查 agent sprite 与 speech bubble 区域
    Expected: 不发生文本被家具遮挡；若遮挡则测试失败并标注坐标
    Evidence: .sisyphus/evidence/task-6-overlap-check.png
  ```

  **Commit**: YES | Message: `style(pixel-office): adapt overlays and info panel for wider scene` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 7. 重算 Zone anchors 与超量防重叠规则

  **What to do**: 根据新布局重算 `desk/bookshelf/commons` anchors，确保 1 lead + 5 child（最多 6）在典型场景不重叠；当同 zone 超出 anchor 数时，采用偏移 fallback（例如 x/y 交错偏移）而不是复用最后一个锚点。
  **Must NOT do**: 不改 `OfficeZone` 类型和 `toolToZone` 逻辑。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 布局与动态分配算法小改
  - Skills: [] — 无额外技能
  - Omitted: [`ui-ux-pro-max`] — 非视觉风格决策任务

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [8] | Blocked By: [4]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:171-175` — 现有 anchors
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:453-461` — anchor 消耗逻辑
  - Pattern: `packages/ui/src/hooks/usePixelOfficeState.ts:22-33` — slotId 上限（lead + child-1..5）

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "desk:\|bookshelf:\|commons:" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "fallback\|offset" packages/ui/src/components/pixel-office/PixelOffice.tsx`

  **QA Scenarios**:
  ```
  Scenario: 6 个 agent 同时在线不重叠
    Tool: Playwright
    Steps: 通过测试桩注入 6 张 card；打开 Pixel Office；采集 sprite 包围盒
    Expected: 任意两个包围盒交集面积 <= 10%（允许轻微遮挡）
    Evidence: .sisyphus/evidence/task-7-anchor-overlap.json

  Scenario: 超量同 zone 时 fallback 生效
    Tool: Playwright
    Steps: 注入 8 张都在 desk zone 的 card（测试桩）；采集坐标
    Expected: 后2个卡片坐标不与最后一个 anchor 完全相同（x,y 至少一轴不同）
    Evidence: .sisyphus/evidence/task-7-anchor-fallback.json
  ```

  **Commit**: YES | Message: `fix(pixel-office): prevent agent overlap with anchor fallback offsets` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 8. 执行自动化验证、截图基线与构建验收

  **What to do**: 运行 type-check/lint/build；新增或更新 Playwright 冒烟用例验证 Pixel Office 在 1280×800 与 1024×768 下展示；输出证据文件（命令日志 + 截图 + 坐标 JSON）。
  **Must NOT do**: 不跳过失败；不使用手工目测代替测试结果。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 综合验证与证据归档
  - Skills: [`playwright`] — 浏览器验证必需
  - Omitted: [`ui-ux-pro-max`] — 验证任务非设计决策

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: [] | Blocked By: [3,5,6,7]

  **References**:
  - Pattern: `packages/ui/src/components/chat/StatusRow.tsx:273-289` — Pixel Office 面板入口与容器
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:926-984` — 组件渲染根
  - Command: `package.json` scripts — `type-check`, `lint`, `build`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run type-check && bun run lint && bun run build` 全部成功
  - [ ] Playwright 用例通过：`pixel-office-layout.spec.ts`（或现有等价用例）
  - [ ] 证据文件存在：
    - `.sisyphus/evidence/task-8-build.txt`
    - `.sisyphus/evidence/task-8-1280.png`
    - `.sisyphus/evidence/task-8-1024.png`
    - `.sisyphus/evidence/task-8-overlap.json`

  **QA Scenarios**:
  ```
  Scenario: 构建链路全绿
    Tool: Bash
    Steps: 执行 bun run type-check && bun run lint && bun run build
    Expected: 全部退出码 0
    Evidence: .sisyphus/evidence/task-8-build.txt

  Scenario: 窄视口布局回归
    Tool: Playwright
    Steps: 1024x768 打开 Pixel Office 面板，断言 "Pixel Office" 标题可见，scene 容器可见，页面无水平滚动条
    Expected: 断言全部通过
    Evidence: .sisyphus/evidence/task-8-1024.png
  ```

  **Commit**: NO | Message: `n/a` | Files: [`n/a`]

- [ ] 9. 增加 Scene 自适应缩放容器（小屏保持完整布局）

  **What to do**: 在 `OfficeScene` 外层增加缩放容器：保持内部设计坐标固定 400×240，按可用容器宽度计算缩放因子 `scale = min(1, availableWidth / 400)`，并统一缩放整个 scene，避免小屏挤压与错位。
  **Must NOT do**: 不改业务状态逻辑；不改 `usePixelOfficeState.ts`。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: UI 布局与缩放逻辑修复
  - Skills: [`theme-system`] — 保证容器视觉 token 一致
  - Omitted: [`ui-ux-pro-max`] — 非风格探索任务

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [12] | Blocked By: [4,5]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:584-670` — scene 渲染根
  - Pattern: `packages/ui/src/components/chat/StatusRow.tsx:273-289` — 面板容器与滚动边界

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "availableWidth\|scale" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] Playwright 1024x768 下 scene 完整可见，无水平滚动条

  **QA Scenarios**:
  ```
  Scenario: 小屏按比例缩放
    Tool: Playwright
    Steps: 设 1024x768；打开 Pixel Office；读取 scene 宽高与 transform
    Expected: scene 未被裁切，且 scale <= 1
    Evidence: .sisyphus/evidence/task-9-responsive-scale.json

  Scenario: 大屏不缩放
    Tool: Playwright
    Steps: 设 1440x900；打开 Pixel Office
    Expected: scale=1，scene 保持 400x240 设计尺寸
    Evidence: .sisyphus/evidence/task-9-desktop-scale.json
  ```

  **Commit**: YES | Message: `fix(pixel-office): add responsive scene scaling for small screens` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 10. 重建像素风背景（墙面/踢脚线/地板）

  **What to do**: 在 scene 内明确绘制三层背景：墙面层（像素纹理）、踢脚线层（1-2px 分隔）、地板层（网格/透视线）；提高墙地对比度，形成 2D 微立体感。
  **Must NOT do**: 不使用硬编码 hex；仅使用 theme tokens（可配合 `color-mix`）。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 背景层级与像素视觉修复
  - Skills: [`theme-system`, `ui-ux-pro-max`] — token 合规 + 像素层次感
  - Omitted: [`settings-ui-patterns`] — 非 settings 场景

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [11,12] | Blocked By: [4]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:598-640` — 当前背景层

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "wall\|floor\|baseboard" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] 背景层至少 3 层（墙、踢脚线、地板）可通过选择器/变量命中

  **QA Scenarios**:
  ```
  Scenario: 背景层存在且有分层
    Tool: Playwright
    Steps: 打开场景并读取背景层元素截图
    Expected: 可识别墙面、踢脚线、地板三段区域
    Evidence: .sisyphus/evidence/task-10-background-layers.png

  Scenario: 主题 token 合规检查
    Tool: Bash
    Steps: grep 检查本次新增背景样式是否含硬编码 # 颜色
    Expected: 不存在 #RRGGBB；全部为 var(--*) / color-mix
    Evidence: .sisyphus/evidence/task-10-token-compliance.txt
  ```

  **Commit**: YES | Message: `fix(pixel-office): restore pixel-style wall and floor background layers` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 11. 重新对齐家具与区域锚点（修复“乱”）

  **What to do**: 基于新背景基线重排 `LAYOUT_SCENE_OBJECTS` 与 `ZONES`：保证工位、书架、休闲区与墙地透视一致；避免家具漂浮感和跨区错位。
  **Must NOT do**: 不减少家具精灵种类；不回退到 `Furn` 主体渲染。

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: 坐标系与锚点统一修复
  - Skills: []
  - Omitted: [`ui-ux-pro-max`] — 非新风格探索

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [12] | Blocked By: [5,10]

  **References**:
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:464-486` — 场景对象数据
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx:208-212` — zone anchors

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "const ZONES" packages/ui/src/components/pixel-office/PixelOffice.tsx`
  - [ ] `grep -n "const LAYOUT_SCENE_OBJECTS" packages/ui/src/components/pixel-office/PixelOffice.tsx`

  **QA Scenarios**:
  ```
  Scenario: 家具不越界且不漂浮
    Tool: Playwright
    Steps: 提取所有家具 sprite bounding boxes 与 floorTop
    Expected: 家具底部 y >= floorTop-2，且不超 scene 边界
    Evidence: .sisyphus/evidence/task-11-furniture-bbox.json

  Scenario: agent 与家具不重叠异常
    Tool: Playwright
    Steps: 注入 6 agent 状态；采集 agent 与家具 bbox
    Expected: 关键工作位无遮挡（交叠面积阈值 <= 15%）
    Evidence: .sisyphus/evidence/task-11-agent-furniture-overlap.json
  ```

  **Commit**: YES | Message: `fix(pixel-office): realign furniture layout with wall-floor perspective` | Files: [`packages/ui/src/components/pixel-office/PixelOffice.tsx`]

- [ ] 12. 回归验证（布局与背景专项）

  **What to do**: 运行专项验证：1024x768 / 1280x800 截图对比、无横向滚动断言、墙地分层检测、构建链路复跑。
  **Must NOT do**: 不使用人工目测结论替代断言。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 综合回归验收
  - Skills: [`playwright`]
  - Omitted: []

  **Parallelization**: Can Parallel: NO | Wave 5 | Blocks: [] | Blocked By: [9,10,11]

  **References**:
  - Pattern: `packages/ui/src/components/chat/StatusRow.tsx:273-289`
  - Pattern: `packages/ui/src/components/pixel-office/PixelOffice.tsx`

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run type-check && bun run lint && bun run build` 成功
  - [ ] Playwright: 1024x768 无水平滚动，scene 完整显示
  - [ ] Playwright: 墙、踢脚线、地板三层均可定位并截图

  **QA Scenarios**:
  ```
  Scenario: 小屏回归验证
    Tool: Playwright
    Steps: 1024x768 打开 Pixel Office，断言无 horizontal scrollbar
    Expected: 断言通过
    Evidence: .sisyphus/evidence/task-12-mobile-regression.png

  Scenario: 背景分层验证
    Tool: Playwright
    Steps: 抓取 scene 截图并输出分层元素坐标
    Expected: 墙/踢脚线/地板坐标区间不重合且顺序正确
    Evidence: .sisyphus/evidence/task-12-background-structure.json
  ```

  **Commit**: NO | Message: `n/a` | Files: [`n/a`]

<!-- TASKS_END -->

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Real Browser QA (Agent-executed) — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Task 1 完成后 commit: `feat(pixel-office): add furniture sprite generation script`
- Task 2 完成后 commit: `feat(pixel-office): add detailed furniture sprite sheets`
- Task 4-7 完成后 commit: `feat(pixel-office): upgrade scene layout and furniture rendering`
- 或合并为单一 commit: `feat(pixel-office): upgrade scene with wider layout and detailed pixel art furniture`

## Success Criteria
1. 场景视觉上明显更宽敞、更精细
2. 家具像素细节与人物精灵质量一致（多色彩、有轮廓线、有明暗变化）
3. type-check / lint / build 全部通过
4. 场景在弹出面板中完整显示，无溢出或裁切
