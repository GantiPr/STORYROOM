# MCP Setup Guide for Storyroom

## ✅ What's Been Set Up

Your MCP client infrastructure is now fully configured! Here's what you have:

### 📦 Installed Packages
- `@modelcontextprotocol/sdk` - Official MCP SDK

### 🏗️ Infrastructure Created

1. **Core MCP Library** (`src/lib/mcp/`)
   - `types.ts` - TypeScript definitions
   - `config.ts` - Server configuration
   - `client.ts` - Individual server client
   - `manager.ts` - Multi-server manager (singleton)
   - `index.ts` - Clean exports

2. **API Routes** (`src/app/api/mcp/`)
   - `GET /api/mcp/status` - Server status
   - `GET /api/mcp/tools` - List all tools
   - `POST /api/mcp/call` - Execute tools

3. **React Hook** (`src/hooks/useMCP.ts`)
   - Easy frontend integration
   - Automatic status/tools loading
   - Simple tool calling

4. **Test Page** (`/mcp-test`)
   - Visual MCP console
   - Test tool execution
   - View server status

## 🚀 Quick Start

### Step 1: Configure an MCP Server

Edit `src/lib/mcp/config.ts` and uncomment a server:

```typescript
export const MCP_SERVERS: Record<string, MCPServerConfig> = {
  // Example: Memory server (simplest to test)
  memory: {
    name: 'Memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    transport: 'stdio',
    enabled: true,
  },
};
```

### Step 2: Start Your App

```bash
npm run dev
```

### Step 3: Test the Connection

Visit: http://localhost:3000/mcp-test

You should see:
- ✅ Memory server connected
- List of available tools
- Tool testing interface

### Step 4: Use in Your App

#### In API Routes (Server-Side):
```typescript
import { mcpManager } from '@/lib/mcp';

// In your API route
export async function POST(request: Request) {
  const result = await mcpManager.callTool('memory', 'store', {
    key: 'story_context',
    value: 'Once upon a time...'
  });
  
  return Response.json({ result });
}
```

#### In React Components (Frontend):
```typescript
import { useMCP } from '@/hooks/useMCP';

function MyComponent() {
  const { tools, callTool } = useMCP();
  
  const handleSave = async () => {
    await callTool('memory', 'store', {
      key: 'story_context',
      value: 'Once upon a time...'
    });
  };
  
  return <button onClick={handleSave}>Save to Memory</button>;
}
```

## 🔧 Recommended MCP Servers for Storyroom

### 1. Memory Server (Start Here!)
**Best for:** Knowledge graphs, entity relationships, story context

```typescript
memory: {
  name: 'Memory',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-memory'],
  transport: 'stdio',
  enabled: true,
}
```

**Tools:**
- `create_entities` - Create entities (characters, locations, etc.)
- `create_relations` - Define relationships between entities
- `add_observations` - Add facts/observations to entities
- `read_graph` - Read the entire knowledge graph
- `search_nodes` - Search for specific entities
- `delete_entities` - Remove entities
- `delete_relations` - Remove relationships
- `delete_observations` - Remove observations
- `open_nodes` - Get detailed entity information

**Perfect for Storyroom:**
- Store character relationships
- Track plot connections
- Build story knowledge graphs
- Maintain continuity

### 2. Filesystem Server
**Best for:** Story file management, backups

```typescript
filesystem: {
  name: 'Filesystem',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd() + '/stories'],
  transport: 'stdio',
  enabled: true,
}
```

**Tools:**
- `read_file` - Read story files
- `write_file` - Save stories
- `list_directory` - Browse stories
- `create_directory` - Organize stories

### 3. Brave Search Server
**Best for:** Enhanced research capabilities

```typescript
brave: {
  name: 'Brave Search',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
  transport: 'stdio',
  env: {
    BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
  },
  enabled: true,
}
```

**Setup:**
1. Get API key: https://brave.com/search/api/
2. Add to `.env.local`: `BRAVE_API_KEY=your_key_here`

**Tools:**
- `brave_web_search` - Search the web
- `brave_local_search` - Local business search

### 4. SQLite Server
**Best for:** Structured story data, character databases

```typescript
sqlite: {
  name: 'SQLite',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './prisma/dev.db'],
  transport: 'stdio',
  enabled: true,
}
```

