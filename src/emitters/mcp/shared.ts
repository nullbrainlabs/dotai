import type { ToolServer } from "../../domain/tool-server.js";

export function buildMcpEntry(server: ToolServer): Record<string, unknown> {
	const entry: Record<string, unknown> = {};

	if (server.transport === "stdio") {
		entry.command = server.command;
		if (server.args?.length) entry.args = server.args;
	} else {
		entry.type = server.transport;
		entry.url = server.url;
		if (server.headers && Object.keys(server.headers).length > 0) {
			entry.headers = server.headers;
		}
		if (server.oauth) {
			entry.oauth = server.oauth;
		}
	}

	if (server.env && Object.keys(server.env).length > 0) {
		entry.env = server.env;
	}

	return entry;
}
