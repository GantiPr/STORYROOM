/**
 * MCP Permissions API
 * Manage tool permissions and user consent
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureMCPManager } from '@/lib/mcp/secureManager';
import { PermissionChecker } from '@/lib/mcp/permissions';

// GET: Get all tools with their permission status
export async function GET(request: NextRequest) {
  try {
    const tools = secureMCPManager.getToolsWithPermissions();

    return NextResponse.json({
      success: true,
      tools,
    });
  } catch (error: any) {
    console.error('Failed to get permissions:', error);
    return NextResponse.json(
      {
        error: 'Failed to get permissions',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

// POST: Grant or revoke consent for a tool
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverName, toolName } = body;

    if (!action || !serverName || !toolName) {
      return NextResponse.json(
        { error: 'action, serverName, and toolName are required' },
        { status: 400 }
      );
    }

    if (action === 'grant') {
      secureMCPManager.grantConsent(serverName, toolName);
      return NextResponse.json({
        success: true,
        message: `Consent granted for ${serverName}.${toolName}`,
      });
    } else if (action === 'revoke') {
      secureMCPManager.revokeConsent(serverName, toolName);
      return NextResponse.json({
        success: true,
        message: `Consent revoked for ${serverName}.${toolName}`,
      });
    } else if (action === 'clear') {
      secureMCPManager.clearConsentCache();
      return NextResponse.json({
        success: true,
        message: 'All consent cleared',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "grant", "revoke", or "clear"' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Failed to manage consent:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage consent',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
