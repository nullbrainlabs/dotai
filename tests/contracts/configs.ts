import type { ProjectConfig } from "../../src/config/schema.js";
import { emptyConfig } from "../../src/config/schema.js";
import { createIgnorePattern } from "../../src/domain/factories.js";
import {
	fixtureAgent,
	fixtureHook,
	fixturePermission,
	fixtureRule,
	fixtureSkill,
	fixtureToolServer,
} from "../fixtures.js";

/** One of every entity type with diverse options. */
export function kitchenSinkConfig(): ProjectConfig {
	return {
		...emptyConfig(),
		rules: [
			fixtureRule({ content: "Always use TypeScript strict mode.", alwaysApply: true }),
			fixtureRule({
				content: "Follow React best practices.",
				alwaysApply: false,
				appliesTo: ["**/*.tsx", "**/*.jsx"],
				description: "React guidelines",
			}),
		],
		skills: [
			fixtureSkill({
				name: "refactor",
				description: "Refactor code for clarity",
				content: "Analyze the code and suggest refactoring improvements.",
			}),
		],
		agents: [
			fixtureAgent({
				name: "reviewer",
				description: "Code review agent",
				instructions: "Review code for bugs, style, and performance issues.",
				model: "claude-sonnet-4-6",
				tools: ["Read", "Grep", "Glob"],
				readonly: true,
			}),
		],
		toolServers: [
			fixtureToolServer({
				name: "db-server",
				transport: "stdio",
				command: "npx @db/mcp-server",
				args: ["--port", "3000"],
				env: { DB_URL: "postgres://localhost/dev" },
			}),
		],
		permissions: [fixturePermission({ tool: "Bash", decision: "allow" })],
		hooks: [
			fixtureHook({
				event: "postToolUse",
				matcher: "Bash",
				handler: "echo done",
				type: "command",
			}),
		],
		ignorePatterns: [createIgnorePattern({ pattern: "node_modules/", scope: "project" })],
	};
}

/** Single alwaysApply rule, nothing else. */
export function minimalConfig(): ProjectConfig {
	return {
		...emptyConfig(),
		rules: [fixtureRule({ content: "Keep it simple.", alwaysApply: true })],
	};
}

/** Exercises edge cases and merge behavior. */
export function advancedConfig(): ProjectConfig {
	return {
		...emptyConfig(),
		rules: [
			fixtureRule({ content: "Use consistent naming conventions.", alwaysApply: true }),
			fixtureRule({
				content: "Optimize database queries.",
				alwaysApply: false,
				appliesTo: ["**/*.sql", "src/db/**"],
				description: "SQL optimization",
			}),
			fixtureRule({
				content: "Skip this rule for code review.",
				alwaysApply: true,
				excludeAgent: "code-review",
			}),
		],
		skills: [
			fixtureSkill({
				name: "debug",
				description: "Debug issues systematically",
				content: "Step through the code and identify the root cause.",
			}),
			fixtureSkill({
				name: "explain",
				description: "Explain code to users",
				content: "Break down complex code into simple explanations.",
				context: "fork",
			}),
		],
		agents: [
			fixtureAgent({
				name: "architect",
				description: "System architecture agent",
				instructions: "Design and review system architecture.",
				readonly: true,
				tools: ["Read", "Grep", "Glob", "WebSearch"],
			}),
			fixtureAgent({
				name: "coder",
				description: "Implementation agent",
				instructions: "Write clean, tested code.",
				permissionMode: "acceptEdits",
				maxTurns: 25,
			}),
		],
		toolServers: [
			fixtureToolServer({
				name: "filesystem",
				transport: "stdio",
				command: "npx @modelcontextprotocol/server-filesystem",
				args: ["/workspace"],
			}),
			fixtureToolServer({
				name: "remote-api",
				transport: "http",
				url: "https://api.example.com/mcp",
			}),
		],
		permissions: [
			fixturePermission({ tool: "Bash", decision: "allow", pattern: "npm *" }),
			fixturePermission({ tool: "Edit", decision: "deny", pattern: "*.lock" }),
			fixturePermission({ tool: "WebSearch", decision: "ask" }),
		],
		hooks: [
			fixtureHook({
				event: "preToolUse",
				matcher: "Edit",
				handler: "echo 'editing file'",
				type: "command",
			}),
			fixtureHook({
				event: "userPromptSubmitted",
				handler: "Summarize the user request before proceeding.",
				type: "prompt",
			}),
			fixtureHook({
				event: "sessionStart",
				handler: "Review project context and prepare workspace.",
				type: "agent",
			}),
		],
		ignorePatterns: [
			createIgnorePattern({ pattern: "dist/", scope: "project" }),
			createIgnorePattern({ pattern: ".env*", scope: "project" }),
		],
	};
}
