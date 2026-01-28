# MCP Security Migration Guide

## Overview

This guide helps you migrate existing MCP tool calls to use the new secure implementation.

## Breaking Changes

### 1. API Response Format

**Before:**
```json
{
  "success": true,
  "result": { ... }
}
```

**After:**
```json
{
  "success": true,
  "result": { ... },
  "permissionCheck": {
    "allowed": true,
    "scope": "read",
    "consentRequired": false,
    "consentGiven": true
  }
}
```

### 2. Error Responses

**Before:**
```json
{
  "error": "Tool call failed",
  "message": "..."
}
```

**After (Permission Denied):**
```json
{
  "success": false,
  "error": "Permission denied",
  "reason": "Tool 'write_file' is not allowed on server 'filesystem'",
  "permissionCheck": { ... }
}
```

Status code: `403 Forbidden` (instead of `500`)

### 3. User Consent Required

**New Behavior:**
Tools requiring consent will return `403` if consent not provided:

```json
{
  "success": false,
  "error": "User consent required",
  "permissionCheck": {
    "allowed": false,
    "consentRequired": true,
    "consentGiven": false
  }
}
```

## Migration Steps

### Step 1: Update API Calls

**Before:**
```typescript
const response = await fetch('/api/mcp/call', {
  method: 'POST',
  body: JSON.stringify({
    serverName: 'filesystem',
    toolName: 'read_file',
    arguments: { path: './file.txt' }
  })
});
```

**After:**
```typescript
const response = await fetch('/api/mcp/call', {
  method: 'POST',
  body: JSON.stringify({
    serverName: 'filesystem',
    toolName: 'read_file',
    arguments: { path: './file.txt' },
    userConsent: true  // Add if tool requires consent
  })
});

// Handle permission errors
if (response.status === 403) {
  const data = await response.json();
  if (data.permissionCheck?.consentRequired) {
    // Prompt user for consent
  }
}
```

### Step 2: Update React Components

**Before:**
```typescript
const { callTool } = useMCP();

try {
  const result = await callTool('filesystem', 'write_file', {
    path: 'story.txt',
    content: 'Once upon a time...'
  });
} catch (error) {
  console.error('Failed:', error);
}
```

**After (Option 1: Manual Consent):**
```typescript
const { callTool } = useMCP();

try {
  const result = await callTool(
    'filesystem',
    'write_file',
    { path: 'story.txt', content: 'Once upon a time...' },
    { userConsent: true }
  );
} catch (error) {
  if (error.message.includes('consent required')) {
    // Handle consent error
  }
}
```

**After (Option 2: Automatic Consent Prompt):**
```typescript
const { callToolWithConsent } = useMCP();

try {
  // Automatically prompts user if consent needed
  const result = await callToolWithConsent(
    'filesystem',
    'write_file',
    { path: 'story.txt', content: 'Once upon a time...' }
  );
} catch (error) {
  if (error.message === 'User denied consent') {
    // User clicked "Cancel" on consent prompt
  }
}
```

### Step 3: Update Direct Manager Usage

**Before:**
```typescript
import { mcpManager } from '@/lib/mcp/manager';

const result = await mcpManager.callTool(
  'filesystem',
  'read_file',
  { path: './file.txt' }
);
```

**After:**
```typescript
import { secureMCPManager } from '@/lib/mcp/secureManager';

const result = await secureMCPManager.callToolSecure(
  'filesystem',
  'read_file',
  { path: './file.txt' },
  {
    userConsent: true,
    userId: 'user-123',
    sessionId: 'session-456'
  }
);

// Check permission result
if (!result.permissionCheck.allowed) {
  console.error('Permission denied:', result.permissionCheck.reason);
}
```

### Step 4: Handle Tool Availability

**Before:**
```typescript
const tools = mcpManager.getAllTools();
// All tools returned
```

**After:**
```typescript
const tools = secureMCPManager.getToolsWithPermissions();
// Tools include permission info

const allowedTools = tools.filter(t => t.allowed);
const consentTools = tools.filter(t => t.requiresConsent);
```

## Common Scenarios

### Scenario 1: Read-Only Operations

Most read operations work without changes:

```typescript
// These work out of the box (no consent needed)
await callTool('memory', 'create_entities', { entities: [...] });
await callTool('filesystem', 'read_file', { path: './README.md' });
await callTool('brave', 'search', { query: 'medieval castles' });
```

### Scenario 2: Write Operations

