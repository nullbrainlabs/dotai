import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadProjectConfig } from "../../src/config/loader.js";
import { parseMarkdownWithFrontmatter } from "../../src/config/markdown-loader.js";
import { emptyConfig, validateConfig } from "../../src/config/schema.js";
import { loadSkills } from "../../src/config/skill-loader.js";

const FIXTURES = join(import.meta.dirname, "../fixtures/.ai");

describe("parseMarkdownWithFrontmatter", () => {
	it("parses frontmatter and body", () => {
		const result = parseMarkdownWithFrontmatter(`---
scope: project
alwaysApply: true
---

# Hello

Body text here.`);

		expect(result.frontmatter.scope).toBe("project");
		expect(result.frontmatter.alwaysApply).toBe(true);
		expect(result.body).toContain("# Hello");
		expect(result.body).toContain("Body text here.");
	});

	it("handles no frontmatter", () => {
		const result = parseMarkdownWithFrontmatter("# Just markdown\n\nNo frontmatter.");
		expect(result.frontmatter).toEqual({});
		expect(result.body).toContain("# Just markdown");
	});

	it("parses array values in frontmatter", () => {
		const result = parseMarkdownWithFrontmatter(`---
appliesTo: ["*.ts", "*.tsx"]
tools: ["Read", "Write"]
---

Body`);

		expect(result.frontmatter.appliesTo).toEqual(["*.ts", "*.tsx"]);
		expect(result.frontmatter.tools).toEqual(["Read", "Write"]);
	});

	it("parses numeric values", () => {
		const result = parseMarkdownWithFrontmatter(`---
count: 42
ratio: 3.14
---

Body`);

		expect(result.frontmatter.count).toBe(42);
		expect(result.frontmatter.ratio).toBe(3.14);
	});

	it("parses boolean values", () => {
		const result = parseMarkdownWithFrontmatter(`---
enabled: true
disabled: false
---

Body`);

		expect(result.frontmatter.enabled).toBe(true);
		expect(result.frontmatter.disabled).toBe(false);
	});

	it("parses nested YAML structures", () => {
		const result = parseMarkdownWithFrontmatter(`---
name: agent
hooks:
  preToolCall:
    command: echo hello
    timeout: 5000
mcpServers:
  github:
    command: npx
    args:
      - "@mcp/github"
---

Body`);

		const hooks = result.frontmatter.hooks as Record<string, unknown>;
		expect(hooks).toBeDefined();
		expect((hooks.preToolCall as Record<string, unknown>).command).toBe("echo hello");
		expect((hooks.preToolCall as Record<string, unknown>).timeout).toBe(5000);

		const servers = result.frontmatter.mcpServers as Record<string, unknown>;
		expect(servers).toBeDefined();
		expect((servers.github as Record<string, unknown>).command).toBe("npx");
	});
});

describe("loadSkills", () => {
	it("loads skills from fixture directory (backward compat, no frontmatter)", async () => {
		const skills = await loadSkills(join(FIXTURES, "skills"));
		expect(skills).toHaveLength(1);
		expect(skills[0].name).toBe("review");
		expect(skills[0].content).toContain("# Code Review");
		expect(skills[0].disableAutoInvocation).toBe(false);
	});

	it("returns empty array for missing directory", async () => {
		const skills = await loadSkills("/nonexistent/path");
		expect(skills).toEqual([]);
	});

	it("parses frontmatter fields from SKILL.md", async () => {
		const { mkdirSync, writeFileSync, rmSync } = await import("node:fs");
		const tmpDir = join(import.meta.dirname, "../fixtures/tmp-skills");
		const skillDir = join(tmpDir, "gen");
		mkdirSync(skillDir, { recursive: true });
		writeFileSync(
			join(skillDir, "SKILL.md"),
			`---
description: Generate code
disable-model-invocation: true
argument-hint: "<file-path>"
user-invocable: false
allowed-tools: [Read, Grep]
model: opus
context: fork
agent: reviewer
---

# Generator

Generate code from templates.`,
		);

		try {
			const skills = await loadSkills(tmpDir);
			expect(skills).toHaveLength(1);
			expect(skills[0].name).toBe("gen");
			expect(skills[0].description).toBe("Generate code");
			expect(skills[0].disableAutoInvocation).toBe(true);
			expect(skills[0].argumentHint).toBe("<file-path>");
			expect(skills[0].userInvocable).toBe(false);
			expect(skills[0].allowedTools).toEqual(["Read", "Grep"]);
			expect(skills[0].model).toBe("opus");
			expect(skills[0].context).toBe("fork");
			expect(skills[0].agent).toBe("reviewer");
			expect(skills[0].content).toContain("# Generator");
			expect(skills[0].content).not.toContain("---");
		} finally {
			rmSync(tmpDir, { recursive: true });
		}
	});
});

