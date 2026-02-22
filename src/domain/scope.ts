/**
 * The 4-tier scope hierarchy shared by Claude Code, Cursor, and Codex.
 * Precedence: enterprise > project > user > local (highest to lowest).
 */
export const Scope = {
	Enterprise: "enterprise",
	Project: "project",
	User: "user",
	Local: "local",
} as const;

export type Scope = (typeof Scope)[keyof typeof Scope];

/** All scopes ordered from highest to lowest precedence. */
export const SCOPE_PRECEDENCE: readonly Scope[] = [
	Scope.Enterprise,
	Scope.Project,
	Scope.User,
	Scope.Local,
];

/** Returns true if `a` has higher precedence (lower index) than `b`. */
export function scopeOutranks(a: Scope, b: Scope): boolean {
	return SCOPE_PRECEDENCE.indexOf(a) < SCOPE_PRECEDENCE.indexOf(b);
}
