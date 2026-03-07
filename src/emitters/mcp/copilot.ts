import type { ToolServer } from "../../domain/tool-server.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { buildMcpEntry } from "./shared.js";

/** Copilot: .vscode/mcp.json — same JSON format but with explicit type field */
export function emitCopilotMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const servers_: Record<string, unknown> = {};
	for (const server of servers) {
		const entry = buildMcpEntry(server);
		// Copilot requires explicit type field for all transports
		if (!entry.type) {
			entry.type = "stdio";
		}
		servers_[server.name] = entry;
	}

	files.push({
		path: ".vscode/mcp.json",
		content: `${JSON.stringify({ servers: servers_ }, null, 2)}\n`,
	});

	warnings.push(
		"Copilot coding agent MCP must be configured in GitHub repo settings separately — .vscode/mcp.json is for VS Code Copilot Chat only. The 'tools' field is now required in Coding Agent MCP config. Use COPILOT_MCP_<NAME> variables for secrets.",
	);

	return { files, warnings };
}
