# Claude Code Configuration Capabilities — Complete Reference

> Source: Claude Code CLI (firsthand knowledge + emitter code)
> Last Researched Version: Claude Code 2.1.63+
> Date: 2026-03-07

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

### 1a. Project-Wide — `CLAUDE.md` / `.claude/CLAUDE.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.md` or `.claude/CLAUDE.md` (project root or any subdirectory) |
| **Format** | Plain Markdown (no frontmatter) |
| **Scope** | Loaded for all conversations in the project |
| **Subdirectory** | `subdir/CLAUDE.md` — loaded when working in or below `subdir/` |

Multiple `CLAUDE.md` files are concatenated (root first, then deeper directories). Both `CLAUDE.md` and `.claude/CLAUDE.md` at the root are valid equivalents.

### 1b. Import Syntax — `@path/to/file`

CLAUDE.md files can import additional files using `@path/to/import` syntax anywhere in the file body:

```text
See @README for project overview and @package.json for available npm commands.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

Imported files are expanded and loaded into context at launch. Both relative and absolute paths are supported. Relative paths resolve relative to the importing file. Imports can recurse up to five hops deep.

### 1c. Local-Only — `CLAUDE.local.md`

| Property | Value |
|----------|-------|
| **File** | `CLAUDE.local.md` (project root or any subdirectory) |
| **Format** | Plain Markdown |
| **Scope** | Same as `CLAUDE.md` but gitignored — personal local instructions |

### 1d. Scoped Rules — `.claude/rules/<name>.md`

| Property | Value |
|----------|-------|
| **Directory** | `.claude/rules/` |
| **Naming** | `<slug>.md` |
| **Format** | Markdown with YAML frontmatter |
| **Discovery** | Recursive — files in subdirectories of `.claude/rules/` are discovered |
| **Symlinks** | Supported; circular symlinks are detected and handled |

#### Frontmatter Schema

```yaml
---
paths:
  - "src/**/*.ts"
  - "tests/**/*.test.ts"
---
```

Rules with `paths:` frontmatter are only loaded when the conversation involves matching files. Rules without frontmatter load unconditionally (same as being in `CLAUDE.md`).

### 1e. User-Level — `~/.claude/CLAUDE.md` and `~/.claude/rules/`

| Property | Value |
|----------|-------|
| **File** | `~/.claude/CLAUDE.md` |
| **Rules** | `~/.claude/rules/<name>.md` |
| **Scope** | Applied to all projects for the current user |

User-level rules in `~/.claude/rules/` apply to every project on the machine. They are loaded before project rules, giving project rules higher priority.

### 1f. Managed Policy — System-Wide `CLAUDE.md`

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| Linux/WSL | `/etc/claude-code/CLAUDE.md` |
| Windows | `C:\Program Files\ClaudeCode\CLAUDE.md` |

Managed policy CLAUDE.md files cannot be excluded by individual settings.

### 1g. Scope Hierarchy (highest to lowest)

1. Managed policy (`/Library/Application Support/ClaudeCode/CLAUDE.md` or equivalent)
2. User (`~/.claude/CLAUDE.md`, `~/.claude/rules/`)
3. Project (`CLAUDE.md`, `.claude/CLAUDE.md`, `.claude/rules/`)
4. Local (`CLAUDE.local.md`)

### 1h. Auto Memory — `~/.claude/projects/<project>/memory/`

Claude Code includes an auto memory system where Claude saves notes to itself across sessions.

| Property | Value |
|----------|-------|
| **Location** | `~/.claude/projects/<project>/memory/` |
| **Entrypoint** | `MEMORY.md` (first 200 lines loaded every session) |
| **Toggle** | `autoMemoryEnabled` in settings, or `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` |

```text
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Detailed notes on debugging patterns
└── api-conventions.md # API design decisions
```

The `<project>` path is derived from the git repository. All worktrees and subdirectories within the same repo share one auto memory directory.

### 1i. claudeMdExcludes Setting

In large monorepos, the `claudeMdExcludes` setting skips specific CLAUDE.md files by path or glob pattern:

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/user/monorepo/other-team/.claude/rules/**"
  ]
}
```

