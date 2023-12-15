import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { continueComments } from "../src/index.js";

(async () => {
  let editor = new EditorView({
    doc: `let hasAnError: string = 10;

function increment(num: number) {
  return num + 1;
}

increment('not a number');`,
    extensions: [
      basicSetup,
      javascript({
        typescript: true,
        jsx: true,
      }),
    ],
    parent: document.querySelector("#editor")!,
  });
})();
