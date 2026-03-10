import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
	cacheFilename,
	docHash,
	loadDriftReport,
	loadResearchConfig,
	readCachedDoc,
	saveDriftReport,
	saveResearchConfig,
	writeCachedDoc,
} from "../src/spec-drift.js";
import type { DriftReport, ResearchConfig } from "../src/spec-drift.js";
import {
	fixtureDriftReport,
	fixtureResearchConfig,
} from "./fixtures.js";

describe("spec-drift", () => {
	describe("docHash", () => {
		it("returns a 64-char hex SHA-256 digest", () => {
			const hash = docHash("hello world");
			expect(hash).toMatch(/^[a-f0-9]{64}$/);
		});

		it("returns consistent results for same input", () => {
			expect(docHash("test content")).toBe(docHash("test content"));
		});

		it("returns different results for different input", () => {
			expect(docHash("content A")).not.toBe(docHash("content B"));
		});
	});

	describe("cacheFilename", () => {
		it("extracts filename from URL with extension", () => {
			expect(cacheFilename("https://code.claude.com/docs/en/hooks.md")).toBe("hooks.md");
		});

		it("extracts filename from URL without extension", () => {
			expect(cacheFilename("https://cursor.com/docs/rules")).toBe("rules");
		});

		it("returns 'index' for root URL", () => {
			expect(cacheFilename("https://example.com/")).toBe("index");
		});

		it("handles URL with query params", () => {
			expect(cacheFilename("https://example.com/docs/page.md?v=2")).toBe("page.md");
		});
	});

	describe("I/O helpers", () => {
		let tmp: string;

		beforeEach(async () => {
			tmp = join(tmpdir(), `spec-drift-test-${Date.now()}`);
			await mkdir(tmp, { recursive: true });
		});

		afterEach(async () => {
			await rm(tmp, { recursive: true, force: true });
		});

		describe("research config", () => {
			it("round-trips a research config", async () => {
				const config = fixtureResearchConfig();
				const path = join(tmp, "test.research.json");
				await saveResearchConfig(path, config);
				const loaded = await loadResearchConfig(path);
				expect(loaded).toEqual(config);
			});

			it("writes with tabs", async () => {
				const config = fixtureResearchConfig();
				const path = join(tmp, "test.research.json");
				await saveResearchConfig(path, config);
				const raw = await readFile(path, "utf-8");
				expect(raw).toContain("\t");
				expect(raw.endsWith("\n")).toBe(true);
			});
		});

		describe("drift report", () => {
			it("round-trips a drift report", async () => {
				const report = fixtureDriftReport();
				const path = join(tmp, "test.drift-report.json");
				await saveDriftReport(path, report);
				const loaded = await loadDriftReport(path);
				expect(loaded).toEqual(report);
			});

			it("returns null for missing file", async () => {
				const loaded = await loadDriftReport(join(tmp, "nonexistent.json"));
				expect(loaded).toBeNull();
			});

			it("writes with tabs", async () => {
				const report = fixtureDriftReport();
				const path = join(tmp, "test.drift-report.json");
				await saveDriftReport(path, report);
				const raw = await readFile(path, "utf-8");
				expect(raw).toContain("\t");
				expect(raw.endsWith("\n")).toBe(true);
			});
		});

		describe("doc cache", () => {
			it("writes and reads cached doc", async () => {
				const cacheDir = join(tmp, "cache", "claude-code");
				const url = "https://code.claude.com/docs/en/hooks.md";
				const content = "# Hooks\n\nHook documentation here.";

				await writeCachedDoc(cacheDir, url, content);
				const cached = await readCachedDoc(cacheDir, url);
				expect(cached).toBe(content);
			});

			it("creates cache directory if missing", async () => {
				const cacheDir = join(tmp, "deep", "nested", "cache");
				const url = "https://example.com/docs/page.md";

				await writeCachedDoc(cacheDir, url, "content");
				const cached = await readCachedDoc(cacheDir, url);
				expect(cached).toBe("content");
			});

			it("returns null for uncached doc", async () => {
				const cached = await readCachedDoc(tmp, "https://example.com/missing.md");
				expect(cached).toBeNull();
			});
		});
	});
});
