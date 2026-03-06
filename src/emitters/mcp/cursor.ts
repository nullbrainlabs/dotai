import type { ToolServer } from "../../domain/tool-server.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { buildMcpEntry } from "./shared.js";

/** Cursor: .cursor/mcp.json (same JSON format as Claude Code) */
export function emitCursorMcp(servers: ToolServer[]): EmitResult {
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
