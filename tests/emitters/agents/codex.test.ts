import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { agentsEmitter } from "../../../src/emitters/agents/index.js";

describe("agentsEmitter — codex", () => {
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

	it("emits config.toml with agent role entries", () => {
		const result = agentsEmitter.emit(makeConfig(), "codex");
		const configFile = result.files.find((f) => f.path === ".codex/config.toml");
		expect(configFile).toBeDefined();
		expect(configFile?.content).toContain("[agents.reviewer]");
		expect(configFile?.content).toContain('description = "Code review agent"');
		expect(configFile?.content).toContain('config_file = "agents/reviewer.toml"');
	});

	it("emits per-agent toml config files", () => {
		const result = agentsEmitter.emit(makeConfig(), "codex");
		const agentFile = result.files.find((f) => f.path === ".codex/agents/reviewer.toml");
		expect(agentFile).toBeDefined();
		expect(agentFile?.content).toContain('model = "claude-sonnet-4-6"');
		expect(agentFile?.content).toContain('sandbox_mode = "read-only"');
		expect(agentFile?.content).toContain("developer_instructions =");
		expect(agentFile?.content).toContain("Review code changes.");
	});

	it("emits modelReasoningEffort when present", () => {
		const config = emptyConfig();
		config.agents.push({
			name: "thinker",
			description: "Deep thinker",
			instructions: "Think hard.",
			model: "gpt-5.3-codex",
			modelReasoningEffort: "high",
		});
		const result = agentsEmitter.emit(config, "codex");
		const agentFile = result.files.find((f) => f.path === ".codex/agents/thinker.toml");
		expect(agentFile).toBeDefined();
		expect(agentFile?.content).toContain('model_reasoning_effort = "high"');
	});

	it("warns about unsupported fields", () => {
		const result = agentsEmitter.emit(makeConfig(), "codex");
		expect(result.warnings.some((w) => w.includes('"tools"'))).toBe(true);
	});
});
