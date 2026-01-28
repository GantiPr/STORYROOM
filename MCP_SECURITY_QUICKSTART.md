# MCP Security Quick Start

## 🚀 5-Minute Setup

### 1. Configure Sandbox Path

Add to `.env.local`:

```bash
MCP_SANDBOX_PATH=/path/to/your/workspace
```

This restricts filesystem operations to this directory only.

### 2. Review Server Permissions

Edit `src/lib/mcp/permissions.ts` and enable only the servers you need:

```typescript
export const SERVER_PERMISSIONS = {
  memory: { enabled: true },      // ✅ Safe
  filesystem: { enabled: true },  // ⚠️  Needs sandbox
  github: { enabled: false },     // ❌ Disabled by default
  brave: { enabled: false },      // ❌ Disabled by default
};
```

### 3. Test Security

```bash
# Start your app
npm run dev

# Visit the permissions UI
open http://localhost:3000/mcp-permissions

# Test an API call
curl -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverName": "memory",
    "toolName": "create_entities",
    "arguments": {"entities": [{"name": "Test", "entityType": "character"}]}
  }'
```

## 🔒 Security Levels

### Level 1: Read-Only (Default)
- Filesystem: read files only
- GitHub: read repos only
- Databases: SELECT queries only

### Level 2: Write with Consent
- User must approve each write operation
- Cached per session
- Can be revoked anytime

### Level 3: Full Access (Dangerous)
- Requires explicit configuration
- Use only in development
- Never in production

## 🛡️ What's Protected

### Automatically Blocked:
- ❌ Writing to `.env` files
- ❌ Modifying `.git` directory
- ❌ Changing `package.json`
- ❌ `DROP TABLE` queries
- ❌ Deleting critical files

### Automatically Redacted:
- 🔒 API keys and tokens
- 🔒 AWS credentials
- 🔒 GitHub tokens
- 🔒 Passwords
- 🔒 Private keys
- 🔒 Database URLs

## 📊 Monitor Usage

Visit `/mcp-permissions` to:
- See all available tools
- Check which tools are allowed/denied
- Grant/revoke consent
- View tool scopes (read/write/execute)

## ⚡ Quick Commands

```bash
# Grant consent for a tool
curl -X POST http://localhost:3000/api/mcp/permissions \
  -H "Content-Type: application/json" \
  -d '{"action":"grant","serverName":"filesystem","toolName":"write_file"}'

# Revoke consent
curl -X POST http://localhost:3000/api/mcp/permissions \
  -H "Content-Type: application/json" \
  -d '{"action":"revoke","serverName":"filesystem","toolName":"write_file"}'

# Clear all consent
curl -X POST http://localhost:3000/api/mcp/permissions \
  -H "Content-Type: application/json" \
  -d '{"action":"clear"}'
```

## 🚨 Before Production

- [ ] Set `MCP_SANDBOX_PATH` in production env
- [ ] Disable unused servers
- [ ] Review all `enabled: true` servers
- [ ] Test permission denials
- [ ] Set up logging service
- [ ] Add rate limiting
- [ ] Implement user authentication

## 📖 Full Documentation

See `MCP_SECURITY.md` for complete details.

## 🆘 Troubleshooting

**Tool call returns 403?**
- Check if server is enabled in `SERVER_PERMISSIONS`
- Check if tool is in `allowedTools` list
- Check if tool requires user consent

**Path outside sandbox error?**
- Verify `MCP_SANDBOX_PATH` is set correctly
- Ensure requested path is within sandbox

**Sensitive data in logs?**
- Add pattern to `SENSITIVE_PATTERNS` in `permissions.ts`
- Redaction happens automatically

## 💡 Tips

1. Start with read-only access
2. Enable write access only when needed
3. Use consent for all write operations
4. Monitor the permissions UI regularly
5. Review logs for suspicious activity
6. Keep `SENSITIVE_PATTERNS` updated
