import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

// ── Types ──────────────────────────────────────────────────────────────────

/** A doc entry in a research config, tracking URL + last-known content hash. */
export interface DocEntry {
	url: string;
	/** SHA-256 hex digest of last-fetched content. Empty string = never fetched. */
	lastHash: string;
	/** ISO date string of last fetch. Empty string = never fetched. */
	lastFetched: string;
}

/** Machine-readable metadata that tells agents where to look and what to watch. */
export interface ResearchConfig {
	tool: string;
	lastResearchedVersion: string;
	spec: string;
	llmsTxt: string;
	docs: DocEntry[];
	emitters: string[];
	outputPaths: Record<string, string | null>;
	notes: string[];
}

/** A single detected change in the drift report. */
export interface DriftChange {
	section: string;
	type: "structural" | "behavioral" | "format";
	description: string;
	docUrl: string;
	specLines: string;
	emittersAffected: string[];
}

/** Structured drift report produced by detection/analysis phases. */
export interface DriftReport {
	tool: string;
	detectedAt: string;
	changes: DriftChange[];
	status: "pending" | "resolved" | "no-drift";
}

// ── Hash utility ───────────────────────────────────────────────────────────

/** Compute the full SHA-256 hex digest of a string. */
export function docHash(content: string): string {
	return createHash("sha256").update(content).digest("hex");
}

// ── I/O helpers ────────────────────────────────────────────────────────────

/** Read and parse a research config JSON file. */
export async function loadResearchConfig(path: string): Promise<ResearchConfig> {
	const raw = await readFile(path, "utf-8");
	return JSON.parse(raw) as ResearchConfig;
}

/** Write a research config back to disk. */
export async function saveResearchConfig(path: string, config: ResearchConfig): Promise<void> {
	await writeFile(path, `${JSON.stringify(config, null, "\t")}\n`, "utf-8");
}

/** Read and parse a drift report JSON file. Returns null if not found. */
export async function loadDriftReport(path: string): Promise<DriftReport | null> {
	try {
		const raw = await readFile(path, "utf-8");
		return JSON.parse(raw) as DriftReport;
	} catch {
		return null;
	}
}

/** Write a drift report to disk. */
export async function saveDriftReport(path: string, report: DriftReport): Promise<void> {
	await writeFile(path, `${JSON.stringify(report, null, "\t")}\n`, "utf-8");
}

/**
 * Derive the cache filename from a doc URL.
 * e.g. "https://code.claude.com/docs/en/hooks.md" → "hooks.md"
 */
export function cacheFilename(url: string): string {
	const parsed = new URL(url);
	return basename(parsed.pathname) || "index";
}

/** Read cached doc content. Returns null if not cached. */
export async function readCachedDoc(cacheDir: string, url: string): Promise<string | null> {
	try {
		return await readFile(join(cacheDir, cacheFilename(url)), "utf-8");
	} catch {
		return null;
	}
}

/** Write doc content to the cache directory, creating it if needed. */
export async function writeCachedDoc(
	cacheDir: string,
	url: string,
	content: string,
): Promise<void> {
	await mkdir(cacheDir, { recursive: true });
	await writeFile(join(cacheDir, cacheFilename(url)), content, "utf-8");
}
