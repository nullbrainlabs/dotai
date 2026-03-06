import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { permissionsEmitter } from "../../../src/emitters/permissions/index.js";

describe("permissionsEmitter — cursor", () => {
	it("emits .cursor/cli.json", () => {
		const config = emptyConfig();
		config.permissions.push(
			{ tool: "Bash", pattern: "npm *", decision: "allow", scope: "project" },
			{ tool: "Read", decision: "allow", scope: "project" },
			{ tool: "Write", pattern: "dist/**", decision: "deny", scope: "project" },
		);
		config.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });

		const result = permissionsEmitter.emit(config, "cursor");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".cursor/cli.json");

		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.allow).toContain("Bash(npm *)");
	});
});
