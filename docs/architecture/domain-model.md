# Domain Model

This document describes the eight domain entities that form dotai's unified configuration model, explains the scope hierarchy that governs precedence, and highlights the key architectural insights that shaped these choices.

---

## Why These 8 Entities

dotai targets three AI coding tools -- Claude Code, Cursor, and Codex -- each with its own configuration surface. After mapping every configurable concept across all three tools, we identified eight distinct entity types that, together, cover the full configuration space:

| Entity | What it governs |
|--------|----------------|
| **Rule** | Persistent textual instructions that shape agent behavior |
| **Skill** | Reusable packages of domain knowledge invoked by name |
| **Agent** | Specialized sub-agents with isolated context and tool restrictions |
| **ToolServer** | External tool/data providers connected via MCP |
| **Hook** | Event-driven handlers fired at agent lifecycle points |
| **Permission** | Access control rules governing what tools the agent can use |
| **Setting** | Key-value configuration for model selection, feature flags, and tool behavior |
| **IgnorePattern** | File/directory exclusion rules that limit what the agent sees or indexes |

No entity is redundant. Each maps to at least one concrete configuration concept in every target tool (with the exception of Hook, which Codex does not support). Removing any entity would leave a category of configuration unrepresentable.

---

## The 4-Tier Scope Hierarchy

Every scoped entity (Rule, ToolServer, Hook, Permission, Setting, IgnorePattern) carries a `scope` field drawn from a four-level hierarchy:

```
enterprise > project > user > local
```

**Precedence flows from left to right.** Enterprise scope has the highest precedence; local scope has the lowest. When the same logical configuration exists at multiple scopes, the higher-precedence scope wins.

### Scope Definitions

| Scope | Meaning | Typical location | Committed to VCS? |
|-------|---------|-------------------|--------------------|
| **Enterprise** | Organization-wide policy enforced across all projects | Managed centrally (e.g. `~/.config/dotai/enterprise/`) | N/A (distributed separately) |
| **Project** | Shared project configuration, same for all contributors | `.ai/config.yaml`, `.ai/rules/` | Yes |
| **User** | Personal preferences for the current user | `~/.config/dotai/user/` | No |
| **Local** | Machine-specific overrides (e.g. local paths, dev secrets) | `.ai/config.local.yaml` | No (gitignored) |

### Precedence Logic

The `scopeOutranks(a, b)` function compares two scopes by their index in `SCOPE_PRECEDENCE`:

```typescript
export const SCOPE_PRECEDENCE: readonly Scope[] = [
  Scope.Enterprise,  // index 0 -- highest
  Scope.Project,     // index 1
  Scope.User,        // index 2
  Scope.Local,       // index 3 -- lowest
];
```

A lower index means higher precedence. This means:
- Enterprise permissions cannot be overridden by project, user, or local config.
- Project rules take precedence over user or local rules when they conflict.
- Local settings exist for convenience (machine-specific paths, personal model preferences) but cannot weaken enterprise or project policy.

### Why This Order

The precedence order `enterprise > project > user > local` reflects a trust hierarchy:

1. **Enterprise** represents organizational security and compliance policy. It must be unoverridable.
2. **Project** represents team consensus. A project that says "never run rm -rf" should not be overridden by a user preference.
3. **User** represents personal workflow customization that does not violate project or enterprise rules.
4. **Local** represents ephemeral, machine-specific values (paths to local MCP servers, debug flags).

---

## Entity Reference

### Rule

```typescript
interface Rule {
  content: string;         // Markdown body
  scope: Scope;
  appliesTo?: string[];    // Glob patterns -- activates only for matching file paths
  alwaysApply: boolean;    // Always include vs. intelligent selection
  description?: string;    // Used for intelligent selection when alwaysApply is false
}
```

**Rationale:** Every AI coding tool has a mechanism for injecting persistent instructions into the agent's context. Rule is the unified abstraction for all of them.

**Cross-tool mapping:**

| Tool | Source format |
|------|-------------|
| Claude Code | `CLAUDE.md` (project-wide, always-apply), `.claude/rules/*.md` (scoped rules with frontmatter) |
| Cursor | `.cursor/rules/*.mdc` (MDC files with YAML frontmatter: `alwaysApply`, `globs`, `description`) |
| Codex | `AGENTS.md` (single project-wide instruction file) |

**Design notes:**
- The `appliesTo` field maps directly to Cursor's `globs` frontmatter and Claude Code's file-scoped rules.
- The `alwaysApply` flag distinguishes between rules that are always injected and those selected by the agent based on relevance.
- Codex has no equivalent of conditional/scoped rules; all rules targeting Codex are concatenated into a single `AGENTS.md`.

### Skill

```typescript
interface Skill {
  name: string;                  // Invocation identifier (e.g. /skill-name)
  description: string;           // What this skill does
  content: string;               // SKILL.md body (markdown)
  disableAutoInvocation: boolean; // Restrict to explicit /skill-name only
}
```

**Rationale:** Skills are the most convergent concept across all three tools. All three use a nearly identical format: a `SKILL.md` file inside a named directory, optionally accompanied by scripts, references, and assets.