Patterns are matched against absolute file paths. Arrays merge across settings scopes.

---

## 2. Agents

| Property | Value |
|----------|-------|
| **Directory** | `.claude/agents/` |
| **User-level** | `~/.claude/agents/` |
| **Plugin** | `<plugin>/agents/<name>.md` |
| **Naming** | `<name>.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/agent:<name>` in conversation, or via Agent tool with `subagent_type` |

### Built-in Agents

Claude Code includes built-in agents that are used automatically:

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| `Explore` | Haiku | Read-only | File discovery, codebase exploration |
| `Plan` | Inherits | Read-only | Research during plan mode |
| `general-purpose` | Inherits | All | Complex multi-step tasks |
| `Bash` | Inherits | Bash | Terminal commands in separate context |
| `Claude Code Guide` | Haiku | — | Answers questions about Claude Code |

### CLI Definition — `--agents` Flag

Agents can be passed as JSON when launching Claude Code (session-scoped only):

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer. Use proactively after code changes.",
    "prompt": "You are a senior code reviewer.",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

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
| `model` | string | No | `sonnet`, `opus`, `haiku`, `inherit`, or full model ID |
| `modelReasoningEffort` | string | No | `low`, `medium`, `high` |
| `tools` | string[] | No | Allowed tools; use `Agent(name1,name2)` syntax to restrict spawnable subagents |
| `disallowedTools` | string[] | No | Explicitly blocked tools |
| `permissionMode` | string | No | Permission level override |
| `maxTurns` | number | No | Maximum agentic turns |
| `skills` | string[] | No | Skills preloaded into this agent's context at startup |
| `memory` | string | No | Memory scope: `user`, `project`, or `local` |
| `background` | boolean | No | Always run as a background task |
| `isolation` | string | No | `worktree` for isolated git worktree |
| `hooks` | object | No | Agent-specific hook overrides |
| `mcpServers` | object | No | Agent-specific MCP servers |

### Tool Restriction: Agent(subagent-type)

To restrict which subagents an agent (running as main thread via `claude --agent`) can spawn:

```yaml
tools: Agent(worker, researcher), Read, Bash
```

This is an allowlist — only `worker` and `researcher` can be spawned. `Task(...)` is an alias for `Agent(...)` (renamed in v2.1.63).

### Agent Scope Priority (highest to lowest)

1. `--agents` CLI flag (session-scoped)
2. `.claude/agents/` (project)
3. `~/.claude/agents/` (user)
4. Plugin `agents/` directory

### Available Tool Names

`Read`, `Edit`, `Write`, `MultiEdit`, `Glob`, `Grep`, `Bash`, `Agent`, `WebSearch`, `WebFetch`, `NotebookEdit`, `NotebookRead`, `TodoRead`, `TodoWrite`, `AskUserQuestion`, `LSP`

---

## 3. Skills

| Property | Value |
|----------|-------|
| **Directory** | `.claude/skills/<name>/SKILL.md` |
| **User-level** | `~/.claude/skills/<name>/SKILL.md` |
| **Plugin** | `<plugin>/skills/<name>/SKILL.md` (namespaced as `plugin-name:skill-name`) |
| **Naming** | Directory = skill name (kebab-case), file = `SKILL.md` |
| **Format** | Markdown with YAML frontmatter |
| **Invocation** | `/<skill-name>` in conversation |
| **Legacy** | `.claude/commands/<name>.md` still works (skills take precedence on name conflict) |

### Monorepo Auto-Discovery

When working in a subdirectory (e.g. `packages/frontend/`), Claude Code also discovers skills from nested `.claude/skills/` directories under that path. This enables per-package skills in monorepos.

### Bundled Skills

Claude Code ships several built-in skills available in every session:

