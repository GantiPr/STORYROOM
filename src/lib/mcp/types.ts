/**
 * MCP Client Types
 * Type definitions for MCP server configuration and tool execution
 */

export type MCPServerConfig = {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse';
  url?: string; // For SSE transport
  enabled?: boolean;
};

export type MCPTool = {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
};

export type MCPResource = {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
};

export type MCPPrompt = {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
};

export type MCPServerCapabilities = {
  tools?: MCPTool[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
};

export type MCPToolCallResult = {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
};
