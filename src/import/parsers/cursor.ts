import { readFile } from "node:fs/promises";
import { parseMarkdownWithFrontmatter } from "../../config/markdown-loader.js";
import type { ProjectConfig } from "../../config/schema.js";
import { emptyConfig } from "../../config/schema.js";
import type { DetectedFile } from "../scanner.js";

/** Parse Cursor config files into a partial ProjectConfig. */
export async function parseCursor(
	_projectDir: string,
	files: DetectedFile[],
): Promise<Partial<ProjectConfig>> {
	const config = emptyConfig();

	for (const file of files) {
		switch (file.kind) {
			case "directives":
				await parseCursorRule(file.path, config);
				break;
			case "mcp":
				await parseCursorMcp(file.path, config);
				break;
			case "agents":
				await parseCursorAgent(file.path, config);
				break;
		}
	}

	return config;
}

async function parseCursorRule(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const { frontmatter, body } = parseMarkdownWithFrontmatter(raw);

	let appliesTo: string[] | undefined;
	if (typeof frontmatter.globs === "string") {
		appliesTo = frontmatter.globs.split(",").map((s: string) => s.trim());
	} else if (Array.isArray(frontmatter.globs)) {
		appliesTo = frontmatter.globs.map(String);
	}

	config.directives.push({
		content: body,
		scope: "project",
		alwaysApply: frontmatter.alwaysApply !== false,
		appliesTo,
		description:
			typeof frontmatter.description === "string"
				? frontmatter.description
				: (filePath
						.split("/")
						.pop()
						?.replace(/\.mdc?$/, "") ?? "rule"),
	});
}

async function parseCursorMcp(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	try {
		const parsed = JSON.parse(raw);
		const servers = parsed.mcpServers ?? parsed;
		if (typeof servers !== "object" || servers === null) return;

		for (const [name, entry] of Object.entries(servers)) {
			// Skip if already detected from Claude (dedup by name happens in runner)
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

async function parseCursorAgent(filePath: string, config: ProjectConfig): Promise<void> {
	const raw = await readFile(filePath, "utf-8").catch(() => null);
	if (!raw) return;

	const { frontmatter, body } = parseMarkdownWithFrontmatter(raw);
	const name = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "agent";

	config.agents.push({
		name,
		description: typeof frontmatter.description === "string" ? frontmatter.description : "",
		instructions: body,
		model: typeof frontmatter.model === "string" ? frontmatter.model : undefined,
		readonly: frontmatter.readonly === true ? true : undefined,
		tools: Array.isArray(frontmatter.tools) ? frontmatter.tools.map(String) : undefined,
	});
}