**Cross-tool mapping:**

| Tool | Location |
|------|----------|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| Cursor | `.cursor/skills/<name>/SKILL.md` |
| Codex | `.codex/skills/<name>/SKILL.md` |

**Design notes:**
- Skills are not scoped. They are project-level artifacts by nature -- portable packages that can be shared, versioned, and reused.
- The `disableAutoInvocation` flag controls whether the agent can decide on its own to activate the skill, or whether it requires explicit `/skill-name` invocation by the user.

### Agent

```typescript
interface Agent {
  name: string;           // Delegation identifier
  description: string;    // When/why to delegate
  model?: string;         // Model override
  readonly?: boolean;     // Read-only file access
  instructions: string;   // System prompt (markdown)
  tools?: string[];       // Allowed tool names (undefined = all)
}
```

**Rationale:** All three tools support the concept of specialized sub-agents that handle focused tasks. The primary agent delegates to them based on context.

**Cross-tool mapping:**

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | `.claude/agents/*.md` | Markdown with frontmatter (model, tools, etc.) |
| Cursor | `.cursor/agents/*.md` | Markdown with frontmatter |
| Codex | Config sections | `[agents.<name>]` in `.codex/config.toml` |

**Design notes:**
- Agents are task-driven, not capability-driven. They activate at specific workflow points (plan validation, code review, documentation checks).
- The `readonly` flag is a coarse permission control. Fine-grained permissions are handled by the Permission entity.
- The `tools` array restricts what the sub-agent can do. When undefined, the sub-agent inherits all tools from the primary agent.

### ToolServer

```typescript
interface ToolServer {
  name: string;
  transport: "stdio" | "http" | "sse";
  command?: string;          // Stdio transport
  url?: string;              // HTTP/SSE transport
  args?: string[];           // Command arguments
  env?: Record<string, string>;
  enabledTools?: string[];   // Whitelist
  disabledTools?: string[];  // Blacklist
  scope: Scope;
}
```

**Rationale:** MCP (Model Context Protocol) is universal across all three tools. Every tool supports connecting to external tool servers that provide additional capabilities (database access, API integrations, custom tooling).

**Cross-tool mapping:**

| Tool | Config location | Format |
|------|----------------|--------|
| Claude Code | `.mcp.json` | JSON with `mcpServers` object |
| Cursor | `.cursor/mcp.json` | JSON with `mcpServers` object |
| Codex | `.codex/config.toml` | TOML `[mcp_servers.<name>]` sections |

**Design notes:**
- Transport types cover the three MCP connection modes: `stdio` (spawn a subprocess), `http` (stateless HTTP endpoint), and `sse` (server-sent events for streaming).
- `enabledTools` and `disabledTools` provide tool-level filtering on a per-server basis. They are mutually exclusive in practice -- use one or the other.
- ToolServer is scoped because enterprise policy may mandate certain MCP servers (e.g., a compliance tool) while local config may add developer-specific servers.

### Hook

```typescript
interface Hook {
  event: HookEvent;     // Lifecycle trigger
  matcher?: string;     // Filter condition (glob or tool name)
  handler: string;      // Shell command or prompt
  scope: Scope;
}
```

Where `HookEvent` is one of: `preToolUse`, `postToolUse`, `preFileEdit`, `postFileEdit`, `sessionStart`, `sessionEnd`.

**Rationale:** Hooks allow injecting custom behavior at specific points in the agent lifecycle -- running linters after file edits, logging tool usage, or enforcing pre-commit checks.

**Cross-tool mapping:**

| Tool | Support | Format |
|------|---------|--------|
| Claude Code | Full | `hooks` section in settings JSON |
| Cursor | Partial | Rule-triggered actions |
| Codex | None | Not supported |

**Design notes:**
- Hook is the only entity with partial tool support. When generating Codex output, hooks are silently dropped with a warning in the generation log.
- The `matcher` field acts as a filter: for `preToolUse`/`postToolUse`, it matches tool names; for `preFileEdit`/`postFileEdit`, it matches file glob patterns.
- Hooks are scoped because enterprise policy may require mandatory hooks (e.g., audit logging) that project or user config cannot disable.

### Permission

```typescript
interface Permission {
  tool: string;          // Tool name (e.g. "Bash", "Read", "Write")
  pattern?: string;      // Glob/prefix for argument matching
  decision: "allow" | "deny" | "ask";
  scope: Scope;
}
```

**Rationale:** Every tool has access control, but the granularity and model differ significantly. Permission provides a unified representation that can be projected onto each tool's native format.

**Cross-tool mapping:**

| Tool | Model | Format |
|------|-------|--------|
| Claude Code | Per-tool allow/deny/ask with glob patterns: `Bash(npm run *)`, `Read(src/**)` | `.claude/settings.json` permissions object |
| Cursor | Per-type allow/deny: `Shell(cmd)`, `Read(glob)`, `Write(glob)` | `.cursor/cli.json` |
| Codex | Coarse: `approval_policy` (suggest/auto-edit/full-auto) + `sandbox_mode` (off/read-only/full) | `.codex/config.toml` |

