---
title: Permissions
description: Access control rules governing what tools the agent can use.
---

Permissions control what tools agents can invoke and with what arguments. Each permission rule targets a specific tool by name, optionally narrows the match with an argument pattern, and assigns a decision — `allow`, `deny`, or `ask`. Rules are evaluated in order; the first match wins.

## TypeScript Interface

```typescript
interface Permission {
  tool: string;          // Tool name ("Bash", "Read", "Write")
  pattern?: string;      // Glob/prefix for argument matching
  decision: "allow" | "deny" | "ask";
  scope: Scope;
}
```

## Configuration

Permissions are defined in the `permissions` section of `.ai/config.yaml`.

```yaml
permissions:
  - tool: Bash
    pattern: "npm run *"
    decision: allow
    scope: project
  - tool: Bash
    pattern: "rm -rf *"
    decision: deny
    scope: project
```

### Permission Fields

| Field | Type | Description |
|---|---|---|
| `tool` | `string` | The tool name to match, e.g. `"Bash"`, `"Read"`, `"Write"` |
| `pattern` | `string` | Optional glob or prefix pattern matched against the tool's argument |
| `decision` | `"allow" \| "deny" \| "ask"` | What to do when the rule matches |
| `scope` | `Scope` | Scope tier this rule applies at |

## Decision Types

| Decision | Behavior |
|---|---|
| `allow` | Auto-approve the tool invocation without prompting the user |
| `deny` | Block the tool invocation entirely |
| `ask` | Prompt the user for approval before proceeding |

The `ask` decision is the default behavior for most tools when no matching permission rule exists. Explicit `allow` rules are useful for automating repetitive, safe operations. Explicit `deny` rules create hard guardrails that cannot be bypassed by the agent.

## Cross-Tool Support

dotai translates permissions into each tool's native access control format. Coverage and granularity vary significantly across tools.

| Aspect | Claude Code | Cursor | Codex | Copilot |
|---|---|---|---|---|
| Granularity | Per-tool + argument patterns | Per-tool-type + patterns | Global policy only | None |
| Decisions | allow/deny/ask | allow/deny | suggest/auto-edit/full-auto | N/A |
| Tool targeting | `Bash(npm run *)` | `Shell(cmd)` | N/A | N/A |
| Sandbox | N/A | N/A | off/read-only/full | N/A |

### Translation Rules

- **Cursor** — Does not support the `ask` decision. Rules with `decision: ask` are translated to `deny` so that the agent stops rather than proceeding silently.
- **Codex** — Does not support per-tool permission rules. Fine-grained rules are coerced to the most restrictive matching global policy. A single `deny` rule for any tool forces Codex into `suggest` mode for the entire session.
- **Claude Code** — Full support for per-tool rules, argument patterns, and all three decision types.

### Known Limitations

- **Copilot** — Does not support file-based permission configuration. All permission rules are skipped with a warning during `ai sync`.
- **Codex** — Only supports a global automation policy (`suggest`, `auto-edit`, `full-auto`). Per-tool and per-pattern granularity is lost.
- **Cursor** — Does not support the `ask` decision. `ask` rules are emitted as `deny` to preserve safety.
