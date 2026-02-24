import type { Agent } from "../domain/agent.js";
import type { Directive } from "../domain/directive.js";
import type { Hook } from "../domain/hook.js";
import type { IgnorePattern } from "../domain/ignore-pattern.js";
import type { Permission } from "../domain/permission.js";
import type { Setting } from "../domain/settings.js";
import type { Skill } from "../domain/skill.js";
import type { ToolServer } from "../domain/tool-server.js";

/** Aggregated project configuration loaded from `.ai/`. */
export interface ProjectConfig {
	directives: Directive[];
	skills: Skill[];
	agents: Agent[];
	toolServers: ToolServer[];
	hooks: Hook[];
	permissions: Permission[];
	settings: Setting[];
	ignorePatterns: IgnorePattern[];
}

/** A validation error with location context. */
export interface ConfigError {
	file: string;
	line?: number;
	message: string;
}

/** Result of config validation. */
export interface ValidationResult {
	valid: boolean;
	errors: ConfigError[];
}

/** The scope at which config was loaded. */
export type ConfigScope = "user" | "project";

/** Create an empty ProjectConfig. */
export function emptyConfig(): ProjectConfig {
	return {
		directives: [],
		skills: [],
		agents: [],
		toolServers: [],
		hooks: [],
		permissions: [],
		settings: [],
		ignorePatterns: [],
	};
}

/**
 * Merge two configs: base (user) + override (project).
 * Project-level entities are appended after user-level ones.
 * For settings with the same key, project overrides user.
 */
export function mergeConfigs(base: ProjectConfig, override: ProjectConfig): ProjectConfig {
	// For settings, project overrides user by key
	const mergedSettings = [...base.settings];
	for (const setting of override.settings) {
		const idx = mergedSettings.findIndex((s) => s.key === setting.key);
		if (idx >= 0) {
			mergedSettings[idx] = setting;
		} else {
			mergedSettings.push(setting);
		}
	}

	// For tool servers, project overrides user by name
	const mergedServers = [...base.toolServers];
	for (const server of override.toolServers) {
		const idx = mergedServers.findIndex((s) => s.name === server.name);
		if (idx >= 0) {
			mergedServers[idx] = server;
		} else {
			mergedServers.push(server);
		}
	}

	return {
		directives: [...base.directives, ...override.directives],
		skills: [...base.skills, ...override.skills],
		agents: [...base.agents, ...override.agents],
		toolServers: mergedServers,
		hooks: [...base.hooks, ...override.hooks],
		permissions: [...base.permissions, ...override.permissions],
		settings: mergedSettings,
		ignorePatterns: [...base.ignorePatterns, ...override.ignorePatterns],
	};
}

/** Validate a ProjectConfig and return errors. */
export function validateConfig(config: ProjectConfig): ValidationResult {
	const errors: ConfigError[] = [];

	for (const d of config.directives) {
		if (!d.content.trim()) {
			errors.push({ file: "directives", message: "Directive has empty content" });
		}
	}

	for (const s of config.skills) {
		if (!s.name.trim()) {
			errors.push({ file: "skills", message: "Skill has empty name" });
		}
		if (!s.content.trim()) {
			errors.push({ file: `skills/${s.name}`, message: "Skill has empty content" });
		}
	}

	const validPermissionModes = ["default", "acceptEdits", "dontAsk", "bypassPermissions", "plan"];
	const validMemoryScopes = ["user", "project", "local"];

	for (const a of config.agents) {
		if (!a.name.trim()) {
			errors.push({ file: "agents", message: "Agent has empty name" });
		}
		if (!a.instructions.trim()) {
			errors.push({ file: `agents/${a.name}`, message: "Agent has empty instructions" });
		}
		if (a.permissionMode && !validPermissionModes.includes(a.permissionMode)) {
			errors.push({
				file: `agents/${a.name}`,
				message: `Invalid permissionMode "${a.permissionMode}" — must be one of: ${validPermissionModes.join(", ")}`,
			});
		}
		if (a.memory && !validMemoryScopes.includes(a.memory)) {
			errors.push({
				file: `agents/${a.name}`,
				message: `Invalid memory "${a.memory}" — must be one of: ${validMemoryScopes.join(", ")}`,
			});
		}
		const validReasoningEfforts = ["low", "medium", "high"];
		if (a.modelReasoningEffort && !validReasoningEfforts.includes(a.modelReasoningEffort)) {
			errors.push({
				file: `agents/${a.name}`,
				message: `Invalid modelReasoningEffort "${a.modelReasoningEffort}" — must be one of: ${validReasoningEfforts.join(", ")}`,
			});
		}
		if (a.maxTurns !== undefined && (!Number.isInteger(a.maxTurns) || a.maxTurns <= 0)) {
			errors.push({
				file: `agents/${a.name}`,
				message: `maxTurns must be a positive integer, got ${a.maxTurns}`,
			});
		}
	}

	for (const ts of config.toolServers) {
		if (!ts.name.trim()) {
			errors.push({ file: "config.yaml", message: "ToolServer has empty name" });
		}
		if (ts.transport === "stdio" && !ts.command) {
			errors.push({
				file: "config.yaml",
				message: `ToolServer "${ts.name}" uses stdio transport but has no command`,
			});
		}
		if ((ts.transport === "http" || ts.transport === "sse") && !ts.url) {
			errors.push({
				file: "config.yaml",
				message: `ToolServer "${ts.name}" uses ${ts.transport} transport but has no url`,
			});
		}
	}

	for (const p of config.permissions) {
		if (!p.tool.trim()) {
			errors.push({ file: "config.yaml", message: "Permission has empty tool" });
		}
	}

	return { valid: errors.length === 0, errors };
}
