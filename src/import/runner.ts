import { join } from "node:path";
import { loadProjectConfig } from "../config/loader.js";
import type { ProjectConfig } from "../config/schema.js";
import { emptyConfig, mergeConfigs } from "../config/schema.js";
import { parseClaude } from "./parsers/claude.js";
import { parseCodex } from "./parsers/codex.js";
import { parseCursor } from "./parsers/cursor.js";
import type { DetectedFile, SourceTool } from "./scanner.js";
import { scanForConfigs } from "./scanner.js";
import { writeProjectConfig } from "./writer.js";

/** Options for running an import. */
export interface ImportOptions {
	interactive: boolean;
	sourceFilter?: SourceTool;
	/** In interactive mode, this function selects which files to import. */
	selectFiles?: (detected: DetectedFile[]) => Promise<DetectedFile[]>;
}

/** Result of an import operation. */
export interface ImportResult {
	detected: DetectedFile[];
	imported: DetectedFile[];
	config: ProjectConfig;
	filesWritten: string[];
}

/** Run the import pipeline: scan → select → parse → merge → write. */
export async function runImport(projectDir: string, options: ImportOptions): Promise<ImportResult> {
	const detected = await scanForConfigs(projectDir);

	// Filter by source if specified
	const filtered = options.sourceFilter
		? detected.filter((f) => f.source === options.sourceFilter)
		: detected;

	if (filtered.length === 0) {
		return { detected, imported: [], config: emptyConfig(), filesWritten: [] };
	}

	// Select files (interactive or all)
	const selected = options.selectFiles ? await options.selectFiles(filtered) : filtered;

	if (selected.length === 0) {
		return { detected, imported: [], config: emptyConfig(), filesWritten: [] };
	}

	// Group by source and parse
	const bySource = groupBySource(selected);
	let importedConfig = emptyConfig();

	// Parse in priority order: claude > cursor > codex
	if (bySource.claude.length > 0) {
		const partial = await parseClaude(projectDir, bySource.claude);
		importedConfig = mergeConfigs(importedConfig, toFull(partial));
	}
	if (bySource.cursor.length > 0) {
		const partial = await parseCursor(projectDir, bySource.cursor);
		importedConfig = mergeConfigs(importedConfig, toFull(partial));
	}
	if (bySource.codex.length > 0) {
		const partial = await parseCodex(projectDir, bySource.codex);
		importedConfig = mergeConfigs(importedConfig, toFull(partial));
	}

	// Deduplicate MCP servers by name (first wins due to parse order)
	importedConfig.toolServers = deduplicateByName(importedConfig.toolServers);

	// If .ai/ exists, load it and merge (existing .ai/ takes precedence)
	const aiDir = join(projectDir, ".ai");
	try {
		const existing = await loadProjectConfig(aiDir, "project");
		if (hasContent(existing.config)) {
			importedConfig = mergeConfigs(importedConfig, existing.config);
		}
	} catch {
		// No existing .ai/
	}

	// Write
	const filesWritten = await writeProjectConfig(aiDir, importedConfig);

	return {
		detected,
		imported: selected,
		config: importedConfig,
		filesWritten,
	};
}

function groupBySource(files: DetectedFile[]): Record<SourceTool, DetectedFile[]> {
	const result: Record<SourceTool, DetectedFile[]> = {
		claude: [],
		cursor: [],
		codex: [],
	};
	for (const f of files) {
		result[f.source].push(f);
	}
	return result;
}

function toFull(partial: Partial<ProjectConfig>): ProjectConfig {
	return { ...emptyConfig(), ...partial };
}

function deduplicateByName<T extends { name: string }>(items: T[]): T[] {
	const seen = new Set<string>();
	return items.filter((item) => {
		if (seen.has(item.name)) return false;
		seen.add(item.name);
		return true;
	});
}

function hasContent(config: ProjectConfig): boolean {
	return (
		config.directives.length > 0 ||
		config.skills.length > 0 ||
		config.agents.length > 0 ||
		config.toolServers.length > 0 ||
		config.hooks.length > 0 ||
		config.permissions.length > 0 ||
		config.settings.length > 0 ||
		config.ignorePatterns.length > 0
	);
}
