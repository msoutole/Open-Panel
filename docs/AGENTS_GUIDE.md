# OpenPanel Agents Guide

This guide explains how to connect AI Agents (Claude Desktop, Cursor, etc.) to the OpenPanel MCP Server to manage your infrastructure.

## 🤖 What can the Agent do?
By connecting to the MCP Server, your AI agent can:
1.  **Manage Infrastructure:** List, restart, and inspect Docker containers.
2.  **Manage Resources:** Create and list notes/code snippets in the system's MongoDB.
3.  **Fetch Logs:** Read logs from running services to help debug issues.

## 🔌 Connection Details

### URL
**SSE Endpoint:** `http://localhost:3005/sse`

### Claude Desktop Configuration
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "openpanel": {
      "command": "node",
      "args": ["path/to/openpanel/apps/mcp-server/dist/index.js"],
      "env": {
         "AI_SERVICE_URL": "http://localhost:8000",
         "PORT": "3005"
      }
    }
  }
}
```
*Note: For remote connection (SSE), Claude Desktop support is evolving. The configuration above assumes you are running the MCP code locally via node. If connecting to the Docker container via SSE, use an MCP client that supports HTTP/SSE transport.*

## 🛠️ Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_containers` | Lists running Docker containers | `all` (boolean) |
| `restart_container` | Restarts a specific container | `container_id` (string) |
| `get_container_logs` | Fetches logs from a container | `container_id`, `tail` (int) |
| `create_resource` | Saves a resource to the knowledge base | `name`, `type`, `content` |
| `list_resources` | Lists saved resources | `limit` (int) |

## 🔒 Security Note
The MCP server has access to the Docker socket (`/var/run/docker.sock`). This allows it to control your containers. Ensure this port is not exposed to the public internet without additional authentication layers (beyond the internal JWT).
