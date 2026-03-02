import { createRequire } from "node:module";
import { Command } from "commander";
import type { AddOptions } from "./commands/add.js";
import { runAdd } from "./commands/add.js";
import { runCheck } from "./commands/check.js";
import { runImportCommand } from "./commands/import.js";
import type { InitOptions } from "./commands/init.js";
import { runInit } from "./commands/init.js";
import { runStatus } from "./commands/status.js";
import { runSync } from "./commands/sync.js";
import type { ConfigScope } from "./config/schema.js";
import type { TargetTool } from "./emitters/types.js";
import type { SourceTool } from "./import/scanner.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
	.name("dotai")
	.description("Configure once, generate for all AI coding tools")
	.version(version);

program
	.command("init")
	.description("Scaffold a new .ai/ directory with guided setup")
	.option("-t, --target <tools...>", "Target tools (claude, cursor, codex, copilot)")
	.option("--skip-import", "Skip auto-detection of existing configs", false)
	.option("--sync", "Run sync after init", false)
	.option("--with-helpers", "Include dotai helper skills", false)
	.action(
		async (opts: {
			target?: string[];
			skipImport: boolean;
			sync: boolean;
			withHelpers: boolean;
		}) => {
			const initOpts: InitOptions = {
				targets: opts.target as TargetTool[] | undefined,
				skipImport: opts.skipImport,
				autoSync: opts.sync,
				includeHelpers: opts.withHelpers,
			};
			await runInit(process.cwd(), initOpts);
		},
	);

program
	.command("import")
	.description("Import existing AI tool configs into .ai/ format")
	.option("--source <tool>", "Filter to specific source (claude, cursor, codex, copilot)")
	.action(async (opts: { source?: string }) => {
		await runImportCommand(process.cwd(), {
			source: opts.source as SourceTool | undefined,
		});
	});

program
	.command("add")
	.description("Scaffold a rule, agent, skill, or MCP server")
	.argument("[type]", "Entity type (rule, agent, skill, mcp)")
	.argument("[name]", "Name of the entity to create")
	.option("--command <cmd>", "MCP server command (stdio transport)")
	.option("--url <url>", "MCP server URL (http/sse transport)")
	.action(async (type: string | undefined, name: string | undefined, opts: AddOptions) => {
		await runAdd(process.cwd(), type, name, opts);
	});

program
	.command("sync")
	.description("Generate tool-specific config files from .ai/")
	.option("-t, --target <tool>", "Target tool (claude, cursor, codex, copilot, all)", "all")
	.option("--dry-run", "Show what would be written without writing", false)
	.option("-s, --scope <scope>", "Config scope (user, project)", "project")
	.option("--force", "Overwrite conflicting files", false)
	.option("-y, --yes", "Skip confirmation prompt", false)
	.action(
		async (opts: {
			target: string;
			dryRun: boolean;
			scope: string;
			force: boolean;
			yes: boolean;
		}) => {
			const targets: TargetTool[] = opts.target === "all" ? [] : [opts.target as TargetTool];
			await runSync(process.cwd(), {
				targets,
				dryRun: opts.dryRun,
				scope: opts.scope as ConfigScope,
				force: opts.force,
				yes: opts.yes,
			});
		},
	);

program
	.command("check")
	.description("Validate .ai/ config and check target compatibility")
	.option("-s, --scope <scope>", "Config scope (user, project)", "project")
	.action(async (opts: { scope: string }) => {
		await runCheck(process.cwd(), opts.scope as ConfigScope);
	});

program
	.command("status")
	.description("Show status of generated files vs what's on disk")
	.action(async () => {
		await runStatus(process.cwd());
	});

// Show help (exit 0) when no subcommand is provided
if (process.argv.length <= 2) {
	program.outputHelp();
	process.exit(0);
}

program.parse();
