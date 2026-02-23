import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scanForConfigs } from "../../src/import/scanner.js";

const TMP_DIR = join(import.meta.dirname, "../fixtures/tmp-scanner");

describe("scanForConfigs", () => {
	beforeEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
		mkdirSync(TMP_DIR, { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) rmSync(TMP_DIR, { recursive: true });
	});

	it("returns empty array for project with no config files", async () => {
		const result = await scanForConfigs(TMP_DIR);
		expect(result).toEqual([]);
	});

	it("detects CLAUDE.md as claude/directives", async () => {
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# Rules\n\nDo things.");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === "CLAUDE.md");
		expect(found).toBeDefined();
		expect(found?.source).toBe("claude");
		expect(found?.kind).toBe("directives");
	});

	it("detects .mcp.json as claude/mcp", async () => {
		writeFileSync(join(TMP_DIR, ".mcp.json"), "{}");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".mcp.json");
		expect(found).toBeDefined();
		expect(found?.source).toBe("claude");
		expect(found?.kind).toBe("mcp");
	});

	it("detects .claude/settings.json as claude/settings", async () => {
		mkdirSync(join(TMP_DIR, ".claude"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".claude", "settings.json"), "{}");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".claude/settings.json");
		expect(found).toBeDefined();
		expect(found?.source).toBe("claude");
		expect(found?.kind).toBe("settings");
	});

	it("detects .claude/rules/*.md as claude/directives", async () => {
		mkdirSync(join(TMP_DIR, ".claude", "rules"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".claude", "rules", "style.md"), "# Style\n\nUse tabs.");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".claude/rules/style.md");
		expect(found).toBeDefined();
		expect(found?.source).toBe("claude");
		expect(found?.kind).toBe("directives");
	});

	it("detects .claude/agents/*.md as claude/agents", async () => {
		mkdirSync(join(TMP_DIR, ".claude", "agents"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".claude", "agents", "reviewer.md"), "# Reviewer\n\nReview code.");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".claude/agents/reviewer.md");
		expect(found).toBeDefined();
		expect(found?.source).toBe("claude");
		expect(found?.kind).toBe("agents");
	});

	it("detects .cursor/rules/*.mdc as cursor/directives", async () => {
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "testing.mdc"),
			"---\nalwaysApply: true\n---\nTest rules.",
		);
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".cursor/rules/testing.mdc");
		expect(found).toBeDefined();
		expect(found?.source).toBe("cursor");
		expect(found?.kind).toBe("directives");
	});

	it("detects .cursor/mcp.json as cursor/mcp", async () => {
		mkdirSync(join(TMP_DIR, ".cursor"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".cursor", "mcp.json"), "{}");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".cursor/mcp.json");
		expect(found).toBeDefined();
		expect(found?.source).toBe("cursor");
		expect(found?.kind).toBe("mcp");
	});

	it("detects .codex/config.toml as codex/settings", async () => {
		mkdirSync(join(TMP_DIR, ".codex"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".codex", "config.toml"), 'approval_policy = "full"');
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === ".codex/config.toml");
		expect(found).toBeDefined();
		expect(found?.source).toBe("codex");
		expect(found?.kind).toBe("settings");
	});

	it("detects AGENTS.md as codex/directives", async () => {
		writeFileSync(join(TMP_DIR, "AGENTS.md"), "# Agents\n\nInstructions.");
		const result = await scanForConfigs(TMP_DIR);
		const found = result.find((f) => f.relativePath === "AGENTS.md");
		expect(found).toBeDefined();
		expect(found?.source).toBe("codex");
		expect(found?.kind).toBe("directives");
	});

	it("detects multiple sources at once", async () => {
		writeFileSync(join(TMP_DIR, "CLAUDE.md"), "# Rules");
		mkdirSync(join(TMP_DIR, ".cursor", "rules"), { recursive: true });
		writeFileSync(
			join(TMP_DIR, ".cursor", "rules", "style.mdc"),
			"---\nalwaysApply: true\n---\nStyle.",
		);
		mkdirSync(join(TMP_DIR, ".codex"), { recursive: true });
		writeFileSync(join(TMP_DIR, ".codex", "config.toml"), 'approval_policy = "full"');

		const result = await scanForConfigs(TMP_DIR);
		const sources = new Set(result.map((f) => f.source));
		expect(sources.has("claude")).toBe(true);
		expect(sources.has("cursor")).toBe(true);
		expect(sources.has("codex")).toBe(true);
		expect(result.length).toBeGreaterThanOrEqual(3);
	});
});
