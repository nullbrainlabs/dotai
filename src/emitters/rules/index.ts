import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, Emitter, TargetTool } from "../types.js";
import { emitClaude } from "./claude.js";
import { emitCodex } from "./codex.js";
import { emitCopilot } from "./copilot.js";
import { emitCursor } from "./cursor.js";

/** Emits rule files — biggest format divergence across tools. */
export const rulesEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.rules);
			case "cursor":
				return emitCursor(config.rules);
			case "codex":
				return emitCodex(config.rules);
			case "copilot":
				return emitCopilot(config.rules);
		}
	},
};
