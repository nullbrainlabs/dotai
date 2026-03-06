import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { mcpEmitter } from "../../../src/emitters/mcp/index.js";

describe("mcpEmitter — codex", () => {
	it("emits .codex/config.toml", () => {
		const config = emptyConfig();
		config.toolServers.push(
			{
				name: "github",
				transport: "stdio",
				command: "npx",
				args: ["@modelcontextprotocol/server-github"],
				// biome-ignore lint/suspicious/noTemplateCurlyInString: intentional env var placeholder
				env: { GITHUB_TOKEN: "${GITHUB_TOKEN}" },
				scope: "project",
			},
			{
				name: "remote",
				transport: "http",
				url: "https://mcp.example.com",
				scope: "project",
			},
		);

		const result = mcpEmitter.emit(config, "codex");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".codex/config.toml");
		expect(result.files[0].content).toContain("[mcp_servers.github]");
		expect(result.files[0].content).toContain('command = "npx"');
		expect(result.files[0].content).toContain("[mcp_servers.remote]");
		expect(result.files[0].content).toContain('url = "https://mcp.example.com"');
	});
});
