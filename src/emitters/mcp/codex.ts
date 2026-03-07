import type { ToolServer } from "../../domain/tool-server.js";
import { tomlString } from "../toml-utils.js";
import type { EmitResult, EmittedFile } from "../types.js";

/** Codex: .codex/config.toml with `[mcp_servers.<name>]` sections */
export function emitCodexMcp(servers: ToolServer[]): EmitResult {
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

	return { files, warnings };
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

	if (server.enabledTools?.length) {
		lines.push(`enabled_tools = [${server.enabledTools.map(tomlString).join(", ")}]`);
	}
	if (server.disabledTools?.length) {
		lines.push(`disabled_tools = [${server.disabledTools.map(tomlString).join(", ")}]`);
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
