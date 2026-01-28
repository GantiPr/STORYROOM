/**
 * MCP Client
 * Manages connections to MCP servers and tool execution
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPToolCallResult,
  MCPServerCapabilities,
} from './types';

export class MCPClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private config: MCPServerConfig;
  private connected: boolean = false;
  private capabilities: MCPServerCapabilities = {};

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<void> {
    if (this.connected) {
      return;
    }

    try {
      // Create transport based on config
      if (this.config.transport === 'stdio') {
        this.transport = new StdioClientTransport({
          command: this.config.command,
          args: this.config.args || [],
          env: {
            ...process.env,
            ...this.config.env,
          },
        });
      } else {
        throw new Error('SSE transport not yet implemented');
      }

      // Create client
      this.client = new Client(
        {
          name: 'storyroom-client',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
        }
      );

      // Connect
      await this.client.connect(this.transport);
      this.connected = true;

      // Load capabilities
      await this.loadCapabilities();

      console.log(`✅ Connected to MCP server: ${this.config.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect to MCP server ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    if (!this.connected) {
      return;
    }

    try {
      await this.client?.close();
      this.connected = false;
      this.client = null;
      this.transport = null;
      console.log(`✅ Disconnected from MCP server: ${this.config.name}`);
    } catch (error) {
      console.error(`❌ Failed to disconnect from MCP server ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Load server capabilities (tools, resources, prompts)
   */
  private async loadCapabilities(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not connected');
    }

    try {
      // List tools
      const toolsResponse = await this.client.listTools();
      this.capabilities.tools = toolsResponse.tools as MCPTool[];

      // List resources
      try {
        const resourcesResponse = await this.client.listResources();
        this.capabilities.resources = resourcesResponse.resources as MCPResource[];
      } catch (error) {
        // Resources might not be supported
        this.capabilities.resources = [];
      }

      // List prompts
      try {
        const promptsResponse = await this.client.listPrompts();
        this.capabilities.prompts = promptsResponse.prompts as MCPPrompt[];
      } catch (error) {
        // Prompts might not be supported
        this.capabilities.prompts = [];
      }

      console.log(`📋 Loaded capabilities for ${this.config.name}:`, {
        tools: this.capabilities.tools?.length || 0,
        resources: this.capabilities.resources?.length || 0,
        prompts: this.capabilities.prompts?.length || 0,
      });
    } catch (error) {
      console.error(`❌ Failed to load capabilities for ${this.config.name}:`, error);
      throw error;
    }
  }

  /**
   * Get available tools
   */
  getTools(): MCPTool[] {
    return this.capabilities.tools || [];
  }

  /**
   * Get available resources
   */
  getResources(): MCPResource[] {
    return this.capabilities.resources || [];
  }

  /**
   * Get available prompts
   */
  getPrompts(): MCPPrompt[] {
    return this.capabilities.prompts || [];
  }

  /**
   * Call a tool
   */
  async callTool(toolName: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected');
    }

    try {
      console.log(`🔧 Calling tool: ${toolName}`, args);
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });

      return result as MCPToolCallResult;
    } catch (error) {
      console.error(`❌ Tool call failed: ${toolName}`, error);
      throw error;
    }
  }

  /**
   * Read a resource
   */
  async readResource(uri: string): Promise<any> {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected');
    }

    try {
      console.log(`📖 Reading resource: ${uri}`);
      const result = await this.client.readResource({ uri });
      return result;
    } catch (error) {
      console.error(`❌ Resource read failed: ${uri}`, error);
      throw error;
    }
  }

  /**
   * Get a prompt
   */
  async getPrompt(promptName: string, args?: Record<string, string>): Promise<any> {
    if (!this.client || !this.connected) {
      throw new Error('Client not connected');
    }

    try {
      console.log(`💬 Getting prompt: ${promptName}`, args);
      const result = await this.client.getPrompt({
        name: promptName,
        arguments: args,
      });
      return result;
    } catch (error) {
      console.error(`❌ Prompt get failed: ${promptName}`, error);
      throw error;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get server name
   */
  getServerName(): string {
    return this.config.name;
  }
}
