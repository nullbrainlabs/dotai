import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { mcpEmitter } from "../../../src/emitters/mcp/index.js";

describe("mcpEmitter — copilot", () => {
	it("emits .vscode/mcp.json with servers key and explicit type field", () => {
		const config = emptyConfig();
		config.toolServers.push(
			{
				name: "github",
				transport: "stdio",
				command: "npx",
				args: ["@modelcontextprotocol/server-github"],
				scope: "project",
			},
			{
				name: "remote",
				transport: "http",
				url: "https://mcp.example.com",
				scope: "project",
			},
		);

		const result = mcpEmitter.emit(config, "copilot");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".vscode/mcp.json");

		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.servers.github.command).toBe("npx");
		expect(parsed.servers.github.type).toBe("stdio");
		expect(parsed.servers.remote.type).toBe("http");
		expect(parsed.servers.remote.url).toBe("https://mcp.example.com");
		expect(parsed.mcpServers).toBeUndefined();
	});

	it("warns about coding agent MCP", () => {
		const config = emptyConfig();
		config.toolServers.push({
			name: "github",
			transport: "stdio",
			command: "npx",
			args: ["@modelcontextprotocol/server-github"],
			scope: "project",
		});

		const result = mcpEmitter.emit(config, "copilot");
		expect(result.warnings.some((w) => w.includes("repo settings"))).toBe(true);
	});
});
