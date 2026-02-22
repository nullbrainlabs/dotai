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

	it("scaffolds .ai/ directory with blank template", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { template: "blank", skipImport: true });

		const aiDir = join(TMP_DIR, ".ai");
		expect(existsSync(aiDir)).toBe(true);
		expect(existsSync(join(aiDir, "config.yaml"))).toBe(true);
		expect(existsSync(join(aiDir, "directives"))).toBe(true);
		expect(existsSync(join(aiDir, "skills"))).toBe(true);
		expect(existsSync(join(aiDir, "agents"))).toBe(true);

		const configContent = await readFile(join(aiDir, "config.yaml"), "utf-8");
		expect(configContent).toContain("mcpServers");
		expect(configContent).toContain("permissions");
	});

	it("scaffolds with minimal template", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { template: "minimal", skipImport: true });

		const aiDir = join(TMP_DIR, ".ai");
		expect(existsSync(join(aiDir, "directives", "conventions.md"))).toBe(true);

		const directive = await readFile(join(aiDir, "directives", "conventions.md"), "utf-8");
		expect(directive).toContain("Project Conventions");
	});

	it("scaffolds with web template", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, { template: "web", skipImport: true });

		const aiDir = join(TMP_DIR, ".ai");
		expect(existsSync(join(aiDir, "directives", "typescript-conventions.md"))).toBe(true);
		expect(existsSync(join(aiDir, "directives", "testing.md"))).toBe(true);
		expect(existsSync(join(aiDir, "directives", "security.md"))).toBe(true);

		const configContent = await readFile(join(aiDir, "config.yaml"), "utf-8");
		expect(configContent).toContain("filesystem");
	});

	it("auto-sync writes tool configs", async () => {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(TMP_DIR, { recursive: true });

		await runInit(TMP_DIR, {
			template: "minimal",
			targets: ["claude"],
			autoSync: true,
			skipImport: true,
		});

		expect(existsSync(join(TMP_DIR, "CLAUDE.md"))).toBe(true);
	});
});
