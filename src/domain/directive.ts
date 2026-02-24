import type { Scope } from "./scope.js";

/**
 * A persistent, text-based instruction that shapes agent behavior.
 *
 * Abstracts what Claude Code calls "CLAUDE.md / rules",
 * Cursor calls "rules", and Codex calls "AGENTS.md / instructions".
 */
export interface Directive {
	/** Markdown content of the directive. */
	content: string;
	/** Scope at which this directive is defined. */
	scope: Scope;
	/** Optional glob patterns — activates only for matching file paths. */
	appliesTo?: string[];
	/** When true, always include in context (vs. intelligent selection). */
	alwaysApply: boolean;
	/** Optional human-readable description (used for intelligent selection). */
	description?: string;
	/** Optional subdirectory for the emitted file (e.g. "docs-site" → docs-site/CLAUDE.md). */
	outputDir?: string;
	/** When true, emit to AGENTS.override.md instead of AGENTS.md (Codex only). */
	override?: boolean;
}
