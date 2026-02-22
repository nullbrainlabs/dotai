# Glossary

Definitions of terms as used within the dotai project.

---

**Agent** -- A specialized AI sub-assistant with its own instructions, model override, and optional tool restrictions. The primary agent delegates focused tasks (plan validation, docs review, code cleanup) to agents based on context. Defined in `.ai/agents/*.md`.

**Approval Policy** -- Codex's coarse-grained access control model. One of three levels: `suggest` (agent proposes changes but cannot apply them), `auto-edit` (agent can edit files but must ask before running commands), or `full-auto` (agent operates without manual approval). dotai maps fine-grained Permission rules down to the closest Codex approval policy during generation.

**Checkpoint** -- A snapshot of the working tree state saved by the agent before making changes, enabling rollback if the changes are rejected or cause problems. Claude Code creates checkpoints automatically; other tools use git commits or stash-based mechanisms.

**Compaction** -- The process of summarizing earlier conversation history to free up context window space when the agent approaches its token limit. The agent condenses prior turns into a shorter summary and continues with the freed capacity. Relevant to Setting configuration (e.g., enabling/disabling auto-compaction).

**Context Window** -- The fixed token budget available to the agent for a single session. All instructions, file contents, tool outputs, and conversation history must fit within this window. IgnorePattern and Directive scoping exist specifically to manage what occupies this limited space.

**Directive** -- A persistent, text-based instruction that shapes agent behavior. The unified abstraction for what Claude Code calls `CLAUDE.md` and rules, Cursor calls rules (`.mdc` files), and Codex calls `AGENTS.md`. Defined in `.ai/directives/*.md` with YAML frontmatter controlling scope, conditional application, and always-apply behavior.

**Enterprise Scope** -- The highest-precedence scope tier. Represents organization-wide policy (security rules, compliance requirements, mandatory MCP servers) that cannot be overridden by project, user, or local configuration.

**Frontmatter** -- YAML metadata at the top of a markdown file, delimited by `---` lines. dotai directives and agents use frontmatter to declare properties like `scope`, `alwaysApply`, `appliesTo`, `model`, `readonly`, and `tools` without polluting the markdown body.

**Glob** -- A file path pattern using wildcard syntax (e.g., `*.tsx`, `src/**/*.test.ts`). Used in Directive `appliesTo` fields to conditionally activate directives, in Permission `pattern` fields to scope access control, and in IgnorePattern to exclude files from agent visibility.

**Hook** -- An event handler that fires at specific points in the agent lifecycle (before/after tool use, before/after file edits, session start/end). Supported by Claude Code and Cursor; not supported by Codex. Defined in `.ai/config.yaml` under the `hooks` section.

**IgnorePattern** -- A gitignore-style glob pattern that excludes matching files and directories from the agent's context window and file indexing. Prevents noise (build artifacts, lock files, `node_modules`) from consuming limited context. Restricted to project and user scope.

**Local Scope** -- The lowest-precedence scope tier. Represents machine-specific overrides such as local file paths, debug flags, or developer-specific MCP server configurations. Not committed to version control.

**Matcher** -- A filter condition on a Hook that determines when it fires. For tool-use hooks, the matcher is a tool name (e.g., `"Bash"`). For file-edit hooks, the matcher is a glob pattern (e.g., `"*.ts"`). When no matcher is specified, the hook fires on every event of its type.

**MCP (Model Context Protocol)** -- An open protocol for connecting AI agents to external tool and data providers. All three target tools (Claude Code, Cursor, Codex) support MCP. dotai models MCP connections as ToolServer entities and generates the appropriate config format for each tool.

**Permission** -- An access control rule governing what tools and actions the agent can perform. Consists of a tool name, an optional argument pattern, and a decision (allow, deny, or ask). dotai stores permissions at the finest granularity and projects down to coarser models (Cursor's two-way allow/deny, Codex's approval policy) during generation.

**Profile** -- A named collection of settings, permissions, and directives that can be activated as a group. Profiles allow switching between configurations (e.g., "review mode" with read-only permissions vs. "development mode" with full access) without modifying individual settings.

**Progressive Disclosure** -- A UX principle applied to dotai's CLI and configuration: show the simplest interface by default and reveal advanced options only when needed. For example, `dotai init` asks minimal questions and generates sensible defaults; advanced users can then edit `.ai/config.yaml` directly.

**Project Scope** -- The second-highest-precedence scope tier. Represents shared project configuration committed to version control and used by all contributors. The most common scope for directives, permissions, and MCP server definitions.

**Sandbox** -- An isolation mechanism that restricts the agent's ability to affect the host system. Codex supports explicit sandbox modes (`off`, `read-only`, `full`). Claude Code and Cursor use permission rules to achieve similar isolation. dotai maps Permission deny rules to sandbox configuration where applicable.

**Scope** -- One of four hierarchical tiers (enterprise, project, user, local) that determines where a configuration entity is defined and its precedence relative to other scopes. Higher-precedence scopes override lower ones when they conflict.

**Setting** -- A key-value configuration entry controlling tool behavior, model selection, or feature flags. Examples include default model, auto-compaction behavior, and context window limits. Defined in `.ai/config.yaml` and generated into each tool's native settings format.

**Skill** -- A portable, reusable package of domain-specific knowledge and optional scripts. Consists of a `SKILL.md` file inside a named directory, optionally accompanied by `scripts/`, `references/`, and `assets/` subdirectories. Invoked explicitly via `/skill-name` or automatically by the agent. Defined in `.ai/skills/<name>/SKILL.md`.

**Slash Command** -- A user-initiated action triggered by typing `/<name>` in the agent's input. Skills are invoked as slash commands (e.g., `/commit`, `/review-pr`). The agent recognizes the command and loads the corresponding skill's instructions.

**ToolServer** -- An external tool or data provider connected to the agent via MCP. Supports three transport types: `stdio` (subprocess), `http` (stateless HTTP), and `sse` (server-sent events). Configured in `.ai/config.yaml` under `servers` and generated into each tool's MCP configuration format.

**Transport** -- The connection mechanism used to communicate with a ToolServer. One of `stdio` (spawn a child process and communicate over stdin/stdout), `http` (stateless HTTP requests), or `sse` (server-sent events for streaming responses).

**User Scope** -- The third-precedence scope tier. Represents personal preferences for the current user (preferred model, custom MCP servers, personal workflow directives). Stored outside the project directory (e.g., `~/.config/dotai/user/`) and not committed to version control.

**Worktree** -- A git worktree used to isolate agent work on a separate branch without affecting the main working tree. Claude Code can create worktrees automatically for experimental changes. dotai's scope system is worktree-aware: local scope configuration applies per-worktree.
