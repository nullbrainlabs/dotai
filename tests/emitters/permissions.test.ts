import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { permissionsEmitter } from "../../src/emitters/permissions.js";

describe("permissionsEmitter", () => {
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

	describe("Claude", () => {
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
	});

	describe("Cursor", () => {
		it("emits .cursor/cli.json", () => {
			const result = permissionsEmitter.emit(makeConfig(), "cursor");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".cursor/cli.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.permissions.allow).toContain("Bash(npm *)");
		});
	});

	describe("Codex", () => {
		it("emits .codex/config.toml with lossy permissions", () => {
			const result = permissionsEmitter.emit(makeConfig(), "codex");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".codex/config.toml");
			expect(result.files[0].content).toContain("approval_policy");
			expect(result.warnings.length).toBeGreaterThan(0);
		});
	});

	describe("Copilot", () => {
		it("returns empty files with permission warning", () => {
			const result = permissionsEmitter.emit(makeConfig(), "copilot");
			expect(result.files).toHaveLength(0);
			expect(result.warnings.some((w) => w.includes("permission"))).toBe(true);
		});

		it("returns empty files with settings warning", () => {
			const result = permissionsEmitter.emit(makeConfig(), "copilot");
			expect(result.warnings.some((w) => w.includes("settings"))).toBe(true);
		});
	});

	it("returns empty for no permissions or settings", () => {
		const config = emptyConfig();
		const result = permissionsEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
