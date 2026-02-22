import { loadMergedConfig } from "../config/loader.js";
import { validateConfig } from "../config/schema.js";
import {
	agentsEmitter,
	directivesEmitter,
	hooksEmitter,
	mcpEmitter,
	permissionsEmitter,
	skillsEmitter,
} from "../emitters/index.js";
import type { EmittedFile, Emitter } from "../emitters/types.js";
import { ALL_TARGETS } from "../emitters/types.js";
import { diffFiles, type FileStatus, loadState } from "../state.js";

const EMITTERS: Emitter[] = [
	skillsEmitter,
	directivesEmitter,
	mcpEmitter,
	agentsEmitter,
	permissionsEmitter,
	hooksEmitter,
];

const STATUS_ICONS: Record<FileStatus, string> = {
	new: "\x1b[32m+\x1b[0m",
	"up-to-date": "\x1b[90m=\x1b[0m",
	modified: "\x1b[33m~\x1b[0m",
	conflict: "\x1b[31m!\x1b[0m",
	orphaned: "\x1b[31m-\x1b[0m",
};

const STATUS_LABELS: Record<FileStatus, string> = {
	new: "new",
	"up-to-date": "up-to-date",
	modified: "modified",
	conflict: "conflict (manually edited)",
	orphaned: "orphaned (no longer generated)",
};

/** Show the status of generated files vs what's on disk. */
export async function runStatus(projectDir: string): Promise<void> {
	// Load config
	const { config, errors: loadErrors } = await loadMergedConfig(projectDir);

	if (loadErrors.length > 0) {
		console.error("\x1b[31mConfig errors:\x1b[0m");
		for (const err of loadErrors) {
			console.error(`  ${err.file}${err.line ? `:${err.line}` : ""}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	const { errors: valErrors } = validateConfig(config);
	if (valErrors.length > 0) {
		console.error("\x1b[31mValidation errors:\x1b[0m");
		for (const err of valErrors) {
			console.error(`  ${err.file}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	// Generate files (in memory only)
	const allFiles: EmittedFile[] = [];
	for (const target of ALL_TARGETS) {
		for (const emitter of EMITTERS) {
			const result = emitter.emit(config, target);
			allFiles.push(...result.files);
		}
	}

	// Merge duplicates
	const mergedFiles = mergeFilesByPath(allFiles);

	// Load previous state
	const state = await loadState(projectDir);

	if (!state) {
		console.log("No previous sync state found. Run \x1b[1mdotai sync\x1b[0m first.\n");
	}

	// Diff
	const entries = await diffFiles(projectDir, mergedFiles, state);

	// Display
	const counts: Record<FileStatus, number> = {
		new: 0,
		"up-to-date": 0,
		modified: 0,
		conflict: 0,
		orphaned: 0,
	};

	console.log("\x1b[1mFile status:\x1b[0m\n");
	for (const entry of entries.sort((a, b) => a.path.localeCompare(b.path))) {
		counts[entry.status]++;
		console.log(
			`  ${STATUS_ICONS[entry.status]} ${entry.path}  \x1b[90m${STATUS_LABELS[entry.status]}\x1b[0m`,
		);
	}

	// Summary
	console.log("");
	const parts: string[] = [];
	if (counts.new > 0) parts.push(`\x1b[32m${counts.new} new\x1b[0m`);
	if (counts.modified > 0) parts.push(`\x1b[33m${counts.modified} modified\x1b[0m`);
	if (counts["up-to-date"] > 0) parts.push(`\x1b[90m${counts["up-to-date"]} up-to-date\x1b[0m`);
	if (counts.conflict > 0) parts.push(`\x1b[31m${counts.conflict} conflicts\x1b[0m`);
	if (counts.orphaned > 0) parts.push(`\x1b[31m${counts.orphaned} orphaned\x1b[0m`);
	console.log(`  ${parts.join(", ")}`);

	if (counts.conflict > 0) {
		console.log("\n  Use \x1b[1mdotai sync --force\x1b[0m to overwrite conflicting files.");
	}
}

/** Simple merge of files by path (last writer wins for non-JSON/TOML). */
function mergeFilesByPath(files: EmittedFile[]): EmittedFile[] {
	const byPath = new Map<string, EmittedFile>();
	for (const file of files) {
		const existing = byPath.get(file.path);
		if (!existing) {
			byPath.set(file.path, file);
		} else if (file.path.endsWith(".json")) {
			const merged = deepMergeJson(existing.content, file.content);
			byPath.set(file.path, { path: file.path, content: merged });
		} else if (file.path.endsWith(".toml")) {
			byPath.set(file.path, {
				path: file.path,
				content: `${existing.content.trim()}\n\n${file.content.trim()}\n`,
			});
		} else if (file.path.endsWith(".md")) {
			byPath.set(file.path, {
				path: file.path,
				content: `${existing.content.trim()}\n\n---\n\n${file.content.trim()}\n`,
			});
		} else {
			byPath.set(file.path, file);
		}
	}
	return [...byPath.values()];
}

function deepMergeJson(a: string, b: string): string {
	const objA = JSON.parse(a);
	const objB = JSON.parse(b);
	const merged = merge(objA, objB);
	return `${JSON.stringify(merged, null, 2)}\n`;
}

function merge(
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...target };
	for (const [key, value] of Object.entries(source)) {
		if (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value) &&
			typeof result[key] === "object" &&
			result[key] !== null &&
			!Array.isArray(result[key])
		) {
			result[key] = merge(result[key] as Record<string, unknown>, value as Record<string, unknown>);
		} else if (Array.isArray(value) && Array.isArray(result[key])) {
			result[key] = [...(result[key] as unknown[]), ...value];
		} else {
			result[key] = value;
		}
	}
	return result;
}
