import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { Agent } from "../domain/agent.js";
import type { Directive } from "../domain/directive.js";
import type { Hook, HookEvent } from "../domain/hook.js";
import type { Permission } from "../domain/permission.js";
import type { Scope } from "../domain/scope.js";
import type { ToolServer, Transport } from "../domain/tool-server.js";
import { loadMarkdownFile } from "./markdown-loader.js";
import type { ConfigError, ConfigScope, ProjectConfig } from "./schema.js";
import { emptyConfig, mergeConfigs } from "./schema.js";
import { loadSkills } from "./skill-loader.js";

/** Result of loading a project config from `.ai/`. */
export interface LoadResult {
	config: ProjectConfig;
	errors: ConfigError[];
}

/** Load a full ProjectConfig from an `.ai/` directory. */
export async function loadProjectConfig(
	aiDir: string,
	scope: ConfigScope = "project",
): Promise<LoadResult> {
	const config = emptyConfig();
	const errors: ConfigError[] = [];

	// Load config.yaml
	const configPath = join(aiDir, "config.yaml");
	await loadConfigYaml(configPath, config, errors, scope);

	// Load directives
	const directivesDir = join(aiDir, "directives");
	await loadDirectives(directivesDir, config, errors, scope);

	// Load skills
	const skillsDir = join(aiDir, "skills");
	try {
		config.skills = await loadSkills(skillsDir);
	} catch {
		// skills directory doesn't exist — that's fine
	}

	// Load agents
	const agentsDir = join(aiDir, "agents");
	await loadAgents(agentsDir, config, errors);

	return { config, errors };
}

/**
 * Load merged config: user-level ~/.ai/ as base, project .ai/ overrides.
 * Returns the combined config with correct scopes on each entity.
 */
export async function loadMergedConfig(projectDir: string): Promise<LoadResult> {
	const userAiDir = join(homedir(), ".ai");
	const projectAiDir = join(projectDir, ".ai");

	const userResult = await loadProjectConfig(userAiDir, "user");
	const projectResult = await loadProjectConfig(projectAiDir, "project");

	const errors = [...userResult.errors, ...projectResult.errors];
	const config = mergeConfigs(userResult.config, projectResult.config);

	return { config, errors };
}

async function loadConfigYaml(
	filePath: string,
	config: ProjectConfig,
	errors: ConfigError[],
	scope: ConfigScope = "project",
): Promise<void> {
	let raw: string;
	try {
		raw = await readFile(filePath, "utf-8");
	} catch {
		// config.yaml is optional
		return;
	}

	let parsed: Record<string, unknown>;
	try {
		parsed = parseYaml(raw) ?? {};
	} catch (e) {
		errors.push({
			file: filePath,
			message: `Invalid YAML: ${e instanceof Error ? e.message : String(e)}`,
		});
		return;
	}

	if (typeof parsed !== "object" || parsed === null) {
		errors.push({ file: filePath, message: "config.yaml must be a YAML mapping" });
		return;
	}

	// Parse MCP servers
	if (parsed.mcpServers && typeof parsed.mcpServers === "object") {
		for (const [name, raw] of Object.entries(parsed.mcpServers as Record<string, unknown>)) {
			const server = parseToolServer(name, raw, filePath, errors, scope);
			if (server) config.toolServers.push(server);
		}
	}

	// Parse permissions
	if (Array.isArray(parsed.permissions)) {
		for (const raw of parsed.permissions) {
			const perm = parsePermission(raw, filePath, errors, scope);
			if (perm) config.permissions.push(perm);
		}
	}

	// Parse settings
	if (parsed.settings && typeof parsed.settings === "object") {
		for (const [key, value] of Object.entries(parsed.settings as Record<string, unknown>)) {
			config.settings.push({ key, value, scope: scope as Scope });
		}
	}

	// Parse hooks
	if (Array.isArray(parsed.hooks)) {
		for (const raw of parsed.hooks) {
			const hook = parseHook(raw, filePath, errors, scope);
			if (hook) config.hooks.push(hook);
		}
	}

	// Parse ignore patterns
	if (Array.isArray(parsed.ignore)) {
		for (const raw of parsed.ignore) {
			if (typeof raw === "string") {
				config.ignorePatterns.push({ pattern: raw, scope: scope as "project" | "user" });
			}
		}
	}
}

