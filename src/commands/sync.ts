import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { loadMergedConfig, loadProjectConfig } from "../config/loader.js";
import type { ConfigScope, ProjectConfig } from "../config/schema.js";
import { validateConfig } from "../config/schema.js";
import {
	agentsEmitter,
	directivesEmitter,
	hooksEmitter,
	mcpEmitter,
	permissionsEmitter,
	skillsEmitter,
} from "../emitters/index.js";
import { mergeFiles } from "../emitters/merge.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "../emitters/types.js";
import { ALL_TARGETS } from "../emitters/types.js";
import type { FileStatusEntry } from "../state.js";
import { diffFiles, loadState, saveState } from "../state.js";
import { cancelGuard, confirm, isTTY } from "../tui.js";

export interface SyncOptions {
	targets: TargetTool[];
	dryRun: boolean;
	scope: ConfigScope;
	force: boolean;
	yes?: boolean;
}

/** Map of target tool to user-level output directories. */
const USER_OUTPUT_DIRS: Record<TargetTool, string> = {
	claude: join(homedir(), ".claude"),
	cursor: join(homedir(), ".cursor"),
	codex: join(homedir(), ".codex"),
	copilot: join(homedir(), ".copilot"),
};

const EMITTERS: Emitter[] = [
	skillsEmitter,
	directivesEmitter,
	mcpEmitter,
	agentsEmitter,
	permissionsEmitter,
	hooksEmitter,
];

