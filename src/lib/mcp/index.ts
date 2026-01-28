/**
 * MCP Module
 * Main exports for MCP functionality
 */

export { MCPClient } from './client';
export { mcpManager } from './manager';
export { secureMCPManager } from './secureManager';
export { PermissionChecker, SERVER_PERMISSIONS, TOOL_PERMISSIONS } from './permissions';
export { MCP_SERVERS, getEnabledServers, getServerConfig } from './config';
export type {
  MCPServerConfig,
  MCPTool,
  MCPResource,
  MCPPrompt,
  MCPServerCapabilities,
  MCPToolCallResult,
} from './types';
export type {
  PermissionScope,
  ServerPermission,
  ToolPermission,
} from './permissions';
export type {
  ToolExecutionContext,
  SecureToolCallResult,
} from './secureManager';
