---
title: Settings
description: Key-value configuration for model selection, feature flags, and tool behavior.
---

Settings are intentionally loosely typed key-value pairs used to configure model selection, temperature, feature flags, and tool-specific behavior. The loose typing is deliberate — it allows dotai to pass through settings for future or tool-specific keys without requiring a schema update.

## TypeScript Interface

```typescript
interface Setting {
  key: string;
  value: unknown;
  scope: Scope;
}
```

## Configuration

Settings are defined in the `settings` section of `.ai/config.yaml`.

```yaml
settings:
  - key: model
    value: claude-sonnet-4-20250514
    scope: project
  - key: temperature
    value: 0.7
    scope: user
```

## Common Settings

| Key | Example Value | Description |
|---|---|---|
| `model` | `"claude-sonnet-4-20250514"` | The model ID to use for the agent |
| `temperature` | `0.7` | Sampling temperature controlling response randomness |
| Feature flags | `true` / `false` | Tool-specific feature toggles, passed through as-is |

## Scope

Settings support all four scope tiers. When the same key appears at multiple scopes, the narrower scope wins.

| Scope | Meaning |
|---|---|
| `enterprise` | Organization-wide defaults, committed to VCS |
| `project` | Repository-level settings, committed to VCS |
| `user` | Personal preferences from `~/.ai/`, not committed |
| `local` | Machine-local overrides from `.ai.local/`, gitignored |

## Forward Compatibility

Unknown keys are passed through to the target tool's configuration without validation. This allows you to use tool-specific settings that dotai does not explicitly model. Settings are emitted only for the tool that understands them — a key only recognized by Claude Code will not appear in Cursor's config output.

## Known Limitations

- **Copilot** — Does not support file-based settings configuration. All settings are skipped with a warning during `ai sync`.
