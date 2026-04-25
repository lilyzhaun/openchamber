# Upstream 合并后的汉化恢复手册

这份文档用于记录本仓库相对 upstream 的**汉化层修改点**，方便下次合并 upstream 更新时直接恢复，不必重新从 0 排查。

## 适用原则

本仓库长期原则：

- **功能逻辑与 UI 结构一律以上游为准**。
- fork **只保留汉化层**，即：
  - i18n key 接线
  - `en` / `zh-CN` 词条补齐
  - 中文可见文案恢复
- 不保留与 upstream 相悖的功能分叉、样式分叉、结构分叉。

也就是说，下次合并时应当先把仓库收敛到 upstream 的结构，再按本文恢复汉化。

---

## 推荐工作流

### 1. 先合并 upstream，再恢复汉化

建议顺序：

1. 清理工作区或先 stash 本地改动。
2. 合并 `upstream/main`。
3. 冲突处理时，**优先保留 upstream 的结构与逻辑**。
4. 合并完成后，再按本文恢复汉化层。
5. 最后运行：
   - `bun run type-check`
   - `bun run build`
   - `bun run lint`

### 2. 恢复优先级

如果时间有限，按以下顺序恢复最划算：

1. `packages/ui/src/lib/i18n/locales.ts`
2. 设置页主链路
3. 认证 / onboarding
4. 侧栏 / Header / 会话确认弹窗
5. MCP 页面长尾
6. 其它零散 UI 长尾

---

## 当前汉化修改总览

以下文件是当前这轮相对 upstream 明确做过汉化恢复/补齐的落点。

### A. 词条中心

#### `packages/ui/src/lib/i18n/locales.ts`

这是最重要的恢复文件。当前已补齐/扩展的主要命名空间：

- `settings.appearance.*`
  - `timeFormat*`
  - `weekStart*`
  - `installOrientation*`
- `settings.behavior.*`
  - `messageStreamTransport*`
  - `activityRenderModeOption.*`
- `settings.privacy.*`
- `settings.magicPromptsSidebar.*`
- `settings.magicPrompts.prompt.*`
- `settings.mcpSidebar.*`
- `session.confirmDialogs.*`
- `auth.tunnel.*`
- `auth.passkey.*`
- `auth.locked.trustDevice`
- `onboarding.chooseConnection`
- `onboarding.localInstall`
- `onboarding.connectRemote`
- `onboarding.checking`
- `onboarding.checkAndContinue`
- `onboarding.checkHelpText`
- `onboarding.remote.*`
- `onboarding.localSetupTitle`
- `onboarding.localSetupDesc`
- `onboarding.preferRemote`
- `chat.permissionCard.*`
- `sidebar.sections.*`
- `sectionPlaceholder.comingSoon`
- `layout.sidebar.*`

> 注意：`settings.mcpPage.*` 这组 key 在当前仓库中已经相对完整，**下次合并后优先复用这些 key**，不要重新发明一套新 key。

---

### B. 设置页相关

#### `packages/ui/src/components/views/SettingsView.tsx`

- 已补：`'magic-prompts'` 对应的 `settings.pages.magicPrompts` 标题映射。
- 这是合并后很容易因为上游新增 slug 而漏掉的类型点。

#### `packages/ui/src/components/sections/openchamber/OpenChamberVisualSettings.tsx`

这是设置页最关键的共享组件之一，外观 / 聊天很多内容都复用它。

当前已恢复：

- `useI18n()` 接线
- 外观相关标题、select、tooltip、aria、按钮文案
- 聊天 / 行为相关选项文案
- 隐私文案

下次 merge 后如果出现“设置导航已汉化，但页面内容英文”的情况，**优先先看这个文件**。

#### `packages/ui/src/components/sections/openchamber/NotificationSettings.tsx`

当前已恢复：

- 通知开关与说明
- 测试通知文案
- toast / debug message 的 i18n 接线
- AI summarization 与 push notifications 的部分文案

#### `packages/ui/src/components/sections/magic-prompts/MagicPromptsSidebar.tsx`

- 分组标题改为走 `settings.magicPromptsSidebar.*`
- 侧栏项标题改为走 `settings.magicPrompts.prompt.*`

---

### C. MCP 相关

#### `packages/ui/src/components/sections/mcp/McpSidebar.tsx`

当前已恢复：

- 页面标题
- 刷新按钮
- 空状态
- 本地 / 远程服务器标签
- 删除确认弹窗
- 删除动作按钮

#### `packages/ui/src/components/sections/mcp/McpPage.tsx`

**这是目前仍然最值得继续扫的长尾热点。**

现状：

- `locales.ts` 里已经有很多 `settings.mcpPage.*` 词条
- 但组件内部仍有不少直接英文文案没有完全替换

下次 merge 后，优先做法不是重新设计，而是：

1. grep `settings.mcpPage.`
2. 将组件里的英文 toast / label / dialog / status 文案机械替换成现有 key

重点关注：

- 保存 / 删除提示
- 连接 / 断开 / 测试连接
- 授权流程提示
- 空状态
- import JSON snippet / delete dialog

---

### D. 认证 / 会话 / 侧栏

#### `packages/ui/src/components/auth/SessionAuthGate.tsx`

当前已恢复：

- 解锁标题
- passkey 按钮文案
- trust device 文案
- 网络 / 密码 / 服务器错误提示

#### `packages/ui/src/components/session/sidebar/ConfirmDialogs.tsx`

当前已恢复：

- 删除/归档会话确认弹窗
- 删除文件夹确认弹窗
- 单数 / 复数文案接线

