import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { agentsEmitter } from "../../src/emitters/agents.js";

describe("agentsEmitter", () => {
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

	describe("Claude", () => {
		it("emits .claude/agents/<name>.md with frontmatter", () => {
			const result = agentsEmitter.emit(makeConfig(), "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".claude/agents/reviewer.md");
			expect(result.files[0].content).toContain("---");
			expect(result.files[0].content).toContain("name: reviewer");
			expect(result.files[0].content).toContain("description: Code review agent");
			expect(result.files[0].content).toContain("tools: Read, Glob");
			expect(result.files[0].content).toContain("# Reviewer");
		});

		it("normalizes model aliases", () => {
			const result = agentsEmitter.emit(makeConfig(), "claude");
			expect(result.files[0].content).toContain("model: sonnet");
			expect(result.files[0].content).not.toContain("claude-sonnet-4-6");
		});

		it("warns on unknown model", () => {
			const config = emptyConfig();
			config.agents.push({
				name: "custom",
				description: "Custom agent",
				instructions: "Do stuff.",
				model: "gpt-4o",
			});
			const result = agentsEmitter.emit(config, "claude");
			expect(result.warnings).toHaveLength(1);
			expect(result.warnings[0]).toContain('Unknown model "gpt-4o"');
			expect(result.files[0].content).toContain("model: gpt-4o");
		});

		it("translates readonly to disallowedTools", () => {
			const result = agentsEmitter.emit(makeConfig(), "claude");
			expect(result.files[0].content).toContain("disallowedTools: Write, Edit, NotebookEdit");
		});

		it("uses explicit disallowedTools over readonly translation", () => {
			const config = emptyConfig();
			config.agents.push({
				name: "limited",
				description: "Limited agent",
				instructions: "Limited.",
				readonly: true,
				disallowedTools: ["Bash"],
			});
			const result = agentsEmitter.emit(config, "claude");
			expect(result.files[0].content).toContain("disallowedTools: Bash");
			expect(result.files[0].content).not.toContain("Write, Edit");
		});

		it("emits all optional fields when present", () => {
			const config = emptyConfig();
			config.agents.push({
				name: "full",
				description: "Full agent",
				instructions: "Instructions.",
				permissionMode: "acceptEdits",
				maxTurns: 10,
				skills: ["review", "test"],
				memory: "project",
				background: true,
				isolation: "worktree",
			});
			const result = agentsEmitter.emit(config, "claude");
			const content = result.files[0].content;
			expect(content).toContain("permissionMode: acceptEdits");
			expect(content).toContain("maxTurns: 10");
			expect(content).toContain("skills: review, test");
			expect(content).toContain("memory: project");
			expect(content).toContain("background: true");
			expect(content).toContain("isolation: worktree");
		});

		it("serializes hooks and mcpServers into frontmatter", () => {
			const config = emptyConfig();
			config.agents.push({
				name: "hooked",
				description: "Agent with hooks",
				instructions: "Do things.",
				hooks: {
					preToolCall: { command: "echo hello" },
				},
				mcpServers: {
					github: { command: "npx", args: ["@mcp/github"] },
				},
			});
			const result = agentsEmitter.emit(config, "claude");
			const content = result.files[0].content;
			expect(content).toContain("hooks:");
			expect(content).toContain("preToolCall:");
			expect(content).toContain("mcpServers:");
			expect(content).toContain("github:");
		});
	});

	describe("Cursor", () => {
		it("emits .cursor/agents/<name>.md with frontmatter", () => {
			const result = agentsEmitter.emit(makeConfig(), "cursor");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".cursor/agents/reviewer.md");
			expect(result.files[0].content).toContain("model: claude-sonnet-4-6");
			expect(result.files[0].content).toContain("readonly: true");
			expect(result.files[0].content).toContain("tools: [Read, Glob]");
		});
	});

	describe("Codex", () => {
		it("emits agent sections in AGENTS.md", () => {
			const result = agentsEmitter.emit(makeConfig(), "codex");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe("AGENTS.md");
			expect(result.files[0].content).toContain("## Agent: reviewer");
			expect(result.files[0].content).toContain("Review code changes.");
		});

		it("warns about tool restrictions", () => {
			const result = agentsEmitter.emit(makeConfig(), "codex");
			expect(result.warnings.length).toBeGreaterThan(0);
			expect(result.warnings[0]).toContain("tool restrictions");
		});
	});

	describe("Copilot", () => {
		it("emits .github/agents/<name>.agent.md with frontmatter", () => {
			const result = agentsEmitter.emit(makeConfig(), "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".github/agents/reviewer.agent.md");
			expect(result.files[0].content).toContain("description: Code review agent");
			expect(result.files[0].content).toContain("# Reviewer");
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

		it("warns about model override", () => {
			const result = agentsEmitter.emit(makeConfig(), "copilot");
			expect(result.warnings.some((w) => w.includes("model"))).toBe(true);
		});
	});

	it("returns empty for no agents", () => {
		const config = emptyConfig();
		const result = agentsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
