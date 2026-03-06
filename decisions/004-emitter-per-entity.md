# ADR-004: One emitter per entity type

**Status:** Accepted
**Date:** 2026-02-20

## Context

We needed to organize emitter code. Two options:

1. **Per entity type** — One emitter for "rules" that handles all 4 targets (Claude, Cursor, Codex, Copilot) via internal dispatch.
2. **Per target** — One emitter for "Claude" that handles all entity types.

## Decision

Use **one emitter per entity type**, with per-target files inside each emitter's subdirectory.

Structure: `src/emitters/<entity>/` contains `claude.ts`, `cursor.ts`, `codex.ts`, `copilot.ts`, and `index.ts`. The `index.ts` implements the `Emitter` interface and dispatches to the target-specific module.

## Consequences

- Entity-specific logic (e.g., rule frontmatter parsing, MCP server grouping) stays together.
- Adding a new target tool means adding one file per emitter subdirectory — changes are spread but small.
- Adding a new entity type means creating one new subdirectory with all targets — self-contained.
- The `EMITTERS` array in `commands/sync.ts` runs all emitters in sequence; `merge.ts` reconciles when multiple emitters write to the same output path.
