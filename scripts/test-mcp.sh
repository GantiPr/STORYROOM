#!/bin/bash

# MCP Test Runner
# Runs golden tests to verify MCP infrastructure

echo "🧪 MCP Golden Test Suite"
echo "========================"
echo ""

# Check if Memory server is configured
echo "📋 Checking configuration..."
if grep -q "enabled: true" src/lib/mcp/config.ts; then
  echo "✅ At least one server is enabled"
else
  echo "⚠️  No servers enabled in config.ts"
  echo "   Edit src/lib/mcp/config.ts to enable a server"
  exit 1
fi

echo ""
echo "🚀 Running Jest tests..."
echo ""

# Run the golden tests
npm run test:mcp

echo ""
echo "📊 Test Results Summary"
echo "======================="
echo ""
echo "If all tests passed:"
echo "  ✅ MCP infrastructure is working correctly"
echo "  ✅ Servers connect/disconnect cleanly"
echo "  ✅ Tools return deterministic results"
echo "  ✅ Ready to build UX on top"
echo ""
echo "If tests failed:"
echo "  1. Check server configuration in src/lib/mcp/config.ts"
echo "  2. Ensure npx is installed: npx --version"
echo "  3. Test server manually: npx -y @modelcontextprotocol/server-memory"
echo "  4. Check logs for connection errors"
echo ""
echo "Next steps:"
echo "  • Visit http://localhost:3000/mcp-test for interactive testing"
echo "  • Read MCP_SETUP.md for integration examples"
echo "  • Check src/lib/mcp/README.md for API documentation"
