# Quick MCP Verification Guide

## 🎯 Goal
Verify the MCP infrastructure works end-to-end with deterministic golden tests.

## ⏱️ Time Required
~5-10 minutes

---

## Step 1: Enable Memory Server (1 min)

Edit `src/lib/mcp/config.ts`:

```typescript
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  memory: {
    name: 'Memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    transport: 'stdio',
    enabled: true, // ← Make sure this is true
  },
};
```

---

## Step 2: Run Automated Tests (2-3 min)

```bash
npm run test:mcp
```

**Expected Output:**
```
✓ should connect and list tools
✓ should store and retrieve a value
✓ should handle missing keys gracefully
✓ should delete a stored value
✓ should handle complex JSON values
... (15 tests total)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

---

## Step 3: Run Interactive Tests (2-3 min)

```bash
npm run dev
```

Visit: http://localhost:3000/mcp-test

1. Click **"Run Golden Tests"**
2. Watch tests execute in real-time
3. Verify all 5 tests pass ✅

**Expected Results:**
- ✅ Server Connection (< 1s)
- ✅ List Tools (< 100ms)
- ✅ Store Value (< 200ms)
- ✅ Retrieve Value (< 200ms)
- ✅ Delete Value (< 200ms)

---

## Step 4: Manual Tool Testing (2-3 min)

On the same page (http://localhost:3000/mcp-test):

1. **Select Server:** Memory
2. **Select Tool:** store
3. **Arguments:**
   ```json
   {
     "key": "my_test",
     "value": "Hello from Storyroom!"
   }
   ```
4. Click **"Call Tool"**
5. Verify success message appears

Then test retrieve:
1. **Select Tool:** retrieve
2. **Arguments:**
   ```json
   {
     "key": "my_test"
   }
   ```
3. Click **"Call Tool"**
4. Verify you see: "Hello from Storyroom!"

---

## ✅ Success Criteria

### All tests should:
- ✅ Connect to server without errors
- ✅ List tools (store, retrieve, delete)
- ✅ Store values successfully
- ✅ Retrieve exact values stored
- ✅ Delete values successfully
- ✅ Complete in < 5 seconds total

### If tests fail:

**Problem:** "No servers connected"
- **Fix:** Enable memory server in `src/lib/mcp/config.ts`

**Problem:** "npx command not found"
- **Fix:** Install Node.js/npm: https://nodejs.org

**Problem:** "Server connection timeout"
- **Fix:** Test manually: `npx -y @modelcontextprotocol/server-memory`

**Problem:** "Tool call failed"
- **Fix:** Check server logs in terminal for errors

---

## 🎉 Verification Complete!

If all tests pass, you have a **known-good baseline** and can confidently:

1. ✅ Build UX features on top of MCP
2. ✅ Integrate MCP into existing features
3. ✅ Add more MCP servers
4. ✅ Deploy to production

---

## 📚 Next Steps

### Immediate (< 1 hour)
- [ ] Read `MCP_SETUP.md` for integration examples
- [ ] Try adding Brave Search or Filesystem server
- [ ] Test with your own data

### Short-term (1-2 days)
- [ ] Integrate MCP into Research Assistant
- [ ] Use Memory for Builder session context
- [ ] Add Filesystem for story backups

### Long-term (1-2 weeks)
- [ ] Add SQLite for structured data
- [ ] Build custom MCP workflows
- [ ] Monitor performance in production

---

## 📖 Documentation

- **Setup Guide:** `MCP_SETUP.md`
- **API Docs:** `src/lib/mcp/README.md`
- **Verification:** `MCP_VERIFICATION.md`
- **Test Suite:** `src/lib/mcp/__tests__/golden.test.ts`

---

**Ready to verify?** Run `npm run test:mcp` now! 🚀
