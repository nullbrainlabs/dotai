---
applyTo: "src/emitters/**/*.ts"
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
- After modifying output, run `pnpm test -- --update` then review snapshot diffs

---

---
applyTo: "src/emitters/**/*.ts"
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
- After modifying output, run `pnpm test -- --update` then review snapshot diffs
