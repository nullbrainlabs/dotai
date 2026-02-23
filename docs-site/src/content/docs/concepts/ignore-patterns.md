---
title: Ignore Patterns
description: File exclusion rules that limit what the agent sees or indexes.
---

Ignore patterns exclude files and directories from agent context. When an agent indexes your repository or reads files, ignored paths are filtered out before anything reaches the context window. This keeps the agent's context focused on signal rather than noise — build artifacts, lock files, and generated code rarely provide useful information for coding tasks.

## TypeScript Interface

```typescript
interface IgnorePattern {
  pattern: string;
  scope: Exclude<Scope, "enterprise" | "local">;
}
```

Note that the scope for ignore patterns is restricted to `project` and `user` only. The `enterprise` and `local` tiers are not supported for this entity type.

## Configuration

Ignore patterns are defined in the `ignore` section of `.ai/config.yaml`. Patterns use gitignore-style glob syntax.

```yaml
ignore:
  - pattern: "dist/**"
    scope: project
  - pattern: "node_modules/**"
    scope: project
  - pattern: "*.lock"
    scope: project
  - pattern: ".cache/**"
    scope: project
```

## Cross-Tool Support

Each tool has its own native mechanism for file exclusion. dotai translates ignore patterns into whichever format the target tool uses.

| Aspect | Claude Code | Cursor | Codex | Copilot |
|---|---|---|---|---|
| Config | `.claude/settings.json` (deny Read/Edit) | `.cursorignore` | `.codex/config.toml` (`protected_paths`) | Not supported |
| Format | Permission deny rules | Gitignore-style file | TOML array | N/A |

Claude Code does not have a native ignore file, so dotai emits ignore patterns as `deny` permission rules targeting the `Read` and `Edit` tools. The effect is equivalent — the agent cannot read or edit matched paths — but the mechanism differs from the other tools.

## Best Practices

Exclude paths that generate noise in the agent context window without contributing useful information:

- **Build artifacts** — `dist/**`, `build/**`, `out/**`
- **Lock files** — `*.lock`, `package-lock.json`, `yarn.lock`
- **Generated code** — `**/*.generated.ts`, `**/generated/**`
- **Caches and temp dirs** — `.cache/**`, `tmp/**`, `.turbo/**`
- **Large binary or data dirs** — `**/*.wasm`, `data/**`

Keeping ignored paths lean maximizes the portion of the context window available for source code, tests, and documentation that the agent actually needs.

## Known Limitations

- **Copilot** — Does not support ignore pattern configuration via files. All ignore patterns are skipped with a warning during `ai sync`.
