import type { Scope } from "./scope.js";

/**
 * A file/directory exclusion rule — the agent should not access or index matching paths.
 *
 * Claude Code: Deny rules on Read()/Edit()
 * Cursor:      .cursorignore, .cursorindexingignore
 * Codex:       Protected paths + shell_environment_policy
 */
export interface IgnorePattern {
	/** Gitignore-style glob pattern. */
	pattern: string;
	/** Scope at which this ignore rule is defined. */
	scope: Exclude<Scope, "enterprise" | "local">;
}
