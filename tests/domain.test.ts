import { describe, expect, it } from "vitest";
import {
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
} from "../src/domain/index.js";

describe("Scope", () => {
	it("has four scopes in precedence order", () => {
		expect(SCOPE_PRECEDENCE).toEqual(["enterprise", "project", "user", "local"]);
	});

	it("scopeOutranks returns true when first scope has higher precedence", () => {
		expect(scopeOutranks(Scope.Enterprise, Scope.Project)).toBe(true);
		expect(scopeOutranks(Scope.Enterprise, Scope.Local)).toBe(true);
		expect(scopeOutranks(Scope.Project, Scope.User)).toBe(true);
		expect(scopeOutranks(Scope.User, Scope.Local)).toBe(true);
	});

	it("scopeOutranks returns false for equal or lower precedence", () => {
		expect(scopeOutranks(Scope.Local, Scope.Enterprise)).toBe(false);
		expect(scopeOutranks(Scope.User, Scope.User)).toBe(false);
		expect(scopeOutranks(Scope.Project, Scope.Enterprise)).toBe(false);
	});
});

describe("Directive", () => {
	it("creates with defaults", () => {
		const d = createDirective({ content: "Use tabs", scope: Scope.Project });
		expect(d.alwaysApply).toBe(true);
		expect(d.content).toBe("Use tabs");
		expect(d.scope).toBe("project");
	});

	it("allows overriding alwaysApply", () => {
		const d = createDirective({ content: "x", scope: Scope.User, alwaysApply: false });
		expect(d.alwaysApply).toBe(false);
	});

	it("type guard validates correctly", () => {
		expect(isDirective({ content: "x", scope: "project", alwaysApply: true })).toBe(true);
		expect(isDirective({ content: "x" })).toBe(false);
		expect(isDirective(null)).toBe(false);
		expect(isDirective("string")).toBe(false);
	});
});

describe("Skill", () => {
	it("creates with defaults", () => {
		const s = createSkill({ name: "review", content: "Review code carefully" });
		expect(s.description).toBe("");
		expect(s.disableAutoInvocation).toBe(false);
	});

	it("type guard validates correctly", () => {
		expect(isSkill({ name: "x", content: "y", disableAutoInvocation: false })).toBe(true);
		expect(isSkill({ name: "x" })).toBe(false);
	});
});

describe("Agent", () => {
	it("creates with defaults", () => {
		const a = createAgent({ name: "reviewer", instructions: "Review PRs" });
		expect(a.description).toBe("");
		expect(a.model).toBeUndefined();
		expect(a.tools).toBeUndefined();
	});

	it("type guard validates correctly", () => {
		expect(isAgent({ name: "x", instructions: "y" })).toBe(true);
		expect(isAgent({ name: "x" })).toBe(false);
	});
});

describe("ToolServer", () => {
	it("creates stdio server", () => {
		const ts = createToolServer({
			name: "github",
			transport: Transport.Stdio,
			command: "npx @modelcontextprotocol/server-github",
			scope: Scope.Project,
		});
		expect(ts.transport).toBe("stdio");
		expect(ts.command).toBe("npx @modelcontextprotocol/server-github");
	});

	it("creates http server", () => {
		const ts = createToolServer({
			name: "remote",
			transport: Transport.Http,
			url: "https://mcp.example.com",
			scope: Scope.User,
		});
		expect(ts.transport).toBe("http");
		expect(ts.url).toBe("https://mcp.example.com");
	});

	it("type guard validates correctly", () => {
		expect(isToolServer({ name: "x", transport: "stdio", scope: "project" })).toBe(true);
		expect(isToolServer({ name: "x", transport: "stdio" })).toBe(false);
	});
});

describe("Hook", () => {
	it("creates hook", () => {
		const h = createHook({
			event: HookEvent.PreFileEdit,
			handler: "eslint --fix",
			scope: Scope.Project,
		});
		expect(h.event).toBe("preFileEdit");
		expect(h.matcher).toBeUndefined();
	});

	it("type guard validates correctly", () => {
		expect(isHook({ event: "preToolUse", handler: "cmd", scope: "project" })).toBe(true);
		expect(isHook({ event: "preToolUse" })).toBe(false);
	});
});

describe("Permission", () => {
	it("creates permission", () => {
		const p = createPermission({
			tool: "Bash",
			pattern: "npm *",
			decision: Decision.Allow,
			scope: Scope.Project,
		});
		expect(p.decision).toBe("allow");
	});

	it("type guard validates correctly", () => {
		expect(isPermission({ tool: "Bash", decision: "allow", scope: "project" })).toBe(true);
		expect(isPermission({ tool: "Bash" })).toBe(false);
	});
});

describe("Setting", () => {
	it("creates setting", () => {
		const s = createSetting({ key: "model", value: "claude-sonnet-4-6", scope: Scope.User });
		expect(s.key).toBe("model");
		expect(s.value).toBe("claude-sonnet-4-6");
	});

	it("type guard validates correctly", () => {
		expect(isSetting({ key: "k", value: 42, scope: "user" })).toBe(true);
		expect(isSetting({ key: "k" })).toBe(false);
	});
});

describe("IgnorePattern", () => {
	it("creates ignore pattern", () => {
		const p = createIgnorePattern({ pattern: "node_modules/**", scope: Scope.Project });
		expect(p.pattern).toBe("node_modules/**");
	});

	it("type guard validates correctly", () => {
		expect(isIgnorePattern({ pattern: "*.log", scope: "project" })).toBe(true);
		expect(isIgnorePattern({ pattern: "*.log" })).toBe(false);
	});
});

describe("Const enums", () => {
	it("Transport has expected values", () => {
		expect(Transport.Stdio).toBe("stdio");
		expect(Transport.Http).toBe("http");
		expect(Transport.Sse).toBe("sse");
	});

	it("HookEvent has expected values", () => {
		expect(HookEvent.PreToolUse).toBe("preToolUse");
		expect(HookEvent.PostToolUse).toBe("postToolUse");
		expect(HookEvent.PreFileEdit).toBe("preFileEdit");
		expect(HookEvent.PostFileEdit).toBe("postFileEdit");
		expect(HookEvent.SessionStart).toBe("sessionStart");
		expect(HookEvent.SessionEnd).toBe("sessionEnd");
	});

	it("Decision has expected values", () => {
		expect(Decision.Allow).toBe("allow");
		expect(Decision.Deny).toBe("deny");
		expect(Decision.Ask).toBe("ask");
	});

	it("Scope has expected values", () => {
		expect(Scope.Enterprise).toBe("enterprise");
		expect(Scope.Project).toBe("project");
		expect(Scope.User).toBe("user");
		expect(Scope.Local).toBe("local");
	});
});
