import { EMITTERS } from "../../src/commands/sync.js";
import type { ProjectConfig } from "../../src/config/schema.js";
import { mergeFiles } from "../../src/emitters/merge.js";
import type { EmittedFile, TargetTool } from "../../src/emitters/types.js";

/** Run all emitters for a target and merge the results, mirroring the sync pipeline. */
export function emitAllForTarget(config: ProjectConfig, target: TargetTool): EmittedFile[] {
	const allFiles: EmittedFile[] = [];
	for (const emitter of EMITTERS) {
		allFiles.push(...emitter.emit(config, target).files);
	}
	return mergeFiles(allFiles);
}

/** Convert a file path to a safe snapshot filename. */
export function sanitizePath(path: string): string {
	return path.replaceAll("/", "--");
}
