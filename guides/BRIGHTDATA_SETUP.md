# Bright Data MCP Server Setup

Bright Data has been configured for your Storyroom MCP integration!

## What is Bright Data?

Bright Data is a leading web scraping and proxy service that provides:
- **Web Scraping API** - Extract data from any website
- **Proxy Network** - Residential, datacenter, and mobile proxies
- **SERP API** - Search engine results
- **Web Unlocker** - Bypass anti-bot systems
- **Dataset Marketplace** - Pre-collected data

## ✅ Already Configured

I can see you already have your API key in `.env.local`:
```bash
BRIGHTDATA_API_KEY=06a2a43e-eff6-49df-9fce-728c070ee1f6
```

## Enable the Server

Edit `src/lib/mcp/config.ts` and change:

```typescript
brightdata: {
  name: 'Bright Data',
  command: 'npx',
  args: ['-y', '@brightdata/mcp-server'],
  transport: 'stdio',
  env: {
    BRIGHTDATA_API_KEY: process.env.BRIGHTDATA_API_KEY || '',
  },
  enabled: true,  // ← Change from false to true
},
```

## Restart Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Verify It's Working

Visit: `http://localhost:3000/mcp-test`

You should see:
- ✅ Bright Data in the server list
- Tools available for web scraping

## Security Configuration

Bright Data is configured with:
- **Scope:** `execute` (can perform web scraping)
- **User Consent:** Required (you'll be prompted before scraping)
- **Allowlist:** Enabled in permissions

## Available Tools

Bright Data MCP server typically provides:

### 1. `scrape_url`
Extract data from a URL
```json
{
  "url": "https://example.com",
  "format": "html"
}
```

### 2. `search`
Get search engine results
```json
{
  "query": "medieval castles",
  "engine": "google",
  "country": "us"
}
```

### 3. `extract_data`
Extract structured data
```json
{
  "url": "https://example.com",
  "schema": {
    "title": "string",
    "price": "number"
  }
}
```

### 4. `get_proxy`
Get a proxy for manual use
```json
{
  "type": "residential",
  "country": "us"
}
```

## Test Examples

### Example 1: Simple Web Scrape

**Server:** Bright Data  
**Tool:** `scrape_url`  
**Arguments:**
```json
{
  "url": "https://example.com"
}
```

### Example 2: Google Search Results

**Server:** Bright Data  
**Tool:** `search`  
**Arguments:**
```json
{
  "query": "historical fiction writing tips",
  "engine": "google",
  "num_results": 10
}
```

### Example 3: Extract Product Data

**Server:** Bright Data  
**Tool:** `extract_data`  
**Arguments:**
```json
{
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "fields": ["title", "price", "rating", "reviews"]
}
```

## Use Cases for Storyroom

### 1. Research Historical Facts
```json
{
  "query": "medieval castle architecture 1200s",
  "engine": "google",
  "num_results": 20
}
```

### 2. Scrape Reference Material
```json
{
  "url": "https://en.wikipedia.org/wiki/Medieval_warfare",
  "extract": ["paragraphs", "images", "references"]
}
```

### 3. Gather Character Inspiration
```json
{
  "query": "famous medieval knights",
  "engine": "google",
  "type": "images"
}
```

### 4. Location Research
```json
{
  "url": "https://www.britannica.com/place/London",
  "extract": ["history", "geography", "culture"]
}
```

## Pricing

Bright Data is a **paid service**. Check pricing at:
https://brightdata.com/pricing

**Important:** Monitor your usage to avoid unexpected costs!

## Troubleshooting

### Server Not Starting

**Error:** "Failed to connect to Bright Data"

**Fix:**
1. Check API key is correct in `.env.local`
2. Make sure `enabled: true` in config
3. Restart dev server
4. Check Bright Data dashboard for account status

### Rate Limiting

**Error:** "Rate limit exceeded"

**Fix:**
- Check your Bright Data plan limits
- Upgrade your plan if needed
- Add delays between requests

### Blocked Requests

**Error:** "Request blocked" or "403 Forbidden"

**Fix:**
- Use Bright Data's Web Unlocker feature
- Try different proxy types (residential vs datacenter)
- Check if the target site allows scraping

### Invalid API Key

**Error:** "Invalid API key" or "Unauthorized"

**Fix:**
1. Verify API key in Bright Data dashboard
2. Make sure you copied the full key
3. Check for extra spaces in `.env.local`

## Best Practices

### 1. Respect Robots.txt
Always check if a site allows scraping:
```json
{
  "url": "https://example.com/robots.txt"
}
```

### 2. Add Delays
Don't hammer websites:
```typescript
await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
```

### 3. Cache Results
Use the reliability layer's caching to avoid duplicate requests.

### 4. Monitor Costs
Check your Bright Data dashboard regularly to monitor usage and costs.

### 5. Handle Errors Gracefully
Always wrap scraping calls in try-catch blocks.

## Integration with Research Workflow

You can use Bright Data with the MCP Research Panel:

1. **Search with Bright Data** instead of Brave Search
2. **Save sources** to your project
3. **Generate content** grounded in scraped data
4. **Cite sources** automatically

## Disable Bright Data

If you want to disable it later:

1. Edit `src/lib/mcp/config.ts`
2. Change `enabled: true` to `enabled: false`
3. Restart dev server

## Documentation

- **Bright Data Docs:** https://docs.brightdata.com/
- **MCP Server Docs:** https://brightdata.com/products/mcp
- **API Reference:** https://docs.brightdata.com/api-reference

## Support

- **Bright Data Support:** https://brightdata.com/support
- **Dashboard:** https://brightdata.com/cp/mcp/configure

## Next Steps

1. ✅ API key already added to `.env.local`
2. Enable the server in `src/lib/mcp/config.ts`
3. Restart dev server
4. Test on `/mcp-test` page
5. Start scraping! 🕷️

Happy web scraping! 🌐