/** Load config, run emitters, write files. */
export async function runSync(projectDir: string, options: SyncOptions): Promise<void> {
	const isUserScope = options.scope === "user";
	const label = isUserScope ? "~/.ai/" : ".ai/";

	// Load
	console.log(`Loading config from ${label} ...`);

	const { config, errors: loadErrors } = isUserScope
		? await loadProjectConfig(join(homedir(), ".ai"), "user")
		: await loadMergedConfig(projectDir);

	if (loadErrors.length > 0) {
		console.error("\x1b[31mConfig errors:\x1b[0m");
		for (const err of loadErrors) {
			console.error(`  ${err.file}${err.line ? `:${err.line}` : ""}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	// Validate
	const { errors: valErrors } = validateConfig(config);
	if (valErrors.length > 0) {
		console.error("\x1b[31mValidation errors:\x1b[0m");
		for (const err of valErrors) {
			console.error(`  ${err.file}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	// Emit — track per-target results for summary
	const targets = options.targets.length > 0 ? options.targets : [...ALL_TARGETS];
	const perTarget = new Map<TargetTool, { files: EmittedFile[]; warnings: string[] }>();

	for (const target of targets) {
		const targetFiles: EmittedFile[] = [];
		const targetWarnings: string[] = [];
		for (const emitter of EMITTERS) {
			const result: EmitResult = emitter.emit(config, target);
			targetFiles.push(...result.files);
			targetWarnings.push(...result.warnings);
		}
		perTarget.set(target, { files: targetFiles, warnings: targetWarnings });
	}

	const allFiles = [...perTarget.values()].flatMap((r) => r.files);
	const allWarnings = [...perTarget.values()].flatMap((r) => r.warnings);

	// Merge files that target the same path (e.g. multiple emitters writing to .claude/settings.json)
	const mergedFiles = mergeFiles(allFiles);

	// Warnings
	if (allWarnings.length > 0) {
		console.log("\x1b[33mWarnings:\x1b[0m");
		for (const w of allWarnings) {
			console.log(`  ⚠ ${w}`);
		}
		console.log("");
	}

	// Conflict detection (project scope only)
	if (!isUserScope && !options.force && !options.dryRun) {
		const state = await loadState(projectDir);
		const statuses = await diffFiles(projectDir, mergedFiles, state);
		const conflicts = statuses.filter((s) => s.status === "conflict");
		if (conflicts.length > 0) {
			console.error("\x1b[31mConflicts detected (files manually edited since last sync):\x1b[0m");
			for (const c of conflicts) {
				console.error(`  ! ${c.path}`);
			}
			console.error("\nUse \x1b[1m--force\x1b[0m to overwrite, or manually resolve.");
			process.exitCode = 1;
			return;
		}
	}

	// Write or report
	if (options.dryRun) {
		console.log("\x1b[36mDry run — files that would be written:\x1b[0m");
		for (const file of mergedFiles) {
			const outputPath = resolveOutputPath(file.path, isUserScope, projectDir, targets);
			console.log(`  ${outputPath}`);
		}
	} else {
		// Interactive confirmation in TTY mode (unless --yes)
		let filesToWrite = mergedFiles;
		if (!options.yes && isTTY() && !isUserScope) {
			const state = await loadState(projectDir);
			const statuses = await diffFiles(projectDir, mergedFiles, state);
			const changeCount = statuses.filter(
				(s) => s.status !== "up-to-date" && s.status !== "orphaned",
			).length;

			if (changeCount === 0) {
				console.log("\x1b[32m✓\x1b[0m Everything is up-to-date.");
				return;
			}

			printStatusTable(statuses, projectDir, isUserScope, targets);

			const proceed = cancelGuard(
				await confirm({
					message: `Apply ${changeCount} change${changeCount === 1 ? "" : "s"}?`,
					initialValue: true,
				}),
			);

			if (!proceed) {
				console.log("Sync cancelled.");
				return;
			}

			// Filter out up-to-date files
			const changePaths = new Set(
				statuses.filter((s) => s.status !== "up-to-date").map((s) => s.path),
			);
			filesToWrite = mergedFiles.filter((f) => changePaths.has(f.path));
		}

		for (const file of filesToWrite) {
			const fullPath = resolveOutputPath(file.path, isUserScope, projectDir, targets);
			await mkdir(dirname(fullPath), { recursive: true });
			await writeFile(fullPath, file.content, "utf-8");
		}

		// Save state for conflict detection (track all files, not just written ones)
		if (!isUserScope) {
			await saveState(projectDir, mergedFiles);
			const added = await updateGitignore(projectDir, mergedFiles);
			if (added > 0) {
				console.log(`  Updated .gitignore (+${added} entr${added === 1 ? "y" : "ies"})`);
			}
		}

		printSyncSummary(config, targets, perTarget, filesToWrite.length);
	}
}

const TARGET_LABELS: Record<TargetTool, string> = {
	claude: "Claude Code",
	cursor: "Cursor",
	codex: "Codex",
	copilot: "GitHub Copilot",
};

interface EntityCount {
	label: string;
	count: number;
}

function countEntities(config: ProjectConfig): EntityCount[] {
	const counts: EntityCount[] = [];
	if (config.directives.length > 0)
		counts.push({ label: "directive", count: config.directives.length });
	if (config.skills.length > 0) counts.push({ label: "skill", count: config.skills.length });
	if (config.agents.length > 0) counts.push({ label: "agent", count: config.agents.length });
	if (config.toolServers.length > 0)
		counts.push({ label: "MCP server", count: config.toolServers.length });
	if (config.permissions.length > 0)
		counts.push({ label: "permission", count: config.permissions.length });
	if (config.hooks.length > 0) counts.push({ label: "hook", count: config.hooks.length });
	return counts;
}

function pluralize(count: number, singular: string): string {
	return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function printSyncSummary(
	config: ProjectConfig,
	targets: TargetTool[],
	perTarget: Map<TargetTool, { files: EmittedFile[]; warnings: string[] }>,
	filesWritten: number,
): void {
	const entities = countEntities(config);

	console.log(
		`\x1b[32m✓\x1b[0m Synced to ${targets.length} target${targets.length === 1 ? "" : "s"}`,
	);
	console.log("");

	const maxLabelLen = Math.max(...targets.map((t) => TARGET_LABELS[t].length));

	for (const target of targets) {
		const label = TARGET_LABELS[target].padEnd(maxLabelLen);
		const result = perTarget.get(target);
		const warnings = result?.warnings ?? [];

		// Count which entity types actually produced files for this target
		const targetEntities = entities
			.filter((e) => {
				// If there are warnings about this entity type being unsupported, exclude it
				const unsupported = warnings.some(
					(w) =>
						w.toLowerCase().includes(e.label.toLowerCase()) &&
						w.toLowerCase().includes("not support"),
				);
				return !unsupported;
			})
			.map((e) => pluralize(e.count, e.label));

		const summary = targetEntities.length > 0 ? targetEntities.join(", ") : "no entities";

		// Collect short warning notes
		const warningNotes = warnings
			.filter((w) => w.toLowerCase().includes("not support"))
			.map((w) => `\x1b[33m⚠ ${w}\x1b[0m`);

		if (warningNotes.length > 0) {
			console.log(`  ${label}  — ${summary}`);
			for (const note of warningNotes) {
				console.log(`  ${"".padEnd(maxLabelLen)}    ${note}`);
			}
		} else {
			console.log(`  ${label}  — ${summary}`);
		}
	}

	console.log("");
	console.log(`  ${filesWritten} file${filesWritten === 1 ? "" : "s"} written.`);
}

/**
 * Resolve the output path for a file.
 * In user scope, files targeting tool-specific dirs go to ~/.<tool>/...
 * In project scope, files are relative to the project root.
 */
function resolveOutputPath(
	relativePath: string,
	isUserScope: boolean,
	projectDir: string,
	_targets: TargetTool[],
): string {
	if (!isUserScope) {
		return join(projectDir, relativePath);
	}

	// Map tool-specific paths to user home directories
	for (const [tool, userDir] of Object.entries(USER_OUTPUT_DIRS)) {
		const prefix = `.${tool}/`;
		if (relativePath.startsWith(prefix)) {
			return join(userDir, relativePath.slice(prefix.length));
		}
	}

	// Copilot uses .github/ and .vscode/ prefixes → map to user copilot dir
	const copilotPrefixes = [".github/", ".vscode/"];
	for (const prefix of copilotPrefixes) {
		if (relativePath.startsWith(prefix)) {
			return join(USER_OUTPUT_DIRS.copilot, relativePath);
		}
	}

	// Root-level files (CLAUDE.md, AGENTS.md, .mcp.json) go to home dir in user scope
	return join(homedir(), relativePath);
}

const STATUS_COLORS: Record<string, string> = {
	new: "\x1b[32m",
	modified: "\x1b[33m",
	"up-to-date": "\x1b[2m",
	conflict: "\x1b[31m",
	orphaned: "\x1b[2m",
};

function printStatusTable(
	statuses: FileStatusEntry[],
	projectDir: string,
	isUserScope: boolean,
	targets: TargetTool[],
): void {
	console.log("");
	for (const entry of statuses) {
		const color = STATUS_COLORS[entry.status] ?? "";
		const reset = "\x1b[0m";
		const outputPath = resolveOutputPath(entry.path, isUserScope, projectDir, targets);
		const suffix = entry.status === "up-to-date" ? " (skip)" : "";
		console.log(`  ${color}${outputPath.padEnd(40)}${entry.status}${suffix}${reset}`);
	}
	console.log("");
}

const GITIGNORE_HEADER = "# dotai outputs";

/**
 * Derive gitignore patterns from emitted file paths.
 * - Dot-directories at root → dir pattern (`.claude/`)
 * - Dot-directories under outputDir → prefixed dir pattern (`docs-site/.claude/`)
 * - Root-level files → exact match (`CLAUDE.md`)
 * - Always includes `.ai/.state.json`
 */
export function deriveGitignorePatterns(files: EmittedFile[]): string[] {
	const patterns = new Set<string>();
	patterns.add(".ai/.state.json");

	for (const file of files) {
		const parts = file.path.split("/");

		// Find the first dot-directory segment
		const dotDirIdx = parts.findIndex((p) => p.startsWith("."));

		if (dotDirIdx >= 0 && parts.length > dotDirIdx + 1) {
			// It's a file inside a dot-directory — use the dir pattern
			const prefix = parts.slice(0, dotDirIdx + 1).join("/");
			patterns.add(`${prefix}/`);
		} else {
			// Root-level file (possibly under an outputDir prefix)
			patterns.add(file.path);
		}
	}

	return [...patterns].sort();
}

/**
 * Update .gitignore with patterns for emitted files.
 * Returns the number of new entries added.
 */
export async function updateGitignore(projectDir: string, files: EmittedFile[]): Promise<number> {
	const patterns = deriveGitignorePatterns(files);
	if (patterns.length === 0) return 0;

	const gitignorePath = join(projectDir, ".gitignore");
	let existing = "";
	try {
		existing = await readFile(gitignorePath, "utf-8");
	} catch {
		// File doesn't exist yet — that's fine
	}

	// Determine which patterns are already present
	const existingLines = existing.split("\n");
	const newPatterns = patterns.filter((p) => !existingLines.includes(p));

	if (newPatterns.length === 0) return 0;

	// Check if our header block already exists
	const headerIdx = existingLines.indexOf(GITIGNORE_HEADER);
	if (headerIdx >= 0) {
		// Append new patterns after the existing block
		// Find the end of our block (next blank line or EOF)
		let insertIdx = headerIdx + 1;
		while (insertIdx < existingLines.length && existingLines[insertIdx].trim() !== "") {
			insertIdx++;
		}
		existingLines.splice(insertIdx, 0, ...newPatterns);
		await writeFile(gitignorePath, existingLines.join("\n"), "utf-8");
	} else {
		// Append a new block
		const trailingNewline = existing.endsWith("\n") || existing === "";
		const separator = existing === "" ? "" : trailingNewline ? "\n" : "\n\n";
		const block = `${GITIGNORE_HEADER}\n${newPatterns.join("\n")}\n`;
		await writeFile(gitignorePath, `${existing}${separator}${block}`, "utf-8");
	}

	return newPatterns.length;
}
