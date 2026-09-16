/** @jsxImportSource @opentui/solid */
import { Plugin } from "@opencode/plugin/tui"
import { TipsView } from "./tips-view"

export default Plugin.define({
  id: "opencode-i18n",
  setup(context) {
    context.ui.slot({
      prepend: "home.footer",
      render: () => <TipsView context={context} />,
    })
  },
})