/**
 * A portable, reusable package of domain-specific knowledge and optional scripts.
 *
 * Structure: SKILL.md + optional scripts/, references/, assets/.
 * Invocation: explicit (/skill-name) or automatic (agent decides).
 * All three tools (Claude Code, Cursor, Codex) converge on this format.
 */
export interface Skill {
	/** Identifier used for explicit invocation (e.g. /skill-name). */
	name: string;
	/** What this skill does and when to use it. */
	description: string;
	/** The SKILL.md body (markdown). */
	content: string;
	/** When true, only allow explicit /skill-name invocation. */
	disableAutoInvocation: boolean;
}