#### `packages/ui/src/components/session/sidebar/SidebarHeader.tsx`

当前已恢复：

- 新建会话 / 新建多运行 / 搜索 / 选择 / 显示模式 / 折叠展开等 header 行为文案

#### `packages/ui/src/components/layout/Header.tsx`

当前已恢复一部分：

- mobile tabs：Chat / Plan / Diff / Files / Terminal
- services / usage / remaining / open sessions 等高频导航项

但它仍然是**下次 merge 后建议复查**的文件，因为上游经常会在 Header 上加新入口。

#### `packages/ui/src/constants/sidebar.ts`
#### `packages/ui/src/components/sections/SectionPlaceholder.tsx`

当前已恢复：

- 侧栏 section label / description 改为可通过 `getSidebarSectionConfig(t)` 生成
- placeholder 的 `Coming soon...` 已接 i18n

---

### E. Onboarding 相关

#### `packages/ui/src/components/onboarding/ChooserScreen.tsx`
#### `packages/ui/src/components/onboarding/RemoteConnectionForm.tsx`
#### `packages/ui/src/components/onboarding/LocalSetupScreen.tsx`

当前已恢复：

- 欢迎页 / 本地安装 / 远程连接主路径
- Windows + WSL 指引
- Browse / Apply / Retry / Test Connection 等按钮
- 远程连接错误提示、状态提示、下一步操作提示

这三块在 upstream 更新后经常会新增说明文案，所以下次 merge 时建议把它们作为一组一起复查。

---

### F. 聊天权限相关

#### `packages/ui/src/components/chat/PermissionCard.tsx`

当前已恢复：

- `Permission Required`
- `Working Directory / Timeout / Request / Headers / Body / Response format`
- `Action / Details / Patterns`
- `Allow Once / Always Allow / Deny`
- `From subagent`

这块容易被忽略，但用户在权限审批流程中会频繁看到。

---

## 当前文件清单（本轮明确修改过）

下次 merge 后，优先对照这些文件：

- `packages/ui/src/components/auth/SessionAuthGate.tsx`
- `packages/ui/src/components/chat/PermissionCard.tsx`
- `packages/ui/src/components/layout/Header.tsx`
- `packages/ui/src/components/onboarding/ChooserScreen.tsx`
- `packages/ui/src/components/onboarding/LocalSetupScreen.tsx`
- `packages/ui/src/components/onboarding/RemoteConnectionForm.tsx`
- `packages/ui/src/components/sections/SectionPlaceholder.tsx`
- `packages/ui/src/components/sections/magic-prompts/MagicPromptsSidebar.tsx`
- `packages/ui/src/components/sections/mcp/McpSidebar.tsx`
- `packages/ui/src/components/sections/openchamber/NotificationSettings.tsx`
- `packages/ui/src/components/sections/openchamber/OpenChamberVisualSettings.tsx`
- `packages/ui/src/components/session/sidebar/ConfirmDialogs.tsx`
- `packages/ui/src/components/session/sidebar/SidebarHeader.tsx`
- `packages/ui/src/components/views/SettingsView.tsx`
- `packages/ui/src/constants/sidebar.ts`
- `packages/ui/src/lib/i18n/locales.ts`
- `packages/ui/src/index.css`

### 本地相对 upstream 的 UI 行为偏差（非汉化）

这些偏差不是上游 bug，而是 fork 为了更好的默认体验做的本地覆盖。合并时如果 upstream 改到同一处，务必**保留本地值**而不是直接接受 upstream。

- **消息 footer 时间折叠阈值**
  - 文件：`packages/ui/src/index.css`
  - 规则：`@container message-footer`
  - Upstream 值：`max-width: 24rem`（在常见宽度下就会隐藏时间文字，只剩图标，用户感知为"时间消失"）
  - 本地值：`max-width: 12rem`（只有极窄布局才折叠，默认仍显示时间）
  - 合并策略：保留 `12rem`，并保留 CSS 里解释偏差原因的块注释

---

## 下次合并时的建议检查命令

### 找出仍然直接显示英文的高频设置 / MCP / onboarding 入口

```bash
grep -R "Test Connection\|Connect & Restart\|Permission Required\|Windows setup\|Coming soon" packages/ui/src/components
```

### 找出已经走 `t(...)` 的当前落点

```bash
grep -R "useI18n\|t('settings\.mcpPage\|t('chat\.permissionCard\|t('onboarding\.remote\|t('layout\.sidebar" packages/ui/src
```

### 合并后必跑验证

```bash
bun run type-check
bun run build
bun run lint
```

---

## 尚未完全收尾的长尾热点

即使按本文恢复完，仍建议额外检查以下文件，因为它们在当前分支中仍有可继续汉化的空间：

- `packages/ui/src/components/sections/mcp/McpPage.tsx`
- `packages/ui/src/components/layout/VSCodeLayout.tsx`
- `packages/ui/src/components/chat/message/ToolOutputDialog.tsx`
- `packages/ui/src/components/sections/openchamber/PasskeySettings.tsx`

这些文件目前不是阻塞构建的问题，而是**后续可继续提升中文覆盖率**的热点。

---

## 维护要求

以后每次合并 upstream 并恢复汉化后，如果新增了新的汉化层修改点，请同步更新本文：

- 新增了哪些组件改用 `t()`
- `locales.ts` 新增了哪些命名空间
- 哪些页面仍是待扫长尾

目标不是记录“做了很多事”，而是让下次 merge 时能直接按本文逐项恢复。
