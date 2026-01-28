# MCP Client Infrastructure

Complete Model Context Protocol (MCP) integration for Storyroom.

## 📁 Structure

```
src/lib/mcp/
├── types.ts          # TypeScript type definitions
├── config.ts         # MCP server configuration
├── client.ts         # Individual MCP client wrapper
├── manager.ts        # Singleton manager for multiple servers
├── index.ts          # Main exports
└── README.md         # This file

src/app/api/mcp/
├── status/route.ts   # GET server status
├── tools/route.ts    # GET available tools
└── call/route.ts     # POST tool execution

src/hooks/
└── useMCP.ts         # React hook for frontend
```

## 🚀 Quick Start

### 1. Configure MCP Servers

Edit `src/lib/mcp/config.ts`:

```typescript
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  filesystem: {
    name: 'Filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/directory'],
    transport: 'stdio',
    enabled: true,
  },
};
```

### 2. Use in API Routes (Server-Side)

```typescript
import { mcpManager } from '@/lib/mcp';

// Call a tool
const result = await mcpManager.callTool('filesystem', 'read_file', {
  path: '/story.txt'
});

// Get all tools
const tools = mcpManager.getAllTools();
```

### 3. Use in React Components (Frontend)

```typescript
import { useMCP } from '@/hooks/useMCP';

function MyComponent() {
  const { status, tools, callTool, loading } = useMCP();

  const handleToolCall = async () => {
    const result = await callTool('filesystem', 'read_file', {
      path: '/story.txt'
    });
    console.log(result);
  };

  return (
    <div>
      <h2>MCP Status</h2>
      {status?.servers.map(server => (
        <div key={server.name}>
          {server.name}: {server.connected ? '✅' : '❌'}
        </div>
      ))}
    </div>
  );
}
```

## 🔧 Available MCP Servers

### Official Servers

1. **Filesystem** - Read/write files
   ```bash
   npx -y @modelcontextprotocol/server-filesystem /path/to/directory
   ```

2. **Memory** - Key-value storage
   ```bash
   npx -y @modelcontextprotocol/server-memory
   ```

3. **SQLite** - Database access
   ```bash
   npx -y @modelcontextprotocol/server-sqlite --db-path ./data.db
   ```

4. **GitHub** - GitHub API access
   ```bash
   npx -y @modelcontextprotocol/server-github
   ```
   Requires: `GITHUB_PERSONAL_ACCESS_TOKEN`

5. **Brave Search** - Web search
   ```bash
   npx -y @modelcontextprotocol/server-brave-search
   ```
   Requires: `BRAVE_API_KEY`

6. **Google Maps** - Location data
   ```bash
   npx -y @modelcontextprotocol/server-google-maps
   ```
   Requires: `GOOGLE_MAPS_API_KEY`

7. **Slack** - Slack integration
   ```bash
   npx -y @modelcontextprotocol/server-slack
   ```
   Requires: `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID`

### Community Servers

Find more at: https://github.com/modelcontextprotocol/servers

## 📡 API Endpoints

### GET `/api/mcp/status`
Get status of all MCP servers

**Response:**
```json
{
  "initialized": true,
  "servers": [
    {
      "name": "filesystem",
      "connected": true,
      "tools": 5
    }
  ]
}
```

### GET `/api/mcp/tools`
List all available tools

**Response:**
```json
{
  "tools": [
    {
      "serverName": "filesystem",
      "tool": {
        "name": "read_file",
        "description": "Read a file",
        "inputSchema": { ... }
      }
    }
  ],
  "toolsByServer": { ... },
  "totalTools": 5
}
```

### POST `/api/mcp/call`
Execute a tool

**Request:**
```json
{
  "serverName": "filesystem",
  "toolName": "read_file",
  "arguments": {
    "path": "/story.txt"
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "File contents..."
      }
    ]
  }
}
```

## 🎯 Use Cases for Storyroom

### 1. Research Assistant
Use Brave Search or Google Maps MCP servers to enhance research:

```typescript
// In research-assistant API route
const searchResults = await mcpManager.callTool('brave', 'brave_web_search', {
  query: 'medieval castle architecture'
});
```

### 2. Story Storage
Use Filesystem or SQLite to store story data:

```typescript
// Save story to file
await mcpManager.callTool('filesystem', 'write_file', {
  path: '/stories/my-story.json',
  content: JSON.stringify(storyData)
});
```

### 3. Character Database
Use SQLite to query character information:

```typescript
// Query character traits
const traits = await mcpManager.callTool('sqlite', 'query', {
  sql: 'SELECT * FROM character_traits WHERE character_id = ?',
  params: ['C1']
});
```

### 4. External Knowledge
Use Memory server to store session context:

```typescript
// Store conversation context
await mcpManager.callTool('memory', 'store', {
  key: 'session_context',
  value: conversationHistory
});
```

## 🔒 Security

- MCP servers run on the **backend only** (Next.js API routes)
- API keys and credentials stay server-side
- Frontend calls API routes, never directly connects to MCP servers
- Use environment variables for sensitive data

## 🐛 Debugging

Enable debug logging:

```typescript
// In config.ts
export const DEBUG_MCP = process.env.NODE_ENV === 'development';
```

Check server status:
```bash
curl http://localhost:3000/api/mcp/status
```

List available tools:
```bash
curl http://localhost:3000/api/mcp/tools
```

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Official Servers](https://github.com/modelcontextprotocol/servers)
- [Community Servers](https://github.com/topics/mcp-server)

## 🚧 Roadmap

- [ ] SSE transport support
- [ ] Server health monitoring
- [ ] Tool call caching
- [ ] Rate limiting
- [ ] Tool call history/logging
- [ ] Dynamic server loading
- [ ] WebSocket support for real-time updates
