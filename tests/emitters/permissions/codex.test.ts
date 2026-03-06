import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { permissionsEmitter } from "../../../src/emitters/permissions/index.js";

describe("permissionsEmitter — codex", () => {
	it("emits .codex/config.toml with lossy permissions", () => {
		const config = emptyConfig();
		config.permissions.push(
			{ tool: "Bash", pattern: "npm *", decision: "allow", scope: "project" },
			{ tool: "Write", pattern: "dist/**", decision: "deny", scope: "project" },
		);
		config.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });

		const result = permissionsEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".codex/config.toml");
		expect(result.files[0].content).toContain("approval_policy");
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});
