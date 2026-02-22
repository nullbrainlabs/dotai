---
title: Glossary
description: Definitions of terms used in the dotai project.
---

**Agent** — A specialized AI sub-assistant with its own instructions, model override, and optional tool restrictions. Defined in `.ai/agents/*.md`. See [Agents](/concepts/agents).

**Approval Policy** — Codex's coarse-grained access control. One of: `suggest` (propose only), `auto-edit` (edit files, ask before commands), or `full-auto` (no manual approval). dotai maps fine-grained Permissions to the closest Codex policy.

**Checkpoint** — A snapshot of working tree state saved before making changes, enabling rollback.

**Compaction** — Summarizing earlier conversation history to free context window space when approaching token limits.

**Context Window** — The fixed token budget available to the agent for a single session. IgnorePattern and Directive scoping manage what occupies this limited space.

**Directive** — A persistent, text-based instruction that shapes agent behavior. The unified abstraction for Claude Code's `CLAUDE.md`/rules, Cursor's `.mdc` rules, Codex's `AGENTS.md`, and Copilot's `.github/copilot-instructions.md`/`.github/instructions/`. Defined in `.ai/directives/*.md`. See [Directives](/concepts/directives).

**Enterprise Scope** — The highest-precedence scope tier. Organization-wide policy that cannot be overridden.

**Frontmatter** — YAML metadata at the top of a markdown file, delimited by `---` lines. Used to declare properties like `scope`, `alwaysApply`, `appliesTo`.

**Glob** — A file path pattern using wildcard syntax (e.g., `*.tsx`, `src/**/*.test.ts`). Used in directive `appliesTo`, permission `pattern`, and ignore patterns.

**Hook** — An event handler fired at specific agent lifecycle points. Supported by Claude Code (full), GitHub Copilot (most events), and Cursor (partial). Not supported by Codex or OpenCode. Defined in `.ai/config.yaml`. See [Hooks](/concepts/hooks).

**IgnorePattern** — A gitignore-style pattern excluding files from the agent's context and indexing. Restricted to project and user scope. See [Ignore Patterns](/concepts/ignore-patterns).

**Local Scope** — The lowest-precedence scope tier. Machine-specific overrides not committed to VCS.

**Matcher** — A filter on a Hook: tool name for tool-use hooks, glob pattern for file-edit hooks.

**MCP (Model Context Protocol)** — An open protocol for connecting AI agents to external tool/data providers. All six target tools support MCP. See [Tool Servers](/concepts/tool-servers).

**Permission** — An access control rule: tool name + optional argument pattern + decision (allow/deny/ask). Stored at finest granularity, projected to coarser models during generation. See [Permissions](/concepts/permissions).

**Project Scope** — The second-highest scope tier. Shared config committed to VCS and used by all contributors.

**Scope** — One of four hierarchical tiers (`enterprise > project > user > local`) determining where config is defined and its precedence. See [Concepts Overview](/concepts/overview).

**Setting** — A key-value configuration entry for model selection, feature flags, or tool behavior. Defined in `.ai/config.yaml`. See [Settings](/concepts/settings).

**Skill** — A portable package of domain knowledge. A `SKILL.md` file inside a named directory, optionally with `scripts/`, `references/`, `assets/`. Invoked via `/skill-name`. Defined in `.ai/skills/<name>/SKILL.md`. See [Skills](/concepts/skills).

**Slash Command** — A user action triggered by `/<name>`. Skills are invoked as slash commands.

**ToolServer** — An external provider connected via MCP. Three transports: `stdio`, `http`, `sse`. Configured in `.ai/config.yaml`. See [Tool Servers](/concepts/tool-servers).

**Transport** — MCP connection mode: `stdio` (subprocess), `http` (stateless), or `sse` (streaming).

**User Scope** — The third-precedence scope tier. Personal preferences stored outside the project directory.
