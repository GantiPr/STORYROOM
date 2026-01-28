#!/bin/bash

echo "🔍 MCP Diagnostic Tool"
echo "====================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check 2: npx
echo ""
echo "2️⃣  Checking npx..."
if command -v npx &> /dev/null; then
    NPX_VERSION=$(npx --version)
    echo -e "${GREEN}✓${NC} npx installed: $NPX_VERSION"
else
    echo -e "${RED}✗${NC} npx not found"
    exit 1
fi

# Check 3: Dev server
echo ""
echo "3️⃣  Checking dev server..."
if curl -s http://localhost:3000/api/mcp/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Dev server is running"
    
    # Get status
    STATUS=$(curl -s http://localhost:3000/api/mcp/status)
    INITIALIZED=$(echo $STATUS | grep -o '"initialized":[^,]*' | cut -d':' -f2)
    
    if [ "$INITIALIZED" = "true" ]; then
        echo -e "${GREEN}✓${NC} MCP Manager initialized"
    else
        echo -e "${RED}✗${NC} MCP Manager not initialized"
    fi
    
    # Check servers
    echo ""
    echo "   Connected servers:"
    echo $STATUS | jq -r '.servers[] | "   - \(.name): \(if .connected then "✓ connected" else "✗ disconnected" end) (\(.tools) tools)"' 2>/dev/null || echo "   (Unable to parse server status)"
    
else
    echo -e "${RED}✗${NC} Dev server not running"
    echo -e "${YELLOW}→${NC} Run: npm run dev"
    exit 1
fi

# Check 4: MCP server package
echo ""
echo "4️⃣  Testing MCP memory server..."
if timeout 5 npx -y @modelcontextprotocol/server-memory --version > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} MCP memory server package works"
else
    echo -e "${YELLOW}⚠${NC}  MCP memory server test timed out (this is normal)"
fi

# Check 5: Test tool call
echo ""
echo "5️⃣  Testing tool call..."
RESULT=$(curl -s -X POST http://localhost:3000/api/mcp/call \
  -H "Content-Type: application/json" \
  -d '{"serverName":"memory","toolName":"read_graph","arguments":{}}')

SUCCESS=$(echo $RESULT | grep -o '"success":[^,]*' | cut -d':' -f2)

if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✓${NC} Tool call succeeded!"
    echo ""
    echo "   Result preview:"
    echo $RESULT | jq -r '.result.content[0].text' 2>/dev/null | head -5 | sed 's/^/   /'
else
    echo -e "${RED}✗${NC} Tool call failed"
    echo ""
    echo "   Error:"
    echo $RESULT | jq -r '.error // .message // "Unknown error"' 2>/dev/null | sed 's/^/   /'
    
    # Check for common issues
    if echo $RESULT | grep -q "not found"; then
        echo ""
        echo -e "${YELLOW}💡 Tip:${NC} Server might not be configured. Check src/lib/mcp/config.ts"
    elif echo $RESULT | grep -q "Permission denied"; then
        echo ""
        echo -e "${YELLOW}💡 Tip:${NC} Server might not be in allowlist. Check src/lib/mcp/permissions.ts"
    elif echo $RESULT | grep -q "consent"; then
        echo ""
        echo -e "${YELLOW}💡 Tip:${NC} This tool requires user consent. Try from the UI."
    fi
fi

# Check 6: Config files
echo ""
echo "6️⃣  Checking configuration..."

if grep -q "name: 'memory'" src/lib/mcp/config.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Memory server configured"
    
    if grep -A 5 "name: 'memory'" src/lib/mcp/config.ts | grep -q "enabled: true"; then
        echo -e "${GREEN}✓${NC} Memory server enabled"
    else
        echo -e "${RED}✗${NC} Memory server disabled"
        echo -e "${YELLOW}→${NC} Edit src/lib/mcp/config.ts and set enabled: true"
    fi
else
    echo -e "${RED}✗${NC} Memory server not configured"
    echo -e "${YELLOW}→${NC} Add memory server to src/lib/mcp/config.ts"
fi

if grep -q "'memory'" src/lib/mcp/permissions.ts 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Memory server in allowlist"
else
    echo -e "${RED}✗${NC} Memory server not in allowlist"
    echo -e "${YELLOW}→${NC} Add 'memory' to ALLOWED_SERVERS in src/lib/mcp/permissions.ts"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ MCP is working correctly!${NC}"
    echo ""
    echo "You can now:"
    echo "  • Visit http://localhost:3000/mcp-test"
    echo "  • Run the golden tests"
    echo "  • Use MCP tools in your app"
else
    echo -e "${RED}❌ MCP has issues${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Check the errors above"
    echo "  2. Read DEBUG_MCP.md for detailed troubleshooting"
    echo "  3. Make sure dev server is running: npm run dev"
fi

echo ""
