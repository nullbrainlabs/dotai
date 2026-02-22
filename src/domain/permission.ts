import type { Scope } from "./scope.js";

/** The three possible access control decisions. */
export const Decision = {
	Allow: "allow",
	Deny: "deny",
	Ask: "ask",
} as const;

export type Decision = (typeof Decision)[keyof typeof Decision];

/**
 * An access control rule governing what tools and actions the agent can take.
 *
 * Claude Code: allow/deny/ask rules per tool (Bash(pattern), Read(pattern), etc.)
 * Cursor:      allow/deny per tool type (Shell(cmd), Read(glob), Write(glob))
 * Codex:       approval_policy + sandbox_mode + command rules
 */
export interface Permission {
	/** Which tool this applies to (e.g. "Bash", "Read", "Write"). */
	tool: string;
	/** Glob/prefix pattern for matching arguments. */
	pattern?: string;
	/** Access control decision. */
	decision: Decision;
	/** Scope at which this permission is defined. */
	scope: Scope;
}
