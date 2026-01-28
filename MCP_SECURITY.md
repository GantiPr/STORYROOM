# MCP Security & Permissions

## Overview

Storyroom implements a comprehensive security layer for MCP (Model Context Protocol) integration. This ensures that external tool access is controlled, audited, and safe for production use.

## Architecture

```
User Request
    ↓
API Route (/api/mcp/call)
    ↓
SecureMCPManager (security layer)
    ↓
PermissionChecker (validates)
    ↓
MCPManager (executes)
    ↓
MCP Server (filesystem, GitHub, etc.)
```

## Security Features

### 1. Server Allowlist

Only explicitly enabled servers can be used. Configure in `src/lib/mcp/permissions.ts`:

```typescript
export const SERVER_PERMISSIONS: Record<string, ServerPermission> = {
  memory: {
    enabled: true,
    defaultScope: 'write',
    requiresUserConsent: false,
  },
  filesystem: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: true,
    allowedTools: ['read_file', 'list_directory'],
    deniedTools: ['write_file', 'delete_file'],
  },
};
```

### 2. Tool Allowlist

Within each server, you can specify which tools are allowed:

- `allowedTools`: Whitelist of permitted tools
- `deniedTools`: Blacklist of forbidden tools

### 3. Scopes (Read/Write/Execute)

Each tool has a scope:

- **read**: Safe operations (reading files, listing directories)
- **write**: Dangerous operations (writing files, creating issues)
- **execute**: High-risk operations (running queries, executing code)

### 4. User Consent

Tools marked with `requiresUserConsent: true` need explicit user approval before execution.

Consent can be:
- Per-request (passed in API call)
- Session-based (cached after first approval)
- Persistent (stored in database - TODO)

### 5. Path Sandboxing

Filesystem operations are restricted to a sandbox directory:

```typescript
sandboxPath: process.env.MCP_SANDBOX_PATH || process.cwd()
```

Set `MCP_SANDBOX_PATH` in `.env` to restrict filesystem access:

```bash
MCP_SANDBOX_PATH=/path/to/workspace
```

### 6. Pattern Matching

Deny dangerous operations with regex patterns:

```typescript
deniedPatterns: [
  '.*\\.env.*',           // No .env files
  '.*\\.git/.*',          // No .git directory
  '.*/node_modules/.*',   // No node_modules
  'DROP\\s+TABLE',        // No DROP TABLE queries
]
```

### 7. Sensitive Data Redaction

Automatically redacts sensitive data from logs:

- API keys and tokens
- AWS credentials
- GitHub tokens
- Private keys
- Passwords
- Database connection strings
- JWT tokens

## Usage

### API Endpoint

Call tools with security checks:

```typescript
POST /api/mcp/call
{
  "serverName": "filesystem",
  "toolName": "read_file",
  "arguments": { "path": "./README.md" },
  "userConsent": true  // Optional, for consent-required tools
}
```

Response includes permission information:

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

### Permission Denied Response

```json
{
  "success": false,
  "error": "Permission denied",
  "reason": "Tool 'write_file' is not allowed on server 'filesystem'",
  "permissionCheck": {
    "allowed": false,
    "scope": "write",
    "consentRequired": true,
    "consentGiven": false
  }
}
```

### Managing Consent

Grant consent for a tool:

```typescript
POST /api/mcp/permissions
{
  "action": "grant",
  "serverName": "filesystem",
  "toolName": "write_file"
}
```

Revoke consent:

```typescript
POST /api/mcp/permissions
{
  "action": "revoke",
  "serverName": "filesystem",
  "toolName": "write_file"
}
```

Clear all consent:

```typescript
POST /api/mcp/permissions
{
  "action": "clear"
}
```

### UI Management

Visit `/mcp-permissions` to view and manage permissions in the UI:

- View all tools with permission status
- Filter by allowed/denied/consent-required
- Grant/revoke consent for individual tools
- Clear all consent

## Configuration

### Environment Variables

```bash
# Sandbox path for filesystem operations
MCP_SANDBOX_PATH=/path/to/workspace

# Enable/disable specific servers
MCP_ENABLE_FILESYSTEM=true
MCP_ENABLE_GITHUB=false
```

### Customizing Permissions

Edit `src/lib/mcp/permissions.ts`:

1. **Add a new server**:
```typescript
myserver: {
  enabled: true,
  defaultScope: 'read',
  requiresUserConsent: true,
}
```

2. **Add tool-specific permissions**:
```typescript
my_tool: {
  scope: 'write',
  requiresUserConsent: true,
  deniedPatterns: ['.*sensitive.*'],
}
```

3. **Add sensitive data patterns**:
```typescript
export const SENSITIVE_PATTERNS = [
  /my_secret_pattern/gi,
  // ...
];
```

## Security Checklist

Before deploying to production:

- [ ] Review and configure `SERVER_PERMISSIONS`
- [ ] Set `MCP_SANDBOX_PATH` environment variable
- [ ] Enable only necessary servers
- [ ] Test permission denials work correctly
- [ ] Verify sensitive data redaction
- [ ] Set up secure logging service
- [ ] Implement user authentication
- [ ] Add rate limiting to API routes
- [ ] Review and update `SENSITIVE_PATTERNS`
- [ ] Test with real MCP servers (filesystem, GitHub, etc.)

## Logging

All tool executions are logged with:

- Server name and tool name
- Scope (read/write/execute)
- Duration
- Success/failure
- User ID and session ID
- **Redacted** arguments and results

Logs are currently sent to console. In production, integrate with:

- CloudWatch
- Datadog
- Sentry
- Custom logging service

Edit `src/lib/mcp/secureManager.ts` to implement:

```typescript
private logExecution(log: ExecutionLog): void {
  // Send to your logging service
  await sendToLoggingService(log);
}
```

## Testing

Test the security layer:

```bash
# Run tests
npm test src/lib/mcp/__tests__/

# Test permission denials
curl -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"serverName":"filesystem","toolName":"delete_file","arguments":{"path":".env"}}'

# Should return 403 Forbidden
```

## Future Enhancements

- [ ] Persistent consent storage (database)
- [ ] Role-based access control (RBAC)
- [ ] Audit trail with full history
- [ ] Rate limiting per user/tool
- [ ] Webhook notifications for high-risk operations
- [ ] Integration with external auth providers
- [ ] Tool usage analytics dashboard
- [ ] Automated security scanning
- [ ] Compliance reporting (SOC2, GDPR)

## Support

For questions or issues:

1. Check the logs in console
2. Visit `/mcp-permissions` to debug
3. Review `src/lib/mcp/permissions.ts` configuration
4. Test with `/api/mcp/tools` to see available tools

## License

This security implementation is part of Storyroom and follows the same license.
