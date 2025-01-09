import { javascriptLanguage } from "@codemirror/lang-javascript";
import { syntaxTree } from "@codemirror/language";
import {
  EditorSelection,
  type EditorState,
  type Line,
  type SelectionRange,
  type StateCommand,
  type Text,
} from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";
import type { SyntaxNode } from "@lezer/common";

// commentTokens: {line: "//", block: {open: "/*", close: "*/"}},
interface Block {
  open: string | null,
  close: string | null
}
interface CommentTokens {
  line: string | null,
  block: Block | null
}

const atCommentToken = (doc: Text, pos: number, node: SyntaxNode) => {
  return (
    // Either */<HERE> or *<HERE>/.
    ((pos === node.to) || (pos === (node.to - 1)))
    // And there's enough space in the comment for it to be ending.
    && ((node.to - node.from) >= "/**/".length)
    // And the comment actually ends.
    && (doc.sliceString(node.to - 2, node.to) === "*/")
  );
}

const able = (state: EditorState, range: SelectionRange) => {
  if (range.empty) {
    const data = state.languageDataAt<CommentTokens>("commentTokens", range.from);
    for (let i = 0; i < data.length; i++) {
      const block = data[i]?.block;
      if (block
          && (block.open === "/*")
          && (block.close === "*/"))
        return true;
    }
  }
  return false;
}

/**
 * This is modeled after the CodeMirror Markdown mode's
 * ability to continue lists and blockquotes. It's meant to be bound
 * to the "Enter" keybinding with Prec.high: there are many cases
 * where this will "fall through", do nothing, and allow the next
 * keybinding to handle.
 */
export const insertNewlineContinueComment: StateCommand = ({
  state,
  dispatch,
}) => {
  const tree = syntaxTree(state);
  const { doc } = state;
  let dont: null | { range: SelectionRange } = null;
  const changes = state.changeByRange((range) => {
    if (!able(state, range))
      return (dont = { range });

    const pos = range.from;
    const line = doc.lineAt(pos);

    const node = tree.resolveInner(pos, -1);

    if (node.name === "BlockComment") {
      // If the cursor is at the */ token, do not continue.
      if (atCommentToken(doc, pos, node)) {
        return (dont = { range });
      }

      const startLine = doc.lineAt(node.from);
      let offset = node.from - startLine.from;
      if (offset < 0) {
        // Something went wrong.
        return (dont = { range });
      }
      offset++; // Line up with the *.

      const restOfLine = line.text.slice(pos - line.from).trim();
      let indentStr = " ".repeat(offset);
      const insert = `${state.lineBreak}${indentStr}* ${restOfLine}`;

      return {
        range: EditorSelection.cursor(pos + insert.length - restOfLine.length),
        changes: { from: pos, to: line.to, insert: insert },
      };
    }

    return (dont = { range });
  });
  if (dont) return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};

/**
 * When someone has created the final line of a block comment and
 * they hit /, we should _delete_ the space between the * and /
 * for convenience.
 */
export const maybeCloseBlockComment: StateCommand = ({ state, dispatch }) => {
  const tree = syntaxTree(state);
  const { doc } = state;
  let dont: null | { range: SelectionRange } = null;
  const changes = state.changeByRange((range) => {
    if (!able(state, range))
      return (dont = { range });
    const pos = range.from;
    const line = doc.lineAt(pos);

    const restOfLine = line.text.slice(pos - line.from).trim();

    // TODO: we could do something more sophisticated here.
    // If we're not at the end of the line,
    // do nothing.
    if (restOfLine) {
      return (dont = { range });
    }

    const node = tree.resolveInner(pos, -1);

    if (node.name === "BlockComment") {
      // If this line is the comment ending, do not
      // continue.
      if (line.text.match(/\*\//)) {
        return (dont = { range });
      }
      if (!line.text.match(/^\s+\* $/)) {
        return (dont = { range });
      }
      const insert = "/";
      return {
        range: EditorSelection.cursor(pos),
        changes: { from: line.to - 1, to: line.to, insert: insert },
      };
    }

    return (dont = { range });
  });
  if (dont) return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};

/**
 * Keymap to use to enable this extra behavior.
 *
 * Example of what you would put in your extensions array.
 *
 * ```ts
 * Prec.high(keymap.of(continueKeymap)),
 * ```
 */
export const continueKeymap: readonly KeyBinding[] = [
  { key: "Enter", run: insertNewlineContinueComment },
  { key: "/", run: maybeCloseBlockComment },
];
