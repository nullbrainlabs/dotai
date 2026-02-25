import type { Scope } from "./scope.js";

/** MCP transport type. */
export const Transport = {
	Stdio: "stdio",
	Http: "http",
	Sse: "sse",
} as const;

export type Transport = (typeof Transport)[keyof typeof Transport];

/**
 * An external tool/data provider connected via Model Context Protocol (MCP).
 * Universal across Claude Code, Cursor, and Codex.
 */
export interface ToolServer {
	/** Identifier. */
	name: string;
	/** Connection type. */
	transport: Transport;
	/** Shell command (stdio) or endpoint URL (http/sse). */
	command?: string;
	url?: string;
	/** Command arguments (stdio transport). */
	args?: string[];
	/** Environment variables passed to the server. */
	env?: Record<string, string>;
	/** If set, only these tools are exposed from the server. */
	enabledTools?: string[];
	/** If set, these tools are hidden from the server. */
	disabledTools?: string[];
	/** Custom HTTP headers for non-stdio transports. */
	headers?: Record<string, string>;
	/** OAuth configuration for non-stdio transports. */
	oauth?: { clientId: string; callbackPort?: number };
	/** Scope at which this server is configured. */
	scope: Scope;
}
