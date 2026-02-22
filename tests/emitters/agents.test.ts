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
		it("emits .claude/agents/<name>.md", () => {
			const result = agentsEmitter.emit(makeConfig(), "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".claude/agents/reviewer.md");
			expect(result.files[0].content).toContain("# Reviewer");
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

	describe("Antigravity", () => {
		it("returns empty files with warning", () => {
			const result = agentsEmitter.emit(makeConfig(), "antigravity");
			expect(result.files).toHaveLength(0);
			expect(result.warnings.some((w) => w.includes("agent"))).toBe(true);
		});

		it("returns no warnings for empty agents", () => {
			const config = emptyConfig();
			const result = agentsEmitter.emit(config, "antigravity");
			expect(result.files).toHaveLength(0);
			expect(result.warnings).toHaveLength(0);
		});
	});

	it("returns empty for no agents", () => {
		const config = emptyConfig();
		const result = agentsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
