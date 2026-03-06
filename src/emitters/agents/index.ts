import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, Emitter, TargetTool } from "../types.js";
import { emitClaudeAgents } from "./claude.js";
import { emitCodexAgents } from "./codex.js";
import { emitCopilotAgents } from "./copilot.js";
import { emitCursorAgents } from "./cursor.js";

/** Emits agent definition files. */
export const agentsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaudeAgents(config.agents);
			case "cursor":
				return emitCursorAgents(config.agents);
			case "codex":
				return emitCodexAgents(config.agents);
			case "copilot":
				return emitCopilotAgents(config.agents);
		}
	},
};
