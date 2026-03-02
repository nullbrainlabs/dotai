// Domain types

// Commands
export type {
	AddEntityType,
	AddOptions,
	ImportCommandOptions,
	InitOptions,
	SyncOptions,
} from "./commands/index.js";
export {
	runAdd,
	runCheck,
	runImportCommand,
	runInit,
	runStatus,
	runSync,
} from "./commands/index.js";
// Config
export type {
	ConfigError,
	ConfigScope,
	LoadResult,
	ParsedMarkdown,
	ProjectConfig,
	ValidationResult,
} from "./config/index.js";
export {
	emptyConfig,
	loadMarkdownFile,
	loadMergedConfig,
	loadProjectConfig,
	loadSkills,
	mergeConfigs,
	parseMarkdownWithFrontmatter,
	validateConfig,
} from "./config/index.js";
export type {
	Agent,
	Hook,
	IgnorePattern,
	Permission,
	Rule,
	Setting,
	Skill,
	ToolServer,
} from "./domain/index.js";
export {
	createAgent,
	createHook,
	createIgnorePattern,
	createPermission,
	createRule,
	createSetting,
	createSkill,
	createToolServer,
	Decision,
	HookEvent,
	HookType,
	isAgent,
	isHook,
	isIgnorePattern,
	isPermission,
	isRule,
	isSetting,
	isSkill,
	isToolServer,
	SCOPE_PRECEDENCE,
	Scope,
	scopeOutranks,
	Transport,
} from "./domain/index.js";
// Emitters
export type { EmitResult, EmittedFile, Emitter } from "./emitters/index.js";
export {
	ALL_TARGETS,
	agentsEmitter,
	deepMerge,
	hooksEmitter,
	mcpEmitter,
	mergeFiles,
	permissionsEmitter,
	rulesEmitter,
	skillsEmitter,
	TargetTool,
} from "./emitters/index.js";

// Import
export type {
	DetectedFile,
	DetectedKind,
	ImportOptions,
	ImportResult,
	SourceTool,
} from "./import/index.js";
export {
	parseClaude,
	parseCodex,
	parseCursor,
	runImport,
	scanForConfigs,
	writeProjectConfig,
} from "./import/index.js";

// State
export type { FileStatus, FileStatusEntry, SyncState } from "./state.js";
export { contentHash, diffFiles, loadState, saveState } from "./state.js";

// Templates
export { defaultConfig, helperSkills } from "./templates/index.js";
