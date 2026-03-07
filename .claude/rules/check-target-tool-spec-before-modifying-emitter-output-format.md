---
paths:
  - "src/emitters/**/*.ts"
---

# Emitter Spec Check

Before modifying any emitter file, read the corresponding spec to verify your changes are valid.

## Spec Mapping

- `*/claude.ts` → `specs/claude-code.md`
- `*/cursor.ts` → `specs/cursor.md`
- `*/codex.ts` → `specs/codex.md`
- `*/copilot.ts` → `specs/copilot.md`

## Requirements

- The spec defines exact file paths, frontmatter schemas, JSON structures, and TOML sections
- When adding a new field, verify the tool supports it via the spec's field reference tables
- When the spec shows a "Known Gap", don't silently "fix" it without discussion

## MANDATORY: Update Snapshots After Any Emitter Change

**Every change to emitter output format MUST be followed by a snapshot update.** Skipping this will cause CI contract test failures.

1. Run `pnpm test -- --update` to regenerate all contract snapshots
2. Review the snapshot diff to confirm only expected files changed
3. Commit the updated snapshots alongside the emitter changes in the same PR

Contract snapshots live in `tests/contracts/__snapshots__/<target>/`. If you change frontmatter fields, JSON structure, or file content for any target, those snapshot files must be updated.
