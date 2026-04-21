---
"@valtown/codemirror-continue": patch
---

Only continue asterisks for JSDoc comments

Previously if you were editing a comment that started with `/*`,
we'd continue the comment. This change restricts the behavior so it
only continues block comments that start with `/**`, which are usually
JSDoc comments. This is intended to make it easier to comment out code.
