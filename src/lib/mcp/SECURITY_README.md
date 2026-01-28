# MCP Security Layer

## Quick Overview

This directory contains a comprehensive security and permissions layer for MCP (Model Context Protocol) integration in Storyroom.

## Files

- **`permissions.ts`** - Permission configuration, allowlists, and security checker
- **`secureManager.ts`** - Secure wrapper around MCP manager with consent management
- **`manager.ts`** - Core MCP manager (wrapped by secure manager)
- **`client.ts`** - MCP client for individual server connections
- **`config.ts`** - MCP server configuration
- **`types.ts`** - TypeScript type definitions
- **`index.ts`** - Public exports
- **`__tests__/permissions.test.ts`** - Security test suite (27 tests)
- **`__tests__/golden.test.ts`** - Integration tests

## Architecture

```
User Request
    ↓
API Route (/api/mcp/call)
    ↓
SecureMCPManager
    ├─ Permission Check
    ├─ Consent Check
    ├─ Pattern Validation
    ├─ Sandbox Validation
    └─ Sensitive Data Redaction
    ↓
MCPManager
    ↓
MCPClient
    ↓
External MCP Server
```

## Security Features

### 1. Server Allowlist
Only explicitly enabled servers can be used.

### 2. Tool Allowlist/Denylist
Control which tools are available per server.

### 3. Scopes
- **read**: Safe operations (reading files, listing directories)
- **write**: Dangerous operations (writing files, creating issues)
- **execute**: High-risk operations (running queries, executing code)

### 4. User Consent
Tools marked as requiring consent need explicit user approval.

### 5. Path Sandboxing
Filesystem operations restricted to `MCP_SANDBOX_PATH`.

### 6. Pattern Matching
Block dangerous operations with regex patterns (e.g., no `.env` files).

### 7. Sensitive Data Redaction
Automatically redact API keys, tokens, passwords from logs.

## Usage

### Basic Tool Call (Secure)

```typescript
import { secureMCPManager } from '@/lib/mcp/secureManager';

const result = await secureMCPManager.callToolSecure(
  'filesystem',
  'read_file',
  { path: './README.md' },
  {
    userConsent: true,
    userId: 'user-123',
    sessionId: 'session-456'
  }
);

if (!result.permissionCheck.allowed) {
  console.error('Permission denied:', result.permissionCheck.reason);
}
```

### Check Permissions

```typescript
import { PermissionChecker } from '@/lib/mcp/permissions';

// Check if server is allowed
const allowed = PermissionChecker.isServerAllowed('filesystem');

// Check if tool is allowed
const toolAllowed = PermissionChecker.isToolAllowed('filesystem', 'read_file');

// Check if consent required
const needsConsent = PermissionChecker.requiresUserConsent('filesystem', 'write_file');

// Comprehensive check
const check = await PermissionChecker.checkPermission(
  'filesystem',
  'write_file',
  { path: 'story.txt' }
);
```

### Manage Consent

```typescript
import { secureMCPManager } from '@/lib/mcp/secureManager';

// Grant consent for a tool (session-based)
secureMCPManager.grantConsent('filesystem', 'write_file');

// Revoke consent
secureMCPManager.revokeConsent('filesystem', 'write_file');

// Clear all consent
secureMCPManager.clearConsentCache();
```

### Get Tools with Permissions

```typescript
const tools = secureMCPManager.getToolsWithPermissions();

tools.forEach(tool => {
  console.log(`${tool.serverName}.${tool.toolName}:`, {
    allowed: tool.allowed,
    scope: tool.scope,
    requiresConsent: tool.requiresConsent
  });
});
```

## Configuration

### Enable/Disable Servers

Edit `permissions.ts`:

```typescript
export const SERVER_PERMISSIONS = {
  memory: {
    enabled: true,
    requiresUserConsent: false,
  },
  filesystem: {
    enabled: true,
    requiresUserConsent: true,
    allowedTools: ['read_file', 'list_directory'],
    deniedTools: ['write_file', 'delete_file'],
  },
};
```

### Add Tool-Specific Permissions

```typescript
export const TOOL_PERMISSIONS = {
  my_tool: {
    scope: 'write',
    requiresUserConsent: true,
    deniedPatterns: ['.*sensitive.*'],
  },
};
```

### Add Sensitive Patterns

```typescript
export const SENSITIVE_PATTERNS = [
  /my_secret_pattern/gi,
  // ...
];
```

## Environment Variables

```bash
# Required for filesystem operations
MCP_SANDBOX_PATH=/path/to/workspace

# Optional server toggles
MCP_ENABLE_FILESYSTEM=true
MCP_ENABLE_GITHUB=false
```

## Testing

```bash
# Run security tests
npm test src/lib/mcp/__tests__/permissions.test.ts

# All tests should pass (27 tests)
```

## API Integration

### Secure API Route

```typescript
// src/app/api/mcp/call/route.ts
import { secureMCPManager } from '@/lib/mcp/secureManager';

const result = await secureMCPManager.callToolSecure(
  serverName,
  toolName,
  args,
  { userConsent, sessionId }
);

if (!result.permissionCheck.allowed) {
  return NextResponse.json(result, { status: 403 });
}
```

### React Hook

```typescript
import { useMCP } from '@/hooks/useMCP';

const { callToolWithConsent } = useMCP();

// Automatically prompts for consent if needed
const result = await callToolWithConsent(
  'filesystem',
  'write_file',
  { path: 'story.txt', content: '...' }
);
```

## Documentation

- **Quick Start**: `/MCP_SECURITY_QUICKSTART.md`
- **Full Documentation**: `/MCP_SECURITY.md`
- **Migration Guide**: `/MCP_MIGRATION_GUIDE.md`
- **Implementation Summary**: `/MCP_SECURITY_IMPLEMENTATION.md`

## Pre-Production Checklist

- [ ] Set `MCP_SANDBOX_PATH` environment variable
- [ ] Review `SERVER_PERMISSIONS` configuration
- [ ] Enable only necessary servers
- [ ] Test permission denials
- [ ] Verify sensitive data redaction
- [ ] Set up logging service
- [ ] Add rate limiting
- [ ] Implement user authentication

## Support

For issues or questions:
1. Check console logs
2. Visit `/mcp-permissions` UI
3. Run tests
4. Review documentation

---

**Status**: Production-ready with proper configuration
**Tests**: 27/27 passing
**Last Updated**: January 27, 2026
