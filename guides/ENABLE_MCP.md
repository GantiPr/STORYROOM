# Enable MCP Server - Quick Fix

## Issue
The "Run Golden Tests" button is disabled because no MCP servers are configured.

## Solution

### Step 1: Memory Server is Now Enabled ✅

I've already enabled the Memory server in `src/lib/mcp/config.ts`:

```typescript
memory: {
  name: 'Memory',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory'],
  transport: 'stdio',
  enabled: true,
}
```

### Step 2: Restart Your Dev Server

The MCP manager initializes when the server starts, so you need to restart:

```bash
# Stop your current dev server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Test the Connection

Visit: http://localhost:3000/mcp-test

You should now see:
- ✅ Memory server in "Server Status" section
- ✅ "Run Golden Tests" button is now clickable
- ✅ 9 tools available

### Step 4: Run the Tests

Click **"Run Golden Tests"** and watch:
1. ✅ Server Connection
2. ✅ List Tools
3. ✅ Create Entity
4. ✅ Read Graph
5. ✅ Delete Entity

All tests should pass in ~2-3 seconds!

---

## Troubleshooting

### Button still disabled?

**Check server status:**
- Look for "Server Status" section on the page
- Should show: Memory ✅ with "9 tools available"
- If showing ❌, check terminal for errors

**Common issues:**

1. **"npx command not found"**
   - Install Node.js: https://nodejs.org
   - Verify: `npx --version`

2. **Server connection timeout**
   - First time may be slow (downloading package)
   - Wait 10-20 seconds and refresh page

3. **Still no servers showing**
   - Check terminal for error messages
   - Verify `src/lib/mcp/config.ts` has `enabled: true`
   - Try: `npx -y @modelcontextprotocol/server-memory` manually

### Manual verification

Test the server directly:
```bash
npx -y @modelcontextprotocol/server-memory
```

Should output: "Knowledge Graph MCP Server running on stdio"

---

## Next Steps

Once the button works:
1. Click "Run Golden Tests"
2. Verify all 5 tests pass ✅
3. Try manual tool testing below
4. Start integrating MCP into your app!

---

**Quick command to restart and test:**
```bash
# Stop server (Ctrl+C), then:
npm run dev
# Visit: http://localhost:3000/mcp-test
```