function parseToolServer(
	name: string,
	raw: unknown,
	file: string,
	errors: ConfigError[],
	scope: ConfigScope = "project",
): ToolServer | null {
	if (typeof raw !== "object" || raw === null) {
		errors.push({ file, message: `mcpServers.${name} must be an object` });
		return null;
	}
	const obj = raw as Record<string, unknown>;
	const transport = (typeof obj.transport === "string" ? obj.transport : "stdio") as Transport;
	return {
		name,
		transport,
		command: typeof obj.command === "string" ? obj.command : undefined,
		url: typeof obj.url === "string" ? obj.url : undefined,
		args: Array.isArray(obj.args) ? obj.args.map(String) : undefined,
		env:
			typeof obj.env === "object" && obj.env !== null
				? Object.fromEntries(
						Object.entries(obj.env as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
					)
				: undefined,
		enabledTools: Array.isArray(obj.enabledTools) ? obj.enabledTools.map(String) : undefined,
		disabledTools: Array.isArray(obj.disabledTools) ? obj.disabledTools.map(String) : undefined,
		scope: scope as Scope,
	};
}

function parsePermission(
	raw: unknown,
	file: string,
	errors: ConfigError[],
	scope: ConfigScope = "project",
): Permission | null {
	if (typeof raw !== "object" || raw === null) {
		errors.push({ file, message: "Permission entry must be an object" });
		return null;
	}
	const obj = raw as Record<string, unknown>;
	if (typeof obj.tool !== "string" || typeof obj.decision !== "string") {
		errors.push({ file, message: "Permission requires 'tool' and 'decision' fields" });
		return null;
	}
	return {
		tool: obj.tool,
		pattern: typeof obj.pattern === "string" ? obj.pattern : undefined,
		decision: obj.decision as Permission["decision"],
		scope: scope as Scope,
	};
}

function parseHook(
	raw: unknown,
	file: string,
	errors: ConfigError[],
	scope: ConfigScope = "project",
): Hook | null {
	if (typeof raw !== "object" || raw === null) {
		errors.push({ file, message: "Hook entry must be an object" });
		return null;
	}
	const obj = raw as Record<string, unknown>;
	if (typeof obj.event !== "string" || typeof obj.handler !== "string") {
		errors.push({ file, message: "Hook requires 'event' and 'handler' fields" });
		return null;
	}
	return {
		event: obj.event as HookEvent,
		matcher: typeof obj.matcher === "string" ? obj.matcher : undefined,
		handler: obj.handler,
		scope: scope as Scope,
	};
}

async function loadDirectives(
	directivesDir: string,
	config: ProjectConfig,
	errors: ConfigError[],
	scope: ConfigScope = "project",
): Promise<void> {
	let files: string[];
	try {
		files = await readdir(directivesDir);
	} catch {
		return; // directory doesn't exist
	}

	for (const file of files.filter((f) => f.endsWith(".md"))) {
		const filePath = join(directivesDir, file);
		try {
			const { frontmatter, body } = await loadMarkdownFile(filePath);
			const directive: Directive = {
				content: body,
				scope: (typeof frontmatter.scope === "string" ? frontmatter.scope : scope) as Scope,
				alwaysApply: frontmatter.alwaysApply !== false,
				appliesTo: Array.isArray(frontmatter.appliesTo)
					? frontmatter.appliesTo.map(String)
					: typeof frontmatter.appliesTo === "string"
						? [frontmatter.appliesTo]
						: undefined,
				description:
					typeof frontmatter.description === "string"
						? frontmatter.description
						: file.replace(/\.md$/, ""),
				outputDir: typeof frontmatter.outputDir === "string" ? frontmatter.outputDir : undefined,
			};
			config.directives.push(directive);
		} catch (e) {
			errors.push({
				file: filePath,
				message: `Failed to parse: ${e instanceof Error ? e.message : String(e)}`,
			});
		}
	}
}

async function loadAgents(
	agentsDir: string,
	config: ProjectConfig,
	errors: ConfigError[],
): Promise<void> {
	let files: string[];
	try {
		files = await readdir(agentsDir);
	} catch {
		return; // directory doesn't exist
	}

	for (const file of files.filter((f) => f.endsWith(".md"))) {
		const filePath = join(agentsDir, file);
		try {
			const { frontmatter, body } = await loadMarkdownFile(filePath);
			const agent: Agent = {
				name: file.replace(/\.md$/, ""),
				description: typeof frontmatter.description === "string" ? frontmatter.description : "",
				instructions: body,
				model: typeof frontmatter.model === "string" ? frontmatter.model : undefined,
				readonly: frontmatter.readonly === true ? true : undefined,
				tools: Array.isArray(frontmatter.tools) ? frontmatter.tools.map(String) : undefined,
			};
			config.agents.push(agent);
		} catch (e) {
			errors.push({
				file: filePath,
				message: `Failed to parse: ${e instanceof Error ? e.message : String(e)}`,
			});
		}
	}
}
