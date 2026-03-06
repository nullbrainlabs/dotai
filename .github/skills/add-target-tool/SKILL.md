---
name: add-target-tool
description: Add support for a new AI coding tool target. Guides through enum, all emitters, sync command, and tests.
---

# Add Target Tool

## Steps

1. **Create spec files** — `specs/<tool>.md` (spec document) and `specs/<tool>.research.json` (research config with doc URLs)

2. **Add to TargetTool enum** — in `src/emitters/types.ts`, add the new value. `ALL_TARGETS` updates automatically.

3. **Add emitter submodules** — for each emitter directory (rules, skills, agents, mcp, permissions, hooks):
   - Create `src/emitters/<entity-plural>/<tool>.ts`
   - Add the switch case in the directory's `index.ts`

4. **Update sync command** — in `src/commands/sync.ts`:
   - Add output directory to `USER_OUTPUT_DIRS`
   - Add display label to `TARGET_LABELS`

5. **Update init command** — add the tool as a selectable target in `src/commands/init.ts`

6. **Add tests** — create test files for each emitter submodule, then run:

```sh
pnpm test -- --update
pnpm test
```