**Design notes:**
- Permission translation is the most lossy operation in dotai. Codex's coarse-grained model (three approval levels, two sandbox modes) cannot express "allow Bash for npm commands but deny Bash for rm". dotai maps to the most restrictive Codex equivalent.
- The `ask` decision maps to Claude Code's interactive approval prompt. Cursor has no direct equivalent; `ask` maps to `deny` in Cursor output.
- Permissions are scoped because enterprise policy must be able to enforce hard deny rules that lower scopes cannot override.

### Setting

```typescript
interface Setting {
  key: string;
  value: unknown;
  scope: Scope;
}
```

**Rationale:** Each tool has miscellaneous configuration that does not fit into the other seven categories -- model defaults, feature flags, UI preferences, context window behavior.

**Cross-tool mapping:**

| Tool | Location | Format |
|------|----------|--------|
| Claude Code | `.claude/settings.json` | JSON |
| Cursor | `.cursor/cli.json` | JSON |
| Codex | `.codex/config.toml` | TOML |

**Design notes:**
- Setting is intentionally loosely typed (`value: unknown`). The set of valid keys and value types is tool-specific and evolves with each tool's releases.
- dotai maintains a registry of known setting keys and their valid types, but passes through unknown keys without validation to support forward compatibility.

### IgnorePattern

```typescript
interface IgnorePattern {
  pattern: string;
  scope: Exclude<Scope, "enterprise" | "local">;
}
```

**Rationale:** All three tools benefit from excluding irrelevant files (build artifacts, node_modules, lock files, generated code) from the agent's context window and file indexing.

**Cross-tool mapping:**

| Tool | Mechanism |
|------|-----------|
| Claude Code | Deny rules on `Read()` and `Edit()` in permissions |
| Cursor | `.cursorignore` and `.cursorindexingignore` files |
| Codex | Protected paths and `shell_environment_policy` |

**Design notes:**
- IgnorePattern is restricted to `project` and `user` scope. Enterprise-level ignore rules do not exist in practice (they would need to anticipate all possible project structures). Local-level ignore is unnecessary because local scope already implies machine-specific configuration that is not shared.
- Patterns use gitignore-style glob syntax, which is the most widely understood and supported format across all three tools.

---

## Key Architectural Insights

### 1. Skills Convergence

All three tools have converged on a nearly identical skills format:

```
skills/<name>/
  SKILL.md          # Description, instructions, examples
  scripts/          # Optional automation scripts
  references/       # Optional reference documents
  assets/           # Optional supporting files
```

This convergence means dotai can generate skills with near-zero translation loss. A skill written once works identically across Claude Code, Cursor, and Codex. This is the strongest interoperability story in the entire domain model.

### 2. Rule Divergence

Rules are the most divergent concept across tools:

- **Claude Code** uses `CLAUDE.md` for project-wide always-apply instructions, plus `.claude/rules/*.md` files with YAML frontmatter for scoped, conditional rules.
- **Cursor** uses `.cursor/rules/*.mdc` files with its own MDC frontmatter format (`alwaysApply`, `globs`, `description`).
- **Codex** uses a single `AGENTS.md` file with no support for conditional application, glob-based scoping, or intelligent selection.

This divergence means dotai must perform non-trivial translation. A rule with `appliesTo: ["*.tsx"]` and `alwaysApply: false` maps cleanly to Claude Code and Cursor, but must be unconditionally concatenated into `AGENTS.md` for Codex, losing its conditional semantics.

### 3. MCP Universality

All three tools support MCP with minor config format differences:

- Claude Code and Cursor both use JSON with an `mcpServers` top-level key.
- Codex uses TOML with `[mcp_servers.<name>]` sections.

The data model is identical across all three: name, transport, command/URL, args, env, and tool filtering. Translation is mechanical and lossless.

### 4. Hooks Partial Support

Hooks are supported by Claude Code (full lifecycle events) and Cursor (partial, via rule-triggered actions), but not by Codex at all. This means:

- dotai generates hook configuration for Claude Code and Cursor.
- For Codex, hooks are dropped with a warning.
- Users who depend heavily on hooks should be aware that their Codex output will lack these capabilities.

### 5. Permissions Translation Challenge

Permission granularity varies dramatically:

| Granularity | Claude Code | Cursor | Codex |
|-------------|-------------|--------|-------|
| Per-tool | Yes | Yes | No |
| Per-argument pattern | Yes (`Bash(npm run *)`) | Partial (`Shell(cmd)`) | No |
| Three-way decision | Yes (allow/deny/ask) | No (allow/deny only) | No (approval_policy only) |
| Sandbox isolation | No | No | Yes (off/read-only/full) |

dotai handles this by:
1. Storing permissions at the finest granularity (Claude Code level).
2. Projecting down to coarser models during generation:
   - `ask` becomes `deny` in Cursor output.
   - Fine-grained tool patterns are collapsed to the most restrictive matching Codex `approval_policy`.
3. Logging warnings when translation is lossy so users understand what was lost.
