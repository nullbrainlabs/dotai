import { describe, expect, it } from "vitest";
import { emptyConfig, mergeConfigs } from "../../src/config/schema.js";

describe("mergeConfigs", () => {
	it("merges empty configs", () => {
		const result = mergeConfigs(emptyConfig(), emptyConfig());
		expect(result).toEqual(emptyConfig());
	});

	it("concatenates rules from both configs", () => {
		const base = emptyConfig();
		base.rules.push({
			content: "User rule",
			scope: "user",
			alwaysApply: true,
		});

		const override = emptyConfig();
		override.rules.push({
			content: "Project rule",
			scope: "project",
			alwaysApply: true,
		});

		const result = mergeConfigs(base, override);
		expect(result.rules).toHaveLength(2);
		expect(result.rules[0].content).toBe("User rule");
		expect(result.rules[1].content).toBe("Project rule");
	});

	it("project settings override user settings by key", () => {
		const base = emptyConfig();
		base.settings.push(
			{ key: "model", value: "claude-haiku", scope: "user" },
			{ key: "theme", value: "dark", scope: "user" },
		);

		const override = emptyConfig();
		override.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });

		const result = mergeConfigs(base, override);
		expect(result.settings).toHaveLength(2);
		expect(result.settings.find((s) => s.key === "model")?.value).toBe("claude-sonnet-4-6");
		expect(result.settings.find((s) => s.key === "theme")?.value).toBe("dark");
	});

	it("project tool servers override user tool servers by name", () => {
		const base = emptyConfig();
		base.toolServers.push({
			name: "github",
			transport: "stdio",
			command: "old-command",
			scope: "user",
		});

		const override = emptyConfig();
		override.toolServers.push({
			name: "github",
			transport: "stdio",
			command: "new-command",
			scope: "project",
		});

		const result = mergeConfigs(base, override);
		expect(result.toolServers).toHaveLength(1);
		expect(result.toolServers[0].command).toBe("new-command");
	});

	it("concatenates skills, agents, hooks, permissions, ignorePatterns", () => {
		const base = emptyConfig();
		base.skills.push({ name: "a", description: "", content: "a", disableAutoInvocation: false });
		base.agents.push({ name: "a", description: "", instructions: "a" });
		base.hooks.push({ event: "preToolUse", handler: "a", scope: "user" });
		base.permissions.push({ tool: "Bash", decision: "allow", scope: "user" });
		base.ignorePatterns.push({ pattern: "*.log", scope: "user" });

		const override = emptyConfig();
		override.skills.push({
			name: "b",
			description: "",
			content: "b",
			disableAutoInvocation: false,
		});
		override.agents.push({ name: "b", description: "", instructions: "b" });
		override.hooks.push({ event: "postToolUse", handler: "b", scope: "project" });
		override.permissions.push({ tool: "Read", decision: "deny", scope: "project" });
		override.ignorePatterns.push({ pattern: "dist/**", scope: "project" });

		const result = mergeConfigs(base, override);
		expect(result.skills).toHaveLength(2);
		expect(result.agents).toHaveLength(2);
		expect(result.hooks).toHaveLength(2);
		expect(result.permissions).toHaveLength(2);
		expect(result.ignorePatterns).toHaveLength(2);
	});
});
