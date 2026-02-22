import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ProjectConfig } from "../../config/schema.js";
import { emptyConfig } from "../../config/schema.js";
import { loadSkills } from "../../config/skill-loader.js";
import type { DetectedFile } from "../scanner.js";

/** Parse Claude Code config files into a partial ProjectConfig. */
export async function parseClaude(
	projectDir: string,
	files: DetectedFile[],
): Promise<Partial<ProjectConfig>> {
	const config = emptyConfig();

	for (const file of files) {
		switch (file.kind) {
			case "directives":
				if (file.relativePath === "CLAUDE.md") {
					await parseClaudeMd(file.path, config);
				} else {
					await parseClaudeRule(file.path, config);
				}
				break;
			case "mcp":
				await parseMcpJson(file.path, config);
				break;
			case "settings":
				await parseClaudeSettings(file.path, config);
				break;
			case "agents":
				await parseClaudeAgent(file.path, config);
				break;
			case "skills": {
				const skillsDir = join(projectDir, ".claude", "skills");
				try {
					config.skills = await loadSkills(skillsDir);
				} catch {
					// skills dir may not be loadable
				}
				break;
			}
		}
	}

	return config;
}

async function parseClaudeMd(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const sections = raw.split("\n\n---\n\n");
	for (const section of sections) {
		const content = section.trim();
		if (!content) continue;
		config.directives.push({
			content,
			scope: "project",
			alwaysApply: true,
			description: extractHeading(content),
		});
	}
}

async function parseClaudeRule(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	let content = raw.trim();
	let appliesTo: string[] | undefined;

	// Extract <!-- applies to: ... --> comment
	const match = content.match(/^<!--\s*applies to:\s*(.+?)\s*-->\s*\n*/);
	if (match) {
		appliesTo = match[1].split(",").map((s) => s.trim());
		content = content.slice(match[0].length).trim();
	}

	config.directives.push({
		content,
		scope: "project",
		alwaysApply: !appliesTo,
		appliesTo,
		description: extractHeading(content),
	});
}

async function parseMcpJson(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw);
		const servers = parsed.mcpServers ?? parsed;
		if (typeof servers !== "object" || servers === null) return;

		for (const [name, entry] of Object.entries(servers)) {
			const obj = entry as Record<string, unknown>;
			config.toolServers.push({
				name,
				transport: (typeof obj.type === "string" ? obj.type : "stdio") as "stdio" | "http" | "sse",
				command: typeof obj.command === "string" ? obj.command : undefined,
				url: typeof obj.url === "string" ? obj.url : undefined,
				args: Array.isArray(obj.args) ? obj.args.map(String) : undefined,
				env:
					typeof obj.env === "object" && obj.env !== null
						? Object.fromEntries(
								Object.entries(obj.env as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
							)
						: undefined,
				scope: "project",
			});
		}
	} catch {
		// Invalid JSON
	}
}

async function parseClaudeSettings(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw);

		// Parse permissions
		if (parsed.permissions) {
			const perms = parsed.permissions;
			for (const rule of perms.allow ?? []) {
				const p = parsePermissionRule(rule, "allow");
				if (p) {
					// Check if this is an ignore pattern (paired Read/Edit deny)
					config.permissions.push(p);
				}
			}
			for (const rule of perms.deny ?? []) {
				const p = parsePermissionRule(rule, "deny");
				if (p) {
					// Detect ignore patterns: paired Read(X) + Edit(X) deny rules
					if (p.tool === "Read" || p.tool === "Edit") {
						const pattern = p.pattern;
						if (pattern) {
							const existing = config.ignorePatterns.find((ip) => ip.pattern === pattern);
							if (!existing) {
								config.ignorePatterns.push({ pattern, scope: "project" });
							}
						}
					} else {
						config.permissions.push(p);
					}
				}
			}
		}

		// Parse hooks
		if (parsed.hooks && typeof parsed.hooks === "object") {
			for (const [event, entries] of Object.entries(parsed.hooks)) {
				if (!Array.isArray(entries)) continue;
				for (const entry of entries) {
					const obj = entry as Record<string, unknown>;
					if (typeof obj.command !== "string") continue;
					config.hooks.push({
						event: event as
							| "preToolUse"
							| "postToolUse"
							| "preFileEdit"
							| "postFileEdit"
							| "sessionStart"
							| "sessionEnd",
						handler: obj.command,
						matcher: typeof obj.matcher === "string" ? obj.matcher : undefined,
						scope: "project",
					});
				}
			}
		}

		// Parse remaining settings (exclude known keys)
		const knownKeys = new Set(["permissions", "hooks"]);
		for (const [key, value] of Object.entries(parsed)) {
			if (!knownKeys.has(key)) {
				config.settings.push({ key, value, scope: "project" });
			}
		}
	} catch {
		// Invalid JSON
	}
}

function parsePermissionRule(
	rule: string,
	decision: "allow" | "deny",
): { tool: string; pattern?: string; decision: "allow" | "deny"; scope: "project" } | null {
	const match = rule.match(/^(\w+)\((.+)\)$/);
	if (match) {
		return { tool: match[1], pattern: match[2], decision, scope: "project" };
	}
	return { tool: rule, decision, scope: "project" };
}

async function parseClaudeAgent(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const name = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "agent";
	config.agents.push({
		name,
		description: "",
		instructions: raw.trim(),
	});
}

function extractHeading(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	if (match) return match[1].trim();
	const firstLine = content.split("\n")[0]?.trim() ?? "";
	return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
}