Write operations need consent:

```typescript
// Option 1: Provide consent in call
await callTool(
  'filesystem',
  'write_file',
  { path: 'story.txt', content: '...' },
  { userConsent: true }
);

// Option 2: Grant consent once per session
await grantConsent('filesystem', 'write_file');
await callTool('filesystem', 'write_file', { ... });
```

### Scenario 3: Batch Operations

```typescript
// Grant consent once for multiple operations
await grantConsent('github', 'create_issue');

for (const issue of issues) {
  await callTool('github', 'create_issue', issue);
}

// Revoke when done
await revokeConsent('github', 'create_issue');
```

### Scenario 4: Error Handling

```typescript
try {
  const result = await callToolWithConsent(
    'filesystem',
    'delete_file',
    { path: 'temp.txt' }
  );
} catch (error) {
  if (error.message.includes('Permission denied')) {
    // Tool not allowed
    console.error('This tool is disabled');
  } else if (error.message.includes('consent required')) {
    // User needs to approve
    console.error('User approval needed');
  } else if (error.message === 'User denied consent') {
    // User clicked cancel
    console.error('User declined');
  } else if (error.message.includes('outside the allowed sandbox')) {
    // Path sandboxing violation
    console.error('Invalid path');
  } else {
    // Other error
    console.error('Tool execution failed:', error);
  }
}
```

## Testing Your Migration

### 1. Test Permission Denials

```bash
# Should return 403
curl -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverName": "filesystem",
    "toolName": "delete_file",
    "arguments": {"path": ".env"}
  }'
```

### 2. Test Consent Flow

```typescript
// Should prompt for consent
const result = await callToolWithConsent(
  'filesystem',
  'write_file',
  { path: 'test.txt', content: 'test' }
);
```

### 3. Test Sandbox Violations

```typescript
// Should fail if path outside sandbox
await callTool('filesystem', 'read_file', {
  path: '/etc/passwd'  // Outside sandbox
});
```

## Rollback Plan

If you need to temporarily disable security:

### Option 1: Use Direct Manager (Not Recommended)

```typescript
// Emergency bypass (development only!)
import { mcpManager } from '@/lib/mcp/manager';
const result = await mcpManager.callTool(...);
```

### Option 2: Grant Blanket Consent

```typescript
// Grant consent for all tools (development only!)
const tools = await fetch('/api/mcp/tools').then(r => r.json());
for (const tool of tools.tools) {
  if (tool.requiresConsent) {
    await grantConsent(tool.serverName, tool.toolName);
  }
}
```

### Option 3: Modify Permissions Config

Edit `src/lib/mcp/permissions.ts`:

```typescript
// Temporarily disable consent (development only!)
filesystem: {
  enabled: true,
  requiresUserConsent: false,  // Changed from true
  // ...
}
```

## Checklist

- [ ] Updated all `callTool` calls to handle consent
- [ ] Added error handling for `403` responses
- [ ] Tested permission denials work correctly
- [ ] Tested consent prompts appear when needed
- [ ] Updated UI to show tool permission status
- [ ] Set `MCP_SANDBOX_PATH` environment variable
- [ ] Reviewed which tools are enabled in production
- [ ] Documented approved tools for your team
- [ ] Tested with real MCP servers
- [ ] Updated any documentation/README files

## Support

If you encounter issues:

1. Check `/mcp-permissions` page for tool status
2. Review console logs for detailed errors
3. Test with `npm test src/lib/mcp/__tests__/permissions.test.ts`
4. See `MCP_SECURITY.md` for full documentation

## FAQ

**Q: Can I disable security for development?**
A: Yes, but not recommended. Instead, grant consent once per session or modify `requiresUserConsent` in config.

**Q: How do I allow a previously denied tool?**
A: Edit `src/lib/mcp/permissions.ts` and add the tool to `allowedTools` or remove from `deniedTools`.

**Q: What if I need to write to `.env` files?**
A: Remove the pattern from `deniedPatterns` in `TOOL_PERMISSIONS`, but this is highly discouraged.

**Q: Can users override permissions?**
A: No, permissions are enforced server-side. Only admins can modify `permissions.ts`.

**Q: How do I add a new MCP server?**
A: Add it to `SERVER_PERMISSIONS` in `src/lib/mcp/permissions.ts` with appropriate settings.

---

**Need Help?** See `MCP_SECURITY.md` or `MCP_SECURITY_QUICKSTART.md`
