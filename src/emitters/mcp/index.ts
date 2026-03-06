import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, Emitter, TargetTool } from "../types.js";
import { emitClaudeMcp } from "./claude.js";
import { emitCodexMcp } from "./codex.js";
import { emitCopilotMcp } from "./copilot.js";
import { emitCursorMcp } from "./cursor.js";

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
