# AgentQL MCP Server Setup

AgentQL has been added to your Storyroom MCP configuration!

## What is AgentQL?

AgentQL is an MCP server that provides web scraping and automation capabilities. It can:
- Extract data from websites
- Automate web interactions
- Navigate complex web pages
- Handle dynamic content

## Setup Steps

### 1. Get Your API Key

Visit: https://www.agentql.com/

1. Sign up for an account
2. Get your API key from the dashboard

### 2. Add API Key to .env.local

Open `.env.local` and replace the placeholder:

```bash
AGENTQL_API_KEY=your_actual_api_key_here
```

### 3. Enable the Server

Edit `src/lib/mcp/config.ts` and change:

```typescript
agentql: {
  name: 'AgentQL',
  command: 'npx',
  args: ['-y', 'agentql-mcp'],
  transport: 'stdio',
  env: {
    AGENTQL_API_KEY: process.env.AGENTQL_API_KEY || '',
  },
  enabled: true,  // ← Change from false to true
},
```

### 4. Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 5. Verify It's Working

Visit: `http://localhost:3000/mcp-test`

You should see:
- ✅ AgentQL in the server list
- Tools available for web scraping

## Security

AgentQL is configured with:
- **Scope:** `execute` (can perform web automation)
- **User Consent:** Required (you'll be prompted before any web automation)
- **Allowlist:** Enabled in permissions

This means:
- AgentQL tools will ask for your permission before running
- All operations are logged
- Sensitive data is redacted from logs

## Usage Example

Once enabled, you can use AgentQL tools through:

1. **MCP Test Page:** `http://localhost:3000/mcp-test`
   - Select "AgentQL" server
   - Choose a tool
   - Enter arguments
   - Click "Call Tool"

2. **Programmatically:**
   ```typescript
   import { secureMCPManager } from '@/lib/mcp/secureManager';
   
   const result = await secureMCPManager.callToolSecure(
     'agentql',
     'scrape_page',
     { url: 'https://example.com' },
     { userConsent: true }
   );
   ```

## Available Tools

AgentQL typically provides tools like:
- `scrape_page` - Extract data from a webpage
- `navigate` - Navigate through web pages
- `extract_data` - Extract structured data
- `click_element` - Click on page elements
- `fill_form` - Fill out web forms

(Exact tools depend on the agentql-mcp package version)

## Troubleshooting

### Server Not Starting

**Error:** "Failed to connect to AgentQL"

**Fix:**
1. Check API key is correct in `.env.local`
2. Make sure `enabled: true` in config
3. Restart dev server

### Permission Denied

**Error:** "Permission denied"

**Fix:**
- AgentQL is in the allowlist (already done)
- Click "OK" when prompted for consent

### Tool Not Found

**Error:** "Tool not found"

**Fix:**
- Check the tool name is correct
- Visit `/mcp-test` to see available tools
- Some tools may require specific arguments

## Cost

AgentQL is a paid service. Check their pricing at:
https://www.agentql.com/pricing

Make sure you understand the costs before enabling and using it extensively.

## Disable AgentQL

If you want to disable it later:

1. Edit `src/lib/mcp/config.ts`
2. Change `enabled: true` to `enabled: false`
3. Restart dev server

Or remove the API key from `.env.local`.

## For Kiro IDE Users

If you want to use AgentQL in Kiro IDE (not Storyroom), add this to your Kiro settings:

**File:** `~/.kiro/settings/mcp.json` or workspace `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "agentql": {
      "command": "npx",
      "args": ["-y", "agentql-mcp"],
      "env": {
        "AGENTQL_API_KEY": "your_api_key_here"
      },
      "disabled": false
    }
  }
}
```

## Next Steps

1. Get your API key from AgentQL
2. Add it to `.env.local`
3. Enable the server in config
4. Restart and test!

Happy web scraping! 🕷️
