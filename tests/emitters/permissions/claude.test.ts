import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { permissionsEmitter } from "../../../src/emitters/permissions/index.js";

const makeConfig = () => {
	const config = emptyConfig();
	config.permissions.push(
		{ tool: "Bash", pattern: "npm *", decision: "allow", scope: "project" },
		{ tool: "Read", decision: "allow", scope: "project" },
		{ tool: "Write", pattern: "dist/**", decision: "deny", scope: "project" },
	);
	config.settings.push({ key: "model", value: "claude-sonnet-4-6", scope: "project" });
	return config;
};

describe("permissionsEmitter — claude", () => {
	it("emits .claude/settings.json with permissions", () => {
		const result = permissionsEmitter.emit(makeConfig(), "claude");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".claude/settings.json");

		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.allow).toContain("Bash(npm *)");
		expect(parsed.permissions.allow).toContain("Read");
		expect(parsed.permissions.deny).toContain("Write(dist/**)");
		expect(parsed.model).toBe("claude-sonnet-4-6");
	});

	it("includes $schema in settings.json", () => {
		const result = permissionsEmitter.emit(makeConfig(), "claude");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.$schema).toBe("https://json.schemastore.org/claude-code-settings.json");
	});

	it("emits ask permissions into permissions.ask", () => {
		const config = emptyConfig();
		config.permissions.push(
			{ tool: "Bash", pattern: "docker *", decision: "ask", scope: "project" },
			{ tool: "Write", decision: "allow", scope: "project" },
		);
		const result = permissionsEmitter.emit(config, "claude");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.ask).toContain("Bash(docker *)");
		expect(parsed.permissions.allow).toContain("Write");
		expect(result.warnings).toHaveLength(0);
	});

	it("supports defaultMode from settings", () => {
		const config = emptyConfig();
		config.permissions.push({ tool: "Bash", decision: "allow", scope: "project" });
		config.settings.push({ key: "permissions.defaultMode", value: "acceptEdits", scope: "project" });
		const result = permissionsEmitter.emit(config, "claude");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.defaultMode).toBe("acceptEdits");
		expect(parsed.permissions.allow).toContain("Bash");
		expect(parsed["permissions.defaultMode"]).toBeUndefined();
	});

	it("supports additionalDirectories from settings", () => {
		const config = emptyConfig();
		config.settings.push({
			key: "permissions.additionalDirectories",
			value: ["/shared/libs"],
			scope: "project",
		});
		const result = permissionsEmitter.emit(config, "claude");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.additionalDirectories).toEqual(["/shared/libs"]);
		expect(parsed["permissions.additionalDirectories"]).toBeUndefined();
	});

	it("merges permission extensions with allow/deny rules", () => {
		const config = emptyConfig();
		config.permissions.push({ tool: "Read", decision: "allow", scope: "project" });
		config.settings.push({ key: "permissions.defaultMode", value: "dontAsk", scope: "project" });
		config.settings.push({
			key: "permissions.additionalDirectories",
			value: ["/extra"],
			scope: "project",
		});
		const result = permissionsEmitter.emit(config, "claude");
		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.permissions.allow).toContain("Read");
		expect(parsed.permissions.defaultMode).toBe("dontAsk");
		expect(parsed.permissions.additionalDirectories).toEqual(["/extra"]);
	});

	it("returns empty for no permissions or settings", () => {
		const config = emptyConfig();
		const result = permissionsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
