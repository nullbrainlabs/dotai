---
title: Tool Servers
description: External tool and data providers connected via MCP.
---

Tool servers connect AI agents to external capabilities — filesystems, databases, APIs, and custom tools — via the Model Context Protocol (MCP). MCP support is universal across all six tools that dotai targets. Translation from `.ai/config.yaml` to each tool's native format is mechanical and lossless.

## TypeScript Interface

```typescript
interface ToolServer {
  name: string;
  transport: "stdio" | "http" | "sse";
  command?: string;
  url?: string;
  args?: string[];
  env?: Record<string, string>;
  enabledTools?: string[];
  disabledTools?: string[];
  scope: Scope;
}
```

## Configuration

Tool servers are defined in the `servers` section of `.ai/config.yaml`:

```yaml
servers:
  - name: filesystem
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem"]
    scope: project

  - name: github
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: "${GITHUB_TOKEN}"
    scope: project

  - name: my-api
    transport: http
    url: "https://api.example.com/mcp"
    scope: user
```

### Transport Types

| Transport | Required fields | Description |
|-----------|----------------|-------------|
| `stdio` | `command` | Spawns a local process and communicates over stdin/stdout. Most common for npm-installed servers. |
| `http` | `url` | Connects to a remote HTTP endpoint serving the MCP protocol. |
| `sse` | `url` | Connects to a remote Server-Sent Events stream. Used for streaming-capable MCP servers. |

### Tool Filtering

Two mutually exclusive fields control which tools from a server are exposed to the agent:

- **`enabledTools`** — whitelist: only the listed tools are available
- **`disabledTools`** — blacklist: all tools are available except the listed ones

Setting both fields on the same server is a validation error. If neither is set, all tools from the server are available.

```yaml
servers:
  - name: filesystem
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem"]
    enabledTools:
      - read_file
      - list_directory
    scope: project
```

## Cross-Tool Support

| Aspect | Claude Code | Cursor | Codex | OpenCode | Copilot | Antigravity |
|--------|-------------|--------|-------|----------|---------|-------------|
| Config file | `.mcp.json` | `.cursor/mcp.json` | `.codex/config.toml` | `opencode.json` | `.vscode/mcp.json` | `mcp_config.json` |
| Format | JSON | JSON | TOML | JSON | JSON | JSON |
| Top-level key | `mcpServers` | `mcpServers` | `[mcp_servers.<name>]` | `mcp` | `mcpServers` | `mcpServers` |
| Tool filtering | `enabledTools` / `disabledTools` | `enabledTools` / `disabledTools` | `enabled_tools` / `disabled_tools` | Not supported | Not supported | Not supported |

## Known Limitations

- **OpenCode**: HTTP and SSE transports are mapped to a generic `"remote"` transport type. The distinction between streaming and non-streaming is not preserved in OpenCode's config format.
- **OpenCode, Copilot, Antigravity**: Tool filtering (`enabledTools` / `disabledTools`) is not supported. These fields are silently dropped when emitting to those targets. All tools from the server are exposed.
