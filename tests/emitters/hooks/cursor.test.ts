import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { hooksEmitter } from "../../../src/emitters/hooks/index.js";

describe("hooksEmitter — cursor", () => {
	it("emits .cursorignore for ignore patterns", () => {
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

		const result = hooksEmitter.emit(config, "cursor");
		const ignoreFile = result.files.find((f) => f.path === ".cursorignore");
		expect(ignoreFile).toBeDefined();
		expect(ignoreFile?.content).toContain("node_modules/**");
		expect(ignoreFile?.content).toContain("dist/**");
	});

	it("warns about limited hook support", () => {
		const config = emptyConfig();
		config.hooks.push({
			event: "preFileEdit",
			handler: "eslint --fix",
			scope: "project",
		});
		config.ignorePatterns.push({ pattern: "node_modules/**", scope: "project" });

		const result = hooksEmitter.emit(config, "cursor");
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});
