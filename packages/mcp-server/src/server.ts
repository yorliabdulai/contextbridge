import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getContextTool, handleGetContext } from './tools/getContext';
import { saveContextTool, handleSaveContext } from './tools/saveContext';
import { searchMemoryTool, handleSearchMemory } from './tools/searchMemory';
import { getUserProfileTool, handleGetUserProfile } from './tools/getUserProfile';

export class MemoryMeshServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'memorymesh',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerHandlers();
  }

  private registerHandlers(): void {
    // List all available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        getContextTool,
        saveContextTool,
        searchMemoryTool,
        getUserProfileTool,
      ],
    }));

    // Route tool calls to their handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get_context':
          return handleGetContext(args);
        case 'save_context':
          return handleSaveContext(args);
        case 'search_memory':
          return handleSearchMemory(args);
        case 'get_user_profile':
          return handleGetUserProfile(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MemoryMesh MCP Server running on stdio');
  }
}