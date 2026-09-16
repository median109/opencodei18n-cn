# OpenCode i18n (CN)

OpenCode TUI 界面汉化插件 —— 在 [opencode-i18n](https://github.com/huahai0202/opencode-i18n)（简称 opencode-i18n 原始仓库）的基础上，补全了**主页面提示（tips）的汉化**：

- 命令面板、菜单、描述、缩略命令等全部界面文案中文化（继承自原插件）；
- **主页面 `说点什么…` 下方的提示区改为轮换显示中文小技巧**（快捷键、命令、配置技巧），未连接模型服务商时显示 `/connect` 引导；
- 提供与内置英文 tips 完全一致的能力：`{highlight}...{/highlight}` 高亮、`{key:xxx}` 自动替换真实快捷键。

效果与默认行为保持一致：

- 未连接任何 AI 服务商 → 显示 `/connect` 引导提示；
- 已连接、但还没有会话 → 不显示（与内置一致）；
- 已有会话 → 随机轮换显示一条中文技巧。

## 一键安装

### 方式一：npm 安装（推荐）

```bash
opencode plugin add opencode-i18n-cn
```

安装后重启 OpenCode，运行 `/i18n` 选择 **简体中文**。选择 `English` 会回到原始英文界面。

### 方式二：本地目录安装（不需要 npm/pnpm/bun）

将插件目录复制到 `~/.config/opencode/plugins/` 下：

```bash
cp -r /path/to/opencodei18n-cn ~/.config/opencode/plugins/opencode-i18n-cn
```

重启 OpenCode 即可。

说明：

- 本插件基于 opencode v2 公开插件 API（`Plugin.define` + `ui.slot` + `keymap.layer` + `storage.store` + `dialog.select`），无内部 patch，跨版本优雅生存。
- 插件自带语言包（`i18n/locales/*.json`），开箱即用。
- 重新安装/覆盖前，旧版本 `opencode-i18n` 请先移除，避免两个翻译插件并存：

```bash
opencode plugin remove opencode-i18n
```

## 命令

| 命令 | 说明 |
| --- | --- |
| `/i18n` 或 `/语言` | 打开语言选择对话框 |
| `/tips` 或 `/提示` | 切换主页提示的显示/隐藏 |

也可通过命令面板（`Ctrl+P`）搜索 `切换界面语言` 或 `切换主页提示显示`。

## 跨版本优雅生存

本插件只使用 opencode v2 公开插件 API，不依赖内部补丁。核心机制：

- **槽位声明**：`context.ui.slot({ prepend: "home.footer" })` —— 在内置 footer 上方渲染提示，不替换内置内容。
- **状态持久化**：`context.storage.store` —— Solid 响应式 store，JSON 持久化到磁盘，跨重启同步。
- **快捷键解析**：`context.keymap.shortcuts(id)` —— 反应式读取注册命令的格式化快捷键；若命令不存在或不可解析，对应提示自动省略（优雅降级）。
- **语言选择**：`context.ui.dialog.select` —— Promise 弹窗选择器。
- **命令注册**：`context.keymap.layer` —— 注册 `/i18n` 和 `/tips` 命令。

前导键（leader）提示：v2 中 leader 为 timed 伪命令，仅在 leader timeout 窗口内可达。插件通过 `shortcuts("leader")` 反应式解析；若返回空（非待输入态），该条提示自动省略，与内置键盘帮助行为一致。

## 自定义语言包

语言包是**整个文件替换**（不做深合并）。把文件放到 `~/.config/opencode/i18n/locales/` 即可覆盖内置默认值，例如：

```text
~/.config/opencode/i18n/locales/
└── zh-Hans.json        # 覆盖内置简体中文包
```

用户目录里缺失的 locale JSON 仍会回退到包内默认值。

### 自定义 tips（提示文案）

`zh-Hans.json` 顶部多了一个 **`tips`** 数组。每条是一个字符串模板，支持两种占位语法：

| 语法 | 含义 |
| --- | --- |
| `{highlight}文本{/highlight}` | 高亮一段文本（渲染为强调色） |
| `{key:名字}` | 替换为用户实际绑定的快捷键（见下），键位缺失时该条提示自动跳过 |

快捷键名字映射（与内置 tips 一致）：

`agentCycle` `childFirst` `childNext` `childPrevious` `commandList` `editorOpen` `helpShow` `inputClear` `inputNewline` `inputPaste` `inputUndo` `leader` `messagesCopy` `messagesFirst` `messagesLast` `messagesPageDown` `messagesPageUp` `messagesToggleConceal` `modelCycleRecent` `modelList` `sessionExport` `sessionInterrupt` `sessionList` `sessionNew` `sessionParent` `sessionPinToggle` `sessionQuickSwitch1` `sessionQuickSwitch9` `sessionSidebarToggle` `sessionTimeline` `statusView` `terminalSuspend` `themeList`

示例：

```json
"tips": [
  "输入 {highlight}@{/highlight} 加文件名进行模糊搜索并附加文件",
  "按 {key:commandList} 查看所有可用的操作与命令"
]
```

新增语言时，只要在 `i18n/locales/` 添加一个 locale JSON 即可被自动识别；**提示（tips）目前仅内置中文（`zh-Hans`）**，其它语言包暂未翻译 tips（缺少 `tips` 数组时该语言不显示提示、也不隐藏内置英文提示）。

## 文件说明

- `tui.tsx`：v2 插件入口（re-export）。
- `plugins/i18n/index.tsx`：`Plugin.define` 主入口。声明 `home.footer` 槽位（prepend）、注册 `/i18n` 和 `/tips` 命令、管理语言状态（`storage.store`）。
- `plugins/i18n/tips-view.tsx`：主页面提示组件（Solid JSX）。负责 `{key:xxx}` 快捷键解析、`{highlight}` 高亮、随机轮换、连接检测。
- `i18n/lib.ts`：共享路径、配置与语言解析逻辑（复用，无改动）。
- `i18n/config.json`：默认语言与内置语言排序。
- `i18n/locales/*.json`：语言包；`zh-Hans.json` 内含 `tips` 提示文案。

## License

MIT，原始版权归 opencode-i18n 原作者所有。
