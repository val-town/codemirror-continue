import { type StateCommand, EditorSelection } from "@codemirror/state";
import type { KeyBinding } from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { javascriptLanguage } from "@codemirror/lang-javascript";

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
  let dont = null;
  const changes = state.changeByRange((range) => {
    // Don't do anything if we're not in JavaScript mode.
    // This should also cover TypeScript, which is just
    // JavaScript with extra configuration.
    if (!range.empty || !javascriptLanguage.isActiveAt(state, range.from))
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

      const indentation = line.text.match(/^([^\*\/]+)([\*|\/])/);
      let indentStr = indentation?.[1] || " ";

      // If continuing from /**,
      // we want an extra space of indentation
      // to match the second *
      if (indentation?.[2] === "/") {
        indentStr = indentStr + " ";
      }
      const insert = state.lineBreak + `${indentStr}* `;

      return {
        range: EditorSelection.cursor(pos + insert.length),
        changes: { from: line.to, insert: insert },
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
  let dont = null;
  const changes = state.changeByRange((range) => {
    // Don't do anything if we're not in JavaScript mode.
    // This should also cover TypeScript, which is just
    // JavaScript with extra configuration.
    if (!range.empty || !javascriptLanguage.isActiveAt(state, range.from))
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
