# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the dotai project.

## Index

| # | Title | Status |
|---|-------|--------|
| [001](001-inline-content-generation.md) | Inline content generation over file refs/symlinks | Accepted |
| [002](002-functional-style.md) | Functional style, no classes | Accepted |
| [003](003-four-tier-scope.md) | Four-tier scope hierarchy | Accepted |
| [004](004-emitter-per-entity.md) | One emitter per entity type | Accepted |
| [005](005-file-merge-strategy.md) | File merge strategy for shared paths | Accepted |
| [006](006-state-conflict-detection.md) | State-based conflict detection | Accepted |
| [007](007-markdown-frontmatter-rules.md) | Markdown frontmatter for rules | Accepted |
| [008](008-outputdir-subdirectory-rules.md) | OutputDir for per-subdirectory rules | Accepted |
| [009](009-rename-directive-to-rule.md) | Rename "directive" to "rule" | Accepted |
| [010](010-biome-over-eslint.md) | Biome over ESLint + Prettier | Accepted |

## Template

```markdown
# ADR-NNN: Title

**Status:** Accepted
**Date:** YYYY-MM-DD

## Context
Why this decision was needed.

## Decision
What we chose.

## Consequences
What follows from this decision.
```
