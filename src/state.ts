import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { EmittedFile } from "./emitters/types.js";

/** Persisted state of last sync operation. */
export interface SyncState {
	/** Timestamp of last sync. */
	lastSync: string;
	/** Map of relative file path → content hash. */
	files: Record<string, string>;
}

const STATE_FILE = ".ai/.state.json";

/** Compute a content hash for a string. */
export function contentHash(content: string): string {
	return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/** Load the sync state from .ai/.state.json. */
export async function loadState(projectDir: string): Promise<SyncState | null> {
	try {
		const raw = await readFile(join(projectDir, STATE_FILE), "utf-8");
		return JSON.parse(raw) as SyncState;
	} catch {
		return null;
	}
}

/** Save the sync state to .ai/.state.json. */
export async function saveState(projectDir: string, files: EmittedFile[]): Promise<void> {
	const state: SyncState = {
		lastSync: new Date().toISOString(),
		files: {},
	};

	for (const file of files) {
		state.files[file.path] = contentHash(file.content);
	}

	await writeFile(join(projectDir, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`, "utf-8");
}

/** Status of a generated file compared to what's on disk. */
export type FileStatus = "new" | "up-to-date" | "modified" | "conflict" | "orphaned";

/** Result of comparing a file. */
export interface FileStatusEntry {
	path: string;
	status: FileStatus;
}

/**
 * Compare generated files against on-disk state and last-known state.
 * Returns status for each file plus any orphaned files from previous sync.
 */
export async function diffFiles(
	projectDir: string,
	generated: EmittedFile[],
	state: SyncState | null,
): Promise<FileStatusEntry[]> {
	const entries: FileStatusEntry[] = [];
	const seenPaths = new Set<string>();

	for (const file of generated) {
		seenPaths.add(file.path);
		const generatedHash = contentHash(file.content);

		// Read what's on disk
		let diskContent: string | null = null;
		try {
			diskContent = await readFile(join(projectDir, file.path), "utf-8");
		} catch {
			// File doesn't exist on disk
		}

		if (diskContent === null) {
			// File doesn't exist on disk
			entries.push({ path: file.path, status: "new" });
			continue;
		}

		const diskHash = contentHash(diskContent);
		const lastKnownHash = state?.files[file.path];

		if (diskHash === generatedHash) {
			// Disk matches what we'd generate
			entries.push({ path: file.path, status: "up-to-date" });
		} else if (!lastKnownHash) {
			// No previous state — file existed but differs from what we'd generate
			entries.push({ path: file.path, status: "conflict" });
		} else if (diskHash === lastKnownHash) {
			// Disk matches our last sync, but config has changed — safe to update
			entries.push({ path: file.path, status: "modified" });
		} else {
			// Disk was manually edited since last sync AND config changed — conflict
			entries.push({ path: file.path, status: "conflict" });
		}
	}

	// Check for orphaned files (in state but not in generated)
	if (state) {
		for (const path of Object.keys(state.files)) {
			if (!seenPaths.has(path)) {
				entries.push({ path, status: "orphaned" });
			}
		}
	}

	return entries;
}
