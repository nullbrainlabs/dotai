import { homedir } from "node:os";
import { join } from "node:path";
import { loadMergedConfig, loadProjectConfig } from "../config/loader.js";
import type { ConfigScope, ProjectConfig } from "../config/schema.js";
import { validateConfig } from "../config/schema.js";
import { ALL_TARGETS, type TargetTool } from "../emitters/types.js";

/** Validate config and warn about unsupported features per target. */
export async function runCheck(projectDir: string, scope: ConfigScope = "project"): Promise<void> {
	const isUserScope = scope === "user";
	const label = isUserScope ? "~/.ai/" : ".ai/";

	console.log(`Checking ${label} configuration...\n`);

	// Load
	const { config, errors: loadErrors } = isUserScope
		? await loadProjectConfig(join(homedir(), ".ai"), "user")
		: await loadMergedConfig(projectDir);

	if (loadErrors.length > 0) {
		console.error("\x1b[31mLoad errors:\x1b[0m");
		for (const err of loadErrors) {
			console.error(`  ${err.file}${err.line ? `:${err.line}` : ""}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	// Validate
	const { valid, errors: valErrors } = validateConfig(config);
	if (!valid) {
		console.error("\x1b[31mValidation errors:\x1b[0m");
		for (const err of valErrors) {
			console.error(`  ${err.file}: ${err.message}`);
		}
		process.exitCode = 1;
		return;
	}

	console.log("\x1b[32m✓\x1b[0m Config is valid\n");

	// Summary
	printSummary(config);

	// Per-target compatibility
	console.log("\n\x1b[1mTarget compatibility:\x1b[0m\n");
	for (const target of ALL_TARGETS) {
		checkTarget(config, target);
	}
}

function printSummary(config: ProjectConfig): void {
	const counts = [
		["Rules", config.rules.length],
		["Skills", config.skills.length],
		["Agents", config.agents.length],
		["MCP Servers", config.toolServers.length],
		["Permissions", config.permissions.length],
		["Settings", config.settings.length],
		["Hooks", config.hooks.length],
		["Ignore patterns", config.ignorePatterns.length],
	] as const;

	console.log("\x1b[1mConfig summary:\x1b[0m");
	for (const [label, count] of counts) {
		if (count > 0) {
			console.log(`  ${label}: ${count}`);
		}
	}
}

function checkTarget(config: ProjectConfig, target: TargetTool): void {
	const warnings: string[] = [];

	if (target === "codex") {
		if (config.hooks.length > 0) {
			warnings.push("Hooks are not supported — will be skipped");
		}
		if (config.permissions.length > 0) {
			warnings.push("Per-tool permissions are lossy — mapped to approval_policy");
		}
		if (config.rules.some((d) => d.appliesTo?.length)) {
			warnings.push("File-scoped rules are not enforced — included as notes only");
		}
		if (config.agents.some((a) => a.tools?.length)) {
			warnings.push("Per-agent tool restrictions are not supported");
		}
	}

	if (target === "cursor") {
		if (config.hooks.length > 0) {
			warnings.push("Hook support is limited — hooks not directly emitted");
		}
	}

	const icon = warnings.length > 0 ? "\x1b[33m⚠\x1b[0m" : "\x1b[32m✓\x1b[0m";
	console.log(`  ${icon} ${target}`);
	for (const w of warnings) {
		console.log(`    - ${w}`);
	}
}
