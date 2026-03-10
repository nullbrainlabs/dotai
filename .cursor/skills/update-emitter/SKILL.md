---
name: update-emitter
description: 1. **Identify scope** — which entity (rules/skills/agents/mcp/permissions/hooks) and which target...
---

# Update Emitter

## Steps

1. **Identify scope** — which entity (rules/skills/agents/mcp/permissions/hooks) and which target(s) (claude/cursor/codex/copilot)?

2. **Read the spec and drift report** — open `specs/<target>.md`, find the entity section, check the field reference tables. Confirm the change is valid for the target tool. If `specs/<target>.drift-report.json` exists with status `"pending"`, read it to understand exactly what changed and which emitters are affected. Cross-reference the spec's Known Gaps to avoid "fixing" documented gaps without discussion.

3. **Read the current emitter** — open `src/emitters/<entity-plural>/<target>.ts` and understand the existing output format.

4. **Assess cross-target impact** — check all 4 target submodules for the same entity. Each tool handles fields differently. Determine if other targets need analogous changes.

5. **Make the change** — the emitter is a pure function returning `EmitResult` with files and warnings. Keep it functional.

6. **Update tests** — edit `tests/emitters/<entity-plural>/<target>.test.ts` to cover the changed behavior.

7. **Run tests** — execute `pnpm test -- --update`, review snapshot diffs to confirm they match expectations, then run `pnpm test` to verify everything passes.

8. **Check structural tests** — if JSON or TOML output changed, verify contract/structural test snapshots are correct.

9. **Update the spec** — if you discovered the spec was outdated during this process, update it.
