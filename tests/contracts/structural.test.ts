import { parse as parseTOML } from "smol-toml";
import { describe, expect, it } from "vitest";
import type { ProjectConfig } from "../../src/config/schema.js";
import type { TargetTool } from "../../src/emitters/types.js";
import { advancedConfig, kitchenSinkConfig } from "./configs.js";
import { emitAllForTarget } from "./helpers.js";

function findFile(files: { path: string; content: string }[], path: string) {
	return files.find((f) => f.path === path);
}

function parseJSON(content: string): Record<string, unknown> {
	return JSON.parse(content) as Record<string, unknown>;
}

describe("structural validation", () => {
	const configs: [string, ProjectConfig][] = [
		["kitchen-sink", kitchenSinkConfig()],
		["advanced", advancedConfig()],
	];

	describe.each(configs)("%s", (_name, config) => {
		describe("claude", () => {
			const files = emitAllForTarget(config, "claude" as TargetTool);

			it(".claude/settings.json has valid structure", () => {
				const file = findFile(files, ".claude/settings.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				// Must have at least permissions or hooks
				const hasPermissions = "permissions" in parsed;
				const hasHooks = "hooks" in parsed;
				expect(hasPermissions || hasHooks).toBe(true);

				if (hasPermissions) {
					const perms = parsed.permissions as Record<string, unknown>;
					expect("allow" in perms || "deny" in perms || "ask" in perms).toBe(true);
				}
			});

			it(".mcp.json has valid structure", () => {
				const file = findFile(files, ".mcp.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				expect(parsed).toHaveProperty("mcpServers");
				const servers = parsed.mcpServers as Record<string, unknown>;
				for (const entry of Object.values(servers)) {
					const server = entry as Record<string, unknown>;
					expect("command" in server || "url" in server).toBe(true);
				}
			});
		});

		describe("cursor", () => {
			const files = emitAllForTarget(config, "cursor" as TargetTool);

			it(".cursor/mcp.json has valid structure", () => {
				const file = findFile(files, ".cursor/mcp.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				expect(parsed).toHaveProperty("mcpServers");
				const servers = parsed.mcpServers as Record<string, unknown>;
				for (const entry of Object.values(servers)) {
					const server = entry as Record<string, unknown>;
					expect("command" in server || "url" in server).toBe(true);
				}
			});

			it(".cursor/cli.json has valid structure", () => {
				const file = findFile(files, ".cursor/cli.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				expect(parsed).toHaveProperty("permissions");
				const perms = parsed.permissions as Record<string, unknown>;
				expect("allow" in perms || "deny" in perms).toBe(true);
			});
		});

		describe("codex", () => {
			const files = emitAllForTarget(config, "codex" as TargetTool);

			it(".codex/config.toml parses as valid TOML", () => {
				const file = findFile(files, ".codex/config.toml");
				if (!file) return;
				const parsed = parseTOML(file.content);
				// Should have at least one known section
				const hasMcp = "mcp_servers" in parsed;
				const hasAgents = "agents" in parsed;
				expect(hasMcp || hasAgents || Object.keys(parsed).length > 0).toBe(true);
			});

			it(".codex/agents/*.toml files parse as valid TOML", () => {
				const agentFiles = files.filter(
					(f) => f.path.startsWith(".codex/agents/") && f.path.endsWith(".toml"),
				);
				for (const file of agentFiles) {
					const parsed = parseTOML(file.content);
					expect(Object.keys(parsed).length).toBeGreaterThan(0);
				}
			});
		});

		describe("copilot", () => {
			const files = emitAllForTarget(config, "copilot" as TargetTool);

			it(".vscode/mcp.json has valid structure", () => {
				const file = findFile(files, ".vscode/mcp.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				expect(parsed).toHaveProperty("servers");
				const servers = parsed.servers as Record<string, unknown>;
				for (const entry of Object.values(servers)) {
					const server = entry as Record<string, unknown>;
					expect(server).toHaveProperty("type");
				}
			});

			it(".github/hooks/hooks.json has valid structure", () => {
				const file = findFile(files, ".github/hooks/hooks.json");
				if (!file) return;
				const parsed = parseJSON(file.content);
				expect(parsed).toHaveProperty("version", 1);
				expect(parsed).toHaveProperty("hooks");
			});
		});
	});
});
