/**
 * MCP Tool Call API (SECURE)
 * Execute a tool on a specific MCP server with security checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { mcpManager } from '@/lib/mcp/manager';
import { secureMCPManager } from '@/lib/mcp/secureManager';
import { parseError } from '@/lib/reliability/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serverName, toolName, arguments: args, userConsent } = body;

    if (!serverName || !toolName) {
      return NextResponse.json(
        { error: 'serverName and toolName are required' },
        { status: 400 }
      );
    }

    // Ensure manager is initialized
    if (!mcpManager.isInitialized()) {
      await mcpManager.initialize();
    }

    // Call the tool with security checks
    const result = await secureMCPManager.callToolSecure(
      serverName,
      toolName,
      args || {},
      {
        userConsent,
        sessionId: request.headers.get('x-session-id') || undefined,
        // TODO: Add userId from auth session when implemented
      }
    );

    // If permission denied or consent required, return 403
    if (!result.permissionCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Permission denied',
          reason: result.permissionCheck.reason,
          permissionCheck: result.permissionCheck,
        },
        { status: 403 }
      );
    }

    if (result.permissionCheck.consentRequired && !result.permissionCheck.consentGiven) {
      return NextResponse.json(
        {
          success: false,
          error: 'User consent required',
          permissionCheck: result.permissionCheck,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
      permissionCheck: result.permissionCheck,
    });
  } catch (error: any) {
    console.error('MCP tool call error:', error);
    const structuredError = parseError(error);
    
    return NextResponse.json(
      { 
        success: false,
        error: structuredError.userMessage,
        code: structuredError.code,
        retryable: structuredError.retryable,
        retryAfter: structuredError.retryAfter,
      },
      { status: 500 }
    );
  }
}
