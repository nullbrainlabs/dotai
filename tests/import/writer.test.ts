import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadProjectConfig } from "../../src/config/loader.js";
import type { ProjectConfig } from "../../src/config/schema.js";
import { writeProjectConfig } from "../../src/import/writer.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-writer");

describe("writeProjectConfig", () => {
	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	const fullConfig: ProjectConfig = {
		directives: [
			{
				content: "# Test Directive\n\nSome rules here.",
				scope: "project",
				alwaysApply: true,
				description: "test-directive",
			},
		],
		skills: [
			{
				name: "test-skill",
				description: "A test skill",
				content: "# Test Skill\n\nDo the thing.\n",
				disableAutoInvocation: false,
			},
		],
		agents: [
			{
				name: "test-agent",
				description: "A test agent",
				instructions: "You are a test agent.",
				model: "claude-sonnet-4-6",
				readonly: true,
				tools: ["Read", "Glob"],
			},
		],
		toolServers: [
			{
				name: "test-server",
				transport: "stdio",
				command: "npx",
				args: ["-y", "test-mcp"],
				env: { API_KEY: "test" },
				scope: "project",
			},
		],
		hooks: [
			{
				event: "preFileEdit",
				handler: "eslint --fix",
				matcher: "*.ts",
				scope: "project",
			},
		],
		permissions: [
			{
				tool: "Bash",
				pattern: "npm *",
				decision: "allow",
				scope: "project",
			},
		],
		settings: [{ key: "model", value: "claude-sonnet-4-6", scope: "project" }],
		ignorePatterns: [
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
		],
	};

	it("writes config.yaml with toolServers, permissions, settings, hooks, ignore", async () => {
		const written = await writeProjectConfig(TMP_DIR, fullConfig);
		const configPath = join(TMP_DIR, "config.yaml");

		expect(written).toContain(configPath);
		expect(existsSync(configPath)).toBe(true);

		const content = readFileSync(configPath, "utf-8");
		expect(content).toContain("mcpServers");
		expect(content).toContain("test-server");
		expect(content).toContain("permissions");
		expect(content).toContain("Bash");
		expect(content).toContain("settings");
		expect(content).toContain("model");
		expect(content).toContain("hooks");
		expect(content).toContain("preFileEdit");
		expect(content).toContain("ignore");
		expect(content).toContain("node_modules/**");
		expect(content).toContain("dist/**");
	});

	it("writes directives as .md files with frontmatter", async () => {
		const written = await writeProjectConfig(TMP_DIR, fullConfig);
		const directivePath = join(TMP_DIR, "directives", "test-directive.md");

		expect(written).toContain(directivePath);
		expect(existsSync(directivePath)).toBe(true);

		const content = readFileSync(directivePath, "utf-8");
		expect(content).toContain("---");
		expect(content).toContain("scope: project");
		expect(content).toContain("alwaysApply: true");
		expect(content).toContain("description: test-directive");
		expect(content).toContain("# Test Directive");
		expect(content).toContain("Some rules here.");
	});

	it("writes agents as .md files with frontmatter", async () => {
		const written = await writeProjectConfig(TMP_DIR, fullConfig);
		const agentPath = join(TMP_DIR, "agents", "test-agent.md");

		expect(written).toContain(agentPath);
		expect(existsSync(agentPath)).toBe(true);

		const content = readFileSync(agentPath, "utf-8");
		expect(content).toContain("---");
		expect(content).toContain("description: A test agent");
		expect(content).toContain("model: claude-sonnet-4-6");
		expect(content).toContain("readonly: true");
		expect(content).toContain("tools: [Read, Glob]");
		expect(content).toContain("You are a test agent.");
	});

	it("writes skills as SKILL.md in subdirectories", async () => {
		const written = await writeProjectConfig(TMP_DIR, fullConfig);
		const skillPath = join(TMP_DIR, "skills", "test-skill", "SKILL.md");

		expect(written).toContain(skillPath);
		expect(existsSync(skillPath)).toBe(true);

		const content = readFileSync(skillPath, "utf-8");
		expect(content).toContain("# Test Skill");
		expect(content).toContain("Do the thing.");
	});

	it("round-trip: write then loadProjectConfig produces matching data", async () => {
		await writeProjectConfig(TMP_DIR, fullConfig);

		const { config: loaded, errors } = await loadProjectConfig(TMP_DIR);
		expect(errors).toEqual([]);

		// Directives
		expect(loaded.directives).toHaveLength(1);
		expect(loaded.directives[0].content).toContain("# Test Directive");
		expect(loaded.directives[0].content).toContain("Some rules here.");
		expect(loaded.directives[0].alwaysApply).toBe(true);
		expect(loaded.directives[0].scope).toBe("project");
		expect(loaded.directives[0].description).toBe("test-directive");

		// Skills
		expect(loaded.skills).toHaveLength(1);
		expect(loaded.skills[0].name).toBe("test-skill");
		expect(loaded.skills[0].content).toContain("# Test Skill");
		expect(loaded.skills[0].content).toContain("Do the thing.");

		// Agents
		expect(loaded.agents).toHaveLength(1);
		expect(loaded.agents[0].name).toBe("test-agent");
		expect(loaded.agents[0].description).toBe("A test agent");
		expect(loaded.agents[0].instructions).toContain("You are a test agent.");
		expect(loaded.agents[0].model).toBe("claude-sonnet-4-6");
		expect(loaded.agents[0].readonly).toBe(true);
		expect(loaded.agents[0].tools).toEqual(["Read", "Glob"]);

		// Tool servers
		expect(loaded.toolServers).toHaveLength(1);
		expect(loaded.toolServers[0].name).toBe("test-server");
		expect(loaded.toolServers[0].transport).toBe("stdio");
		expect(loaded.toolServers[0].command).toBe("npx");
		expect(loaded.toolServers[0].args).toEqual(["-y", "test-mcp"]);
		expect(loaded.toolServers[0].env).toEqual({ API_KEY: "test" });

		// Hooks
		expect(loaded.hooks).toHaveLength(1);
		expect(loaded.hooks[0].event).toBe("preFileEdit");
		expect(loaded.hooks[0].handler).toBe("eslint --fix");
		expect(loaded.hooks[0].matcher).toBe("*.ts");

		// Permissions
		expect(loaded.permissions).toHaveLength(1);
		expect(loaded.permissions[0].tool).toBe("Bash");
		expect(loaded.permissions[0].pattern).toBe("npm *");
		expect(loaded.permissions[0].decision).toBe("allow");

		// Settings
		expect(loaded.settings).toHaveLength(1);
		expect(loaded.settings[0].key).toBe("model");
		expect(loaded.settings[0].value).toBe("claude-sonnet-4-6");

		// Ignore patterns
		expect(loaded.ignorePatterns).toHaveLength(2);
		expect(loaded.ignorePatterns.map((p) => p.pattern)).toEqual(["node_modules/**", "dist/**"]);
	});

	it("empty config produces minimal skeleton", async () => {
		const emptyProjectConfig: ProjectConfig = {
			directives: [],
			skills: [],
			agents: [],
			toolServers: [],
			hooks: [],
			permissions: [],
			settings: [],
			ignorePatterns: [],
		};

		const written = await writeProjectConfig(TMP_DIR, emptyProjectConfig);

		// Should at least write config.yaml
		const configPath = join(TMP_DIR, "config.yaml");
		expect(written).toContain(configPath);
		expect(existsSync(configPath)).toBe(true);

		const content = readFileSync(configPath, "utf-8");
		// Should have empty arrays/objects in yaml
		expect(content).toContain("mcpServers");
		expect(content).toContain("permissions");
		expect(content).toContain("settings");
		expect(content).toContain("hooks");
		expect(content).toContain("ignore");

		// No directive, skill, or agent files should be written
		expect(written).toHaveLength(1);
	});
});
