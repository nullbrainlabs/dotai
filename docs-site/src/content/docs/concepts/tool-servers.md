---
title: Tool Servers
description: External tool and data providers connected via MCP.
---

Tool servers connect AI agents to external capabilities — filesystems, databases, APIs, and custom tools — via the Model Context Protocol (MCP). MCP support is universal across all four tools that dotai targets. Translation from `.ai/config.yaml` to each tool's native format is mechanical and lossless.

## TypeScript interface

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
  headers?: Record<string, string>;
  oauth?: { clientId: string; callbackPort?: number };
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
    headers:
      Authorization: "Bearer ${API_TOKEN}"
    scope: user

  - name: oauth-api
    transport: http
    url: "https://api.example.com/mcp"
    oauth:
      clientId: my-app
      callbackPort: 8080
    scope: project
```

### Transport types

| Transport | Required fields | Description |
|-----------|----------------|-------------|
| `stdio` | `command` | Spawns a local process and communicates over stdin/stdout. Most common for npm-installed servers. |
| `http` | `url` | Connects to a remote HTTP endpoint serving the MCP Streamable HTTP protocol. Preferred for remote servers. |
| `sse` | `url` | Connects to a remote Server-Sent Events stream. **Deprecated** — prefer `http` transport instead. |

:::caution
The `sse` transport is deprecated. New server configurations should use `http` (Streamable HTTP) instead. dotai will emit a deprecation warning when `sse` is used. Existing `sse` servers will continue to work but should be migrated.
:::

### Headers

The `headers` field allows setting custom HTTP headers for `http` and `sse` transports. This is useful for authentication tokens, API keys, or custom routing headers:

```yaml
servers:
  - name: authenticated-api
    transport: http
    url: "https://api.example.com/mcp"
    headers:
      Authorization: "Bearer ${API_TOKEN}"
      X-Custom-Header: "my-value"
    scope: project
```

Headers are not applicable to `stdio` transport.

### OAuth

The `oauth` field configures OAuth authentication for `http` and `sse` transports:

```yaml
servers:
  - name: oauth-protected
    transport: http
    url: "https://api.example.com/mcp"
    oauth:
      clientId: my-application
      callbackPort: 8080
    scope: project
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clientId` | string | Yes | OAuth client ID for the application |
| `callbackPort` | number | No | Port for the OAuth callback server |

### Tool filtering

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

## Cross-tool support

| Aspect | Claude Code | Cursor | Codex | Copilot |
|--------|-------------|--------|-------|---------|
| Config file | `.mcp.json` | `.cursor/mcp.json` | `.codex/config.toml` | `.vscode/mcp.json` |
| Format | JSON | JSON | TOML | JSON |
| Top-level key | `mcpServers` | `mcpServers` | `[mcp_servers.<name>]` | `mcpServers` |
| Tool filtering | `enabledTools` / `disabledTools` | `enabledTools` / `disabledTools` | Not supported | Not supported |
| Headers | Supported | Supported | Not supported | Supported |
| OAuth | Supported | Supported | Not supported | Supported |

## Known limitations

- **Copilot**: Tool filtering (`enabledTools` / `disabledTools`) is not supported. These fields are silently dropped when emitting to Copilot. All tools from the server are exposed.
- **Codex**: Tool filtering and HTTP headers/OAuth are not supported. Only stdio and basic http/sse configurations are emitted.
