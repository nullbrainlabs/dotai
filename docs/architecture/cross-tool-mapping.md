# Cross-Tool Mapping

This document maps every dotai unified concept to its equivalent in Claude Code, Cursor, and Codex. It covers file paths, config keys, format details, output file maps, and known limitations.

---

## Concept Mapping Table

### Directive

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Always-apply, project-wide** | `CLAUDE.md` at project root | `.cursor/rules/*.mdc` with `alwaysApply: true` | `AGENTS.md` at project root |
| **Scoped / conditional** | `.claude/rules/*.md` with frontmatter | `.cursor/rules/*.mdc` with `globs` frontmatter | Not supported (concatenated into `AGENTS.md`) |
| **File format** | Markdown with optional YAML frontmatter | MDC (Markdown Components) with YAML frontmatter | Plain markdown |
| **Conditional activation** | `appliesTo` globs in frontmatter | `globs` field in frontmatter | None |
| **Intelligent selection** | `description` field, `alwaysApply: false` | `description` field, `alwaysApply: false` | None (all directives always apply) |
| **Scope support** | Enterprise, project, user | Project only | Project only |

**Translation notes:**
- When generating for Codex, all directives are concatenated into a single `AGENTS.md` file regardless of their `appliesTo` or `alwaysApply` settings. Conditional semantics are lost.
- Claude Code's `CLAUDE.md` is reserved for always-apply project-scope directives. Conditional directives go into `.claude/rules/`.
- Cursor's MDC frontmatter keys differ from dotai's: `appliesTo` becomes `globs`, and the format uses `---` delimiters just like standard YAML frontmatter.

### Skill

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Location** | `.claude/skills/<name>/SKILL.md` | `.cursor/skills/<name>/SKILL.md` | `.codex/skills/<name>/SKILL.md` |
| **Format** | Markdown | Markdown | Markdown |
| **Invocation** | `/skill-name` slash command | `/skill-name` slash command | `/skill-name` slash command |
| **Auto-invocation** | Supported (agent decides) | Supported (agent decides) | Supported (agent decides) |
| **Supporting files** | `scripts/`, `references/`, `assets/` | `scripts/`, `references/`, `assets/` | `scripts/`, `references/`, `assets/` |

**Translation notes:**
- Skills are the most portable concept. The format is identical across all three tools. No translation loss occurs.
- The `disableAutoInvocation` flag is respected by all three tools via a convention in the SKILL.md content (a "Manual invocation only" notice).

### Agent

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Location** | `.claude/agents/*.md` | `.cursor/agents/*.md` | `.codex/config.toml` `[agents.<name>]` |
| **Format** | Markdown with YAML frontmatter | Markdown with YAML frontmatter | TOML config section |
| **Model override** | `model` frontmatter key | `model` frontmatter key | `model` key in TOML |
| **Read-only mode** | `readonly` frontmatter key | `readonly` frontmatter key | Not directly supported |
| **Tool restrictions** | `tools` array in frontmatter | `tools` array in frontmatter | Limited support |
| **Instructions** | Markdown body | Markdown body | `instructions` key (string or file path) |

**Translation notes:**
- Codex agents are configured in TOML rather than standalone markdown files. The markdown instructions body is either inlined as a multi-line TOML string or referenced as a file path.
- Codex has limited support for tool restrictions and no direct `readonly` flag. dotai approximates `readonly: true` by setting restrictive command policies.

### ToolServer (MCP)

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Config file** | `.mcp.json` | `.cursor/mcp.json` | `.codex/config.toml` |
| **Config format** | JSON | JSON | TOML |
| **Top-level key** | `mcpServers` | `mcpServers` | `[mcp_servers.<name>]` |
| **Stdio transport** | `command`, `args`, `env` | `command`, `args`, `env` | `command`, `args`, `env` |
| **HTTP transport** | `url` | `url` | `url` |
| **SSE transport** | `url` | `url` | `url` |
| **Tool filtering** | `enabledTools` / `disabledTools` | `enabledTools` / `disabledTools` | `enabled_tools` / `disabled_tools` |
| **Scope support** | Project and user | Project only | Project only |

**Translation notes:**
- Claude Code and Cursor use nearly identical JSON structures. The only difference is the file path.
- Codex uses TOML with snake_case keys (`mcp_servers`, `enabled_tools`) instead of camelCase.
- Translation is mechanical and lossless across all three tools.

### Hook

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Support level** | Full | Partial | None |
| **Config location** | `.claude/settings.json` `hooks` section | Rule-triggered actions | N/A |
| **preToolUse** | Yes | Limited | No |
| **postToolUse** | Yes | Limited | No |
| **preFileEdit** | Yes | Limited | No |
| **postFileEdit** | Yes | Limited | No |
| **sessionStart** | Yes | No | No |
| **sessionEnd** | Yes | No | No |
| **Matcher support** | Tool name or glob | Glob only | N/A |

