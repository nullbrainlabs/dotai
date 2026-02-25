import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../src/config/schema.js";
import { mcpEmitter } from "../../src/emitters/mcp.js";

describe("mcpEmitter", () => {
	const makeConfig = () => {
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
		return config;
	};

	describe("Claude", () => {
		it("emits .mcp.json", () => {
			const result = mcpEmitter.emit(makeConfig(), "claude");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".mcp.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.mcpServers.github.command).toBe("npx");
			expect(parsed.mcpServers.github.args).toEqual(["@modelcontextprotocol/server-github"]);
			expect(parsed.mcpServers.remote.url).toBe("https://mcp.example.com");
		});

		it("emits headers for non-stdio servers", () => {
			const config = emptyConfig();
			config.toolServers.push({
				name: "authed",
				transport: "http",
				url: "https://mcp.example.com",
				headers: { Authorization: "Bearer token123" },
				scope: "project",
			});
			const result = mcpEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.mcpServers.authed.headers).toEqual({
				Authorization: "Bearer token123",
			});
		});

		it("emits oauth for non-stdio servers", () => {
			const config = emptyConfig();
			config.toolServers.push({
				name: "oauth-server",
				transport: "http",
				url: "https://mcp.example.com",
				oauth: { clientId: "my-client", callbackPort: 8080 },
				scope: "project",
			});
			const result = mcpEmitter.emit(config, "claude");
			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.mcpServers["oauth-server"].oauth).toEqual({
				clientId: "my-client",
				callbackPort: 8080,
			});
		});

		it("warns when server uses SSE transport", () => {
			const config = emptyConfig();
			config.toolServers.push({
				name: "legacy",
				transport: "sse",
				url: "https://mcp.example.com/sse",
				scope: "project",
			});
			const result = mcpEmitter.emit(config, "claude");
			expect(result.warnings.some((w) => w.includes("SSE") && w.includes("deprecated"))).toBe(true);
		});
	});

	describe("Cursor", () => {
		it("emits .cursor/mcp.json", () => {
			const result = mcpEmitter.emit(makeConfig(), "cursor");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".cursor/mcp.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.mcpServers.github.command).toBe("npx");
		});
	});

	describe("Codex", () => {
		it("emits .codex/config.toml", () => {
			const result = mcpEmitter.emit(makeConfig(), "codex");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".codex/config.toml");
			expect(result.files[0].content).toContain("[mcp_servers.github]");
			expect(result.files[0].content).toContain('command = "npx"');
			expect(result.files[0].content).toContain("[mcp_servers.remote]");
			expect(result.files[0].content).toContain('url = "https://mcp.example.com"');
		});
	});

	describe("Copilot", () => {
		it("emits .vscode/mcp.json with explicit type field", () => {
			const result = mcpEmitter.emit(makeConfig(), "copilot");
			expect(result.files).toHaveLength(1);
			expect(result.files[0].path).toBe(".vscode/mcp.json");

			const parsed = JSON.parse(result.files[0].content);
			expect(parsed.mcpServers.github.command).toBe("npx");
			expect(parsed.mcpServers.github.type).toBe("stdio");
			expect(parsed.mcpServers.remote.type).toBe("http");
			expect(parsed.mcpServers.remote.url).toBe("https://mcp.example.com");
		});

		it("warns about coding agent MCP", () => {
			const result = mcpEmitter.emit(makeConfig(), "copilot");
			expect(result.warnings.some((w) => w.includes("repo settings"))).toBe(true);
		});
	});

	it("returns empty for no servers", () => {
		const config = emptyConfig();
		const result = mcpEmitter.emit(config, "claude");
		expect(result.files).toHaveLength(0);
	});
});
