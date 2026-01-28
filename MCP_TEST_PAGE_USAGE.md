# MCP Test Page Usage

## What Changed

The MCP test page now works with the **secure reliability layer**. This means:

1. **Permission checks** - Tools must be allowed in the permission system
2. **User consent** - Write operations require explicit user consent
3. **Structured errors** - Clear error messages instead of raw errors
4. **Reliability features** - Automatic retry, circuit breakers, timeouts

## How to Use the Test Page

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Visit the Test Page

Open: `http://localhost:3000/mcp-test`

### 3. Run Golden Tests

Click the **"🧪 Run Golden Tests"** button.

**What happens:**
1. Tests check server connection
2. Tests list available tools
3. Tests create an entity (will prompt for consent)
4. Tests read the graph
5. Tests delete the entity (will prompt for consent)

**Expected behavior:**
- You'll see a browser prompt asking for permission to create/delete entities
- Click "OK" to grant consent
- Tests should pass with green checkmarks ✅

### 4. Manual Tool Testing

You can also test individual tools:

1. **Select a server** from the dropdown (e.g., "memory")
2. **Select a tool** (e.g., "create_entities")
3. **Enter arguments** in JSON format
4. Click **"🚀 Call Tool"**

**Example arguments for `create_entities`:**
```json
{
  "entities": [
    {
      "name": "test_character",
      "entityType": "character",
      "observations": ["brave", "curious"]
    }
  ]
}
```

## Why Tests Might Fail

### 1. No Servers Configured

**Error:** "No servers connected"

**Solution:** Enable MCP servers in `src/lib/mcp/config.ts`:

```typescript
export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    transport: 'stdio',
    enabled: true, // Make sure this is true
  },
  // ... other servers
];
```

### 2. Permission Denied

**Error:** "Permission denied"

**Solution:** The tool is blocked by the permission system. Check:
- Is the server in the allowlist? (`src/lib/mcp/permissions.ts`)
- Is the tool allowed?

### 3. User Consent Required

**Error:** "User consent required"

**What to do:** 
- Click "OK" when the browser prompts for permission
- Or use the manual tool testing with consent pre-granted

### 4. Server Not Starting

**Error:** "Failed to connect"

**Solution:**
- Make sure `npx` is installed (comes with Node.js)
- Check that the MCP server package exists
- Look at the console for detailed error messages

## Understanding Test Results

### ✅ Green Checkmark = Passed
The test completed successfully.

### ❌ Red X = Failed
The test failed. Check the error message for details.

### ⏳ Hourglass = Running
The test is currently executing.

### ⏸️ Pause = Pending
The test hasn't started yet.

## Consent Flow

When a test requires user consent:

1. **Browser prompt appears:**
   ```
   This operation requires your permission:
   
   Server: memory
   Tool: create_entities
   
   Do you want to proceed?
   ```

2. **Click OK** to grant consent
3. **Click Cancel** to deny (test will fail)

**Note:** Consent is cached for the session, so you won't be prompted again for the same tool.

## Reliability Features in Action

While tests run, you can see reliability features working:

### Automatic Retry
If a test fails transiently, it will retry automatically (up to 3 times).

### Timeout Protection
Tests will timeout after 30 seconds to prevent hanging.

### Circuit Breaker
If a server fails repeatedly, the circuit breaker will open and fail fast.

### Structured Errors
Instead of "Error: undefined", you'll see:
- "Brave Search rate-limited. Please wait 60 seconds."
- "Permission denied. This tool is not allowed."
- "User consent required for this operation."

## Monitoring

While tests run, visit the reliability dashboard to see stats:

**Open:** `http://localhost:3000/mcp-reliability`

You'll see:
- Circuit breaker states
- Cache hit rates
- Concurrency stats
- Real-time updates

## Troubleshooting

### Tests hang forever

**Cause:** Server not responding

**Solution:**
1. Check if the server is actually running
2. Look at the console for errors
3. Try restarting the dev server

### "Tool not found" error

**Cause:** The tool doesn't exist on that server

**Solution:**
1. Check the server status section
2. Verify the tool name is correct
3. Make sure the server is connected

### "Invalid arguments" error

**Cause:** The arguments don't match the tool's schema

**Solution:**
1. Check the tool's input schema
2. Make sure all required fields are provided
3. Verify the JSON is valid

## Example: Full Test Run

1. Visit `http://localhost:3000/mcp-test`
2. Click "🧪 Run Golden Tests"
3. See "Server Connection" test pass ✅
4. See "List Tools" test pass ✅
5. Browser prompts for consent to create entity
6. Click "OK"
7. See "Create Entity" test pass ✅
8. See "Read Graph" test pass ✅
9. Browser prompts for consent to delete entity
10. Click "OK"
11. See "Delete Entity" test pass ✅
12. See summary: "🎉 All tests passed!"

## Next Steps

Once tests pass:
- Your MCP infrastructure is working correctly
- You can use MCP tools throughout the app
- The reliability layer is protecting all operations
- You can monitor everything in the reliability dashboard

## Need Help?

Check these files for more info:
- `RELIABILITY_GUIDE.md` - Full reliability documentation
- `MCP_SECURITY.md` - Security and permissions
- `MCP_RESEARCH_WORKFLOW.md` - Research workflow
- `src/lib/mcp/README.md` - MCP implementation details
