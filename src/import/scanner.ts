import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

/** Source tool that originally created a config file. */
export type SourceTool = "claude" | "cursor" | "codex";

/** Kind of config entity the file maps to. */
export type DetectedKind =
	| "directives"
	| "mcp"
	| "permissions"
	| "hooks"
	| "settings"
	| "agents"
	| "skills"
	| "ignore";

/** A detected raw config file in the project. */
export interface DetectedFile {
	path: string;
	relativePath: string;
	source: SourceTool;
	kind: DetectedKind;
	label: string;
}

async function exists(p: string): Promise<boolean> {
	try {
		await stat(p);
		return true;
	} catch {
		return false;
	}
}

async function listMdFiles(dir: string): Promise<string[]> {
	try {
		const entries = await readdir(dir);
		return entries.filter((f) => f.endsWith(".md"));
	} catch {
		return [];
	}
}

async function listMdcFiles(dir: string): Promise<string[]> {
	try {
		const entries = await readdir(dir);
		return entries.filter((f) => f.endsWith(".mdc"));
	} catch {
		return [];
	}
}

async function listSkillDirs(dir: string): Promise<string[]> {
	try {
		const entries = await readdir(dir);
		const dirs: string[] = [];
		for (const entry of entries) {
			const p = join(dir, entry);
			const s = await stat(p).catch(() => null);
			if (s?.isDirectory()) {
				const skillFile = join(p, "SKILL.md");
				if (await exists(skillFile)) dirs.push(entry);
			}
		}
		return dirs;
	} catch {
		return [];
	}
}

/** Scan a project directory for existing raw config files from AI tools. */
export async function scanForConfigs(projectDir: string): Promise<DetectedFile[]> {
	const detected: DetectedFile[] = [];

	const add = (absPath: string, source: SourceTool, kind: DetectedKind, label: string) => {
		detected.push({
			path: absPath,
			relativePath: relative(projectDir, absPath),
			source,
			kind,
			label,
		});
	};

	// Claude Code files
	const claudeMd = join(projectDir, "CLAUDE.md");
	if (await exists(claudeMd)) add(claudeMd, "claude", "directives", "CLAUDE.md (directives)");

	const mcpJson = join(projectDir, ".mcp.json");
	if (await exists(mcpJson)) add(mcpJson, "claude", "mcp", ".mcp.json (MCP servers)");

	const claudeSettings = join(projectDir, ".claude", "settings.json");
	if (await exists(claudeSettings))
		add(claudeSettings, "claude", "settings", ".claude/settings.json (permissions + settings)");

	const claudeRulesDir = join(projectDir, ".claude", "rules");
	for (const f of await listMdFiles(claudeRulesDir)) {
		const p = join(claudeRulesDir, f);
		add(p, "claude", "directives", `.claude/rules/${f} (directive)`);
	}

	const claudeAgentsDir = join(projectDir, ".claude", "agents");
	for (const f of await listMdFiles(claudeAgentsDir)) {
		const p = join(claudeAgentsDir, f);
		add(p, "claude", "agents", `.claude/agents/${f} (agent)`);
	}

	const claudeSkillsDir = join(projectDir, ".claude", "skills");
	for (const s of await listSkillDirs(claudeSkillsDir)) {
		const p = join(claudeSkillsDir, s, "SKILL.md");
		add(p, "claude", "skills", `.claude/skills/${s}/SKILL.md (skill)`);
	}

	// Cursor files
	const cursorRulesDir = join(projectDir, ".cursor", "rules");
	for (const f of await listMdcFiles(cursorRulesDir)) {
		const p = join(cursorRulesDir, f);
		add(p, "cursor", "directives", `.cursor/rules/${f} (directive)`);
	}

	const cursorMcp = join(projectDir, ".cursor", "mcp.json");
	if (await exists(cursorMcp)) add(cursorMcp, "cursor", "mcp", ".cursor/mcp.json (MCP servers)");

	const cursorAgentsDir = join(projectDir, ".cursor", "agents");
	for (const f of await listMdFiles(cursorAgentsDir)) {
		const p = join(cursorAgentsDir, f);
		add(p, "cursor", "agents", `.cursor/agents/${f} (agent)`);
	}

	// Codex files
	const codexToml = join(projectDir, ".codex", "config.toml");
	if (await exists(codexToml)) add(codexToml, "codex", "settings", ".codex/config.toml (settings)");

	const agentsMd = join(projectDir, "AGENTS.md");
	if (await exists(agentsMd)) add(agentsMd, "codex", "directives", "AGENTS.md (directives)");

	return detected;
}
