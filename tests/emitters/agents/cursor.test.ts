import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { agentsEmitter } from "../../../src/emitters/agents/index.js";

describe("agentsEmitter — cursor", () => {
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

	it("emits .cursor/agents/<name>.md with frontmatter", () => {
		const result = agentsEmitter.emit(makeConfig(), "cursor");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".cursor/agents/reviewer.md");
		expect(result.files[0].content).toContain("name: reviewer");
		expect(result.files[0].content).toContain("description: Code review agent");
		expect(result.files[0].content).toContain("model: claude-sonnet-4-6");
		expect(result.files[0].content).toContain("readonly: true");
		expect(result.files[0].content).not.toContain("tools:");
	});

	it("always emits frontmatter with at least name", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "minimal",
			description: "",
			instructions: "Do things.",
		});
		const result = agentsEmitter.emit(config, "cursor");
		expect(result.files[0].content).toContain("---\nname: minimal\n---");
	});

	it("maps background to is_background", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "bg",
			description: "Background agent",
			instructions: "Run in background.",
			background: true,
		});
		const result = agentsEmitter.emit(config, "cursor");
		expect(result.files[0].content).toContain("is_background: true");
		expect(result.files[0].content).not.toMatch(/^background:/m);
	});

	it("warns about unsupported fields", () => {
		const result = agentsEmitter.emit(makeConfig(), "cursor");
		expect(result.warnings.some((w) => w.includes('"tools"'))).toBe(true);
		expect(result.warnings.some((w) => w.includes("Cursor"))).toBe(true);
	});
});
