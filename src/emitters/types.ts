import type { ProjectConfig } from "../config/schema.js";

/** Target AI tool for config generation. */
export const TargetTool = {
	Claude: "claude",
	Cursor: "cursor",
	Codex: "codex",
	Copilot: "copilot",
} as const;

export type TargetTool = (typeof TargetTool)[keyof typeof TargetTool];

/** All supported target tools. */
export const ALL_TARGETS: readonly TargetTool[] = [
	TargetTool.Claude,
	TargetTool.Cursor,
	TargetTool.Codex,
	TargetTool.Copilot,
];

/** A file written by an emitter. */
export interface EmittedFile {
	/** Relative path from the project root. */
	path: string;
	/** File content. */
	content: string;
}

/** Result of an emit operation. */
export interface EmitResult {
	/** Files that were written (or would be written in dry-run). */
	files: EmittedFile[];
	/** Warnings about lossy mappings or unsupported features. */
	warnings: string[];
}

/** Interface that all emitters implement. */
export interface Emitter {
	/** Emit config files for a specific target tool. */
	emit(config: ProjectConfig, target: TargetTool): EmitResult;
}
