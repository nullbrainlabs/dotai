# ADR-008: OutputDir for per-subdirectory rules

**Status:** Accepted
**Date:** 2026-02-20

## Context

Some projects have subdirectories that need their own rules (e.g., `docs-site/CLAUDE.md` with documentation-specific conventions). Claude Code supports per-directory `CLAUDE.md` files, and Cursor supports per-directory rules. We needed a way to route rules to specific subdirectories.

## Decision

Add an optional `outputDir` field to the `Rule` interface:

```yaml
---
outputDir: docs-site
alwaysApply: true
---
Documentation-specific rules here.
```

When `outputDir` is set, emitters write the rule to `<outputDir>/CLAUDE.md` (Claude), `<outputDir>/.cursor/rules/` (Cursor), etc., instead of the project root.

## Consequences

- Rules can target specific subdirectories without creating separate `.ai/` configs per subdirectory.
- The root `.ai/config.yaml` remains the single source of truth.
- Emitters must handle path construction based on `outputDir` presence.
- Not all targets support per-directory rules equally — emitters handle the mismatch gracefully.
