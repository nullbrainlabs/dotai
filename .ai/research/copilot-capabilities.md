# GitHub Copilot Configuration Capabilities — Complete Reference

> Source: [GitHub Copilot Official Docs](https://docs.github.com/en/copilot)
> Date: 2026-02-24

## Table of Contents

1. [Custom Instructions (Directives)](#1-custom-instructions-directives)
2. [Custom Agents](#2-custom-agents)
3. [Agent Skills](#3-agent-skills)
4. [Hooks](#4-hooks)
5. [MCP Servers](#5-mcp-servers)
6. [Prompt Files](#6-prompt-files)
7. [Content Exclusion](#7-content-exclusion)
8. [Setup Steps (CI Environment)](#8-setup-steps)
9. [Plugins (CLI)](#9-plugins-cli)
10. [Permissions & Settings](#10-permissions--settings)
11. [dotai Gap Analysis](#11-dotai-gap-analysis)

---

## 1. Custom Instructions (Directives)

### 1a. Repository-Wide Instructions

| Property | Value |
|----------|-------|
| **File** | `.github/copilot-instructions.md` |
| **Format** | Plain Markdown (no frontmatter) |
| **Limit** | ~2 pages |
| **Support** | All IDEs, GitHub.com Chat, Coding Agent, Code Review, CLI |

Content is natural language markdown. Whitespace between instructions is ignored. Loaded automatically for all Copilot interactions within the repo.

### 1b. Path-Specific Instructions

| Property | Value |
|----------|-------|
| **Directory** | `.github/instructions/` (subdirs allowed) |
| **Naming** | `<name>.instructions.md` |
| **Format** | Markdown with YAML frontmatter |
| **Support** | VS Code, Visual Studio, JetBrains, Coding Agent, Code Review |

#### Frontmatter Schema

```yaml
---
applyTo: "**/*.ts,**/*.tsx"     # Required — comma-separated glob patterns
excludeAgent: "code-review"     # Optional — "code-review" | "coding-agent"
---
```

**`applyTo` glob patterns:**
- `*` — files in current directory
- `**` or `**/*` — all files recursively
- `*.py` — extension in current dir only
- `**/*.py` — extension recursively
- `src/*.py` — direct children of src/
- `src/**/*.py` — recursive under src/
- `**/subdir/**/*.py` — any subdir at any depth
- Multiple patterns: comma-separated `"**/*.ts,**/*.tsx"`

**`excludeAgent`:** When omitted, both coding agent and code review use the instructions.

### 1c. Personal Instructions

- **GitHub.com only** — configured via Copilot Chat UI (not a file)
- Not relevant for dotai file emission

### 1d. Organization Instructions

- **GitHub.com only** — configured via org Settings > Copilot > Custom instructions
- Not relevant for dotai file emission

### 1e. CLI User-Level Instructions

| Property | Value |
|----------|-------|
| **File** | `$HOME/.copilot/copilot-instructions.md` |
| **Format** | Plain Markdown |
| **Env var** | `COPILOT_CUSTOM_INSTRUCTIONS_DIRS` (comma-separated dirs) |

### 1f. Agent Instructions (AGENTS.md)

| Property | Value |
|----------|-------|
| **File** | `AGENTS.md` (any directory in repo; nearest takes precedence) |
| **Alternatives** | `CLAUDE.md`, `GEMINI.md` (repo root) |
| **Support** | Coding Agent, CLI |

### Priority Order (highest → lowest)

1. Personal instructions
2. Repository instructions
3. Organization instructions

When both repo-wide and path-specific exist, **both** are used (combined, not overridden).

---

## 2. Custom Agents

| Property | Value |
|----------|-------|
| **Directory** | `.github/agents/` |
| **Naming** | `<name>.agent.md` |
| **Format** | Markdown with YAML frontmatter |
| **Max body** | 30,000 characters |
| **CLI user-level** | `~/.config/copilot/agents/` |
| **Org/Enterprise** | `agents/` in `.github-private` repo |

### Frontmatter Schema

```yaml
---
name: test-specialist                    # Optional — defaults to filename (sans extension)
description: "Purpose and capabilities"  # Required
tools: ["read", "edit", "search"]        # Optional — omit = all tools; [] = none
target: "vscode"                         # Optional — "vscode" | "github-copilot"; omit = both
disable-model-invocation: true           # Optional — prevents auto-selection, requires manual invoke
model: "gpt-4o"                          # Optional — IDE only (ignored by coding agent)
mcp-servers:                             # Optional — agent-specific MCP servers
  custom-mcp:
    type: "local"
    command: "some-command"
    args: ["--arg1"]
    tools: ["*"]
    env:
      KEY: ${{ secrets.COPILOT_MCP_KEY }}
metadata:                                # Optional — name-value annotation pairs
  team: backend
  priority: high
---

Agent behavioral instructions go here (max 30,000 chars).
```

### Tool Aliases

| Alias | Equivalent Names | Function |
|-------|-----------------|----------|
| `execute` | shell, Bash, powershell | Shell execution |
| `read` | Read, NotebookRead | Read file contents |
| `edit` | Edit, MultiEdit, Write, NotebookEdit | File editing |
| `search` | Grep, Glob | Search files/text |
| `agent` | custom-agent, Task | Invoke other agents |
| `web` | WebSearch, WebFetch | Web operations (IDE only) |

### Out-of-Box MCP Servers

- `github/*` — GitHub read-only tools (scoped to source repo)
- `playwright/*` — Browser automation (localhost-only, repo-scoped token)

### File Naming

Characters limited to: `.`, `-`, `_`, `a-z`, `A-Z`, `0-9`

### Precedence

Lower-level configs override higher levels: **repository > organization > enterprise**.
When agents share the same name across project/user levels, **user-level takes precedence** in CLI.

---

## 3. Agent Skills

| Property | Value |
|----------|-------|
| **File** | `SKILL.md` (case-sensitive) |
| **Project paths** | `.github/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md` |
| **Personal paths** | `~/.copilot/skills/<name>/SKILL.md` or `~/.claude/skills/<name>/SKILL.md` |
| **Support** | Coding Agent, CLI, VS Code Insiders (agent mode) |

### Frontmatter Schema

```yaml
---
name: my-skill          # Required — lowercase, hyphens for spaces
description: "What it does and when to use it"  # Required
license: MIT            # Optional
---

Skill instructions, examples, and guidelines in markdown.
```

### Skill Directories

Skill subdirectory name must be lowercase with hyphens. Can contain supplementary files (scripts, examples, additional markdown) referenced in SKILL.md instructions.

### CLI Commands

- `/skills list` — view available
- `/skills reload` — refresh during session
- `/skills add` — add alternative storage locations
- Invoke: `/my-skill` in prompt

**Note:** Copilot skills support far fewer frontmatter fields than Claude Code skills. Fields like `allowed-tools`, `model`, `context`, `agent`, `hooks`, `user-invocable`, `argument-hint`, `disable-model-invocation` are **NOT documented** for Copilot skills.

---

## 4. Hooks

### File Locations

| Context | Path |
|---------|------|
| **Coding Agent** | `.github/hooks/hooks.json` (must be on default branch) |
| **CLI** | `hooks.json` in cwd, or via plugin |

### Configuration Schema

```json
{
  "version": 1,
  "hooks": {
    "sessionStart": [],
    "sessionEnd": [],
    "userPromptSubmitted": [],
    "preToolUse": [],
    "postToolUse": [],
    "errorOccurred": [],
    "agentStop": [],
    "subagentStop": []
  }
}
```

**`version: 1` is required.**

### Hook Entry Schema

```json
{
  "type": "command",
  "bash": "./scripts/check.sh",
  "powershell": "./scripts/check.ps1",
  "cwd": ".",
  "timeoutSec": 30,
  "env": { "KEY": "value" },
  "comment": "Description of what this hook does"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | Only `"command"` supported |
| `bash` | string | Conditional | Unix shell command (required on Unix) |
| `powershell` | string | Conditional | Windows command |
| `cwd` | string | No | Working directory |
| `timeoutSec` | number | No | Default 30, recommended max ~120 |
| `env` | object | No | Custom environment variables |
| `comment` | string | No | Internal documentation |

### Hook Events & Input JSON

#### sessionStart
```json
{
  "timestamp": 1704614400000,
  "cwd": "/path/to/project",
  "source": "new|resume|startup",
  "initialPrompt": "User's initial instruction"
}
```

#### sessionEnd
```json
{
  "timestamp": 1704618000000,
  "cwd": "/path/to/project",
  "reason": "complete|error|abort|timeout|user_exit"
}
```

#### userPromptSubmitted
```json
{
  "timestamp": 1704614500000,
  "cwd": "/path/to/project",
  "prompt": "User's text input"
}
```

#### preToolUse (can approve/deny)
```json
{
  "timestamp": 1704614600000,
  "cwd": "/path/to/project",
  "toolName": "bash|edit|view|create",
  "toolArgs": "{serialized tool arguments}"
}
```

**Output (only from preToolUse):**
```json
{
  "permissionDecision": "deny|allow|ask",
  "permissionDecisionReason": "Human-readable explanation"
}
```

#### postToolUse
```json
{
  "timestamp": 1704614700000,
  "cwd": "/path/to/project",
  "toolName": "bash|edit|view|create",
  "toolArgs": "{serialized arguments}",
  "toolResult": {
    "resultType": "success|failure|denied",
    "textResultForLlm": "Result text"
  }
}
```

#### errorOccurred
```json
{
  "timestamp": 1704614800000,
  "cwd": "/path/to/project",
  "error": {
    "message": "Error description",
    "name": "ErrorType",
    "stack": "Stack trace if available"
  }
}
```

### Key Constraints

- Only `preToolUse` hook return values are processed
- Exit code 0 = success; non-zero = error (hook fails)
- Input via stdin as single-line JSON
- Keep execution under 5 seconds when possible
- Multiple hooks per event execute sequentially in defined order

---

## 5. MCP Servers

### 5a. VS Code Copilot Chat — `.vscode/mcp.json`

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "api-key",
      "description": "API Key",
      "password": true
    }
  ],
  "servers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@some/mcp-server"]
    }
  }
}
```

**Note:** VS Code uses `servers` key (not `mcpServers`). The `inputs` array defines user-prompted values.

#### Local/stdio Server
```json
{
  "servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "env": { "KEY": "value" }
    }
  }
}
```

#### Remote HTTP/SSE Server
```json
{
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "requestInit": {
        "headers": {
          "Authorization": "Bearer TOKEN"
        }
      }
    }
  }
}
```

### 5b. Coding Agent — GitHub Repo Settings (JSON)

Configured in: **Settings > Code & automation > Copilot > Coding agent > MCP configuration**

```json
{
  "mcpServers": {
    "server-name": {
      "type": "local",
      "tools": ["*"],
      "command": "some-command",
      "args": ["--flag"],
      "env": {
        "SECRET": "COPILOT_MCP_SECRET_NAME"
      }
    }
  }
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `type` | string | Yes | `"local"`, `"stdio"`, `"http"`, `"sse"` |
| `tools` | string[] | Yes | `["*"]` for all or specific tool names |
| `command` | string | local/stdio | Startup command |
| `args` | string[] | No | Command arguments |
| `env` | object | No | Env vars referencing `COPILOT_MCP_` prefixed secrets |
| `url` | string | http/sse | Server endpoint |
| `headers` | object | No | Request headers (can reference `$COPILOT_MCP_` secrets) |

### 5c. Agent-Level MCP (in agent frontmatter)

```yaml
mcp-servers:
  custom-mcp:
    type: 'local'
    command: 'some-command'
    args: ['--arg1']
    tools: ["*"]
    env:
      ENV_VAR: ${{ secrets.COPILOT_MCP_VALUE }}
```

**Environment variable syntax variants:**
- `COPILOT_MCP_VAR`
- `$COPILOT_MCP_VAR`
- `${COPILOT_MCP_VAR}`
- `${{ secrets.COPILOT_MCP_VAR }}`
- `${{ var.COPILOT_MCP_VAR }}`

### 5d. Limitations

- Coding agent only supports MCP **tools** (not resources or prompts)
- Remote OAuth-authenticated servers are unsupported for coding agent
- Built-in GitHub MCP server provides read-only repo access by default

---

## 6. Prompt Files

| Property | Value |
|----------|-------|
| **Directory** | `.github/prompts/` |
| **Naming** | `<name>.prompt.md` |
| **Format** | Markdown with YAML frontmatter |
| **Support** | VS Code, Visual Studio, JetBrains only (public preview) |

### Frontmatter Schema

```yaml
---
agent: 'agent'                                        # Required
description: 'Generate a clear code explanation'       # Required
---
```

### Dynamic Input Variables

```
${input:variableName:Display prompt text}
```

Example:
```markdown
---
agent: 'agent'
description: 'Generate unit tests'
---

Generate unit tests for the following code:
${input:code:Paste your code here}

Target framework: ${input:framework:Which test framework?}
```

### File References

- Relative paths: `[reference](../../path/file.ts)`
- Hash syntax: `#file:../../path/file.ts`

### Invocation

In IDE chat: `/prompt-name` (e.g., `/explain-code`)

---

## 7. Content Exclusion

**NOT file-based.** Configured in GitHub web UI at repo, org, or enterprise level.

Settings path: **Settings > Copilot > Content exclusion**

### Repository-Level Format

```yaml
- "/PATH/TO/DIRECTORY/OR/FILE"
- "secrets.json"
- "*.cfg"
- "/scripts/**"
```

### Organization-Level Format

```yaml
"*":
  - "**/.env"

repository-name:
  - "/PATH/TO/FILE"
```

Repository references support multiple URL formats: `http[s]://`, `git://`, `ssh://`, `[user@]host:path`.

### Pattern Syntax

Uses fnmatch (case insensitive):
- `{server,session}*` — alternation
- `*.m[dk]` — character classes
- `**/package?/*` — single char wildcard
- `**/security/**` — recursive matching

### Limitations

**NOT supported by:** CLI, Coding Agent, Agent mode in Copilot Chat.

Changes propagate within 30 minutes.

---

## 8. Setup Steps

| Property | Value |
|----------|-------|
| **File** | `.github/workflows/copilot-setup-steps.yml` |
| **Format** | GitHub Actions workflow YAML |
| **Job name** | Must be `copilot-setup-steps` (strict) |
| **Purpose** | Pre-install tools/dependencies before coding agent starts |

### Example

```yaml
name: "Copilot Setup Steps"

on:
  workflow_dispatch:
  push:
    paths:
      - .github/workflows/copilot-setup-steps.yml

jobs:
  copilot-setup-steps:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: Checkout code
        uses: actions/checkout@v5
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
```

### Customizable Properties

- `steps` — custom installation/setup commands
- `permissions` — minimal required permissions
- `runs-on` — runner type (larger runners, self-hosted, Windows)
- `services` — service containers
- `snapshot` — environment snapshots
- `timeout-minutes` — max 59 minutes

---

## 9. Plugins (CLI)

### Manifest: `plugin.json`

```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": { "name": "Author Name" },
  "license": "MIT",
  "agents": "agents/",
  "skills": "skills/",
  "hooks": "hooks.json",
  "mcpServers": ".mcp.json",
  "lspServers": "lsp.json"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | kebab-case, max 64 chars |
| `description` | string | No | max 1024 chars |
| `version` | string | No | semver |
| `author` | object | No | `{ name, email?, url? }` |
| `homepage` | string | No | Plugin URL |
| `repository` | string | No | Source repo URL |
| `license` | string | No | License identifier |
| `keywords` | string[] | No | Search terms |
| `category` | string | No | Plugin category |
| `tags` | string[] | No | Additional tags |
| `agents` | string\|string[] | No | Path(s) to agent dirs (default: `agents/`) |
| `skills` | string\|string[] | No | Path(s) to skill dirs (default: `skills/`) |
| `commands` | string\|string[] | No | Path(s) to command dirs |
| `hooks` | string\|object | No | Hooks config path or inline |
| `mcpServers` | string\|object | No | MCP config path or inline |
| `lspServers` | string\|object | No | LSP config path or inline |

### Marketplace Manifest: `.github/plugin/marketplace.json`

```json
{
  "name": "marketplace-name",
  "owner": { "name": "Owner" },
  "plugins": [
    {
      "name": "plugin-name",
      "source": "./path/to/plugin"
    }
  ]
}
```

### Installed Location

`~/.copilot/installed-plugins/`

### Loading Precedence

- **Agents/Skills**: first-found-wins (project > plugin)
- **MCP Servers**: last-wins (later overrides earlier)

---

## 10. Permissions & Settings

### No File-Based Permission Config

Copilot does **not** support file-based permission configuration like Claude Code's `settings.json` allow/deny rules.

### CLI Tool Approval (Flags Only)

- `--allow-all-tools`
- `--allow-tool <tool>`
- `--deny-tool <tool>`

### IDE Settings

- **VS Code**: `settings.json` with `"github.copilot.enable": { "*": true, "language": false }`
- **VS Code feature flags**: `"github.copilot.nextEditSuggestions.enabled": true`
- **VS Code MCP discovery**: `"chat.mcp.discovery.enabled": true`

---

## 11. dotai Gap Analysis

### Current State vs. Required State

#### Directives Emitter — `.github/copilot-instructions.md` + `.github/instructions/`

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| Repo-wide `.github/copilot-instructions.md` | ✅ | ✅ | None |
| Path-specific `.instructions.md` | ✅ | ✅ | None |
| `applyTo` frontmatter | ✅ | ✅ | None |
| `excludeAgent` frontmatter | ❌ | ✅ | **Missing** — need domain field + emitter support |

#### Agents Emitter — `.github/agents/*.agent.md`

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| File path `.github/agents/<name>.agent.md` | ✅ | ✅ | None |
| `description` (required) | ✅ | ✅ | None |
| `tools` with alias mapping | ✅ | ✅ | None |
| `name` field | ❌ | Optional | **Minor** — currently omitted since filename = name |
| `target` field | ❌ | Optional | **Missing** — `"vscode"` \| `"github-copilot"` |
| `disable-model-invocation` | ❌ | Optional | **Missing** — maps from `disableAutoInvocation`-like field |
| `model` field | Warned/skipped | Optional (IDE) | Correct behavior, could emit for IDE use |
| `mcp-servers` in frontmatter | ❌ | Optional | **Missing** — agent has `mcpServers` field but not emitted |
| `metadata` field | ❌ | Optional | **Missing** — new field needed |

#### Skills Emitter — `.github/skills/*/SKILL.md`

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| File path | ✅ | ✅ | None |
| `name` + `description` | ✅ | ✅ | None |
| `license` | ❌ | Optional | **Minor** — not in domain Skill type |
| Extra fields (allowed-tools, model, etc.) | Emitted | Not in Copilot spec | **Over-emitting** — Copilot only supports name, description, license |

#### Hooks Emitter — `.github/hooks/hooks.json`

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| File path | `.github/hooks/dotai.hooks.json` | `.github/hooks/hooks.json` | **Wrong filename** |
| `version: 1` | ❌ | Required | **Missing** |
| Hook entry: `type: "command"` | ❌ | Required | **Missing** |
| Hook entry: `bash` field | ❌ (uses `command`) | Required | **Wrong field name** |
| Hook entry: `powershell` field | ❌ | Conditional | **Missing** |
| Hook entry: `cwd` | ❌ | Optional | **Missing** |
| Hook entry: `timeoutSec` | ❌ | Optional | **Missing** — domain has `timeout` (ms), Copilot uses seconds |
| Hook entry: `env` | ❌ | Optional | **Missing** |
| Hook entry: `comment` | ❌ | Optional | **Missing** |
| `matcher` on hooks | Uses `matcher` | Not in Copilot spec | **Over-emitting** — Copilot doesn't have per-hook matchers |

#### MCP Emitter — `.vscode/mcp.json`

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| File path | ✅ `.vscode/mcp.json` | ✅ | None |
| JSON format | Uses `mcpServers` key | Should use `servers` key | **Wrong key** |
| `inputs` array | ❌ | Supported | **Missing** |
| `type` field | ✅ (added) | ✅ | None |

#### Permissions Emitter

| Feature | Current | Required | Gap |
|---------|---------|----------|-----|
| Permissions | Skipped with warning | Not supported | ✅ Correct |
| Settings | Skipped with warning | Not supported (files) | ✅ Correct |

#### Completely Missing Emitters

| Feature | Status | Notes |
|---------|--------|-------|
| **Prompt files** | Not implemented | `.github/prompts/*.prompt.md` with agent/description frontmatter |
| **copilot-setup-steps.yml** | Not implemented | GH Actions workflow for coding agent environment |
| **Plugin manifest** | Not implemented | `plugin.json` for CLI plugin bundling |

### Priority Fixes

1. **🔴 Critical — Hooks format is completely wrong**
   - Wrong filename (`dotai.hooks.json` → `hooks.json`)
   - Missing `version: 1`
   - Wrong entry format (`command` → `type`+`bash`+`powershell`)
   - Missing `cwd`, `timeoutSec`, `env`, `comment`
   - Remove `matcher` (not a Copilot concept)

2. **🔴 Critical — MCP format uses wrong key**
   - VS Code format uses `servers` not `mcpServers`
   - Missing `inputs` support

3. **🟡 Important — Agent emitter missing fields**
   - `mcp-servers` in frontmatter (already in domain model!)
   - `target` field
   - `disable-model-invocation` field
   - `metadata` field

4. **🟡 Important — Directive `excludeAgent` not emitted**
   - Need domain model change or mapping from existing field

5. **🟢 Nice-to-have — Skills over-emitting**
   - Copilot skills only support: name, description, license
   - Currently emitting Claude Code-specific fields that Copilot ignores

6. **🟢 Nice-to-have — Prompt files**
   - New concept — could map from skills or be a new entity type

7. **🟢 Nice-to-have — copilot-setup-steps.yml**
   - CI environment setup — probably out of scope for dotai

8. **🟢 Nice-to-have — Plugin manifest**
   - CLI-specific bundling — advanced feature
