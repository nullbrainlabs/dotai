import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, Emitter, TargetTool } from "../types.js";
import { emitClaude } from "./claude.js";
import { emitCodex } from "./codex.js";
import { emitCopilot } from "./copilot.js";
import { emitCursor } from "./cursor.js";

/** Emits permissions and settings configuration files. */
export const permissionsEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.permissions, config.settings);
			case "cursor":
				return emitCursor(config.permissions, config.settings);
			case "codex":
				return emitCodex(config.permissions, config.settings);
			case "copilot":
				return emitCopilot(config.permissions, config.settings);
		}
	},
};
