# @valtown/codemirror-continue

<a href="https://www.npmjs.com/package/@valtown/codemirror-continue" rel="nofollow"><img src="https://img.shields.io/npm/v/@valtown/codemirror-continue.svg" alt="npm"></a>

This **continues block comments when you
hit Enter** in [CodeMirror](https://codemirror.net/).

Like when you're typing and you're here:

```ts
/**<cursor>
```

When you hit enter, you want it to do this:

```ts
/**
 * <cursor>
```

Right? Well, this CodeMirror extension does just that. It
also handles the case where you're on the last line of a
comment, like

```ts
/**
 * My comment
 * <cursor>
```

And you hit `/`, it'll _delete_ the previous space, giving you

```ts
/**
 * My comment
 */
```

Spectacular! Get it?

## Usage

Import `continueKeymap`:

```ts
import { continueKeymap } from "@valtown/codemirror-continue";
```

Import `keymap` and `Prec`:

```ts
import { Prec } from "@codemirror/state";
import { keymap } from "@codemirror/view";
```

Add the keybinding to your CodeMirror instance's `extensions` array:

```ts
extensions: [
  basicSetup,
  // … other setup
  Prec.high(keymap.of(continueKeymap)),
],
```

And that's it! This will only do anything if your CodeMirror
is using a language that supports `/* */` style block comments,
like JavaScript and TypeScript.
