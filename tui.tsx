/**
 * opencode-i18n-cn — opencode v2 TUI 入口。
 *
 * 插件形态：v2 公开插件 API（Plugin.define + ui.slot/home.footer + keymap.layer
 * + storage.store + dialog.select），无内部 patch。入口由 package.json 的
 * exports["./tui"] 指向本文件；opencode v2 通过它加载 TUI 插件。
 *
 * 仅转发到实际实现，避免双份逻辑。
 */
export { default } from "./plugins/i18n/index.tsx"