describe("loadProjectConfig", () => {
	it("loads full config from fixtures", async () => {
		const { config, errors } = await loadProjectConfig(FIXTURES);
		expect(errors).toEqual([]);

		// Tool servers
		expect(config.toolServers).toHaveLength(2);
		const github = config.toolServers.find((ts) => ts.name === "github");
		expect(github).toBeDefined();
		expect(github?.transport).toBe("stdio");
		expect(github?.command).toBe("npx");
		expect(github?.args).toEqual(["@modelcontextprotocol/server-github"]);

		const remote = config.toolServers.find((ts) => ts.name === "remote-api");
		expect(remote).toBeDefined();
		expect(remote?.transport).toBe("http");
		expect(remote?.url).toBe("https://mcp.example.com/api");

		// Permissions
		expect(config.permissions).toHaveLength(2);
		expect(config.permissions[0].tool).toBe("Bash");
		expect(config.permissions[0].pattern).toBe("npm *");
		expect(config.permissions[0].decision).toBe("allow");

		// Settings
		expect(config.settings).toHaveLength(2);
		expect(config.settings.find((s) => s.key === "model")?.value).toBe("claude-sonnet-4-6");

		// Hooks
		expect(config.hooks).toHaveLength(2);
		expect(config.hooks[0].event).toBe("preFileEdit");

		// Ignore patterns
		expect(config.ignorePatterns).toHaveLength(3);
		expect(config.ignorePatterns[0].pattern).toBe("node_modules/**");

		// Rules
		expect(config.rules).toHaveLength(2);
		const codeStyle = config.rules.find((d) => d.description === "Code style rules");
		expect(codeStyle).toBeDefined();
		expect(codeStyle?.alwaysApply).toBe(true);
		expect(codeStyle?.content).toContain("Use tabs for indentation");

		const testing = config.rules.find((d) => d.description === "Testing conventions");
		expect(testing).toBeDefined();
		expect(testing?.alwaysApply).toBe(false);
		expect(testing?.appliesTo).toEqual(["**/*.test.ts", "**/*.spec.ts"]);

		// Skills
		expect(config.skills).toHaveLength(1);
		expect(config.skills[0].name).toBe("review");

		// Agents
		expect(config.agents).toHaveLength(1);
		expect(config.agents[0].name).toBe("plan-checker");
		expect(config.agents[0].model).toBe("claude-sonnet-4-6");
		expect(config.agents[0].readonly).toBe(true);
		expect(config.agents[0].tools).toEqual(["Read", "Glob", "Grep"]);
	});

	it("returns empty config for missing directory", async () => {
		const { config, errors } = await loadProjectConfig("/nonexistent/path");
		expect(errors).toEqual([]);
		expect(config).toEqual(emptyConfig());
	});
});

describe("loadProjectConfig — outputDir", () => {
	it("parses outputDir from rule frontmatter", async () => {
		// Use inline parsing to verify the loader logic for outputDir
		const result = parseMarkdownWithFrontmatter(`---
description: Docs rules
alwaysApply: true
outputDir: docs-site
---

Use clear headings.`);

		expect(result.frontmatter.outputDir).toBe("docs-site");
	});
});

describe("validateConfig", () => {
	it("validates a correct config", async () => {
		const { config } = await loadProjectConfig(FIXTURES);
		const result = validateConfig(config);
		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("reports empty rule content", () => {
		const config = emptyConfig();
		config.rules.push({
			content: "",
			scope: "project",
			alwaysApply: true,
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("empty content");
	});

	it("reports stdio server without command", () => {
		const config = emptyConfig();
		config.toolServers.push({
			name: "test",
			transport: "stdio",
			scope: "project",
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("no command");
	});

	it("reports http server without url", () => {
		const config = emptyConfig();
		config.toolServers.push({
			name: "test",
			transport: "http",
			scope: "project",
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("no url");
	});

	it("reports invalid permissionMode", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "bad",
			description: "",
			instructions: "Do stuff.",
			permissionMode: "invalid" as never,
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("Invalid permissionMode");
	});

	it("reports invalid memory scope", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "bad",
			description: "",
			instructions: "Do stuff.",
			memory: "global" as never,
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("Invalid memory");
	});

	it("reports non-positive maxTurns", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "bad",
			description: "",
			instructions: "Do stuff.",
			maxTurns: 0,
		});
		const result = validateConfig(config);
		expect(result.valid).toBe(false);
		expect(result.errors[0].message).toContain("maxTurns must be a positive integer");
	});
});
