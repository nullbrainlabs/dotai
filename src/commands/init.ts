import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TargetTool } from "../emitters/types.js";
import { runImport } from "../import/runner.js";
import { scanForConfigs } from "../import/scanner.js";
import { writeProjectConfig } from "../import/writer.js";
import type { TemplateName } from "../templates/index.js";
import { getTemplate, TEMPLATES } from "../templates/index.js";
import { cancelGuard, confirm, intro, isTTY, multiselect, outro, select } from "../tui.js";
import { runSync } from "./sync.js";

/** Options for the init command. */
export interface InitOptions {
	template?: TemplateName;
	targets?: TargetTool[];
	skipImport?: boolean;
	autoSync?: boolean;
}

/** Scaffold a new `.ai/` directory with guided setup or flags. */
export async function runInit(projectDir: string, options?: InitOptions): Promise<void> {
	if (isTTY() && !options?.template) {
		await interactiveInit(projectDir, options);
	} else {
		await nonInteractiveInit(projectDir, options);
	}
}

async function interactiveInit(projectDir: string, options?: InitOptions): Promise<void> {
	intro("dotai — universal AI tool config");

	const aiDir = join(projectDir, ".ai");
	if (existsSync(aiDir)) {
		const proceed = cancelGuard(
			await confirm({ message: ".ai/ directory already exists. Reinitialize?" }),
		);
		if (!proceed) {
			outro("Keeping existing .ai/ directory.");
			return;
		}
	}

	// Select target tools
	const targets = cancelGuard(
		await multiselect({
			message: "Which AI tools do you use?",
			options: [
				{ value: "claude", label: "Claude Code" },
				{ value: "cursor", label: "Cursor" },
				{ value: "codex", label: "Codex" },
			],
			required: true,
		}),
	) as TargetTool[];

	// Select template
	const templateName = cancelGuard(
		await select({
			message: "Start from a template?",
			options: TEMPLATES.map((t) => ({
				value: t.name,
				label: t.label,
				hint: t.description,
			})),
		}),
	) as TemplateName;

	// Build and write template config
	const config = getTemplate(templateName);
	const written = await writeProjectConfig(aiDir, config);
	console.log(`\n  \x1b[32m✓\x1b[0m Created .ai/ from "${templateName}" template`);
	for (const f of written) {
		const rel = f.replace(`${projectDir}/`, "");
		console.log(`    ${rel}`);
	}

	// Auto-scan for existing configs
	if (!options?.skipImport) {
		const detected = await scanForConfigs(projectDir);
		if (detected.length > 0) {
			const doImport = cancelGuard(
				await confirm({
					message: `Found ${detected.length} existing config file(s). Import them?`,
				}),
			);

			if (doImport) {
				const result = await runImport(projectDir, {
					interactive: false,
				});
				if (result.imported.length > 0) {
					console.log(`\n  \x1b[32m✓\x1b[0m Imported ${result.imported.length} file(s)`);
					for (const f of result.imported) {
						console.log(`    ${f.label}`);
					}
				}
			}
		}
	}

	// Offer to sync
	const doSync = cancelGuard(await confirm({ message: "Run dotai sync now?" }));

	if (doSync) {
		console.log("");
		await runSync(projectDir, { targets, dryRun: false, scope: "project", force: false });
	}

	outro("Done! Edit .ai/ to customize, then run dotai sync.");
}

async function nonInteractiveInit(projectDir: string, options?: InitOptions): Promise<void> {
	const aiDir = join(projectDir, ".ai");
	const templateName = options?.template ?? "blank";
	const config = getTemplate(templateName);
	const written = await writeProjectConfig(aiDir, config);

	console.log(`\x1b[32m✓\x1b[0m Initialized .ai/ from "${templateName}" template`);
	for (const f of written) {
		const rel = f.replace(`${projectDir}/`, "");
		console.log(`  ${rel}`);
	}

	// Auto-import unless skipped
	if (!options?.skipImport) {
		const detected = await scanForConfigs(projectDir);
		if (detected.length > 0) {
			const result = await runImport(projectDir, {
				interactive: false,
			});
			if (result.imported.length > 0) {
				console.log(`\x1b[32m✓\x1b[0m Imported ${result.imported.length} existing config file(s)`);
			}
		}
	}

	// Auto-sync if requested
	if (options?.autoSync) {
		const targets = options.targets ?? [];
		await runSync(projectDir, { targets, dryRun: false, scope: "project", force: false });
	}

	if (!options?.autoSync) {
		console.log("\nNext: run \x1b[1mdotai sync\x1b[0m to generate tool configs.");
	}
}
