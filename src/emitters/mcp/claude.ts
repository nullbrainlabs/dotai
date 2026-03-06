import type { ToolServer } from "../../domain/tool-server.js";
import type { EmitResult, EmittedFile } from "../types.js";
import { buildMcpEntry } from "./shared.js";

/** Claude Code: .mcp.json with `{ mcpServers: { <name>: { command, args, env } } }` */
export function emitClaudeMcp(servers: ToolServer[]): EmitResult {
	const files: EmittedFile[] = [];
	const warnings: string[] = [];

	if (servers.length === 0) return { files, warnings };

	const mcpServers: Record<string, unknown> = {};
	for (const server of servers) {
		mcpServers[server.name] = buildMcpEntry(server);
		if (server.transport === "sse") {
			warnings.push(
				`MCP server "${server.name}" uses SSE transport which is deprecated — consider migrating to HTTP (Streamable HTTP).`,
			);
		}
	}

	files.push({
		path: ".mcp.json",
		content: `${JSON.stringify({ mcpServers }, null, 2)}\n`,
	});

	return { files, warnings };
}
