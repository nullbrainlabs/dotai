import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { cancelGuard, confirm, intro, isTTY, outro, select, text } from "../tui.js";

/** Supported entity types for the add command. */
export type AddEntityType = "rule" | "agent" | "skill" | "mcp";

const ENTITY_TYPES: AddEntityType[] = ["rule", "agent", "skill", "mcp"];

/** Options for the add command. */
export interface AddOptions {
	/** MCP server command (stdio transport, non-interactive). */
	command?: string;
	/** MCP server URL (http/sse transport, non-interactive). */
	url?: string;
}

const ENTITY_LABELS: Record<AddEntityType, string> = {
	rule: "Rule — project rules and conventions",
	agent: "Agent — specialized AI agent instructions",
	skill: "Skill — reusable AI skill definition",
	mcp: "MCP Server — tool server configuration",
};

/** Scaffold individual rules, agents, skills, or MCP servers. */
export async function runAdd(
	projectDir: string,
	entityType?: string,
	name?: string,
	options?: AddOptions,
): Promise<void> {
	const aiDir = join(projectDir, ".ai");

	if (!existsSync(aiDir)) {
		console.error("\x1b[31mNo .ai/ directory found. Run \x1b[1mdotai init\x1b[22m first.\x1b[0m");
		process.exitCode = 1;
		return;
	}

	// Interactive prompts when type or name is missing
	if (!entityType || !name) {
		if (!isTTY()) {
			console.error("\x1b[31mUsage: dotai add <type> <name>\x1b[0m");
			console.error(`  Types: ${ENTITY_TYPES.join(", ")}`);
			process.exitCode = 1;
			return;
		}

		intro("dotai add");

		if (!entityType) {
			entityType = cancelGuard(
				await select({
					message: "What would you like to add?",
					options: ENTITY_TYPES.map((t) => ({
						value: t,
						label: ENTITY_LABELS[t],
					})),
				}),
			) as string;
		}

		if (!ENTITY_TYPES.includes(entityType as AddEntityType)) {
			console.error(
				`\x1b[31mUnknown entity type "${entityType}". Must be one of: ${ENTITY_TYPES.join(", ")}\x1b[0m`,
			);
			process.exitCode = 1;
			return;
		}

		if (!name) {
			name = cancelGuard(
				await text({
					message: `Name for the ${entityType}:`,
					placeholder: entityType === "mcp" ? "my-server" : `my-${entityType}`,
					validate: (val) => {
						if (!val?.trim()) return "Name is required";
						if (!/^[a-z0-9][a-z0-9-]*$/.test(val!))
							return "Use lowercase letters, numbers, and hyphens";
					},
				}),
			) as string;
		}
	}

	if (!ENTITY_TYPES.includes(entityType as AddEntityType)) {
		console.error(
			`\x1b[31mUnknown entity type "${entityType}". Must be one of: ${ENTITY_TYPES.join(", ")}\x1b[0m`,
		);
		process.exitCode = 1;
		return;
	}

	const type = entityType as AddEntityType;

	switch (type) {
		case "rule":
			await addRule(aiDir, name);
			break;
		case "agent":
			await addAgent(aiDir, name);
			break;
		case "skill":
			await addSkill(aiDir, name);
			break;
		case "mcp":
			await addMcp(aiDir, name, options);
			break;
	}
}

async function addRule(aiDir: string, name: string): Promise<void> {
	const dirPath = join(aiDir, "rules");
	await mkdir(dirPath, { recursive: true });

	const filePath = join(dirPath, `${name}.md`);
	if (await checkExistingFile(filePath)) return;

	const content = `---
scope: project
alwaysApply: true
description: ${name}
---

<!-- Add your rule content here -->
`;

	await writeFile(filePath, content, "utf-8");
	console.log(`\x1b[32m+\x1b[0m Created ${filePath}`);
}

async function addAgent(aiDir: string, name: string): Promise<void> {
	const dirPath = join(aiDir, "agents");
	await mkdir(dirPath, { recursive: true });

	const filePath = join(dirPath, `${name}.md`);
	if (await checkExistingFile(filePath)) return;

	const content = `---
description: ${name} agent
---

<!-- Add agent instructions here -->
`;

	await writeFile(filePath, content, "utf-8");
	console.log(`\x1b[32m+\x1b[0m Created ${filePath}`);
}

