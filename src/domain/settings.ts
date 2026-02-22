import type { Scope } from "./scope.js";

/**
 * A key-value configuration entry for tool behavior, model selection, and feature flags.
 *
 * Claude Code: .claude/settings.json
 * Cursor:      .cursor/cli.json
 * Codex:       .codex/config.toml
 */
export interface Setting {
	/** Setting name. */
	key: string;
	/** Setting value (type varies by key). */
	value: unknown;
	/** Scope at which this setting is defined. */
	scope: Scope;
}
