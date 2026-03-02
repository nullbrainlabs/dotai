import { existsSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runInit } from "../../src/commands/init.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-init");

describe("runInit", () => {
	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("scaffolds .ai/ directory", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { skipImport: true });

		const aiDir = join(TMP_DIR, ".ai");
		expect(existsSync(aiDir)).toBe(true);
		expect(existsSync(join(aiDir, "config.yaml"))).toBe(true);
		expect(existsSync(join(aiDir, "rules"))).toBe(true);
		expect(existsSync(join(aiDir, "skills"))).toBe(true);
		expect(existsSync(join(aiDir, "agents"))).toBe(true);

		const configContent = await readFile(join(aiDir, "config.yaml"), "utf-8");
		expect(configContent).toContain("mcpServers");
		expect(configContent).toContain("permissions");
	});

	it("scaffolds with conventions rule", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { skipImport: true });

		const aiDir = join(TMP_DIR, ".ai");
		expect(existsSync(join(aiDir, "rules", "conventions.md"))).toBe(true);

		const rule = await readFile(join(aiDir, "rules", "conventions.md"), "utf-8");
		expect(rule).toContain("Project Conventions");
	});

	it("auto-sync writes tool configs", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, {
			targets: ["claude"],
			autoSync: true,
			skipImport: true,
		});

		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(true);
	});

	it("creates helper skill directories with includeHelpers", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { skipImport: true, includeHelpers: true });

		const skillsDir = join(TMP_DIR, ".ai", "skills");
		expect(existsSync(join(skillsDir, "add-skill", "SKILL.md"))).toBe(true);
		expect(existsSync(join(skillsDir, "add-rule", "SKILL.md"))).toBe(true);
		expect(existsSync(join(skillsDir, "add-agent", "SKILL.md"))).toBe(true);
		expect(existsSync(join(skillsDir, "add-mcp", "SKILL.md"))).toBe(true);

		const content = await readFile(join(skillsDir, "add-skill", "SKILL.md"), "utf-8");
		expect(content).toContain("Skill Creator");
		expect(content).toContain("disableAutoInvocation");
	});

	it("does not create helper skills by default", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { skipImport: true });

		const skillsDir = join(TMP_DIR, ".ai", "skills");
		expect(existsSync(join(skillsDir, "add-skill"))).toBe(false);
		expect(existsSync(join(skillsDir, "add-rule"))).toBe(false);
		expect(existsSync(join(skillsDir, "add-agent"))).toBe(false);
		expect(existsSync(join(skillsDir, "add-mcp"))).toBe(false);
	});
});
