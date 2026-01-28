/**
 * MCP Server Configuration
 * Define your MCP servers here
 */

import type { MCPServerConfig } from './types';

export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  // Memory MCP Server - Knowledge graph for story entities and relationships
  memory: {
    name: 'Memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    transport: 'stdio',
    enabled: true,
  },

  // Example: Filesystem MCP Server
  // filesystem: {
  //   name: 'Filesystem',
  //   command: 'npx',
  //   args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory'],
  //   transport: 'stdio',
  //   enabled: true,
  // },

  // Example: SQLite MCP Server
  // sqlite: {
  //   name: 'SQLite',
  //   command: 'npx',
  //   args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './data/story.db'],
  //   transport: 'stdio',
  //   enabled: true,
  // },

  // Example: GitHub MCP Server
  // github: {
  //   name: 'GitHub',
  //   command: 'npx',
  //   args: ['-y', '@modelcontextprotocol/server-github'],
  //   transport: 'stdio',
  //   env: {
  //     GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN || '',
  //   },
  //   enabled: false,
  // },

  // Brave Search MCP Server
  brave: {
    name: 'Brave Search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    transport: 'stdio',
    env: {
      BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
    },
    enabled: true, // Enabled for research features
  },

  // AgentQL MCP Server - Web scraping and automation
  agentql: {
    name: 'AgentQL',
    command: 'npx',
    args: ['-y', 'agentql-mcp'],
    transport: 'stdio',
    env: {
      AGENTQL_API_KEY: process.env.AGENTQL_API_KEY || '',
    },
    enabled: true, // Enable after adding AGENTQL_API_KEY to .env.local
  },

  // Bright Data MCP Server - Web scraping proxy and data collection
  brightdata: {
    name: 'Bright Data',
    command: 'npx',
    args: ['-y', '@brightdata/mcp-server'],
    transport: 'stdio',
    env: {
      BRIGHTDATA_API_KEY: process.env.BRIGHTDATA_API_KEY || '',
    },
    enabled: true, // Enable after adding BRIGHTDATA_API_KEY to .env.local
  },
};

// Get all enabled servers
export function getEnabledServers(): Record<string, MCPServerConfig> {
  return Object.entries(MCP_SERVERS)
    .filter(([_, config]) => config.enabled !== false)
    .reduce((acc, [key, config]) => ({ ...acc, [key]: config }), {});
}

// Get server by name
export function getServerConfig(serverName: string): MCPServerConfig | undefined {
  return MCP_SERVERS[serverName];
}
