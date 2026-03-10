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
import type { DriftChange, DriftReport, ResearchConfig } from "../src/spec-drift.js";

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

/** Create a test DriftChange with sensible defaults. */
export function fixtureDriftChange(overrides?: Partial<DriftChange>): DriftChange {
	return {
		section: "hooks",
		type: "structural",
		description: "Added 'timeout' field to hook handlers",
		docUrl: "https://code.claude.com/docs/en/hooks.md",
		specLines: "245-260",
		emittersAffected: ["src/emitters/hooks.ts"],
		...overrides,
	};
}

/** Create a test DriftReport with sensible defaults. */
export function fixtureDriftReport(overrides?: Partial<DriftReport>): DriftReport {
	return {
		tool: "claude-code",
		detectedAt: "2026-03-09",
		changes: [fixtureDriftChange()],
		status: "pending",
		...overrides,
	};
}

/** Create a test ResearchConfig with sensible defaults. */
export function fixtureResearchConfig(overrides?: Partial<ResearchConfig>): ResearchConfig {
	return {
		tool: "claude-code",
		lastResearchedVersion: "Claude Code 1.0 (CLI)",
		spec: "specs/claude-code.md",
		llmsTxt: "https://code.claude.com/docs/llms.txt",
		docs: [{ url: "https://code.claude.com/docs/en/hooks.md", lastHash: "", lastFetched: "" }],
		emitters: ["src/emitters/hooks.ts"],
		outputPaths: { hooks: ".claude/settings.json (hooks key)" },
		notes: ["Hook events use PascalCase"],
		...overrides,
	};
}
