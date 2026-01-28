/**
 * MCP Tools API (SECURE)
 * List all available tools from all MCP servers with permission information
 */

import { NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp/manager';
import { secureMCPManager } from '@/lib/mcp/secureManager';

export async function GET() {
  try {
    // Ensure manager is initialized
    if (!mcpManager.isInitialized()) {
      await mcpManager.initialize();
    }

    // Get all tools with permission information
    const toolsWithPermissions = secureMCPManager.getToolsWithPermissions();

    // Group tools by server
    const toolsByServer: Record<string, any[]> = {};
    toolsWithPermissions.forEach((tool) => {
      if (!toolsByServer[tool.serverName]) {
        toolsByServer[tool.serverName] = [];
      }
      toolsByServer[tool.serverName].push({
        name: tool.toolName,
        description: tool.description,
        allowed: tool.allowed,
        scope: tool.scope,
        requiresConsent: tool.requiresConsent,
      });
    });

    return NextResponse.json({
      tools: toolsWithPermissions,
      toolsByServer,
      totalTools: toolsWithPermissions.length,
      allowedTools: toolsWithPermissions.filter((t) => t.allowed).length,
    });
  } catch (error) {
    console.error('MCP tools error:', error);
    return NextResponse.json(
      { error: 'Failed to list MCP tools' },
      { status: 500 }
    );
  }
}
