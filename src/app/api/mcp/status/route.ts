/**
 * MCP Status API
 * Get status of all MCP servers
 */

import { NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp/manager';

export async function GET() {
  try {
    // Ensure manager is initialized
    if (!mcpManager.isInitialized()) {
      await mcpManager.initialize();
    }

    const status = mcpManager.getStatus();

    return NextResponse.json({
      initialized: mcpManager.isInitialized(),
      servers: status,
    });
  } catch (error) {
    console.error('MCP status error:', error);
    return NextResponse.json(
      { error: 'Failed to get MCP status' },
      { status: 500 }
    );
  }
}
