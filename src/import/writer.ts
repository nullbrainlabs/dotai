import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import type { ProjectConfig } from "../config/schema.js";

/** Slugify a string into a filename-safe slug. */
function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

/** Serialize a ProjectConfig back to an `.ai/` directory. Returns paths of written files. */
export async function writeProjectConfig(aiDir: string, config: ProjectConfig): Promise<string[]> {
	const written: string[] = [];

	// Ensure base directories exist
	await mkdir(aiDir, { recursive: true });
	await mkdir(join(aiDir, "rules"), { recursive: true });
	await mkdir(join(aiDir, "skills"), { recursive: true });
	await mkdir(join(aiDir, "agents"), { recursive: true });

	// Write config.yaml
	const yamlObj: Record<string, unknown> = {};

	if (config.toolServers.length > 0) {
		const servers: Record<string, unknown> = {};
		for (const s of config.toolServers) {
			const entry: Record<string, unknown> = { transport: s.transport };
			if (s.command) entry.command = s.command;
			if (s.url) entry.url = s.url;
			if (s.args?.length) entry.args = s.args;
			if (s.env && Object.keys(s.env).length > 0) entry.env = s.env;
			if (s.enabledTools?.length) entry.enabledTools = s.enabledTools;
			if (s.disabledTools?.length) entry.disabledTools = s.disabledTools;
			servers[s.name] = entry;
		}
		yamlObj.mcpServers = servers;
	} else {
		yamlObj.mcpServers = {};
	}

	if (config.permissions.length > 0) {
		yamlObj.permissions = config.permissions.map((p) => {
			const entry: Record<string, unknown> = { tool: p.tool, decision: p.decision };
			if (p.pattern) entry.pattern = p.pattern;
			return entry;
		});
	} else {
		yamlObj.permissions = [];
	}

	if (config.settings.length > 0) {
		const settingsObj: Record<string, unknown> = {};
		for (const s of config.settings) {
			settingsObj[s.key] = s.value;
		}
		yamlObj.settings = settingsObj;
	} else {
		yamlObj.settings = {};
	}

	if (config.hooks.length > 0) {
		yamlObj.hooks = config.hooks.map((h) => {
			const entry: Record<string, unknown> = { event: h.event, handler: h.handler };
			if (h.matcher) entry.matcher = h.matcher;
			return entry;
		});
	} else {
		yamlObj.hooks = [];
	}

	if (config.ignorePatterns.length > 0) {
		yamlObj.ignore = config.ignorePatterns.map((p) => p.pattern);
	} else {
		yamlObj.ignore = [];
	}

	const configPath = join(aiDir, "config.yaml");
	await writeFile(configPath, stringifyYaml(yamlObj), "utf-8");
	written.push(configPath);

	// Write rules
	for (const d of config.rules) {
		const name = slugify(d.description || "rule");
		const fm: string[] = [];
		fm.push(`scope: ${d.scope}`);
		fm.push(`alwaysApply: ${d.alwaysApply}`);
		if (d.appliesTo?.length) {
			fm.push(`appliesTo: [${d.appliesTo.join(", ")}]`);
		}
		if (d.description) {
			fm.push(`description: ${d.description}`);
		}
		const header = `---\n${fm.join("\n")}\n---`;
		const filePath = join(aiDir, "rules", `${name}.md`);
		await writeFile(filePath, `${header}\n\n${d.content}\n`, "utf-8");
		written.push(filePath);
	}

	// Write agents
	for (const a of config.agents) {
		const fm: string[] = [];
		if (a.description) fm.push(`description: ${a.description}`);
		if (a.model) fm.push(`model: ${a.model}`);
		if (a.readonly) fm.push("readonly: true");
		if (a.tools?.length) fm.push(`tools: [${a.tools.join(", ")}]`);
		const header = fm.length > 0 ? `---\n${fm.join("\n")}\n---\n\n` : "";
		const filePath = join(aiDir, "agents", `${a.name}.md`);
		await writeFile(filePath, `${header}${a.instructions}\n`, "utf-8");
		written.push(filePath);
	}

	// Write skills
	for (const s of config.skills) {
		const skillDir = join(aiDir, "skills", s.name);
		await mkdir(skillDir, { recursive: true });
		const filePath = join(skillDir, "SKILL.md");
		await writeFile(filePath, s.content, "utf-8");
		written.push(filePath);
	}

	return written;
}
