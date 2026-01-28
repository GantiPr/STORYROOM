/**
 * MCP Manager
 * Singleton that manages multiple MCP server connections
 */

import { MCPClient } from './client';
import { getEnabledServers, getServerConfig } from './config';
import type { MCPServerConfig, MCPTool, MCPToolCallResult } from './types';

class MCPManager {
  private clients: Map<string, MCPClient> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize all enabled MCP servers
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing MCP Manager...');

    const enabledServers = getEnabledServers();
    const serverNames = Object.keys(enabledServers);

    if (serverNames.length === 0) {
      console.log('⚠️  No MCP servers enabled');
      this.initialized = true;
      return;
    }

    // Connect to all enabled servers
    const connectionPromises = serverNames.map(async (serverName) => {
      try {
        const config = enabledServers[serverName];
        const client = new MCPClient(config);
        await client.connect();
        this.clients.set(serverName, client);
        return { serverName, success: true };
      } catch (error) {
        console.error(`Failed to connect to ${serverName}:`, error);
        return { serverName, success: false, error };
      }
    });

    const results = await Promise.allSettled(connectionPromises);
    const successful = results.filter((r) => r.status === 'fulfilled').length;

    console.log(`✅ MCP Manager initialized: ${successful}/${serverNames.length} servers connected`);
    this.initialized = true;
  }

  /**
   * Get a specific MCP client
   */
  getClient(serverName: string): MCPClient | undefined {
    return this.clients.get(serverName);
  }

  /**
   * Get all connected clients
   */
  getAllClients(): Map<string, MCPClient> {
    return this.clients;
  }

  /**
   * Get all available tools from all servers
   */
  getAllTools(): Array<{ serverName: string; tool: MCPTool }> {
    const allTools: Array<{ serverName: string; tool: MCPTool }> = [];

    for (const [serverName, client] of this.clients.entries()) {
      const tools = client.getTools();
      tools.forEach((tool) => {
        allTools.push({ serverName, tool });
      });
    }

    return allTools;
  }

  /**
   * Call a tool on a specific server
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<MCPToolCallResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not found: ${serverName}`);
    }

    return await client.callTool(toolName, args);
  }

  /**
   * Find and call a tool by name (searches all servers)
   */
  async findAndCallTool(toolName: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    for (const [serverName, client] of this.clients.entries()) {
      const tools = client.getTools();
      const tool = tools.find((t) => t.name === toolName);

      if (tool) {
        console.log(`🔍 Found tool "${toolName}" on server "${serverName}"`);
        return await client.callTool(toolName, args);
      }
    }

    throw new Error(`Tool not found: ${toolName}`);
  }

  /**
   * Disconnect all servers
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down MCP Manager...');

    const disconnectPromises = Array.from(this.clients.values()).map((client) =>
      client.disconnect()
    );

    await Promise.allSettled(disconnectPromises);
    this.clients.clear();
    this.initialized = false;

    console.log('✅ MCP Manager shut down');
  }

  /**
   * Add a new server dynamically
   */
  async addServer(serverName: string, config: MCPServerConfig): Promise<void> {
    if (this.clients.has(serverName)) {
      throw new Error(`Server already exists: ${serverName}`);
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(serverName, client);

    console.log(`✅ Added MCP server: ${serverName}`);
  }

  /**
   * Remove a server
   */
  async removeServer(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server not found: ${serverName}`);
    }

    await client.disconnect();
    this.clients.delete(serverName);

    console.log(`✅ Removed MCP server: ${serverName}`);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get server status
   */
  getStatus(): Array<{ name: string; connected: boolean; tools: number }> {
    return Array.from(this.clients.entries()).map(([name, client]) => ({
      name,
      connected: client.isConnected(),
      tools: client.getTools().length,
    }));
  }
}

// Singleton instance
export const mcpManager = new MCPManager();

// Auto-initialize on first import (for API routes)
if (typeof window === 'undefined') {
  // Only initialize on server-side
  mcpManager.initialize().catch((error) => {
    console.error('Failed to initialize MCP Manager:', error);
  });
}
