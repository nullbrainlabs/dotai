import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { hooksEmitter } from "../../../src/emitters/hooks/index.js";

describe("hooksEmitter — codex", () => {
	it("emits protected_paths in config.toml", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preFileEdit",
			handler: "eslint --fix",
			scope: "project",
		});
		config.ignorePatterns.push(
			{ pattern: "node_modules/**", scope: "project" },
			{ pattern: "dist/**", scope: "project" },
		);

		const result = hooksEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".codex/config.toml");
		expect(result.files[0].content).toContain("protected_paths");
		expect(result.files[0].content).toContain("node_modules/**");
	});

	it("warns that hooks are not supported", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preFileEdit",
			handler: "eslint --fix",
			scope: "project",
		});
		config.ignorePatterns.push({ pattern: "node_modules/**", scope: "project" });

		const result = hooksEmitter.emit(config, "codex");
		expect(result.warnings).toContain(
			"Codex does not support hooks — hook configuration is skipped.",
		);
	});
});
