# ADR-005: File merge strategy for shared paths

**Status:** Accepted
**Date:** 2026-02-20

## Context

Multiple emitters can produce files at the same output path. For example, both the rules emitter and the agents emitter may write to `CLAUDE.md`. We needed a strategy to combine these outputs.

## Decision

Implement format-aware merging in `src/emitters/merge.ts`:

- **JSON** (`.json`) — Deep-merge objects. Arrays are concatenated, nested objects are recursively merged.
- **TOML** (`.toml`) — Concatenate sections with blank line separators.
- **Markdown** (`.md`) — Concatenate with `---` separator between sections.
- **Other formats** — Last writer wins.

The `mergeFiles()` function groups `EmittedFile[]` by path and applies the appropriate strategy.

## Consequences

- Emitters can independently produce fragments for shared files without coordinating.
- JSON deep-merge enables composable `.mcp.json` and settings files.
- Markdown concatenation preserves all content from all emitters.
- Order matters for last-writer-wins — emitter registration order in `EMITTERS` determines precedence.
