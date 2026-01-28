# MCP Debugging Guide - Step 3 Failure

## What's Happening

Step 3 is trying to call the `read_graph` tool on the memory server. If it's failing, here are the most common causes:

## Quick Diagnosis

### 1. Check Browser Console

Open browser DevTools (F12 or Cmd+Option+I) and look for errors.

**Common errors:**

#### Error: "MCP server not found: memory"
**Cause:** Memory server is not configured or not starting

**Fix:**
```bash
# Check if the server config is correct
cat src/lib/mcp/config.ts | grep -A 10 "name: 'memory'"
```

Should show:
```typescript
{
  name: 'memory',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory'],
  transport: 'stdio',
  enabled: true,  // ← Must be true
}
```

#### Error: "Permission denied"
**Cause:** Memory server is not in the allowlist

**Fix:** Check `src/lib/mcp/permissions.ts`:
```typescript
export const ALLOWED_SERVERS = [
  'memory',  // ← Must be here
  'brave-search',
  // ...
];
```

#### Error: "Tool not found: read_graph"
**Cause:** Memory server didn't start correctly or wrong tool name

**Fix:** The tool might be called something else. Check what tools are available.

#### Error: "Failed to initialize MCP manager"
**Cause:** MCP manager failed to start

**Fix:** Check server logs in terminal where you ran `npm run dev`

---

## Step-by-Step Debugging

### Step 1: Check Server Status in Browser

1. Open: `http://localhost:3000/mcp-test`
2. Look at "Server Status" section
3. Is memory server showing ✅ or ❌?

**If ❌ (red X):**
- Server is not starting
- Go to Step 2

**If ✅ (green check):**
- Server is running
- Go to Step 3

---

### Step 2: Check Server Logs

In your terminal where `npm run dev` is running, look for:

**Good logs:**
```
✓ MCP Manager initialized
✓ Connected to memory server
✓ Loaded 8 tools from memory
```

**Bad logs:**
```
✗ Failed to connect to memory server
✗ Error: spawn npx ENOENT
✗ Server process exited with code 1
```

**If you see errors:**

#### Error: "spawn npx ENOENT"
**Fix:**
```bash
# Check if npx is installed
npx --version

# If not, install Node.js from nodejs.org
```

#### Error: "Server process exited with code 1"
**Fix:**
```bash
# Test the server manually
npx -y @modelcontextprotocol/server-memory

# If this fails, there's an issue with the MCP server package
```

#### Error: "EACCES: permission denied"
**Fix:**
```bash
# Fix npm permissions
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

---

### Step 3: Test API Directly

Open a new terminal and test the API directly:

```bash
# Test the status endpoint
curl http://localhost:3000/api/mcp/status | jq

# Should return:
# {
#   "initialized": true,
#   "servers": [
#     {
#       "name": "memory",
#       "connected": true,
#       "tools": 8
#     }
#   ]
# }
```

**If status shows connected, test the tool call:**

```bash
curl -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{
    "serverName": "memory",
    "toolName": "read_graph",
    "arguments": {}
  }' | jq
```

**Expected response:**
```json
{
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Entities:\n..."
      }
    ]
  }
}
```

**If you get an error, the response will tell you exactly what's wrong.**

---

### Step 4: Check MCP Config

```bash
# View your MCP config
cat src/lib/mcp/config.ts
```

**Make sure:**
1. Memory server is defined
2. `enabled: true`
3. Command is `'npx'`
4. Args include `'-y'` and `'@modelcontextprotocol/server-memory'`

---

### Step 5: Check Permissions

```bash
# View permissions config
cat src/lib/mcp/permissions.ts | grep -A 5 "ALLOWED_SERVERS"
```

**Make sure:**
```typescript
export const ALLOWED_SERVERS = [
  'memory',  // ← This must be here
  // ...
];
```

---

## Common Fixes

### Fix 1: Enable Memory Server

Edit `src/lib/mcp/config.ts`:

```typescript
{
  name: 'memory',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory'],
  transport: 'stdio',
  enabled: true,  // ← Change to true if false
}
```

### Fix 2: Add to Allowlist

Edit `src/lib/mcp/permissions.ts`:

```typescript
export const ALLOWED_SERVERS = [
  'memory',  // ← Add this if missing
  'brave-search',
  'filesystem',
  'github',
  'sqlite',
  'postgres',
];
```

### Fix 3: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Fix 4: Clear Node Modules and Reinstall

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Get Detailed Error Info

### In Browser Console

```javascript
// Open browser console (F12)
// Run this to see detailed error:
fetch('/api/mcp/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serverName: 'memory',
    toolName: 'read_graph',
    arguments: {}
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

This will show you the exact error message.

---

## Still Not Working?

### Collect Debug Info

Run these commands and share the output:

```bash
# 1. Check Node version
node --version

# 2. Check npm version
npm --version

# 3. Check if npx works
npx --version

# 4. Test MCP server directly
npx -y @modelcontextprotocol/server-memory

# 5. Check server status
curl http://localhost:3000/api/mcp/status

# 6. Check if dev server is running
curl http://localhost:3000/api/health || echo "Server not running"
```

### Check These Files

1. `src/lib/mcp/config.ts` - Server configuration
2. `src/lib/mcp/permissions.ts` - Permission allowlist
3. Terminal logs where `npm run dev` is running
4. Browser console (F12) for JavaScript errors

---

## Expected Working State

When everything is working correctly:

1. **Terminal shows:**
   ```
   ✓ MCP Manager initialized
   ✓ Connected to memory server
   ✓ Loaded 8 tools
   ```

2. **Browser shows:**
   - Server Status: ✅ memory - 8 tools available

3. **API call succeeds:**
   ```bash
   curl -X POST http://localhost:3000/api/mcp/call \
     -H "Content-Type: application/json" \
     -d '{"serverName":"memory","toolName":"read_graph","arguments":{}}' \
     | jq '.success'
   # Returns: true
   ```

4. **Manual test works:**
   - Select server: memory
   - Select tool: read_graph
   - Arguments: {}
   - Click "Call Tool"
   - See result with entities

---

## Quick Test Script

Save this as `test-mcp.sh`:

```bash
#!/bin/bash

echo "Testing MCP Setup..."
echo ""

echo "1. Checking Node.js..."
node --version || echo "❌ Node.js not found"

echo ""
echo "2. Checking npx..."
npx --version || echo "❌ npx not found"

echo ""
echo "3. Testing MCP server..."
timeout 5 npx -y @modelcontextprotocol/server-memory --version 2>&1 | head -5

echo ""
echo "4. Checking dev server..."
curl -s http://localhost:3000/api/mcp/status | jq '.initialized' || echo "❌ Dev server not running"

echo ""
echo "5. Testing tool call..."
curl -s -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"serverName":"memory","toolName":"read_graph","arguments":{}}' \
  | jq '.success' || echo "❌ Tool call failed"

echo ""
echo "Done!"
```

Run it:
```bash
chmod +x test-mcp.sh
./test-mcp.sh
```

---

## What to Share for Help

If you need help, share:

1. **Error message** from browser console
2. **Terminal logs** from `npm run dev`
3. **Output** from the test script above
4. **Node version:** `node --version`
5. **Operating system:** macOS/Windows/Linux

This will help diagnose the exact issue!
