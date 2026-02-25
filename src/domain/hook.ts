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
	PermissionRequest: "permissionRequest",
	PostToolUseFailure: "postToolUseFailure",
	Notification: "notification",
	SubagentStart: "subagentStart",
	TeammateIdle: "teammateIdle",
	TaskCompleted: "taskCompleted",
	ConfigChange: "configChange",
	WorktreeCreate: "worktreeCreate",
	WorktreeRemove: "worktreeRemove",
	PreCompact: "preCompact",
} as const;

export type HookEvent = (typeof HookEvent)[keyof typeof HookEvent];

/** Hook handler type. */
export const HookType = {
	Command: "command",
	Prompt: "prompt",
	Agent: "agent",
} as const;

export type HookType = (typeof HookType)[keyof typeof HookType];

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
	/** Handler type: command (default), prompt, or agent. */
	type?: HookType;
	/** Timeout in milliseconds for hook execution. */
	timeout?: number;
	/** Status message shown while hook is running. */
	statusMessage?: string;
	/** When true, hook fires only once per session. */
	once?: boolean;
	/** When true, hook runs asynchronously (command type only). */
	async?: boolean;
}