**Translation notes:**
- Hooks are the most divergent concept. Codex has no hook support at all; hooks targeting Codex are silently dropped.
- Cursor's hook equivalent is limited to rule-triggered actions that fire when certain file patterns are matched, roughly mapping to `preFileEdit` and `postFileEdit` with glob matchers.
- Claude Code is the only tool with full lifecycle hook support including `sessionStart` and `sessionEnd`.

### Permission

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Config location** | `.claude/settings.json` `permissions` | `.cursor/cli.json` | `.codex/config.toml` |
| **Granularity** | Per-tool with argument patterns | Per-tool-type with patterns | Approval policy + sandbox mode |
| **Decision model** | allow / deny / ask | allow / deny | suggest / auto-edit / full-auto |
| **Tool targeting** | `Bash(pattern)`, `Read(pattern)`, `Write(pattern)`, `Edit(pattern)` | `Shell(cmd)`, `Read(glob)`, `Write(glob)` | Global policy only |
| **Pattern matching** | Glob/prefix on tool arguments | Glob on file paths, prefix on commands | N/A |
| **Sandbox** | N/A | N/A | `sandbox_mode`: off / read-only / full |

**Translation notes:**
- **ask -> deny in Cursor:** Cursor has no interactive approval prompt. `ask` permissions are downgraded to `deny`.
- **Fine-grained -> coarse in Codex:** Codex cannot express per-tool rules. dotai collapses all Permission rules into the most restrictive matching `approval_policy`:
  - If any `deny` rule exists for write operations: `suggest`
  - If all write operations are allowed but commands are restricted: `auto-edit`
  - If everything is allowed: `full-auto`
- **Sandbox mapping:** When dotai permissions include `deny` on `Read` for certain paths, it maps to Codex `sandbox_mode: read-only` or `full` depending on the breadth of restrictions.

### Setting

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Config file** | `.claude/settings.json` | `.cursor/cli.json` | `.codex/config.toml` |
| **Format** | JSON | JSON | TOML |
| **Model selection** | `model` key | `model` key | `model` key |
| **Feature flags** | Tool-specific JSON keys | Tool-specific JSON keys | Tool-specific TOML keys |