async function addSkill(aiDir: string, name: string): Promise<void> {
	const skillDir = join(aiDir, "skills", name);
	await mkdir(skillDir, { recursive: true });

	const filePath = join(skillDir, "SKILL.md");
	if (await checkExistingFile(filePath)) return;

	const content = `---
description: ${name} skill
---

<!-- Add skill instructions here -->
`;

	await writeFile(filePath, content, "utf-8");
	console.log(`\x1b[32m+\x1b[0m Created ${filePath}`);
}

async function addMcp(aiDir: string, name: string, options?: AddOptions): Promise<void> {
	const configPath = join(aiDir, "config.yaml");

	let transport: string;
	let command: string | undefined;
	let url: string | undefined;
	let args: string[] | undefined;

	if (options?.command) {
		// Non-interactive: stdio transport with command
		transport = "stdio";
		const parts = options.command.split(" ");
		command = parts[0];
		args = parts.length > 1 ? parts.slice(1) : undefined;
	} else if (options?.url) {
		// Non-interactive: http/sse transport with url
		transport = "http";
		url = options.url;
	} else if (isTTY()) {
		// Interactive mode
		intro(`Adding MCP server: ${name}`);

		transport = cancelGuard(
			await select({
				message: "Transport type?",
				options: [
					{ value: "stdio", label: "stdio — local command" },
					{ value: "http", label: "http — HTTP endpoint" },
					{ value: "sse", label: "sse — Server-Sent Events" },
				],
			}),
		) as string;

		if (transport === "stdio") {
			// For non-interactive fallback we need at least the command flag
			console.error(
				"\x1b[31mstdio transport requires --command flag in non-interactive mode.\x1b[0m",
			);
			console.error('  Example: dotai add mcp myserver --command "npx @some/server"');
			outro("Cancelled.");
			process.exitCode = 1;
			return;
		}

		// http or sse — we can't prompt for text with clack select, so require --url
		console.error(
			`\x1b[31m${transport} transport requires --url flag in non-interactive mode.\x1b[0m`,
		);
		console.error(`  Example: dotai add mcp myserver --url "http://localhost:3000"`);
		outro("Cancelled.");
		process.exitCode = 1;
		return;
	} else {
		console.error(
			"\x1b[31mMCP server requires --command or --url flag in non-interactive mode.\x1b[0m",
		);
		process.exitCode = 1;
		return;
	}

	// Load existing config.yaml
	let configObj: Record<string, unknown> = {};
	if (existsSync(configPath)) {
		const raw = await readFile(configPath, "utf-8");
		configObj = (parseYaml(raw) as Record<string, unknown>) ?? {};
	}

	// Add server to mcpServers
	const servers = (configObj.mcpServers as Record<string, unknown>) ?? {};
	const serverEntry: Record<string, unknown> = { transport };
	if (command) serverEntry.command = command;
	if (url) serverEntry.url = url;
	if (args?.length) serverEntry.args = args;
	servers[name] = serverEntry;
	configObj.mcpServers = servers;

	await writeFile(configPath, stringifyYaml(configObj), "utf-8");
	console.log(`\x1b[32m+\x1b[0m Added MCP server "${name}" to config.yaml`);
}

/**
 * Check if a file already exists.
 * In TTY mode, ask for confirmation to overwrite.
 * In non-TTY mode, error out.
 * Returns true if we should skip (file exists and user declined overwrite).
 */
async function checkExistingFile(filePath: string): Promise<boolean> {
	if (!existsSync(filePath)) return false;

	if (isTTY()) {
		const overwrite = cancelGuard(
			await confirm({
				message: `${filePath} already exists. Overwrite?`,
				initialValue: false,
			}),
		);
		return !overwrite;
	}

	console.error(`\x1b[31m${filePath} already exists. Use interactive mode to overwrite.\x1b[0m`);
	process.exitCode = 1;
	return true;
}
