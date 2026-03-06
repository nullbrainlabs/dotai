# ADR-003: Four-tier scope hierarchy

**Status:** Accepted
**Date:** 2026-02-20

## Context

AI coding tools support different scopes for configuration. Claude Code has enterprise/project/user scopes, Cursor has project/user, and Codex has project-level config. We needed a universal scope model that maps cleanly to all targets.

## Decision

Define a **four-tier scope hierarchy** in `src/domain/scope.ts`:

```
enterprise > project > user > local
```

Precedence flows from highest (enterprise) to lowest (local). The `SCOPE_PRECEDENCE` array and `scopeOutranks()` helper encode this ordering.

- **Enterprise** — Organization-wide policies (maps to Claude Code enterprise scope).
- **Project** — Repository-level config in `.ai/` (maps to all targets).
- **User** — Personal config in `~/.ai/` (maps to Claude user scope, Cursor user rules).
- **Local** — Machine-specific overrides (maps to Claude local scope).

## Consequences

- Emitters can map scopes to the closest equivalent in each target tool.
- Some targets don't support all scopes — emitters handle the mismatch (e.g., Codex only has project scope, so user-scope rules go to the project-level output).
- The hierarchy enables org-wide + personal config without conflicts.
- `IgnorePattern` scope is restricted to `"project" | "user"` since enterprise/local ignore patterns aren't meaningful.
