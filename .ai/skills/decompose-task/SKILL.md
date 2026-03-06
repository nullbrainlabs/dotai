---
description: Break a complex task into a phased GitHub issue with an actionable checklist.
disableAutoInvocation: true
---

# Decompose Task

## Steps

1. **Analyze scope** — determine which codebase areas the task affects:
   - Domain types (`src/domain/`)
   - Config schema/loader (`src/config/`)
   - Emitters (`src/emitters/`)
   - Commands (`src/commands/`)
   - Specs (`specs/`)
   - Tests (`tests/`)

2. **Group into phases** — order by dependency:
   - Phase 1: Domain changes (types, factories, guards)
   - Phase 2: Config changes (schema, loader, validation)
   - Phase 3: Emitter changes (one per entity x target)
   - Phase 4: Command changes (sync, init, etc.)
   - Phase 5: Tests (update snapshots, typecheck)
   - Phase 6: Docs (README, regenerate tool configs)

   Skip phases that don't apply. Each checklist item should reference specific file paths.

3. **Check for matching skills** — if the task aligns with an existing skill (add-target-tool, add-entity-type, update-emitter, handle-spec-drift), reference it in the issue body.

4. **Create the issue** — use `gh issue create` with:
   - A clear title describing the task
   - Appropriate labels
   - A body with phased markdown checklist
   - Each item independently completable via `@claude`

```sh
gh issue create \
  --title "Task: <description>" \
  --label "enhancement" \
  --body "<phased checklist>"
```

5. **Confirm** — output the issue URL and a summary of phases created.