| Skill | Description |
|-------|-------------|
| `/simplify` | Reviews recently changed files for code reuse, quality, and efficiency, then fixes them. Spawns three parallel review agents. |
| `/batch <instruction>` | Orchestrates large-scale codebase changes in parallel using git worktrees. Requires a git repo. |
| `/debug [description]` | Troubleshoots the current session by reading the session debug log. |
| `/loop [interval] <prompt>` | Runs a prompt repeatedly on a schedule while the session is open. |
| `/claude-api` | Loads Claude API reference material. Also activates when code imports `anthropic`, `@anthropic-ai/sdk`, or `claude_agent_sdk`. |

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
  postToolUse:
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
| `user-invocable` | boolean | No | `false` = only model can invoke |
| `allowed-tools` | string (CSV) | No | Comma-separated tool names |
| `model` | string | No | Model override for skill execution |
| `context` | string | No | `fork` — run skill in an isolated forked execution context |
| `agent` | string | No | Agent to delegate to when `context: fork` |
| `hooks` | object | No | Skill-specific hooks (scoped to skill's lifecycle) |

### Skill Substitution Variables

| Variable | Value |
|----------|-------|
| `$ARGUMENTS` | Full argument string passed after the skill name |
| `$ARGUMENTS[N]` | The Nth argument (zero-indexed) |
| `$N` | Shorthand for `$ARGUMENTS[N]` (e.g. `$0`, `$1`) |
| `$CLAUDE_SESSION_ID` | Unique identifier for the current session |
| `$CLAUDE_SKILL_DIR` | Absolute path to the skill's directory |

### Dynamic Context Injection

The `` !`command` `` syntax in skill content runs shell commands before the skill is sent to Claude. The command output replaces the placeholder:

```yaml
---
name: pr-summary
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- PR diff: !`gh pr diff`
- PR comments: !`gh pr view --comments`
- Changed files: !`gh pr diff --name-only`

## Your task
Summarize this pull request...
```

### Restricting Claude's Skill Access

Use permission rules to control which skills Claude can invoke:

```text
# Deny all skills
Skill

# Allow only specific skills
Skill(commit)
Skill(review-pr *)

# Deny specific skills
Skill(deploy *)
```

Syntax: `Skill(name)` for exact match, `Skill(name *)` for prefix match.

### Skill Directories

Can contain supplementary files (scripts, templates, examples) referenced from SKILL.md instructions.

---

## 4. Hooks

### Configuration Location

Hooks can be defined in several locations:

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All your projects | No |
| `.claude/settings.json` | Single project | Yes |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin-controlled) |
| Plugin `hooks/hooks.json` | When plugin is enabled | Yes (bundled with plugin) |
| Skill or agent frontmatter | While component is active | Yes (defined in component file) |

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

| Event | Trigger |
|-------|---------|
| `PreToolUse` | Before a tool executes (can approve/deny) |
| `PostToolUse` | After a tool executes |
| `SessionStart` | Conversation begins or resumes |
| `SessionEnd` | Conversation ends |
| `UserPromptSubmit` | User sends a message |
| `Stop` | Agent stops |
| `SubagentStop` | Subagent stops |
| `SubagentStart` | Subagent starts |
| `PermissionRequest` | Permission prompt shown |
| `PostToolUseFailure` | Tool execution failed |
| `Notification` | Notification event |
| `TeammateIdle` | Teammate becomes idle |
| `TaskCompleted` | Task completed |
| `ConfigChange` | Configuration changed |
| `WorktreeCreate` | Git worktree created |
| `WorktreeRemove` | Git worktree removed |
| `PreCompact` | Before context compaction |
| `InstructionsLoaded` | After instructions/rules are loaded |

### Matcher Patterns

The `matcher` field is a **regex string** that filters when hooks fire. Use `"*"`, `""`, or omit `matcher` entirely to match all occurrences.

Each event type matches on a different field:

