import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseMarkdownWithFrontmatter } from "../../config/markdown-loader.js";
import type { ProjectConfig } from "../../config/schema.js";
import { emptyConfig } from "../../config/schema.js";
import { loadSkills } from "../../config/skill-loader.js";
import type { DetectedFile } from "../scanner.js";

/** Parse OpenCode config files into a partial ProjectConfig. */
export async function parseOpenCode(
	projectDir: string,
	files: DetectedFile[],
): Promise<Partial<ProjectConfig>> {
	const config = emptyConfig();

	for (const file of files) {
		switch (file.kind) {
			case "settings":
				await parseOpenCodeJson(file.path, config);
				break;
			case "agents":
				await parseOpenCodeAgent(file.path, config);
				break;
			case "skills": {
				const skillsDir = join(projectDir, ".opencode", "skills");
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

/** Known OpenCode config keys that map to settings. */
const SETTINGS_KEYS = new Set(["model", "theme", "provider", "maxTokens"]);

async function parseOpenCodeJson(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw);

		// MCP servers
		if (parsed.mcp && typeof parsed.mcp === "object") {
			for (const [name, entry] of Object.entries(parsed.mcp)) {
				const obj = entry as Record<string, unknown>;
				const rawType = typeof obj.type === "string" ? obj.type : "stdio";
				// OpenCode "remote" maps to "http"
				const transport = rawType === "remote" ? "http" : rawType;

				config.toolServers.push({
					name,
					transport: transport as "stdio" | "http" | "sse",
					command: typeof obj.command === "string" ? obj.command : undefined,
					url: typeof obj.url === "string" ? obj.url : undefined,
					args: Array.isArray(obj.args) ? obj.args.map(String) : undefined,
					env:
						typeof obj.env === "object" && obj.env !== null
							? Object.fromEntries(
									Object.entries(obj.env as Record<string, unknown>).map(([k, v]) => [
										k,
										String(v),
									]),
								)
							: undefined,
					scope: "project",
				});
			}
		}

		// Permissions
		if (parsed.permission && typeof parsed.permission === "object") {
			for (const [tool, value] of Object.entries(parsed.permission)) {
				if (typeof value === "string") {
					// Flat: { "<tool>": "<decision>" }
					config.permissions.push({
						tool,
						decision: value as "allow" | "deny" | "ask",
						scope: "project",
					});
				} else if (typeof value === "object" && value !== null) {
					// Nested: { "bash": { "<pattern>": "<decision>" } }
					for (const [pattern, decision] of Object.entries(value as Record<string, string>)) {
						config.permissions.push({
							tool,
							pattern,
							decision: decision as "allow" | "deny" | "ask",
							scope: "project",
						});
					}
				}
			}
		}

		// Instructions → directives
		if (Array.isArray(parsed.instructions)) {
			for (const instrPath of parsed.instructions) {
				if (typeof instrPath !== "string") continue;
				const absPath = join(filePath, "..", instrPath);
				const content = await readFile(absPath, "utf-8").catch(() => null);
				if (!content) continue;

				let body = content.trim();
				let appliesTo: string[] | undefined;

				// Extract <!-- applies to: ... --> comment
				const match = body.match(/^<!--\s*applies to:\s*(.+?)\s*-->\s*\n*/);
				if (match) {
					appliesTo = match[1].split(",").map((s) => s.trim());
					body = body.slice(match[0].length).trim();
				}

				config.directives.push({
					content: body,
					scope: "project",
					alwaysApply: !appliesTo,
					appliesTo,
					description: extractHeading(body),
				});
			}
		}

		// Watcher ignore
		if (parsed.watcher?.ignore && Array.isArray(parsed.watcher.ignore)) {
			for (const pattern of parsed.watcher.ignore) {
				if (typeof pattern === "string") {
					config.ignorePatterns.push({ pattern, scope: "project" });
				}
			}
		}

		// Settings (known keys)
		for (const [key, value] of Object.entries(parsed)) {
			if (SETTINGS_KEYS.has(key)) {
				config.settings.push({ key, value, scope: "project" });
			}
		}
	} catch {
		// Invalid JSON
	}
}

async function parseOpenCodeAgent(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const { frontmatter, body } = parseMarkdownWithFrontmatter(raw);
	const name = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "agent";

	config.agents.push({
		name,
		description: typeof frontmatter.description === "string" ? frontmatter.description : "",
		instructions: body,
		model: typeof frontmatter.model === "string" ? frontmatter.model : undefined,
		mode:
			typeof frontmatter.mode === "string"
				? (frontmatter.mode as "primary" | "subagent" | "all")
				: undefined,
		temperature: typeof frontmatter.temperature === "number" ? frontmatter.temperature : undefined,
		topP: typeof frontmatter.top_p === "number" ? frontmatter.top_p : undefined,
		steps: typeof frontmatter.steps === "number" ? frontmatter.steps : undefined,
		color: typeof frontmatter.color === "string" ? frontmatter.color : undefined,
		hidden: frontmatter.hidden === true ? true : undefined,
		disabled: frontmatter.disable === true ? true : undefined,
	});
}

function extractHeading(content: string): string {
	const match = content.match(/^#\s+(.+)$/m);
	if (match) return match[1].trim();
	const firstLine = content.split("\n")[0]?.trim() ?? "";
	return firstLine.length > 50 ? `${firstLine.slice(0, 47)}...` : firstLine;
}
