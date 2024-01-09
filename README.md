# @val-town/codemirror-continue

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