| Event | What matcher filters | Example matcher values |
|-------|---------------------|----------------------|
| `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest` | tool name | `Bash`, `Edit\|Write`, `mcp__.*` |
| `SessionStart` | how the session started | `startup`, `resume`, `clear`, `compact` |
| `SessionEnd` | why the session ended | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other` |
| `Notification` | notification type | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog` |
| `SubagentStart`, `SubagentStop` | agent type name | `Bash`, `Explore`, `Plan`, or custom agent names |
| `PreCompact` | what triggered compaction | `manual`, `auto` |
| `ConfigChange` | configuration source | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` |
| `UserPromptSubmit`, `Stop`, `TeammateIdle`, `TaskCompleted`, `WorktreeCreate`, `WorktreeRemove`, `InstructionsLoaded` | no matcher support | always fires |

Since the matcher is a regex: `Edit|Write` matches either tool, `Notebook.*` matches any tool starting with Notebook, `mcp__memory__.*` matches all tools from the memory MCP server.

### Hook Handler Types

| Type | Fields | Notes |
|------|--------|-------|
| `command` | `command`, `timeout`, `statusMessage`, `async`, `once` | Shell command execution |
| `prompt` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | LLM prompt injection |
| `agent` | `prompt`, `model`, `timeout`, `statusMessage`, `once` | Agent delegation |
| `http` | `url`, `headers`, `allowedEnvVars`, `timeout`, `statusMessage`, `once` | HTTP webhook call |

### Common Handler Fields

| Field | Type | Notes |
|-------|------|-------|
| `type` | string | `command`, `prompt`, `agent`, or `http` |
| `timeout` | number | **Seconds** before canceling. Defaults: 600 (command), 30 (prompt), 60 (agent) |
| `statusMessage` | string | Display text during execution |
| `once` | boolean | Run only once per session (skills only, not agents) |

### Command Hook Fields

| Field | Type | Notes |
|-------|------|-------|
| `command` | string | Shell command |
| `async` | boolean | Non-blocking background execution |

### HTTP Hook Fields

| Field | Type | Notes |
|-------|------|-------|
| `url` | string | Webhook URL |
| `headers` | object | HTTP request headers; supports `$VAR_NAME` env var interpolation |
| `allowedEnvVars` | string[] | Env vars that may be interpolated into header values |

### Prompt/Agent Hook Fields

| Field | Type | Notes |
|-------|------|-------|
| `prompt` | string | LLM prompt |
| `model` | string | Model override |

### Hook Output — JSON Format

Command and HTTP hooks can return structured JSON decisions on stdout:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked by hook"
  }
}
```

The `permissionDecision` field accepts: `"allow"`, `"deny"`.

### Exit Codes (command hooks)

| Code | Effect |
|------|--------|
| `0` | Allow / no action |
| `2` | Block the tool call (feeds stderr back to Claude) |
| other | Non-blocking error (execution continues) |

---

## 5. MCP Servers

### Configuration Location

`.mcp.json` (project root) — for project-scoped (shared) servers.

### Format

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@some/mcp-server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
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
| `env` | object | No | Environment variables (supports `${VAR}` and `${VAR:-default}` expansion) |
| `type` | string | non-stdio | `http`, `sse` |
| `url` | string | non-stdio | Server endpoint |
| `headers` | object | No | HTTP headers |
| `oauth` | object | No | OAuth 2.0 configuration (see below) |

### OAuth 2.0 Configuration

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

`authServerMetadataUrl` overrides standard OAuth discovery; requires Claude Code v2.1.64+.

### MCP Installation Scopes

| Scope | Storage | Notes |
|-------|---------|-------|
| `local` (default) | `~/.claude.json` (under project path) | Private to you, current project only. Was called `project` in older versions |
| `project` | `.mcp.json` in project root | Shared with team via version control |
| `user` | `~/.claude.json` (global) | Available across all projects. Was called `global` in older versions |

```bash
# Add with explicit scope
claude mcp add --transport http stripe --scope local https://mcp.stripe.com
claude mcp add --transport http paypal --scope project https://mcp.paypal.com/mcp
claude mcp add --transport http hubspot --scope user https://mcp.hubspot.com/anthropic
```

### CLI Commands

```bash
# Add from JSON config
claude mcp add-json <name> '<json>'
claude mcp add-json my-server '{"type":"http","url":"https://mcp.example.com/mcp"}'

# Import from Claude Desktop (macOS and WSL only)
claude mcp add-from-claude-desktop

# OAuth flags
claude mcp add --transport http --client-id YOUR_ID --client-secret --callback-port 8080 my-server https://mcp.example.com/mcp

# Management
claude mcp list
claude mcp get <name>
claude mcp remove <name>
claude mcp reset-project-choices
```

### Managed MCP — `managed-mcp.json`

