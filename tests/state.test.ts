import { existsSync, mkdirSync, rmSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { contentHash, diffFiles, loadState, saveState } from "../src/state.js";

const TMP_DIR = join(import.meta.dirname, "fixtures/tmp-state");

describe("contentHash", () => {
	it("returns a 16-char hex string", () => {
		const hash = contentHash("hello world");
		expect(hash).toHaveLength(16);
		expect(hash).toMatch(/^[0-9a-f]+$/);
	});

	it("returns same hash for same content", () => {
		expect(contentHash("test")).toBe(contentHash("test"));
	});

	it("returns different hash for different content", () => {
		expect(contentHash("a")).not.toBe(contentHash("b"));
	});
});

describe("state persistence", () => {
	beforeEach(() => {
		mkdirSync(join(TMP_DIR, ".ai"), { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("returns null when no state file exists", async () => {
		const state = await loadState(TMP_DIR);
		expect(state).toBeNull();
	});

	it("saves and loads state", async () => {
		const files = [
			{ path: "CLAUDE.md", content: "# Hello\n" },
			{ path: ".mcp.json", content: '{ "mcpServers": {} }\n' },
		];

		await saveState(TMP_DIR, files);

		const state = await loadState(TMP_DIR);
		expect(state).not.toBeNull();
		expect(state?.lastSync).toBeDefined();
		expect(state?.files["CLAUDE.md"]).toBe(contentHash("# Hello\n"));
		expect(state?.files[".mcp.json"]).toBe(contentHash('{ "mcpServers": {} }\n'));
	});
});

describe("diffFiles", () => {
	beforeEach(() => {
		mkdirSync(join(TMP_DIR, ".ai"), { recursive: true });
	});

	afterEach(() => {
		if (existsSync(TMP_DIR)) {
			rmSync(TMP_DIR, { recursive: true });
		}
	});

	it("marks missing files as new", async () => {
		const generated = [{ path: "CLAUDE.md", content: "# Hello\n" }];
		const entries = await diffFiles(TMP_DIR, generated, null);
		expect(entries).toHaveLength(1);
		expect(entries[0].status).toBe("new");
	});

	it("marks matching files as up-to-date", async () => {
		const content = "# Hello\n";
		await writeFile(join(TMP_DIR, "CLAUDE.md"), content, "utf-8");

		const generated = [{ path: "CLAUDE.md", content }];
		const entries = await diffFiles(TMP_DIR, generated, null);
		expect(entries).toHaveLength(1);
		expect(entries[0].status).toBe("up-to-date");
	});

	it("marks config-changed files as modified when disk matches last sync", async () => {
		const oldContent = "# Old\n";
		const newContent = "# New\n";
		await writeFile(join(TMP_DIR, "CLAUDE.md"), oldContent, "utf-8");

		const state = {
			lastSync: new Date().toISOString(),
			files: { "CLAUDE.md": contentHash(oldContent) },
		};

		const generated = [{ path: "CLAUDE.md", content: newContent }];
		const entries = await diffFiles(TMP_DIR, generated, state);
		expect(entries).toHaveLength(1);
		expect(entries[0].status).toBe("modified");
	});

	it("marks manually-edited files as conflict", async () => {
		const syncedContent = "# Synced\n";
		const editedContent = "# Manually edited\n";
		const newGenerated = "# New generated\n";
		await writeFile(join(TMP_DIR, "CLAUDE.md"), editedContent, "utf-8");

		const state = {
			lastSync: new Date().toISOString(),
			files: { "CLAUDE.md": contentHash(syncedContent) },
		};

		const generated = [{ path: "CLAUDE.md", content: newGenerated }];
		const entries = await diffFiles(TMP_DIR, generated, state);
		expect(entries).toHaveLength(1);
		expect(entries[0].status).toBe("conflict");
	});

	it("detects orphaned files from previous sync", async () => {
		const state = {
			lastSync: new Date().toISOString(),
			files: {
				"CLAUDE.md": contentHash("# Hello\n"),
				"old-file.md": contentHash("# Old\n"),
			},
		};

		const generated = [{ path: "CLAUDE.md", content: "# Hello\n" }];
		await writeFile(join(TMP_DIR, "CLAUDE.md"), "# Hello\n", "utf-8");

		const entries = await diffFiles(TMP_DIR, generated, state);
		const orphaned = entries.find((e) => e.path === "old-file.md");
		expect(orphaned).toBeDefined();
		expect(orphaned?.status).toBe("orphaned");
	});
});
