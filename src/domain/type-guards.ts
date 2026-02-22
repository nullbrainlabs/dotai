import type { Agent } from "./agent.js";
import type { Directive } from "./directive.js";
import type { Hook } from "./hook.js";
import type { IgnorePattern } from "./ignore-pattern.js";
import type { Permission } from "./permission.js";
import { SCOPE_PRECEDENCE } from "./scope.js";
import type { Setting } from "./settings.js";
import type { Skill } from "./skill.js";
import type { ToolServer } from "./tool-server.js";

function isObj(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null;
}

function hasString(o: Record<string, unknown>, k: string): boolean {
	return typeof o[k] === "string";
}

function hasScope(o: Record<string, unknown>): boolean {
	return typeof o.scope === "string" && SCOPE_PRECEDENCE.includes(o.scope as never);
}

/** Type guard for Directive. */
export function isDirective(v: unknown): v is Directive {
	return isObj(v) && hasString(v, "content") && hasScope(v) && typeof v.alwaysApply === "boolean";
}

/** Type guard for Skill. */
export function isSkill(v: unknown): v is Skill {
	return (
		isObj(v) &&
		hasString(v, "name") &&
		hasString(v, "content") &&
		typeof v.disableAutoInvocation === "boolean"
	);
}

/** Type guard for Agent. */
export function isAgent(v: unknown): v is Agent {
	return isObj(v) && hasString(v, "name") && hasString(v, "instructions");
}

/** Type guard for ToolServer. */
export function isToolServer(v: unknown): v is ToolServer {
	return isObj(v) && hasString(v, "name") && hasString(v, "transport") && hasScope(v);
}

/** Type guard for Hook. */
export function isHook(v: unknown): v is Hook {
	return isObj(v) && hasString(v, "event") && hasString(v, "handler") && hasScope(v);
}

/** Type guard for Permission. */
export function isPermission(v: unknown): v is Permission {
	return isObj(v) && hasString(v, "tool") && hasString(v, "decision") && hasScope(v);
}

/** Type guard for Setting. */
export function isSetting(v: unknown): v is Setting {
	return isObj(v) && hasString(v, "key") && "value" in v && hasScope(v);
}

/** Type guard for IgnorePattern. */
export function isIgnorePattern(v: unknown): v is IgnorePattern {
	return isObj(v) && hasString(v, "pattern") && hasScope(v);
}
