# MCP Server (Node.js/Express)

Model Context Protocol (MCP) Server implementation acting as a gateway to the AI Service.

## Tech Stack
- Node.js 20
- Express.js
- @modelcontextprotocol/sdk
- JWT Authentication (Middleware ready)

## Features
- Exposes `create_resource` and `list_resources` tools via MCP.
- Proxies requests to `ai-service`.

## Running
```bash
docker compose up mcp-server
```
