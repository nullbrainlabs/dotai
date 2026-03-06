import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { agentsEmitter } from "../../../src/emitters/agents/index.js";

describe("agentsEmitter — claude", () => {
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

	it("emits modelReasoningEffort in frontmatter", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "thinker",
			description: "Deep thinker",
			instructions: "Think carefully.",
			model: "claude-sonnet-4-6",
			modelReasoningEffort: "high",
		});
		const result = agentsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("modelReasoningEffort: high");
	});

	it("passes through inherit model without warning", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "sub",
			description: "Subagent",
			instructions: "Do stuff.",
			model: "inherit",
		});
		const result = agentsEmitter.emit(config, "claude");
		expect(result.files[0].content).toContain("model: inherit");
		expect(result.warnings).toHaveLength(0);
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

	it("returns empty for no agents", () => {
		const config = emptyConfig();
		const result = agentsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
