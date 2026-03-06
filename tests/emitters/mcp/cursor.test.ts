import { describe, expect, it } from "vitest";
import { emptyConfig } from "../../../src/config/schema.js";
import { mcpEmitter } from "../../../src/emitters/mcp/index.js";

describe("mcpEmitter — cursor", () => {
	it("emits .cursor/mcp.json", () => {
		const config = emptyConfig();
		config.toolServers.push({
			name: "github",
			transport: "stdio",
			command: "npx",
			args: ["@modelcontextprotocol/server-github"],
			scope: "project",
		});

		const result = mcpEmitter.emit(config, "cursor");
		expect(result.files).toHaveLength(1);
		expect(result.files[0].path).toBe(".cursor/mcp.json");

		const parsed = JSON.parse(result.files[0].content);
		expect(parsed.mcpServers.github.command).toBe("npx");
	});
});
