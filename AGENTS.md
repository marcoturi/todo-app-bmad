# Agent Rules

## Tool priority

Use the best tool for the task. Keep reads and edits minimal.

- **Serena**: code navigation, symbol lookup, references, targeted edits
- **Context7**: official library/framework docs, APIs, configuration, version-aware usage
- **Chrome DevTools**: runtime UI validation in browser, layout/CSS issues, console/network errors

## When to use Serena

Use Serena first for code work:

- find definitions, symbols, and references
- inspect file structure before reading files
- make precise symbol-level edits
- understand impact before changing code

Do not start code exploration with `grep` if Serena can answer semantically.
Use text search only as fallback.

## When to use Context7

Use Context7 when the task depends on external library or framework knowledge:

- library APIs and recommended usage
- framework patterns and configuration
- version-specific behavior
- setup details from official docs

Do not guess API usage when Context7 can verify it.

## When to use Chrome DevTools

Use Chrome DevTools for browser/runtime validation:

- visual UI issues such as spacing, padding, alignment, overflow
- checking the real rendered result after a change
- inspecting DOM, applied CSS, console errors, and network failures
- verifying that a frontend fix works in the browser

Do not rely on static code inspection alone for visual bugs.

## Default workflow

1. Use **Context7** if framework/library behavior is relevant
2. Use **Serena** to locate and change the correct code
3. Use **Chrome DevTools** to validate browser results when UI/runtime behavior matters

## Fallbacks

- Use targeted file reads only when tool output is insufficient
- Use `grep` or broad search only when Serena cannot resolve the target
- Keep context usage lean; avoid broad scans and full-file reads unless necessary
