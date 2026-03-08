# mcp-akamai

MCP (Model Context Protocol) server for Akamai APIs. Provides tools for edge diagnostics, debugging, and network analysis directly from AI assistants.

## Tools

### Edge Diagnostics

| Tool | Description |
|---|---|
| `translate_error_string` | Decode Akamai error reference codes into detailed error info |
| `curl_from_edge` | Fetch a URL from an Akamai edge server with debug headers |
| `get_error_statistics` | HTTP error statistics for a URL or CP code |
| `verify_locate_ip` | Verify if an IP is Akamai edge and get geolocation |
| `locate_ip` | Geolocate up to 10 IP addresses |
| `dig_from_edge` | DNS lookup from an Akamai edge server |
| `mtr_from_edge` | MTR traceroute from an Akamai edge server |
| `grep_edge_logs` | Search edge server logs by IP, time range, and filters |
| `list_edge_locations` | List available Akamai edge server locations |
| `translate_akamaized_url` | Decode an Akamaized URL (ARL) into components |
| `verify_edge_ip` | Verify up to 10 IPs as Akamai edge IPs |
| `url_health_check` | Comprehensive URL health check (cURL + dig + MTR) |
| `connectivity_problems` | Diagnose connectivity issues (GREP + cURL + MTR) |
| `content_problems` | Diagnose content/cache issues (edge vs origin comparison) |

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Akamai API credentials with Edge Diagnostics API access

### Build

```bash
bun install
bun run build
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AKAMAI_CLIENT_SECRET` | Yes | Akamai EdgeGrid client secret |
| `AKAMAI_CLIENT_TOKEN` | Yes | Akamai EdgeGrid client token |
| `AKAMAI_ACCESS_TOKEN` | Yes | Akamai EdgeGrid access token |
| `AKAMAI_HOST` | Yes | Akamai API hostname (e.g. `akab-xxx.luna.akamaiapis.net`) |
| `AKAMAI_ACCOUNT_SWITCH_KEY` | No | Account switch key for multi-account setups |

### VS Code / Copilot Configuration

Add to your `.vscode/mcp.json`:

```json
{
  "inputs": [
    { "id": "akamai-client-secret", "type": "promptString", "description": "Akamai EdgeGrid client secret", "password": true },
    { "id": "akamai-client-token", "type": "promptString", "description": "Akamai EdgeGrid client token", "password": true },
    { "id": "akamai-access-token", "type": "promptString", "description": "Akamai EdgeGrid access token", "password": true },
    { "id": "akamai-host", "type": "promptString", "description": "Akamai API hostname (e.g. akab-xxx.luna.akamaiapis.net)" }
  ],
  "servers": {
    "mcp-akamai": {
      "type": "stdio",
      "command": "node",
      "args": ["<path-to>/mcp-akamai/build/index.js"],
      "env": {
        "AKAMAI_CLIENT_SECRET": "${input:akamai-client-secret}",
        "AKAMAI_CLIENT_TOKEN": "${input:akamai-client-token}",
        "AKAMAI_ACCESS_TOKEN": "${input:akamai-access-token}",
        "AKAMAI_HOST": "${input:akamai-host}"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-akamai": {
      "command": "node",
      "args": ["<path-to>/mcp-akamai/build/index.js"],
      "env": {
        "AKAMAI_CLIENT_SECRET": "...",
        "AKAMAI_CLIENT_TOKEN": "...",
        "AKAMAI_ACCESS_TOKEN": "...",
        "AKAMAI_HOST": "..."
      }
    }
  }
}
```

## Development

### Adding new API tools

1. Generate the API client: add the OpenAPI spec URL to `generate-clients.sh` (in the parent workspace) and run it
2. Create a wrapper in `src/akamai/apis/<api-name>/`
3. Add tool registration files under `src/tools/<api-name>/`
4. Register the tools in `src/tools/index.ts`

### Project structure

```
src/
├── index.ts                          # Entry point (McpServer + STDIO transport)
├── akamai/
│   ├── client.ts                     # Namespaced client hub (edgeDiagnostics, future APIs)
│   ├── customFetch.ts                # EdgeGrid-authenticated fetch
│   ├── generateAkamaiToken.ts        # EdgeGrid auth token generation
│   └── apis/
│       └── edge-diagnostics/
│           ├── index.ts              # Client factory & re-exports
│           └── v1/                   # Auto-generated API client
└── tools/
    ├── index.ts                      # Tool registration hub
    ├── utils.ts                      # Polling, formatting helpers
    └── edge-diagnostics/             # One file per tool or tool group
```
