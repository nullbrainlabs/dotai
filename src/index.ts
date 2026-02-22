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
	Directive,
	Hook,
	IgnorePattern,
	Permission,
	Setting,
	Skill,
	ToolServer,
} from "./domain/index.js";
export {
	createAgent,
	createDirective,
	createHook,
	createIgnorePattern,
	createPermission,
	createSetting,
	createSkill,
	createToolServer,
	Decision,
	HookEvent,
	isAgent,
	isDirective,
	isHook,
	isIgnorePattern,
	isPermission,
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
	directivesEmitter,
	hooksEmitter,
	mcpEmitter,
	mergeFiles,
	permissionsEmitter,
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
	parseOpenCode,
	runImport,
	scanForConfigs,
	writeProjectConfig,
} from "./import/index.js";

// State
export type { FileStatus, FileStatusEntry, SyncState } from "./state.js";
export { contentHash, diffFiles, loadState, saveState } from "./state.js";

// Templates
export type { TemplateInfo, TemplateName } from "./templates/index.js";
export { getTemplate, TEMPLATE_NAMES, TEMPLATES } from "./templates/index.js";
