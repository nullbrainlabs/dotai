// test hook trigger
import type { ProjectConfig } from "../../config/schema.js";
import type { EmitResult, Emitter, TargetTool } from "../types.js";
import { emitClaude } from "./claude.js";
import { emitCodex } from "./codex.js";
import { emitCopilot } from "./copilot.js";
import { emitCursor } from "./cursor.js";

/** Emits hooks and ignore pattern configuration files. */
export const hooksEmitter: Emitter = {
	emit(config: ProjectConfig, target: TargetTool): EmitResult {
		switch (target) {
			case "claude":
				return emitClaude(config.hooks, config.ignorePatterns);
			case "cursor":
				return emitCursor(config.hooks, config.ignorePatterns);
			case "codex":
				return emitCodex(config.hooks, config.ignorePatterns);
			case "copilot":
				return emitCopilot(config.hooks, config.ignorePatterns);
		}
	},
};
