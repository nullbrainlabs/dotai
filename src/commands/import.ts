import { runImport } from "../import/runner.js";
import type { SourceTool } from "../import/scanner.js";
import { scanForConfigs } from "../import/scanner.js";
import { cancelGuard, intro, isTTY, multiselect, outro } from "../tui.js";

/** Options for the import command. */
export interface ImportCommandOptions {
	source?: SourceTool;
}

/** Import existing AI tool configs into .ai/ format. */
export async function runImportCommand(
	projectDir: string,
	options?: ImportCommandOptions,
): Promise<void> {
	if (isTTY()) {
		await interactiveImport(projectDir, options);
	} else {
		await nonInteractiveImport(projectDir, options);
	}
}

async function interactiveImport(
	projectDir: string,
	options?: ImportCommandOptions,
): Promise<void> {
	intro("dotai import — detect and import existing configs");

	const detected = await scanForConfigs(projectDir);
	const filtered = options?.source ? detected.filter((f) => f.source === options.source) : detected;

	if (filtered.length === 0) {
		outro("No existing config files found.");
		return;
	}

	const result = await runImport(projectDir, {
		interactive: true,
		sourceFilter: options?.source,
		selectFiles: async (files) => {
			const selected = cancelGuard(
				await multiselect({
					message: "Select files to import:",
					options: files.map((f) => ({
						value: f.relativePath,
						label: f.label,
						hint: f.source,
					})),
					required: true,
				}),
			) as string[];
			return files.filter((f) => selected.includes(f.relativePath));
		},
	});

	if (result.imported.length === 0) {
		outro("Nothing imported.");
		return;
	}

	console.log(`\n  \x1b[32m✓\x1b[0m Imported ${result.imported.length} file(s):`);
	for (const f of result.imported) {
		console.log(`    ${f.label}`);
	}
	console.log(`\n  Wrote ${result.filesWritten.length} file(s) to .ai/`);

	outro("Run dotai sync to generate tool configs from imported settings.");
}

async function nonInteractiveImport(
	projectDir: string,
	options?: ImportCommandOptions,
): Promise<void> {
	const result = await runImport(projectDir, {
		interactive: false,
		sourceFilter: options?.source,
	});

	if (result.detected.length === 0) {
		console.log("No existing config files found.");
		return;
	}

	if (result.imported.length === 0) {
		console.log("No files to import.");
		return;
	}

	console.log(`\x1b[32m✓\x1b[0m Imported ${result.imported.length} file(s):`);
	for (const f of result.imported) {
		console.log(`  ${f.label}`);
	}
	console.log(`\nWrote ${result.filesWritten.length} file(s) to .ai/`);
	console.log("\nNext: run \x1b[1mdotai sync\x1b[0m to generate tool configs.");
}
