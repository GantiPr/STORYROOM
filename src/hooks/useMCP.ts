/**
 * useMCP Hook
 * React hook for interacting with MCP servers from the frontend (with security)
 */

import { useState, useEffect } from 'react';

type MCPStatus = {
  initialized: boolean;
  servers: Array<{
    name: string;
    connected: boolean;
    tools: number;
  }>;
};

type MCPTool = {
  serverName: string;
  toolName: string;
  description: string;
  allowed: boolean;
  scope: string;
  requiresConsent: boolean;
};

type ToolCallOptions = {
  userConsent?: boolean;
  sessionId?: string;
};

export function useMCP() {
  const [status, setStatus] = useState<MCPStatus | null>(null);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load MCP status
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/mcp/status');
      if (!response.ok) throw new Error('Failed to load MCP status');
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Load available tools (with permission info)
  const loadTools = async () => {
    try {
      const response = await fetch('/api/mcp/tools');
      if (!response.ok) throw new Error('Failed to load MCP tools');
      const data = await response.json();
      setTools(data.tools);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Call a tool (with security checks)
  const callTool = async (
    serverName: string,
    toolName: string,
    args: Record<string, any>,
    options: ToolCallOptions = {}
  ) => {
    try {
      const response = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.sessionId && { 'x-session-id': options.sessionId }),
        },
        body: JSON.stringify({
          serverName,
          toolName,
          arguments: args,
          userConsent: options.userConsent,
        }),
      });

      const data = await response.json();

      // Handle permission denied
      if (response.status === 403) {
        if (data.permissionCheck?.consentRequired && !data.permissionCheck?.consentGiven) {
          throw new Error('User consent required for this operation');
        }
        throw new Error(data.reason || 'Permission denied');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Tool call failed');
      }

      return data.result;
    } catch (err: any) {
      console.error('Tool call error:', err);
      throw err;
    }
  };

  // Call a tool with automatic consent prompt
  const callToolWithConsent = async (
    serverName: string,
    toolName: string,
    args: Record<string, any>,
    options: ToolCallOptions = {}
  ) => {
    try {
      // First try without consent
      return await callTool(serverName, toolName, args, options);
    } catch (err: any) {
      // If consent required, prompt user
      if (err.message.includes('consent required')) {
        const userConfirmed = window.confirm(
          `This operation requires your permission:\n\n` +
          `Server: ${serverName}\n` +
          `Tool: ${toolName}\n\n` +
          `Do you want to proceed?`
        );

        if (userConfirmed) {
          return await callTool(serverName, toolName, args, {
            ...options,
            userConsent: true,
          });
        } else {
          throw new Error('User denied consent');
        }
      }
      throw err;
    }
  };

  // Grant consent for a tool
  const grantConsent = async (serverName: string, toolName: string) => {
    try {
      const response = await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant',
          serverName,
          toolName,
        }),
      });

      if (!response.ok) throw new Error('Failed to grant consent');
      return true;
    } catch (err: any) {
      console.error('Grant consent error:', err);
      throw err;
    }
  };

  // Revoke consent for a tool
  const revokeConsent = async (serverName: string, toolName: string) => {
    try {
      const response = await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          serverName,
          toolName,
        }),
      });

      if (!response.ok) throw new Error('Failed to revoke consent');
      return true;
    } catch (err: any) {
      console.error('Revoke consent error:', err);
      throw err;
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await Promise.all([loadStatus(), loadTools()]);
      setLoading(false);
    };

    initialize();
  }, []);

  return {
    status,
    tools,
    loading,
    error,
    callTool,
    callToolWithConsent,
    grantConsent,
    revokeConsent,
    refresh: async () => {
      await Promise.all([loadStatus(), loadTools()]);
    },
  };
}

