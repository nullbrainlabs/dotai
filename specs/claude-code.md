# Claude Code Configuration Capabilities — Complete Reference

> Source: Claude Code official documentation (code.claude.com/docs)
> Last Researched Version: Claude Code 2.1.x (CLI)
> Date: 2026-03-09

## Table of Contents

1. [Rules (Instructions)](#1-rules-instructions)
2. [Agents](#2-agents)
3. [Skills](#3-skills)
4. [Hooks](#4-hooks)
5. [MCP Servers](#5-mcp-servers)
6. [Permissions & Settings](#6-permissions--settings)
7. [Ignore Patterns](#7-ignore-patterns)
8. [Plugins](#8-plugins)
9. [dotai Entity Coverage](#9-dotai-entity-coverage)

---

## 1. Rules (Instructions)

### 1a. Project-Wide — `CLAUDE.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.md` or `.claude/CLAUDE.md` (project root or any subdirectory) |
| **Format** | Plain Markdown (no frontmatter) |
| **Scope** | Loaded for all conversations in the project |
| **Subdirectory** | `subdir/CLAUDE.md` — loaded on demand when working in or below `subdir/` |

Multiple `CLAUDE.md` files are concatenated (root first, then deeper directories). Files above the working directory load at launch; files in subdirectories load on demand.

#### Import Syntax

CLAUDE.md files can import additional files using `@path/to/import` syntax. Imported files expand at launch. Both relative and absolute paths allowed. Max depth: 5 hops.

```markdown
See @README for project overview and @package.json for npm commands.
@~/.claude/my-project-instructions.md
```

### 1b. Local-Only — `CLAUDE.local.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.local.md` (project root or any subdirectory) |
| **Format** | Plain Markdown |
| **Scope** | Same as `CLAUDE.md` but gitignored — personal local instructions |

### 1c. Scoped Rules — `.claude/rules/<name>.md`

| Property | Value |
|----------|-------|
| **Directory** | `.claude/rules/` (recursive, supports symlinks) |
| **Naming** | `<slug>.md` |
| **Format** | Markdown with YAML frontmatter |

#### Frontmatter Schema

```yaml
---
paths:
  - "src/**/*.ts"
  - "tests/**/*.test.ts"
---
```

Rules with `paths:` frontmatter are only loaded when the conversation involves matching files. Rules without frontmatter load unconditionally (same as being in `CLAUDE.md`). Path patterns use glob syntax: `**/*.ts`, `src/**/*`, `*.md`, `src/components/*.tsx`. Brace expansion supported: `"src/**/*.{ts,tsx}"`.

#### User-Level Rules

Personal rules in `~/.claude/rules/` apply to all projects. Loaded before project rules.

### 1d. User-Level — `~/.claude/CLAUDE.md`

| Property | Value |
|----------|-------|
| **File** | `~/.claude/CLAUDE.md` |
| **Scope** | Applied to all projects for the current user |

### 1e. Managed Policy — System-Wide

| Property | Value |
|----------|-------|
| **macOS** | `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| **Linux/WSL** | `/etc/claude-code/CLAUDE.md` |
| **Windows** | `C:\Program Files\ClaudeCode\CLAUDE.md` |
| **Scope** | All users on the machine (cannot be excluded) |

### 1f. Scope Hierarchy (highest to lowest)

1. Managed policy (system-wide, cannot be overridden)
2. User (`~/.claude/CLAUDE.md`)
3. Project (`CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/`)
4. Local (`CLAUDE.local.md`)

### 1g. Auto Memory

Claude Code has automatic memory that persists learnings across sessions:

| Property | Value |
|----------|-------|
| **Location** | `~/.claude/projects/<project>/memory/` |
| **Entrypoint** | `MEMORY.md` (first 200 lines loaded at session start) |
| **Toggle** | `/memory` command or `autoMemoryEnabled` setting |
| **Disable** | `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` env var |

### 1h. CLAUDE.md Excludes

The `claudeMdExcludes` setting skips specific CLAUDE.md files by path or glob pattern (useful in monorepos):

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

---

## 2. Agents

| Property | Value |
|----------|-------|
| **Directory** | `.claude/agents/` (project), `~/.claude/agents/` (user) |
| **Naming** | `<name>.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/agent:<name>` in conversation, or via Agent tool with `subagent_type` |
| **CLI flag** | `--agents '<json>'` for session-scoped agents |
| **Plugin** | Plugin's `agents/` directory |

### Frontmatter Schema

```yaml
---
name: test-runner
description: Runs tests and reports failures
model: sonnet                    # sonnet | opus | haiku | inherit
modelReasoningEffort: medium     # low | medium | high
tools: [Read, Glob, Grep, Bash]
disallowedTools: [Write, Edit]
permissionMode: default          # default | acceptEdits | dontAsk | bypassPermissions | plan
maxTurns: 20
skills: [test-runner, lint-fixer]
memory: project                  # user | project | local
background: true
isolation: worktree
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: ./scripts/check.sh
mcpServers:
  server-name:
    command: npx
    args: [-y, some-server]
---

Agent behavioral instructions go here.
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | Agent identifier (matches filename) |
| `description` | string | Yes | When/why to delegate to this agent |
| `model` | string | No | `sonnet`, `opus`, `haiku`, `inherit`, or full model ID. Default: `inherit` |
| `modelReasoningEffort` | string | No | `low`, `medium`, `high` |
| `tools` | string[] | No | Allowed tools (omit = all). Supports `Agent(worker, researcher)` syntax |
| `disallowedTools` | string[] | No | Explicitly blocked tools |
| `permissionMode` | string | No | Permission level override |
| `maxTurns` | number | No | Maximum agentic turns |
| `skills` | string[] | No | Skills preloaded into context at startup |
| `memory` | string | No | Persistent memory scope: `user`, `project`, or `local` |
| `background` | boolean | No | Always run as background agent |
| `isolation` | string | No | `worktree` for isolated git worktree |
| `hooks` | object | No | Agent-specific hook overrides |
| `mcpServers` | object | No | Agent-specific MCP servers |

### Memory Scopes

| Scope | Location | Use case |
|-------|----------|----------|
| `user` | `~/.claude/agent-memory/<name>/` | Learnings across all projects |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via VCS |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, not checked in |

### Scope Priority

| Location | Priority |
|----------|----------|
| `--agents` CLI flag | 1 (highest) |
| `.claude/agents/` (project) | 2 |
| `~/.claude/agents/` (user) | 3 |
| Plugin `agents/` directory | 4 (lowest) |

### Available Tool Names

`Read`, `Edit`, `Write`, `MultiEdit`, `Glob`, `Grep`, `Bash`, `Agent`, `WebSearch`, `WebFetch`, `NotebookEdit`, `NotebookRead`, `TodoRead`, `TodoWrite`, `AskUserQuestion`, `LSP`, `MCPSearch`

### Built-in Agents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| Explore | Haiku | Read-only | File discovery, codebase exploration |
| Plan | Inherit | Read-only | Codebase research for planning |
| general-purpose | Inherit | All | Complex multi-step tasks |

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.claude/skills/<name>/SKILL.md` |
| **User-level** | `~/.claude/skills/<name>/SKILL.md` |
| **Plugin** | `<plugin>/skills/<name>/SKILL.md` |
| **Naming** | Directory = skill name (kebab-case), file = `SKILL.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/<skill-name>` in conversation |

Also supports legacy `.claude/commands/<name>.md` files (skills take precedence on name conflict).

### Frontmatter Schema

```yaml
---
name: deploy-app
description: Deploy the application to production
disable-model-invocation: true
argument-hint: <environment> [--dry-run]
user-invocable: false
allowed-tools: Bash, Read, Glob
model: sonnet
context: fork
agent: deploy-agent
hooks:
  PostToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: ./log-deploy.sh
---

Skill instructions, examples, and guidelines in markdown.
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | No | Skill identifier (defaults to directory name) |
| `description` | string | Recommended | Trigger description for auto-invocation |
| `disable-model-invocation` | boolean | No | Prevent auto-selection, require `/<name>` |
| `argument-hint` | string | No | Hint shown in `/` menu |
| `user-invocable` | boolean | No | `false` = only model can invoke (hidden from `/` menu) |
| `allowed-tools` | string (CSV) | No | Comma-separated tool names |
| `model` | string | No | Model override for skill execution |
| `context` | string | No | `fork` — run skill in an isolated forked subagent context |
| `agent` | string | No | Agent type to use when `context: fork` (default: `general-purpose`) |
| `hooks` | object | No | Skill-specific hooks (scoped to skill lifecycle) |

### Skill Substitution Variables

Claude Code substitutes these variables in skill content at invocation time:

| Variable | Value |
|----------|-------|
| `$ARGUMENTS` | Full argument string passed after the skill name |
| `$ARGUMENTS[N]` | The Nth argument (zero-indexed) |
| `$N` | Shorthand for `$ARGUMENTS[N]` (e.g. `$0`, `$1`) |
| `${CLAUDE_SESSION_ID}` | Unique identifier for the current session |
| `${CLAUDE_SKILL_DIR}` | Absolute path to the skill's directory |

### Bash Injection

The `` !`command` `` syntax runs shell commands before skill content is sent to Claude. Output replaces the placeholder:

```markdown
## Context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

### Skill Directories

Can contain supplementary files (scripts, templates, examples) referenced from SKILL.md instructions. Recommended: keep SKILL.md under 500 lines, move detailed reference to separate files.

### Skill Scope Priority

Enterprise > Personal (`~/.claude/skills/`) > Project (`.claude/skills/`). Plugin skills use `plugin-name:skill-name` namespace.

---

## 4. Hooks

### Configuration Locations

| Location | Scope |
|----------|-------|
| `~/.claude/settings.json` | All your projects |
| `.claude/settings.json` | Single project (committable) |
| `.claude/settings.local.json` | Single project (gitignored) |
| Managed policy settings | Organization-wide |
| Plugin `hooks/hooks.json` | When plugin is enabled |
| Skill/agent frontmatter | While the component is active |

### Hook Format

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check.sh",
            "timeout": 30,
            "statusMessage": "Running safety check...",
            "async": true,
            "once": true
          }
        ]
      }
    ]
  }
}
```

### Event Names (PascalCase)

| Event | Trigger | Matcher filters |
|-------|---------|-----------------|
| `PreToolUse` | Before a tool executes (can approve/deny) | Tool name |
| `PostToolUse` | After a tool executes | Tool name |
| `PostToolUseFailure` | After a tool fails | Tool name |
| `PermissionRequest` | Permission prompt shown | Tool name |
| `SessionStart` | Conversation begins/resumes | `startup`, `resume`, `clear`, `compact` |
| `SessionEnd` | Conversation ends | `clear`, `logout`, `prompt_input_exit`, etc. |
| `UserPromptSubmit` | User sends a message | No matcher |
| `Stop` | Agent stops | No matcher |
| `SubagentStart` | Subagent starts | Agent type name |
| `SubagentStop` | Subagent finishes | Agent type name |
| `Notification` | Notification event | Notification type |
| `TeammateIdle` | Teammate becomes idle | No matcher |
| `TaskCompleted` | Task completed | No matcher |
| `ConfigChange` | Configuration changed | Config source |
| `WorktreeCreate` | Git worktree created | No matcher |
| `WorktreeRemove` | Git worktree removed | No matcher |
| `PreCompact` | Before context compaction | `manual`, `auto` |
| `InstructionsLoaded` | After instructions/rules are loaded | No matcher |

Matcher is a regex: `Edit|Write` matches either tool, `mcp__memory__.*` matches all memory server tools.

### Hook Handler Types

| Type | Fields | Notes |
|------|--------|-------|
| `command` | `command`, `timeout`, `statusMessage`, `async`, `once` | Shell command; receives JSON on stdin |
| `http` | `url`, `headers`, `allowedEnvVars`, `timeout`, `statusMessage`, `once` | HTTP POST webhook |
| `prompt` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | LLM prompt evaluation |
| `agent` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | Agent delegation |

### Common Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `command`, `http`, `prompt`, or `agent` |
| `timeout` | number | Seconds (defaults: 600 command, 30 prompt, 60 agent) |
| `statusMessage` | string | Display text during execution |
| `once` | boolean | Run only once per session (skills only, not agents) |

### Command Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `command` | string | Shell command to execute |
| `async` | boolean | Non-blocking background execution |

### HTTP Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `url` | string | Webhook URL |
| `headers` | object | HTTP request headers (supports `$VAR` env var interpolation) |
| `allowedEnvVars` | string[] | Env vars allowed for header interpolation |

### Prompt/Agent Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `prompt` | string | Prompt text (`$ARGUMENTS` placeholder for hook input JSON) |
| `model` | string | Model override |

### Hook Environment Variables

| Variable | Value |
|----------|-------|
| `$CLAUDE_PROJECT_DIR` | Project root directory |
| `${CLAUDE_PLUGIN_ROOT}` | Plugin root directory |
| `$CLAUDE_ENV_FILE` | File path for persisting env vars (SessionStart only) |
| `$CLAUDE_CODE_REMOTE` | `"true"` in remote web environments |

### Common Input Fields (JSON on stdin)

| Field | Description |
|-------|-------------|
| `session_id` | Current session identifier |
| `transcript_path` | Path to conversation JSON |
| `cwd` | Current working directory |
| `permission_mode` | Current permission mode |
| `hook_event_name` | Name of the event that fired |
| `agent_id` | Subagent identifier (when in subagent) |
| `agent_type` | Agent name (when using `--agent` or in subagent) |

### Settings for Hooks

| Setting | Type | Notes |
|---------|------|-------|
| `disableAllHooks` | boolean | Disable all hooks |
| `allowManagedHooksOnly` | boolean | Only managed/SDK hooks (managed settings only) |
| `allowedHttpHookUrls` | string[] | URL allowlist for HTTP hooks |
| `httpHookAllowedEnvVars` | string[] | Env var allowlist for hooks |

---

## 5. MCP Servers

### Configuration Locations

| Scope | Location | Notes |
|-------|----------|-------|
| Project | `.mcp.json` (project root) | Shared via VCS, requires approval |
| Local | `~/.claude.json` (under project path) | Private to you, current project |
| User | `~/.claude.json` (mcpServers field) | Available across all projects |
| Managed | `managed-mcp.json` (system dirs) | Exclusive control by IT |
| Plugin | Plugin's `.mcp.json` or `plugin.json` | When plugin is enabled |

### Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@some/mcp-server"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

### Transport Types

#### stdio (default)

```json
{
  "mcpServers": {
    "local-server": {
      "command": "node",
      "args": ["server.js"],
      "env": { "KEY": "value" }
    }
  }
}
```

#### HTTP (Streamable HTTP)

```json
{
  "mcpServers": {
    "remote-server": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": { "Authorization": "Bearer TOKEN" }
    }
  }
}
```

#### SSE (deprecated)

```json
{
  "mcpServers": {
    "sse-server": {
      "type": "sse",
      "url": "https://api.example.com/sse",
      "headers": {}
    }
  }
}
```

### Field Reference

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `command` | string | stdio | Startup command |
| `args` | string[] | No | Command arguments |
| `env` | object | No | Environment variables |
| `type` | string | non-stdio | `http`, `sse` |
| `url` | string | non-stdio | Server endpoint |
| `headers` | object | No | HTTP headers |
| `oauth` | object | No | OAuth configuration |

### OAuth Configuration

```json
{
  "mcpServers": {
    "my-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "your-client-id",
        "callbackPort": 8080,
        "authServerMetadataUrl": "https://auth.example.com/.well-known/openid-configuration"
      }
    }
  }
}
```

| OAuth Field | Type | Notes |
|-------------|------|-------|
| `clientId` | string | Pre-configured OAuth client ID |
| `callbackPort` | number | Fixed port for OAuth callback redirect |
| `authServerMetadataUrl` | string | Override OAuth metadata discovery URL |

### Environment Variable Expansion

Values in `.mcp.json` support `${VAR}` and `${VAR:-default}` syntax. Expansion works in `command`, `args`, `env`, `url`, and `headers` fields.

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### MCP Scope Hierarchy

Local > Project > User (same-name servers: higher priority wins).

### Tool Search

MCP Tool Search dynamically loads tools on-demand when many MCP tools are configured. Controlled by `ENABLE_TOOL_SEARCH` env var: `auto` (default), `auto:<N>` (custom threshold), `true`, `false`.

### MCP Settings

| Setting | Type | Notes |
|---------|------|-------|
| `enableAllProjectMcpServers` | boolean | Auto-approve all `.mcp.json` servers |
| `enabledMcpjsonServers` | string[] | Specific servers to approve |
| `disabledMcpjsonServers` | string[] | Specific servers to reject |
| `allowedMcpServers` | array | Managed allowlist (by name, command, or URL pattern) |
| `deniedMcpServers` | array | Managed denylist |
| `allowManagedMcpServersOnly` | boolean | Only managed servers (managed settings only) |

---

## 6. Permissions & Settings

### Settings Files (by scope)

| Scope | Location | Purpose | Shared |
|-------|----------|---------|--------|
| **Managed** | System dirs / MDM / `managed-settings.json` | Org-wide enforcement | Yes |
| **User** | `~/.claude/settings.json` | Personal global settings | No |
| **Project** | `.claude/settings.json` | Team-shared settings | Yes (in git) |
| **Local** | `.claude/settings.local.json` | Personal project overrides | No (gitignored) |

### Settings Precedence (highest to lowest)

1. Managed settings (cannot be overridden)
2. Command-line arguments
3. Local project settings (`.claude/settings.local.json`)
4. Project settings (`.claude/settings.json`)
5. User settings (`~/.claude/settings.json`)

Array-valued settings (permissions, sandbox paths) **merge** across scopes.

### Format

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm test)",
      "Read",
      "Glob"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Edit(.env)"
    ],
    "ask": [
      "Bash(git push)"
    ],
    "additionalDirectories": ["/tmp/workspace"],
    "defaultMode": "acceptEdits"
  },
  "env": {},
  "hooks": {},
  "sandbox": {}
}
```

### Permission Rule Format

- `ToolName` — applies to all invocations of the tool
- `ToolName(pattern)` — applies only when the tool argument matches the pattern
- `Bash(npm run *)` — wildcard glob patterns
- `Read(/src/**)`, `Edit(~/.config/*)` — gitignore-style path patterns
- `WebFetch(domain:example.com)` — domain-scoped
- `mcp__server__tool` — MCP tool rules
- `Agent(Explore)` — subagent rules

#### Read/Edit Path Prefixes

| Prefix | Meaning | Example |
|--------|---------|---------|
| `//` | Absolute from filesystem root | `Read(//Users/alice/secrets/**)` |
| `~/` | Home directory | `Read(~/Documents/*.pdf)` |
| `/` | Relative to project root | `Edit(/src/**/*.ts)` |
| `./` or none | Relative to current directory | `Read(*.env)` |

### Permission Decisions

| Decision | Behavior |
|----------|----------|
| `allow` | Auto-approve without prompting |
| `deny` | Block and refuse (highest priority) |
| `ask` | Prompt user for approval |

Evaluation order: **deny > ask > allow** (first match wins).

### Permission Modes

| Mode | Description |
|------|-------------|
| `default` | Standard permission checking with prompts |
| `acceptEdits` | Auto-accept file edit permissions |
| `plan` | Plan Mode: read-only, no modifications |
| `dontAsk` | Auto-deny unless pre-approved |
| `bypassPermissions` | Skip all permission checks (isolated envs only) |

### Permissions Object Fields

| Field | Type | Notes |
|-------|------|-------|
| `allow` | string[] | Auto-approved tool rules |
| `deny` | string[] | Blocked tool rules |
| `ask` | string[] | Tool rules that require user confirmation |
| `additionalDirectories` | string[] | Extra directories Claude can access |
| `defaultMode` | string | Default permission mode |
| `disableBypassPermissionsMode` | string | Set to `"disable"` to prevent bypass mode (managed only) |

### Sandbox Configuration

```json
{
  "sandbox": {
    "enabled": true,
    "autoAllowBashIfSandboxed": true,
    "excludedCommands": ["docker", "git"],
    "allowUnsandboxedCommands": false,
    "filesystem": {
      "allowWrite": ["//tmp/build", "~/.kube", "./dist"],
      "denyWrite": ["~/.ssh"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowAllUnixSockets": false,
      "allowLocalBinding": true,
      "httpProxyPort": 0,
      "socksProxyPort": 0,
      "allowManagedDomainsOnly": false
    },
    "enableWeakerNestedSandbox": false,
    "enableWeakerNetworkIsolation": false
  }
}
```

### Key Settings

| Setting | Type | Notes |
|---------|------|-------|
| `model` | string | Default model |
| `env` | object | Environment variables for all sessions |
| `attribution.commit` | string | Commit attribution text |
| `attribution.pr` | string | PR description attribution |
| `includeGitInstructions` | boolean | Include git workflow in system prompt (default: true) |
| `outputStyle` | string | Adjust system prompt (e.g. `"Explanatory"`) |
| `language` | string | Response language (e.g. `"japanese"`) |
| `autoMemoryEnabled` | boolean | Enable/disable auto memory |
| `claudeMdExcludes` | string[] | Glob patterns to exclude CLAUDE.md files |
| `cleanupPeriodDays` | number | Delete inactive sessions (default: 30) |
| `autoUpdatesChannel` | string | `"stable"` or `"latest"` |

### Plugin Settings

| Setting | Type | Notes |
|---------|------|-------|
| `enabledPlugins` | object | Enable/disable plugins by name |
| `extraKnownMarketplaces` | object | Additional plugin marketplaces |
| `strictKnownMarketplaces` | array | Managed marketplace allowlist |
| `blockedMarketplaces` | array | Managed marketplace blocklist |

### Managed-Only Settings

| Setting | Notes |
|---------|-------|
| `disableBypassPermissionsMode` | Prevent `bypassPermissions` mode |
| `allowManagedPermissionRulesOnly` | Block user/project permission rules |
| `allowManagedHooksOnly` | Block user/project/plugin hooks |
| `allowManagedMcpServersOnly` | Only managed MCP servers |
| `strictKnownMarketplaces` | Marketplace allowlist |
| `blockedMarketplaces` | Marketplace denylist |
| `sandbox.network.allowManagedDomainsOnly` | Only managed domains |

---

## 7. Ignore Patterns

### Implementation

Claude Code does not have a dedicated ignore file. Ignore patterns are implemented as `deny` permission rules on `Read` and `Edit` tools:

```json
{
  "permissions": {
    "deny": [
      "Read(node_modules/**)",
      "Edit(node_modules/**)",
      "Read(.env)",
      "Edit(.env)"
    ]
  }
}
```

This is a lossy mapping — it blocks reading/editing but doesn't hide files from other tools (Glob, Grep, etc.).

---

## 8. Plugins

### Overview

Plugins extend Claude Code with skills, agents, hooks, MCP servers, and LSP servers. They are distributed through plugin marketplaces.

### Plugin Structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json        # Manifest (required)
├── skills/                # Agent Skills with SKILL.md
├── agents/                # Custom agent definitions
├── commands/              # Skills as Markdown files
├── hooks/
│   └── hooks.json         # Event handlers
├── .mcp.json              # MCP server configurations
├── .lsp.json              # LSP server configurations
└── settings.json          # Default settings (only `agent` key)
```

### Plugin Manifest (`plugin.json`)

```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": { "name": "Author Name" }
}
```

Plugin skills are namespaced: `/plugin-name:skill-name`.

### Plugin MCP Variables

| Variable | Value |
|----------|-------|
| `${CLAUDE_PLUGIN_ROOT}` | Plugin root directory |

---

## 9. dotai Entity Coverage

### Current Emitter Status

| Entity | Emitter | Output Path(s) | Status |
|--------|---------|----------------|--------|
| Rules | rulesEmitter | `CLAUDE.md`, `CLAUDE.local.md`, `.claude/rules/*.md` | Complete |
| Agents | agentsEmitter | `.claude/agents/<name>.md` | Complete |
| Skills | skillsEmitter | `.claude/skills/<name>/SKILL.md` | Complete |
| Hooks | hooksEmitter | `.claude/settings.json` (hooks key) | Complete |
| MCP Servers | mcpEmitter | `.mcp.json` | Complete |
| Permissions | permissionsEmitter | `.claude/settings.json` (permissions key) | Complete |
| Ignore | hooksEmitter | `.claude/settings.json` (deny rules) | Complete (lossy) |

### Known Gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| `.claude/settings.local.json` scope | Rules/hooks/permissions emitted only to `.claude/settings.json`, no local scope | Low |
| `@import` syntax in CLAUDE.md | dotai doesn't emit `@path` imports in rules | Low |
| OAuth MCP config | dotai emits basic MCP, no `oauth` block | Low |
| Sandbox filesystem/network | dotai emits basic `sandbox`, not granular `filesystem`/`network` blocks | Low |
| Plugin output | dotai doesn't emit plugin format | Low |
| Agent `memory` persistence | dotai emits `memory` field but doesn't manage memory directories | Low |
| `context: fork` + `agent` in skills | dotai emits these fields but doesn't validate agent references | Low |
| Managed policy paths | dotai doesn't emit to system-wide managed paths | Low |
| `http` hook type | dotai emits `http` hooks but not `allowedHttpHookUrls` setting | Low |
| `claudeMdExcludes` setting | dotai doesn't emit this setting | Low |

### Notes

- Claude Code is the most feature-rich target — most dotai entity fields map 1:1
- Model names use aliases (`sonnet`, `opus`, `haiku`) not full IDs
- Hook events use PascalCase (unlike other tools which use camelCase)
- SSE transport is deprecated — warn users to migrate to HTTP
- `CLAUDE.md` concatenation: multiple rules with the same outputDir merge into one file separated by `---`
- Matcher field is a regex, not a glob pattern
- Hook timeout is in **seconds** (not milliseconds) per official docs
- `once` field on hooks only works in skills, not agents
- `$CLAUDE_PROJECT_DIR` available in hook commands for project-relative paths
- Read/Edit permission patterns follow gitignore spec with `//`, `~/`, `/` prefix conventions
