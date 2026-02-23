import type { ProjectConfig } from "../config/schema.js";
import type { ToolServer } from "../domain/tool-server.js";
import type { EmitResult, EmittedFile, Emitter, TargetTool } from "./types.js";

/** Emits MCP server configuration files. */
export const mcpEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaudeMcp(config.toolServers);
			case "cursor":
				return emitCursorMcp(config.toolServers);
			case "codex":
				return emitCodexMcp(config.toolServers);
			case "copilot":
				return emitCopilotMcp(config.toolServers);
		}
	},
};

/** Claude Code: .mcp.json with `{ mcpServers: { <name>: { command, args, env } } }` */
function emitClaudeMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const mcpServers: Record<string, unknown> = {};
	for (const server of servers) {
		mcpServers[server.name] = buildMcpEntry(server);
	}

	files.push({
		path: ".mcp.json",
		content: `${JSON.stringify({ mcpServers }, null, 2)}\n`,
	});

	return { files, warnings };
}

/** Cursor: .cursor/mcp.json (same JSON format as Claude Code) */
function emitCursorMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const mcpServers: Record<string, unknown> = {};
	for (const server of servers) {
		mcpServers[server.name] = buildMcpEntry(server);
	}

	files.push({
		path: ".cursor/mcp.json",
		content: `${JSON.stringify({ mcpServers }, null, 2)}\n`,
	});

	return { files, warnings };
}

/** Codex: .codex/config.toml with `[mcp_servers.<name>]` sections */
function emitCodexMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const sections: string[] = [];
	for (const server of servers) {
		sections.push(buildTomlSection(server));
	}

	files.push({
		path: ".codex/config.toml",
		content: `${sections.join("\n\n")}\n`,
	});

	if (servers.some((s) => s.enabledTools?.length || s.disabledTools?.length)) {
		warnings.push(
			"Codex config.toml does not support enabledTools/disabledTools filtering for MCP servers.",
		);
	}

	return { files, warnings };
}

/** Copilot: .vscode/mcp.json — same JSON format but with explicit type field */
function emitCopilotMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const mcpServers: Record<string, unknown> = {};
	for (const server of servers) {
		const entry = buildMcpEntry(server);
		// Copilot requires explicit type field for all transports
		if (!entry.type) {
			entry.type = "stdio";
		}
		mcpServers[server.name] = entry;
	}

	files.push({
		path: ".vscode/mcp.json",
		content: `${JSON.stringify({ mcpServers }, null, 2)}\n`,
	});

	warnings.push(
		"Copilot coding agent MCP must be configured in GitHub repo settings separately — .vscode/mcp.json is for VS Code Copilot Chat only.",
	);

	return { files, warnings };
}

function buildMcpEntry(server: ToolServer): Record<string, unknown> {
	const entry: Record<string, unknown> = {};

	if (server.transport === "stdio") {
		entry.command = server.command;
		if (server.args?.length) entry.args = server.args;
	} else {
		entry.type = server.transport;
		entry.url = server.url;
	}

	if (server.env && Object.keys(server.env).length > 0) {
		entry.env = server.env;
	}

	return entry;
}

function buildTomlSection(server: ToolServer): string {
	const lines: string[] = [`[mcp_servers.${server.name}]`];

	if (server.transport === "stdio") {
		lines.push(`type = "stdio"`);
		if (server.command) lines.push(`command = ${tomlString(server.command)}`);
		if (server.args?.length) {
			lines.push(`args = [${server.args.map(tomlString).join(", ")}]`);
		}
	} else {
		lines.push(`type = ${tomlString(server.transport)}`);
		if (server.url) lines.push(`url = ${tomlString(server.url)}`);
	}

	if (server.env && Object.keys(server.env).length > 0) {
		lines.push("");
		lines.push(`[mcp_servers.${server.name}.env]`);
		for (const [key, value] of Object.entries(server.env)) {
			lines.push(`${key} = ${tomlString(value)}`);
		}
	}

	return lines.join("\n");
}

function tomlString(s: string): string {
	return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
