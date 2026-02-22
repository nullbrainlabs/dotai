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
	/** Agent mode (OpenCode). */
	mode?: "primary" | "subagent" | "all";
	/** Sampling temperature (OpenCode). */
	temperature?: number;
	/** Top-p sampling (OpenCode). */
	topP?: number;
	/** Max steps per invocation (OpenCode). */
	steps?: number;
	/** Display color in TUI (OpenCode). */
	color?: string;
	/** Hidden from agent picker (OpenCode). */
	hidden?: boolean;
	/** Disabled agent (OpenCode). */
	disabled?: boolean;
}
