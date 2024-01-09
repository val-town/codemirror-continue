import { EditorView, basicSetup } from "codemirror";
import { Prec } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { continueKeymap } from "../src/index.js";
import { keymap } from "@codemirror/view";

(async () => {
  let editor = new EditorView({
    doc: `/** Comment */
function increment(num: number) {
  /** indented
  return num + 1;
}
/** Continue`,
    extensions: [
      basicSetup,
      javascript({
        typescript: true,
        jsx: true,
      }),
      Prec.high(keymap.of(continueKeymap)),
    ],
    parent: document.querySelector("#editor")!,
  });
})();
