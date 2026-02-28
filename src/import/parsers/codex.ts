import { readFile } from "node:fs/promises";
import { parse as parseToml } from "smol-toml";
import type { ProjectConfig } from "../../config/schema.js";
import { emptyConfig } from "../../config/schema.js";
import type { DetectedFile } from "../scanner.js";

/** Parse Codex config files into a partial ProjectConfig. */
export async function parseCodex(
	_projectDir: string,
	files: DetectedFile[],
): Promise<Partial<ProjectConfig>> {
	const config = emptyConfig();

	for (const file of files) {
		switch (file.kind) {
			case "settings":
				await parseCodexToml(file.path, config);
				break;
			case "rules":
				await parseAgentsMd(file.path, config);
				break;
		}
	}

	return config;
}

async function parseCodexToml(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	try {
		const parsed = parseToml(raw);

		// Parse MCP servers
		if (parsed.mcp_servers && typeof parsed.mcp_servers === "object") {
			for (const [name, entry] of Object.entries(parsed.mcp_servers as Record<string, unknown>)) {
				const obj = entry as Record<string, unknown>;
				config.toolServers.push({
					name,
					transport: (typeof obj.type === "string" ? obj.type : "stdio") as
						| "stdio"
						| "http"
						| "sse",
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

		// Parse approval_policy → Permission
		if (typeof parsed.approval_policy === "string") {
			if (parsed.approval_policy === "unless-allowed") {
				config.permissions.push({
					tool: "Bash",
					decision: "allow",
					scope: "project",
				});
			}
		}

		// Parse protected_paths → IgnorePattern
		if (Array.isArray(parsed.protected_paths)) {
			for (const p of parsed.protected_paths) {
				if (typeof p === "string") {
					config.ignorePatterns.push({ pattern: p, scope: "project" });
				}
			}
		}

		// Parse remaining settings
		const knownKeys = new Set(["mcp_servers", "approval_policy", "protected_paths"]);
		for (const [key, value] of Object.entries(parsed)) {
			if (!knownKeys.has(key)) {
				config.settings.push({ key, value, scope: "project" });
			}
		}
	} catch {
		// Invalid TOML
	}
}

async function parseAgentsMd(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const lines = raw.split("\n");
	let currentName: string | null = null;
	let currentType: "agent" | "rule" = "rule";
	let currentLines: string[] = [];

	const flush = () => {
		const content = currentLines.join("\n").trim();
		if (!content) return;

		if (currentType === "agent" && currentName) {
			config.agents.push({
				name: currentName,
				description: "",
				instructions: content,
			});
		} else if (currentType === "rule") {
			config.rules.push({
				content,
				scope: "project",
				alwaysApply: true,
				description: currentName ?? "rule",
			});
		}
	};

	for (const line of lines) {
		const agentMatch = line.match(/^##\s+Agent:\s+(.+)$/);
		const sectionMatch = !agentMatch ? line.match(/^##\s+(.+)$/) : null;

		if (agentMatch) {
			flush();
			currentName = agentMatch[1].trim();
			currentType = "agent";
			currentLines = [];
		} else if (sectionMatch) {
			flush();
			currentName = sectionMatch[1].trim();
			currentType = "rule";
			currentLines = [];
		} else if (currentName !== null || currentType === "rule") {
			// Skip top-level heading
			if (line.match(/^#\s/) && currentLines.length === 0 && currentName === null) continue;
			currentLines.push(line);
		}
	}
	flush();
}
