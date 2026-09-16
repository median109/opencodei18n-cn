/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { Show, createMemo } from "solid-js"
import { readConfigSync, resolveLocale } from "../../i18n/lib.ts"

const SHORTCUTS: Record<string, string> = {
  agentCycle: "agent.cycle",
  childFirst: "session.child.first",
  childNext: "session.child.next",
  childPrevious: "session.child.previous",
  commandList: "command.palette.show",
  editorOpen: "prompt.editor",
  helpShow: "help.show",
  inputClear: "prompt.clear",
  inputNewline: "input.newline",
  inputPaste: "prompt.paste",
  inputUndo: "input.undo",
  leader: "leader",
  messagesCopy: "messages.copy",
  messagesFirst: "session.first",
  messagesLast: "session.last",
  messagesPageDown: "session.page.down",
  messagesPageUp: "session.page.up",
  messagesToggleConceal: "session.toggle.conceal",
  modelCycleRecent: "model.cycle_recent",
  modelList: "model.list",
  sessionExport: "session.export",
  sessionInterrupt: "session.interrupt",
  sessionList: "session.list",
  sessionNew: "session.new",
  sessionParent: "session.parent",
  sessionPinToggle: "session.pin.toggle",
  sessionQuickSwitch1: "session.quick_switch.1",
  sessionQuickSwitch9: "session.quick_switch.9",
  sessionSidebarToggle: "session.sidebar.toggle",
  sessionTimeline: "session.timeline",
  statusView: "opencode.status",
  terminalSuspend: "terminal.suspend",
  themeList: "theme.switch",
}

function resolveTip(template: string, context: Plugin.Context): string | undefined {
  const markers = (template.match(/\{key:[a-zA-Z0-9_]+\}/g) ?? []).filter(
    (marker, index, all) => all.indexOf(marker) === index,
  )
  if (markers.length === 0) return template

  let value = template
  for (const marker of markers) {
    const name = marker.slice("{key:".length, -1)
    const command = SHORTCUTS[name]
    if (!command) return undefined
    const keys = context.keymap.shortcuts(command)
    const keyText = keys[0]
    if (!keyText) return undefined
    value = value.replace(marker, `{highlight}${keyText}{/highlight}`)
  }
  return value
}

type TipPart = { text: string; highlight: boolean }

function parse(tip: string): TipPart[] {
  const parts: TipPart[] = []
  const regex = /\{highlight\}(.*?)\{\/highlight\}/g
  const found = Array.from(tip.matchAll(regex))
  const state = found.reduce(
    (acc, match) => {
      const start = match.index ?? 0
      if (start > acc.index) {
        acc.parts.push({ text: tip.slice(acc.index, start), highlight: false })
      }
      acc.parts.push({ text: match[1], highlight: true })
      acc.index = start + match[0].length
      return acc
    },
    { parts, index: 0 },
  )
  if (state.index < tip.length) {
    parts.push({ text: tip.slice(state.index), highlight: false })
  }
  return parts
}

const CONNECT_TIP = "运行 {highlight}/connect{/highlight} 添加 AI 服务商并开始编码"

export function TipsView(props: { context: Plugin.Context }) {
  const context = props.context

  // 命令注册必须在组件渲染体内执行（setup 阶段 Keymap.Provider 尚未初始化，
  // 与 opencode 内置 feature-plugins 的写法一致）。
  const [state, setState] = context.storage.store("state", {
    initial: {
      enabled: true,
      locale: resolveLocale(readConfigSync(), undefined) ?? "zh-Hans",
      tipsHidden: false,
    },
  })

  context.keymap.layer(() => ({
    commands: [
      {
        id: "i18n.switch_language",
        title: "切换界面语言",
        group: "i18n",
        palette: true,
        slash: { name: "i18n", aliases: ["lang", "语言"] },
        run: async () => {
          const cfg = readConfigSync()
          if (!cfg) return
          const locales = Object.keys(cfg.locales)
          const selected = await context.ui.dialog.select({
            title: "选择界面语言",
            placeholder: "搜索语言…",
            current: state.locale,
            options: locales.map((code) => ({
              value: code,
              title: cfg.locales[code]?.name ?? code,
            })),
          })
          if (selected) {
            setState((draft) => { draft.locale = selected })
          }
        },
      },
      {
        id: "i18n.tips.toggle",
        title: "切换主页提示显示",
        group: "i18n",
        palette: true,
        run: () => {
          setState((draft) => { draft.tipsHidden = !draft.tipsHidden })
        },
      },
    ],
  }))

  const activeTip = createMemo(() => {
    if (!state.enabled || state.tipsHidden) return null

    const config = readConfigSync()
    const locale = resolveLocale(config, state)
    const tips = (locale ? config?.locales?.[locale]?.tips : undefined) ?? []

    const connected = (context.data.location.provider.list(context.location) ?? []).some(
      (p: any) => p.id !== "opencode",
    )
    if (!connected) {
      const parts = parse(CONNECT_TIP)
      return { parts, prefix: "● 提示" }
    }

    if (context.data.session.list().length === 0) return null

    const candidates: string[] = []
    for (const entry of tips) {
      const value = resolveTip(entry, context)
      if (value) candidates.push(value)
    }
    if (candidates.length === 0) return null

    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    return { parts: parse(selected), prefix: "● 提示" }
  })

  return (
    <Show when={activeTip()}>
      <box width="100%" maxWidth={75} alignItems="center" paddingTop={2} flexShrink={1}>
        <box flexDirection="row" maxWidth="100%" width="100%">
          <text flexShrink={0} style={{ fg: context.theme.text.feedback.warning.default }}>
            {activeTip()!.prefix}{" "}
          </text>
          <text flexShrink={1} wrapMode="word">
            {activeTip()!.parts.map((part) => (
              <span style={{ fg: part.highlight ? context.theme.text.default : context.theme.text.subdued }}>{part.text}</span>
            ))}
          </text>
        </box>
      </box>
    </Show>
  )
}