## What
<!-- Brief description -->

## Why
<!-- Motivation / issue link -->

## Affected targets
<!-- Which AI tools are affected? claude / cursor / codex / copilot / none -->

## Checklist
- [ ] `pnpm test` passes
- [ ] Changeset added (if user-facing): `pnpm changeset`
- [ ] No upward imports (layer boundaries respected)
- [ ] Emitter changes checked against `specs/`
- [ ] Snapshots updated if emitter output changed (`pnpm test -- --update`)
- [ ] New domain types have factory + type guard + re-export
- [ ] Docs updated if user-facing behavior changed (`docs-site/` and/or `CLAUDE.md`)
