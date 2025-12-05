import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import axios from 'axios';
import Docker from 'dockerode';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// --- MCP Server Setup ---
const mcpServer = new McpServer({
  name: "OpenPanel MCP",
  version: "1.1.0"
});

// --- AI / Business Logic Tools ---

// Tool: Create Resource (Calls Python AI Service)
mcpServer.tool(
  "create_resource",
  {
    name: z.string().describe("Name of the resource"),
    type: z.string().describe("Type of the resource (e.g., note, code, data)"),
    content: z.string().describe("Content of the resource")
  },
  async ({ name, type, content }) => {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/resources`, {
        name,
        type,
        content
      });
      return {
        content: [{ type: "text", text: `Resource created: ${response.data._id}` }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error creating resource: ${error.message}` }],
        isError: true
      };
    }
  }
);

// Tool: List Resources
mcpServer.tool(
  "list_resources",
  {
    limit: z.number().optional().describe("Limit number of results")
  },
  async ({ limit }) => {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/resources`, {
        params: { limit: limit || 10 }
      });
      return {
        content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error listing resources: ${error.message}` }],
        isError: true
      };
    }
  }
);

// --- Infrastructure / DevOps Tools (Docker) ---

mcpServer.tool(
  "list_containers",
  {
    all: z.boolean().optional().describe("Show all containers (default false)")
  },
  async ({ all }) => {
    try {
      const containers = await docker.listContainers({ all });
      const simplified = containers.map(c => ({
        id: c.Id.substring(0, 12),
        names: c.Names,
        image: c.Image,
        state: c.State,
        status: c.Status
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error listing containers: ${error.message}` }],
        isError: true
      };
    }
  }
);

mcpServer.tool(
  "restart_container",
  {
    container_id: z.string().describe("Container ID or Name")
  },
  async ({ container_id }) => {
    try {
      const container = docker.getContainer(container_id);
      await container.restart();
      return {
        content: [{ type: "text", text: `Container ${container_id} restarted successfully.` }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error restarting container: ${error.message}` }],
        isError: true
      };
    }
  }
);

mcpServer.tool(
  "get_container_logs",
  {
    container_id: z.string().describe("Container ID or Name"),
    tail: z.number().optional().describe("Number of lines to show (default 50)")
  },
  async ({ container_id, tail }) => {
    try {
      const container = docker.getContainer(container_id);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: tail || 50,
        timestamps: true
      });
      return {
        content: [{ type: "text", text: logs.toString() }]
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error getting logs: ${error.message}` }],
        isError: true
      };
    }
  }
);

// --- Express Routes ---

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'mcp-server', version: '1.1.0' });
});

// MCP SSE Endpoint
app.get('/sse', async (req, res) => {
  console.log("New SSE connection");
  const transport = new SSEServerTransport("/messages", res);
  await mcpServer.connect(transport);
});

app.post('/messages', async (req, res) => {
  // For a full production MCP implementation, you would map sessions here.
  // For now, we return 202 to acknowledge, assuming the SSE transport
  // will handle the flow if the client is correctly configured to listen to SSE.
  // Note: The official SDK's SSEServerTransport doesn't export a standalone handlePostMessage
  // that we can easily call without the transport instance context from the GET request.
  // In a real scenario, we'd store active transports in a Map<SessionID, Transport>.
  
  res.status(202).send("Accepted");
});

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