**Translation notes:**
- Setting keys are not standardized across tools. dotai maintains an internal mapping of equivalent keys (e.g., "default model" maps to different keys in each tool's config format).
- Unknown keys are passed through to the target format without validation. This supports forward compatibility as tools add new settings.

### IgnorePattern

| Aspect | Claude Code | Cursor | Codex |
|--------|-------------|--------|-------|
| **Mechanism** | `Deny` rules on `Read()` and `Edit()` in permissions | `.cursorignore` file, `.cursorindexingignore` file | Protected paths in config |
| **Format** | Permission deny rules with glob patterns | Gitignore-style pattern file | TOML array of paths |
| **Scope** | Project, user | Project | Project |

**Translation notes:**
- Claude Code has no dedicated ignore file. dotai converts IgnorePatterns into `Read` and `Edit` deny permissions.
- Cursor uses two separate files: `.cursorignore` (agent cannot access) and `.cursorindexingignore` (agent can access but files are not pre-indexed). dotai writes to `.cursorignore` by default.
- Codex uses a protected paths list in `.codex/config.toml`.

---

## Output File Map

What dotai generates for each target tool, organized by entity type.

### Claude Code Output

| dotai Source | Generated File | Notes |
|---------------|---------------|-------|
| `.ai/directives/*.md` (alwaysApply: true) | `CLAUDE.md` | All always-apply directives concatenated |
| `.ai/directives/*.md` (alwaysApply: false) | `.claude/rules/*.md` | One file per directive, frontmatter preserved |
| `.ai/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` | Direct copy with directory structure |
| `.ai/agents/*.md` | `.claude/agents/*.md` | Frontmatter mapped to Claude Code format |
| `.ai/config.yaml` servers | `.mcp.json` | JSON with `mcpServers` key |
| `.ai/config.yaml` hooks | `.claude/settings.json` (hooks section) | Full lifecycle hook support |
| `.ai/config.yaml` permissions | `.claude/settings.json` (permissions section) | Per-tool allow/deny/ask with patterns |
| `.ai/config.yaml` settings | `.claude/settings.json` | Merged with permissions and hooks |
| `.ai/config.yaml` ignore | `.claude/settings.json` (deny rules) | Converted to Read/Edit deny permissions |

### Cursor Output

| dotai Source | Generated File | Notes |
|---------------|---------------|-------|
| `.ai/directives/*.md` | `.cursor/rules/*.mdc` | Frontmatter converted to MDC format (`appliesTo` -> `globs`) |
| `.ai/skills/<name>/SKILL.md` | `.cursor/skills/<name>/SKILL.md` | Direct copy with directory structure |
| `.ai/agents/*.md` | `.cursor/agents/*.md` | Frontmatter mapped to Cursor format |
| `.ai/config.yaml` servers | `.cursor/mcp.json` | JSON with `mcpServers` key |
| `.ai/config.yaml` hooks | `.cursor/rules/*.mdc` (partial) | Only file-edit hooks, mapped to rule actions |
| `.ai/config.yaml` permissions | `.cursor/cli.json` | allow/deny only (ask -> deny) |
| `.ai/config.yaml` settings | `.cursor/cli.json` | Tool-specific key mapping |
| `.ai/config.yaml` ignore | `.cursorignore` | Gitignore-style pattern file |

### Codex Output

| dotai Source | Generated File | Notes |
|---------------|---------------|-------|
| `.ai/directives/*.md` | `AGENTS.md` | All directives concatenated (conditional semantics lost) |
| `.ai/skills/<name>/SKILL.md` | `.codex/skills/<name>/SKILL.md` | Direct copy with directory structure |
| `.ai/agents/*.md` | `.codex/config.toml` (`[agents.<name>]`) | Instructions inlined or referenced |
| `.ai/config.yaml` servers | `.codex/config.toml` (`[mcp_servers.<name>]`) | TOML with snake_case keys |
| `.ai/config.yaml` hooks | Not generated | Hooks unsupported; warning emitted |
| `.ai/config.yaml` permissions | `.codex/config.toml` (`approval_policy`, `sandbox_mode`) | Collapsed to coarse policy |
| `.ai/config.yaml` settings | `.codex/config.toml` | Tool-specific key mapping |
| `.ai/config.yaml` ignore | `.codex/config.toml` (protected paths) | TOML array |

---

## Known Limitations and Lossy Mappings

### Hooks (Codex)

Codex does not support hooks. Any Hook entities in the dotai configuration are silently dropped when generating Codex output. A warning is logged to inform the user. There is no workaround within Codex's configuration model.

**Impact:** Workflows that depend on hooks (pre-commit validation, post-edit linting, session logging) will not function in Codex.

### Hooks (Cursor)

Cursor's hook support is limited to file-edit triggered actions embedded in rule files. The following hooks cannot be represented:
- `sessionStart` / `sessionEnd`
- `preToolUse` / `postToolUse` (for non-file-edit tools)

Only `preFileEdit` and `postFileEdit` hooks with glob matchers can be approximated in Cursor output.

### Permission Granularity (Codex)

Codex's three-level approval policy (`suggest`, `auto-edit`, `full-auto`) cannot express:
- Per-tool rules (e.g., "allow Bash for npm but deny Bash for rm")
- Per-file rules (e.g., "allow Write to src/ but deny Write to config/")
- The `ask` decision (interactive approval)

dotai resolves this by computing the most restrictive policy that satisfies all defined Permission rules. This means a single `deny` rule on any destructive operation forces the entire Codex config to `suggest` mode.

### Permission Granularity (Cursor)

Cursor does not support the `ask` decision. All `ask` permissions are downgraded to `deny` in Cursor output. This is more restrictive than intended -- the user wanted to be prompted, not blocked.

### Directive Conditional Semantics (Codex)

Codex's `AGENTS.md` does not support:
- `appliesTo` glob patterns (conditional activation based on active file)
- `alwaysApply: false` (intelligent selection based on relevance)
- `description` field (used by other tools for intelligent selection)

All directives are unconditionally included in `AGENTS.md`. For large directive sets, this may cause context window pressure in Codex.

### Agent Configuration (Codex)

Codex agents are defined in TOML config sections rather than standalone markdown files. The following properties have limited or no support:
- `readonly`: No direct equivalent. Approximated via restrictive command policies.
- `tools`: Limited tool restriction support compared to Claude Code and Cursor.

### IgnorePattern Mechanism (Claude Code)

Claude Code has no dedicated ignore file. IgnorePatterns are converted to `Read` and `Edit` deny permissions. This means:
- The agent is denied access to matching files (correct behavior).
- The patterns appear in the permissions section rather than a separate ignore file (different UX, same effect).
- There is no equivalent of Cursor's `.cursorindexingignore` (exclude from index but still allow direct access).

### Scope Limitations

| Tool | Supported scopes |
|------|-----------------|
| Claude Code | Enterprise, project, user |
| Cursor | Project only |
| Codex | Project only |

Cursor and Codex do not natively support enterprise or user scope. dotai handles this by:
- Merging enterprise and user-scoped entities into project-scoped output, respecting precedence.
- Emitting a warning when enterprise deny rules are merged into project config (since project contributors could theoretically modify them).
