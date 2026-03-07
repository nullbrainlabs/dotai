import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { agentsEmitter } from "../../../src/emitters/agents/index.js";

describe("agentsEmitter — copilot", () => {
	const makeConfig = () => {
		const config = emptyConfig();
		config.agents.push({
			name: "reviewer",
			description: "Code review agent",
			instructions: "# Reviewer\n\nReview code changes.",
			model: "claude-sonnet-4-6",
			readonly: true,
			tools: ["Read", "Glob"],
		});
		return config;
	};

	it("emits .github/agents/<name>.agent.md with frontmatter", () => {
		const result = agentsEmitter.emit(makeConfig(), "copilot");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".github/agents/reviewer.agent.md");
		expect(result.files[0].content).toContain("name: reviewer");
		expect(result.files[0].content).toContain("description: Code review agent");
		expect(result.files[0].content).toContain("# Reviewer");
	});

	it("emits model in frontmatter without warning", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "smart",
			description: "Smart agent",
			instructions: "Be smart.",
			model: "gpt-4o",
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("model: gpt-4o");
		expect(result.warnings.some((w) => w.includes("model"))).toBe(false);
	});

	it("maps tool names to Copilot aliases", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "helper",
			description: "Helper agent",
			instructions: "Help.",
			tools: ["Read", "Write", "Bash", "WebSearch"],
		});

		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("tools: [read, edit, execute, web]");
	});

	it("sets readonly agents to read and search tools", () => {
		const result = agentsEmitter.emit(makeConfig(), "copilot");
		expect(result.files[0].content).toContain("tools: [read, search]");
	});

	it("emits disable-model-invocation when true", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "passive",
			description: "Passive agent",
			instructions: "Wait.",
			disableModelInvocation: true,
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("disable-model-invocation: true");
	});

	it("emits target in frontmatter", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "ide-agent",
			description: "IDE agent",
			instructions: "Work in IDE.",
			target: "vscode",
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("target: vscode");
	});

	it("emits mcp-servers from mcpServers", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "mcp-agent",
			description: "Agent with MCP",
			instructions: "Use tools.",
			mcpServers: {
				github: { command: "npx", args: ["@mcp/github"] },
			},
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("mcp-servers:");
		expect(result.files[0].content).toContain("github:");
	});

	it("emits metadata in frontmatter", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "meta-agent",
			description: "Agent with metadata",
			instructions: "Do things.",
			metadata: { team: "platform", version: "1.0" },
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("metadata:");
		expect(result.files[0].content).toContain("team: platform");
		expect(result.files[0].content).toContain('version: "1.0"');
	});

	it("emits user-invocable in frontmatter when set", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "invocable-agent",
			description: "User-invocable agent",
			instructions: "Invoke me.",
			userInvocable: true,
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("user-invocable: true");
	});

	it("emits user-invocable: false when explicitly disabled", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "private-agent",
			description: "Non-invocable agent",
			instructions: "Stay hidden.",
			userInvocable: false,
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).toContain("user-invocable: false");
	});

	it("omits user-invocable when not set", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "default-agent",
			description: "Default agent",
			instructions: "Do things.",
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.files[0].content).not.toContain("user-invocable");
	});

	it("warns about unsupported fields", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "full",
			description: "Full agent",
			instructions: "Do stuff.",
			disallowedTools: ["Bash"],
			permissionMode: "dontAsk",
			maxTurns: 5,
			skills: ["review"],
			memory: "project",
			isolation: "worktree",
			hooks: { preToolCall: { command: "echo" } },
			modelReasoningEffort: "high",
			background: true,
		});
		const result = agentsEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes('"disallowedTools"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"permissionMode"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"maxTurns"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"skills"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"memory"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"isolation"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"hooks"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"modelReasoningEffort"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes('"background"'))).toBe(true);
	});
});
