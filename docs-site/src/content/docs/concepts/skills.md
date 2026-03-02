---
title: Skills
description: Reusable knowledge packages invoked by name across all AI tools.
---

Skills are portable, named knowledge packages that teach an AI agent how to perform a specific task. They are the most convergent concept in dotai: every supported tool uses an identical on-disk format, and no translation is required. A skill you author once works without modification in Claude Code, Cursor, Codex, and Copilot.

### TypeScript interface

```typescript
interface Skill {
  name: string;
  description: string;
  content: string;
  disableAutoInvocation: boolean;
  argumentHint?: string;
  userInvocable?: boolean;
  allowedTools?: string[];
  model?: string;
  context?: "fork";
  agent?: string;
  hooks?: Record<string, unknown>;
  license?: string;
}
```

## Skill structure

Each skill lives in its own subdirectory under `.ai/skills/`. The directory name is the skill's identifier. The entry point is always `SKILL.md`. Supporting files — scripts, references, assets — can be co-located in the same directory.

```
.ai/
  skills/
    deploy/
      SKILL.md          # required entry point
      scripts/
        preflight.sh
      references/
        runbook.md
      assets/
        diagram.png
```

The skill directory is self-contained. When dotai emits a skill, it copies the entire directory to each tool's output location.

## Writing SKILL.md

`SKILL.md` uses YAML frontmatter followed by the skill's instructional content.

```markdown
---
description: Deploy the application to a target environment using the standard runbook.
disableAutoInvocation: false
argumentHint: "<environment>"
allowedTools: Bash, Read, Glob
model: sonnet
---

## When to use

Invoke this skill when the user asks to deploy, release, or publish the application.

## Steps

1. Run `scripts/preflight.sh` to verify the environment is ready.
2. Confirm the target environment with the user if not specified.
3. Execute the deployment pipeline using the credentials in the project vault.
4. Validate the deployment by checking the health endpoint.
5. Report the deployed version and any warnings from the pipeline output.

## Notes

- Never deploy directly to production without a preflight check.
- If the pipeline fails, stop and surface the error rather than retrying automatically.
```

### Frontmatter fields

| Field | Type | Default | Description |
|---|---|---|---|
| `description` | string | required | One-line summary shown in tool UIs and used for auto-invocation matching |
| `disableAutoInvocation` | boolean | `false` | Prevent the tool from invoking this skill automatically; require explicit invocation |
| `argumentHint` | string | — | Hint for the argument format shown in the slash command menu (e.g. `<file-path>`, `<environment>`) |
| `userInvocable` | boolean | `true` | When `false`, the skill is not user-invocable (only model-invoked, hidden from slash commands) |
| `allowedTools` | string | — | Comma-separated list of tools the skill is allowed to use (e.g. `Read, Grep, Glob`) |
| `model` | string | — | Model override for skill execution (e.g. `sonnet`, `haiku`, `opus`) |
| `context` | `"fork"` | — | Set to `fork` to run the skill in an isolated context |
| `agent` | string | — | Name of an agent to delegate to when this skill is invoked |
| `hooks` | object | — | Inline [hook](/concepts/hooks) definitions for skill lifecycle (nested YAML) |
| `license` | string | — | SPDX license identifier for skill distribution (Copilot only) |

:::caution
The `allowedTools` field uses **comma-separated** format (`Read, Grep, Glob`), not bracket/array syntax. This matches the SKILL.md frontmatter format that Claude Code expects.
:::

## Auto-invocation

When `disableAutoInvocation` is `false` (the default), the tool may invoke the skill automatically when it detects that the user's request matches the skill's description. The `description` field drives this matching — write it as a clear, specific statement of what the skill does.

When `disableAutoInvocation` is `true`, the skill is never invoked automatically. The user must reference it explicitly by name (e.g., "@deploy" or "/deploy" depending on the tool). Use this for skills that are sensitive, destructive, or context-dependent enough that automatic invocation would be unsafe.

## Argument hints

The `argumentHint` field provides a hint for the argument format shown in the slash command menu. This helps users understand what to pass when invoking the skill.

```yaml
---
description: Review a pull request for code quality issues.
argumentHint: "<pr-number>"
---
```

When the user types `/review-pr`, the menu shows `/review-pr <pr-number>`.

## Tool restrictions

The `allowedTools` field restricts which tools the skill can use during execution:

```yaml
---
description: Search the codebase for patterns and report findings.
allowedTools: Read, Grep, Glob, WebSearch
---
```

When set, the skill can only use the listed tools. This is useful for creating read-only skills or limiting destructive capabilities.

## Context and agent delegation

### Fork context

Set `context: fork` to run the skill in an isolated context. The skill gets its own conversation context, preventing it from polluting the main session:

```yaml
---
description: Run a comprehensive security audit.
context: fork
model: opus
---
```

### Agent delegation

Set `agent` to delegate skill invocation to a named agent:

```yaml
---
description: Deploy the application.
agent: deploy-agent
---
```

When this skill is invoked, it delegates to the `deploy-agent` agent instead of executing inline.

## Inline hooks

Skills can define their own hooks that run during skill execution:

```yaml
---
description: Format and lint the codebase.
hooks:
  PostToolUse:
    - matcher: Write
      hooks:
        - type: command
          command: "npx prettier --write"
---
```

See [Hooks](/concepts/hooks) for the full hook reference.

## Cross-tool support

Skills have no translation loss. Every tool reads them from the same path using the same format.

| Tool | Output path | Format |
|---|---|---|
| Claude Code | `.claude/skills/<name>/SKILL.md` | Identical |
| Cursor | `.cursor/skills/<name>/SKILL.md` | Identical |
| Codex | `.codex/skills/<name>/SKILL.md` | Identical |
| Copilot | `.github/skills/<name>/SKILL.md` | Identical |

Skills are the strongest interoperability story in dotai. There is no translation layer, no field mapping, no dropped semantics. The same `SKILL.md` file is copied verbatim to every tool's output directory.

## Best practices

**Name skills as verbs or verb phrases.** `deploy`, `write-migration`, `review-pr` are better names than `deployment`, `migrations`, or `code-review`. The name is how users and tools invoke the skill.

**Include a "When to use" section.** This is the single most important piece of content in a skill. It tells the tool when to invoke the skill automatically and helps users know when to reach for it manually.

**Reference supporting files explicitly.** If the skill uses scripts, templates, or reference documents in its directory, mention them by relative path in the content. The tool will not discover them automatically.

**Keep skills actionable.** A skill should describe a process, not just convey information. It should read like a runbook: numbered steps, concrete commands, clear decision points.

**Scope each skill to one task.** A skill that covers deploy, rollback, and environment provisioning is too broad. Split it into three skills. Smaller, focused skills are easier to invoke, easier to maintain, and less likely to confuse the agent.
