# ADR-007: Markdown frontmatter for rules

**Status:** Accepted
**Date:** 2026-02-20

## Context

Rules need metadata (scope, glob patterns, description, alwaysApply) alongside their markdown content. We needed a format that keeps rules human-readable while supporting structured metadata.

## Decision

Rules are **markdown files with YAML frontmatter** in `.ai/rules/*.md`:

```markdown
---
alwaysApply: true
description: Code style conventions
appliesTo:
  - "src/**/*.ts"
outputDir: docs-site
---

# Rule content here

The markdown body is the rule's `content` field.
```

The `markdown-loader.ts` parser splits frontmatter from content. Frontmatter fields map directly to `Rule` interface properties.

## Consequences

- Rules are readable and editable in any text editor or markdown preview.
- YAML frontmatter is a well-known convention (used by Jekyll, Hugo, Astro, etc.).
- New rule metadata fields can be added to frontmatter without changing the file format.
- The `content` field is always the markdown body after the frontmatter delimiter.