**Tools:**
- `read_query` - Query database
- `write_query` - Modify database
- `create_table` - Create tables
- `describe_table` - View schema

## 💡 Integration Ideas

### 1. Enhanced Research Assistant
Replace or augment your web search with Brave Search MCP:

```typescript
// In src/app/api/research-search/route.ts
import { mcpManager } from '@/lib/mcp';

const results = await mcpManager.callTool('brave', 'brave_web_search', {
  query: userQuery,
  count: 10
});
```

### 2. Story Persistence
Use Filesystem MCP to save/load stories:

```typescript
// Save story
await mcpManager.callTool('filesystem', 'write_file', {
  path: `/stories/${projectId}.json`,
  content: JSON.stringify(bible)
});

// Load story
const result = await mcpManager.callTool('filesystem', 'read_file', {
  path: `/stories/${projectId}.json`
});
```

### 3. Session Memory
Use Memory MCP for story knowledge graphs:

```typescript
// Create character entity
await mcpManager.callTool('memory', 'create_entities', {
  entities: [
    {
      name: 'Alice',
      entityType: 'character',
      observations: ['protagonist', 'brave', 'curious'],
    },
  ],
});

// Create relationship
await mcpManager.callTool('memory', 'create_relations', {
  relations: [
    {
      from: 'Alice',
      to: 'Wonderland',
      relationType: 'explores',
    },
  ],
});

// Read the graph
const graph = await mcpManager.callTool('memory', 'read_graph', {});
```

### 4. Character Database
Use SQLite MCP for character queries:

```typescript
// Query character relationships
const relationships = await mcpManager.callTool('sqlite', 'read_query', {
  query: 'SELECT * FROM character_relationships WHERE character_id = ?',
  params: ['C1']
});
```

## 🐛 Troubleshooting

### Server Won't Connect

1. **Check if npx is installed:**
   ```bash
   npx --version
   ```

2. **Test server manually:**
   ```bash
   npx -y @modelcontextprotocol/server-memory
   ```

3. **Check logs:**
   - Open browser console
   - Check terminal output
   - Look for connection errors

### Tool Call Fails

1. **Verify server is connected:**
   ```bash
   curl http://localhost:3000/api/mcp/status
   ```

2. **Check tool exists:**
   ```bash
   curl http://localhost:3000/api/mcp/tools
   ```

3. **Validate arguments:**
   - Check tool's `inputSchema`
   - Ensure all required fields are provided
   - Verify data types match

### Environment Variables

If using servers that need API keys:

1. Copy `.env.example` to `.env.local`
2. Add your API keys
3. Restart the dev server

## 📚 Next Steps

1. **Test the infrastructure:**
   - Visit `/mcp-test`
   - Enable Memory server
   - Try storing/retrieving data

2. **Integrate into existing features:**
   - Add Brave Search to Research Assistant
   - Use Memory for Builder sessions
   - Add Filesystem for story backups

3. **Explore more servers:**
   - Browse: https://github.com/modelcontextprotocol/servers
   - Community servers: https://github.com/topics/mcp-server

4. **Build custom integrations:**
   - Create MCP-powered features
   - Combine multiple servers
   - Build workflows

## 🎯 Example: Complete Integration

Here's a complete example of using MCP in your Research Assistant:

```typescript
// src/app/api/research-assistant/route.ts
import { mcpManager } from '@/lib/mcp';

export async function POST(request: Request) {
  const { query } = await request.json();
  
  // Use Brave Search MCP instead of your current search
  const searchResults = await mcpManager.callTool('brave', 'brave_web_search', {
    query,
    count: 5
  });
  
  // Store research in Memory MCP
  await mcpManager.callTool('memory', 'store', {
    key: `research_${Date.now()}`,
    value: JSON.stringify(searchResults)
  });
  
  // Return results
  return Response.json({ results: searchResults });
}
```

## 🔐 Security Notes

- MCP servers run **server-side only** (in API routes)
- API keys stay in `.env.local` (never exposed to frontend)
- Frontend calls your API routes, not MCP directly
- Use `.gitignore` to exclude `.env.local`

## 📖 Documentation

- Full MCP docs: See `src/lib/mcp/README.md`
- Official MCP site: https://modelcontextprotocol.io
- SDK docs: https://github.com/modelcontextprotocol/typescript-sdk

---

**Ready to test?** Visit http://localhost:3000/mcp-test and start exploring! 🚀
