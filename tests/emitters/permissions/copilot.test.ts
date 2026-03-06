import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { permissionsEmitter } from "../../../src/emitters/permissions/index.js";

describe("permissionsEmitter — copilot", () => {
	it("returns empty files with permission warning", () => {
		const config = emptyConfig();
		config.permissions.push({
			tool: "Bash",
			pattern: "npm *",
			decision: "allow",
			scope: "project",
		});
		config.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });

		const result = permissionsEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(0);
		expect(result.warnings.some((w) => w.includes("permission"))).toBe(true);
	});

	it("returns empty files with settings warning", () => {
		const config = emptyConfig();
		config.permissions.push({
			tool: "Bash",
			pattern: "npm *",
			decision: "allow",
			scope: "project",
		});
		config.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });

		const result = permissionsEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes("settings"))).toBe(true);
	});
});