Organizations can deploy a fixed set of MCP servers that users cannot modify:

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-mcp.json` |
| Linux/WSL | `/etc/claude-code/managed-mcp.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-mcp.json` |

When `managed-mcp.json` is present, it takes exclusive control over all MCP servers.

### MCP Tool Search

When many MCP servers are configured, `ENABLE_TOOL_SEARCH` controls dynamic tool loading:

| Value | Behavior |
|-------|----------|
| `auto` (default) | Activates when MCP tools exceed 10% of context window |
| `auto:<N>` | Activates at custom threshold (percentage) |
| `true` | Always enabled |
| `false` | Disabled, all MCP tools loaded upfront |

### MCP Output Limits

- Warning threshold: 10,000 tokens
- Default max: **25,000 tokens** (`MAX_MCP_OUTPUT_TOKENS` env var)

---

## 6. Permissions & Settings

### Configuration Location

`.claude/settings.json`

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
    "additionalDirectories": ["/tmp/workspace", "/home/user/shared"],
    "defaultMode": "acceptEdits"
  },
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["//tmp/build", "~/.kube"],
      "denyWrite": ["//etc"],
      "denyRead": ["~/.aws/credentials"]
    },
    "network": {
      "allowedDomains": ["github.com", "*.npmjs.org"],
      "allowManagedDomainsOnly": false,
      "allowUnixSockets": ["/var/run/docker.sock"],
      "allowAllUnixSockets": false,
      "allowLocalBinding": true,
      "httpProxyPort": 8080,
      "socksProxyPort": 8081
    }
  }
}
```

### Permission Rule Format

- `ToolName` — applies to all invocations of the tool
- `ToolName(pattern)` — applies only when the tool argument matches the pattern
- `Agent(name)` — applies to subagent delegation
- `Skill(name)` — applies to skill invocation

### Permission Decisions

| Decision | Behavior |
|----------|----------|
| `allow` | Auto-approve without prompting |
| `deny` | Block and refuse |
| `ask` | Prompt user for approval |

### Permissions Object Fields

| Field | Type | Notes |
|-------|------|-------|
| `allow` | string[] | Auto-approved tool rules |
| `deny` | string[] | Blocked tool rules |
| `ask` | string[] | Tool rules that require user confirmation |
| `additionalDirectories` | string[] | Extra directories Claude can access beyond the project root |
| `defaultMode` | string | Default permission mode: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |

### Sandbox Configuration

The `sandbox` key configures process-level sandboxing:

#### Filesystem Object

| Field | Type | Notes |
|-------|------|-------|
| `allowWrite` | string[] | Paths allowed for writing (`//` = absolute, `~/` = home, `/` = relative to settings dir) |
| `denyWrite` | string[] | Paths blocked from writing |
| `denyRead` | string[] | Paths blocked from reading |

#### Network Object

| Field | Type | Notes |
|-------|------|-------|
| `allowedDomains` | string[] | Allowed domains (supports wildcards like `*.npmjs.org`) |
| `allowManagedDomainsOnly` | boolean | Only managed domains allowed |
| `allowUnixSockets` | string[] | Unix socket paths allowed |
| `allowAllUnixSockets` | boolean | Allow all unix sockets |
| `allowLocalBinding` | boolean | Allow binding to local ports |
| `httpProxyPort` | number | HTTP proxy port |
| `socksProxyPort` | number | SOCKS proxy port |

### Settings Precedence — 5-Tier Hierarchy (highest to lowest)

1. **Managed settings** (cannot be overridden) — system directory `managed-settings.json`
2. **Command-line arguments** — temporary session overrides
3. **Local project** — `.claude/settings.local.json` (gitignored)
4. **Shared project** — `.claude/settings.json`
5. **User** — `~/.claude/settings.json`

Array settings merge across scopes; individual values follow standard precedence.

### Additional Settings Keys

