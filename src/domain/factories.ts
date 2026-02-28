import type { Agent } from "./agent.js";
import type { Hook } from "./hook.js";
import type { IgnorePattern } from "./ignore-pattern.js";
import type { Permission } from "./permission.js";
import type { Rule } from "./rule.js";
import type { Setting } from "./settings.js";
import type { Skill } from "./skill.js";
import type { ToolServer } from "./tool-server.js";

/** Create a Rule with sensible defaults. */
export function createRule(overrides: Partial<Rule> & Pick<Rule, "content" | "scope">): Rule {
	return {
		alwaysApply: true,
		...overrides,
	};
}

/** Create a Skill with sensible defaults. */
export function createSkill(overrides: Partial<Skill> & Pick<Skill, "name" | "content">): Skill {
	return {
		description: "",
		disableAutoInvocation: false,
		...overrides,
	};
}

/** Create an Agent with sensible defaults. */
export function createAgent(
	overrides: Partial<Agent> & Pick<Agent, "name" | "instructions">,
): Agent {
	return {
		description: "",
		...overrides,
	};
}

/** Create a ToolServer with sensible defaults. */
export function createToolServer(
	overrides: Partial<ToolServer> & Pick<ToolServer, "name" | "transport" | "scope">,
): ToolServer {
	return { ...overrides };
}

/** Create a Hook with sensible defaults. */
export function createHook(
	overrides: Partial<Hook> & Pick<Hook, "event" | "handler" | "scope">,
): Hook {
	return { ...overrides };
}

/** Create a Permission with sensible defaults. */
export function createPermission(
	overrides: Partial<Permission> & Pick<Permission, "tool" | "decision" | "scope">,
): Permission {
	return { ...overrides };
}

/** Create a Setting. */
export function createSetting(
	overrides: Partial<Setting> & Pick<Setting, "key" | "value" | "scope">,
): Setting {
	return { ...overrides };
}

/** Create an IgnorePattern. */
export function createIgnorePattern(
	overrides: Partial<IgnorePattern> & Pick<IgnorePattern, "pattern" | "scope">,
): IgnorePattern {
	return { ...overrides };
}
