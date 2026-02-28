import type { ProjectConfig } from "../src/config/schema.js";
import { emptyConfig } from "../src/config/schema.js";
import type { Agent } from "../src/domain/agent.js";
import {
	createAgent,
	createHook,
	createPermission,
	createRule,
	createSkill,
	createToolServer,
} from "../src/domain/factories.js";
import type { Hook } from "../src/domain/hook.js";
import type { Permission } from "../src/domain/permission.js";
import type { Rule } from "../src/domain/rule.js";
import type { Skill } from "../src/domain/skill.js";
import type { ToolServer } from "../src/domain/tool-server.js";

/** Create a test Rule with sensible defaults. */
export function fixtureRule(overrides?: Partial<Rule>): Rule {
	return createRule({
		content: "Test rule content",
		scope: "project",
		...overrides,
	});
}

/** Create a test Skill with sensible defaults. */
export function fixtureSkill(overrides?: Partial<Skill>): Skill {
	return createSkill({
		name: "test-skill",
		content: "Test skill content",
		...overrides,
	});
}

/** Create a test Agent with sensible defaults. */
export function fixtureAgent(overrides?: Partial<Agent>): Agent {
	return createAgent({
		name: "test-agent",
		instructions: "Test agent instructions",
		...overrides,
	});
}

/** Create a test Hook with sensible defaults. */
export function fixtureHook(overrides?: Partial<Hook>): Hook {
	return createHook({
		event: "preToolUse",
		handler: "echo test",
		scope: "project",
		...overrides,
	});
}

/** Create a test Permission with sensible defaults. */
export function fixturePermission(overrides?: Partial<Permission>): Permission {
	return createPermission({
		tool: "Bash",
		decision: "allow",
		scope: "project",
		...overrides,
	});
}

/** Create a test ToolServer with sensible defaults. */
export function fixtureToolServer(overrides?: Partial<ToolServer>): ToolServer {
	return createToolServer({
		name: "test-server",
		transport: "stdio",
		scope: "project",
		command: "npx test-server",
		...overrides,
	});
}

/** Create a test ProjectConfig with common entities pre-populated. */
export function fixtureConfig(overrides?: Partial<ProjectConfig>): ProjectConfig {
	return {
		...emptyConfig(),
		rules: [fixtureRule()],
		skills: [fixtureSkill()],
		agents: [fixtureAgent()],
		toolServers: [fixtureToolServer()],
		hooks: [fixtureHook()],
		permissions: [fixturePermission()],
		...overrides,
	};
}
