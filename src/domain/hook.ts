import type { Scope } from "./scope.js";

/** Lifecycle events that can trigger a hook. */
export const HookEvent = {
	PreToolUse: "preToolUse",
	PostToolUse: "postToolUse",
	PreFileEdit: "preFileEdit",
	PostFileEdit: "postFileEdit",
	SessionStart: "sessionStart",
	SessionEnd: "sessionEnd",
	UserPromptSubmitted: "userPromptSubmitted",
	AgentStop: "agentStop",
	SubagentStop: "subagentStop",
	ErrorOccurred: "errorOccurred",
} as const;

export type HookEvent = (typeof HookEvent)[keyof typeof HookEvent];

/**
 * An event handler that fires at specific points in the agent lifecycle.
 * Supported by Claude Code and Cursor; not supported by Codex.
 */
export interface Hook {
	/** Lifecycle event this hook responds to. */
	event: HookEvent;
	/** Filter condition (glob pattern or tool name) for when this hook fires. */
	matcher?: string;
	/** Shell command or prompt to execute. */
	handler: string;
	/** Scope at which this hook is defined. */
	scope: Scope;
}