| Key | Type | Notes |
|-----|------|-------|
| `autoMemoryEnabled` | boolean | Toggle auto memory (default: true) |
| `claudeMdExcludes` | string[] | Glob patterns for CLAUDE.md files to skip |
| `attribution` | object | `{ commit: "...", pr: "..." }` — custom attribution text |
| `apiKeyHelper` | string | Path to script that generates a temporary API key |
| `availableModels` | string[] | Restrict which models users can select |
| `enabledPlugins` | object | `{ "plugin@marketplace": true/false }` |
| `allowedHttpHookUrls` | string[] | Allowed URL patterns for HTTP hooks |
| `disableAllHooks` | boolean | Disable all hook execution |
| `allowManagedHooksOnly` | boolean | Block user/project/plugin hooks |
| `allowedMcpServers` | object[] | Allowlist for MCP servers `[{ serverName }, { serverUrl }, { serverCommand }]` |
| `deniedMcpServers` | object[] | Denylist for MCP servers (same format) |
| `env` | object | Environment variables set for the session |
| `model` | string | Default model |

### Managed Settings Locations

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux/WSL | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |

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

Plugins are an entirely new feature that packages skills, agents, MCP servers, and hooks together for distribution.

### Plugin Manifest — `plugin.json`

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "mcpServers": {
    "plugin-api": {
      "command": "${CLAUDE_PLUGIN_ROOT}/servers/api-server",
      "args": ["--port", "8080"]
    }
  }
}
```

### Plugin Structure

```
my-plugin/
├── plugin.json           # Plugin manifest
├── skills/
│   └── my-skill/
│       └── SKILL.md      # Namespaced as plugin-name:skill-name
├── agents/
│   └── my-agent.md
├── hooks/
│   └── hooks.json        # Plugin-scoped hooks
└── .mcp.json             # Plugin MCP servers (alternative to plugin.json)
```

### Plugin Skill Namespacing

Plugin skills use a `plugin-name:skill-name` namespace to avoid conflicts with other skills:

```text
# Invoke a plugin skill
/plugin-name:skill-name
```

### Plugin MCP Environment

- `${CLAUDE_PLUGIN_ROOT}` — available in plugin MCP server configs for plugin-relative paths
- Plugin MCP servers start automatically when the plugin is enabled
- Restart Claude Code to apply MCP server changes

### Plugin Settings

| Key | Type | Notes |
|-----|------|-------|
| `enabledPlugins` | object | `{ "plugin@marketplace": true/false }` |
| `extraKnownMarketplaces` | object | Additional plugin marketplaces |
| `strictKnownMarketplaces` | object[] | Allowlist of trusted marketplaces |
| `blockedMarketplaces` | object[] | Blocked marketplaces |

### CLI Flag

```bash
claude --plugin-dir /path/to/plugin
```

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

- **`.claude/CLAUDE.md` alternate location**: The rules emitter outputs to `CLAUDE.md` (root). Claude Code also accepts `.claude/CLAUDE.md`. No emitter change needed — both are valid.
- **`@path/to/import` syntax**: dotai does not generate import statements in CLAUDE.md files. Users can add these manually.
- **Auto memory**: dotai does not manage the `~/.claude/projects/*/memory/` directory. This is Claude Code's internal feature.
- **Plugin output**: dotai does not generate plugin manifests (`plugin.json`). Plugins are authored separately.
- **Managed settings/MCP**: dotai generates project-level config only; managed files are deployed by IT administrators.
- **MCP scope: `local` vs `project`**: The MCP emitter generates `.mcp.json` (project-scoped/shared). Users wanting local-only servers should configure with the `claude mcp add --scope local` CLI.
- **Hook timeout unit**: The timeout field in dotai domain/emitter passes through the user's value. The unit is **seconds** per the Claude Code spec (defaults: 600 command, 30 prompt, 60 agent). Documentation should reflect this.

### Notes

- Claude Code is the most feature-rich target — most dotai entity fields map 1:1
- Model names use aliases (`sonnet`, `opus`, `haiku`) not full IDs
- Hook events use PascalCase (unlike other tools which use camelCase)
- SSE transport is deprecated — warn users to migrate to HTTP
- `CLAUDE.md` concatenation: multiple rules with the same outputDir merge into one file separated by `---`
- Hook matchers are regex strings — `Edit|Write`, `mcp__.*`, etc.
- MCP scope names changed: `local` (was `project`), `project` (shared via .mcp.json), `user` (was `global`)
- Task tool renamed to Agent in v2.1.63; `Task(...)` still works as alias
