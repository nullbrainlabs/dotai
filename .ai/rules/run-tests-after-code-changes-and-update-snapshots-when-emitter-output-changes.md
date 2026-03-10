---
scope: project
alwaysApply: true
description: Run tests after code changes and update snapshots when emitter output changes
---

# Test After Change

- After modifying `src/`, run `pnpm test` before considering the task complete
- After modifying `src/emitters/**`, run `pnpm test -- --update` first, then `pnpm test`
- After modifying domain types or config schema, also run `pnpm typecheck`
- Never skip or delete failing tests — fix root causes
- Test files mirror source: `tests/emitters/rules/claude.test.ts` ↔ `src/emitters/rules/claude.ts`
