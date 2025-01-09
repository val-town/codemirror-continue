import {
  insertNewlineContinueComment,
  maybeCloseBlockComment,
} from "../src/index.js";
import { javascript } from "@codemirror/lang-javascript";
import { test, expect } from "vitest";
import { EditorState, type Text, type Transaction } from "@codemirror/state";

function insert(text: string, pos: number, char = " ") {
  let tr: Transaction | null = null;

  function dispatch(tr1: Transaction) {
    tr = tr1;
  }
  let state = EditorState.create({
    doc: text,
    extensions: [
      javascript({
        typescript: true,
        jsx: true,
      }),
    ],
  });

  state = state.update({
    selection: { anchor: pos, head: pos },
  }).state;

  tr = null;
  if (char === " ") insertNewlineContinueComment({ state, dispatch: dispatch });
  else if (char === "/") maybeCloseBlockComment({ state, dispatch: dispatch });
  else throw new Error("char must be ' ' or '/'");

  if (tr)
    state = (tr as Transaction).state

  return [ state.doc?.toString(), state.selection.main.head ];
}

test("/*", () => {
  const doc = "/* abc";
  const end = "/* abc\n * ";
  expect(insert(doc, doc.length)).toEqual([ end, end.length ]);
});

test("/**", () => {
  const doc = "/** abc";
  const end = "/** abc\n * ";
  expect(insert(doc, doc.length)).toEqual([ end, end.length ]);
});

test("midway", () => {
  const doc = "/** abc";
  expect(insert(doc, doc.length - 2)).toEqual([ doc, doc.length - 2 ]);
});

test("after code", () => {
  const doc = `
let a = 1; /** abc`;
  const end = `${doc}
            * `;
  expect(insert(doc, doc.length)).toEqual([ end, end.length ]);
});

test("indented", () => {
  const doc = `
/** Comment */
function increment(num: number) {
  /** indented
  return num + 1;
}
/** Continue`;

  const end = `
/** Comment */
function increment(num: number) {
  /** indented
   * 
  return num + 1;
}
/** Continue`;

  expect(insert(doc, 64)).toEqual([ end, 70 ]);
});

test("earlier close missing", () => {
  const doc = `
let a /* forgot to close this...

/* ...so this will align with the one above`;

  const end = `${doc}
       * `;

  expect(insert(doc, doc.length)).toEqual([ end, end.length ]);
});

test("ends on line", () => {
  const doc = "/** abc */";
  expect(insert(doc, doc.length - 3)).toEqual([ doc, doc.length - 3 ]);
});

test("previous comment ends on line", () => {
  const doc = `
/*export*/ function f() { /* description `;
  const end = `${doc}
                           * `;
  expect(insert(doc, doc.length)).toEqual([ end, end.length ]);
});

test("ends on line (/)", () => {
  const doc = "/** abc */";
  expect(insert(doc, doc.length - 3, "/")).toEqual([ doc, doc.length - 3 ]);
});

test("previous comment ends on line (/)", () => {
  const doc = "/*export*/ function f() { /* * ";
  // Could do this.
  //const end = "/*export*/ function f() { /* */";
  const end = "/*export*/ function f() { /* * ";
  expect(insert(doc, doc.length, "/")).toEqual([ end, end.length ]);
});
