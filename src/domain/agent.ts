/**
 * A specialized AI assistant with isolated context, custom instructions,
 * and optional tool/model restrictions.
 *
 * Claude Code: .claude/agents/*.md
 * Cursor:      .cursor/agents/*.md
 * Codex:       [agents.<name>] config sections
 */
export interface Agent {
	/** Identifier used for delegation. */
	name: string;
	/** When/why the primary agent should delegate to this subagent. */
	description: string;
	/** Model override (e.g. "claude-sonnet-4-6"). */
	model?: string;
	/** When true, restrict to read-only file access. */
	readonly?: boolean;
	/** System prompt / behavioral guidance (markdown). */
	instructions: string;
	/** Allowed tool names. Undefined means all tools allowed. */
	tools?: string[];
	/** Disallowed tool names. */
	disallowedTools?: string[];
	/** Permission mode for the agent. */
	permissionMode?: "default" | "acceptEdits" | "dontAsk" | "bypassPermissions" | "plan";
	/** Maximum number of agentic turns. */
	maxTurns?: number;
	/** Skills available to the agent. */
	skills?: string[];
	/** Memory scope for the agent. */
	memory?: "user" | "project" | "local";
	/** Whether the agent runs in the background. */
	background?: boolean;
	/** Isolation mode. */
	isolation?: "worktree";
	/** Hook definitions (opaque nested YAML, passed through). */
	hooks?: Record<string, unknown>;
	/** MCP server definitions (opaque nested YAML, passed through). */
	mcpServers?: Record<string, unknown>;
}
