import { insertNewlineContinueComment } from '../src/index.js';
import { javascript } from "@codemirror/lang-javascript";
import { test, expect } from "vitest";
import {
  EditorState,
  type Text,
  type Transaction,
} from "@codemirror/state";
import { EditorView } from "@codemirror/view";

function insert(text, pos) {
  let tr: any;

  function dispatch(tr1: Transaction) {
    tr = tr1
  }
  let state = EditorState.create({
    doc: text,
    extensions: [
      javascript({
        typescript: true,
        jsx: true,
      }),
    ]
  });

  state = state.update({
    selection: { anchor: pos, head: pos }
  }).state;

  tr = null;
  insertNewlineContinueComment({ state, dispatch: dispatch });

  let doc: Text
  if (tr)
    doc = tr.state.doc
  else
    doc = state.doc;

  return doc?.toString();
}

test("/*", () => {
  const doc = "/* abc";
  const end = "/* abc\n * ";
  expect(insert(doc, doc.length)).toEqual(end);
})

test("/**", () => {
  const doc = "/** abc";
  const end = "/** abc\n * ";
  expect(insert(doc, doc.length)).toEqual(end);
})


test("midway; ", () => {
  const doc = "/** abc";
  expect(insert(doc, doc.length - 2)).toEqual(doc);
})

test("after code", () => {
  const doc = `
let a = 1; /** abc`;
  const end = doc + `
            * `;
  expect(insert(doc, doc.length)).toEqual(end);
})

test("indented", () => {
  const doc = `
/** Comment */
function increment(num: number) {
  /** indented
  return num + 1;
}
/** Continue`

  const end = `
/** Comment */
function increment(num: number) {
  /** indented
   * 
  return num + 1;
}
/** Continue`;

  expect(insert(doc, 64)).toEqual(end);
})

test("earlier close missing", () => {
  const doc = `
let a /* forgot to close this...

/* ...so this will align with the one above`

  const end = doc + `
       * `;

  expect(insert(doc, doc.length)).toEqual(end);
})
