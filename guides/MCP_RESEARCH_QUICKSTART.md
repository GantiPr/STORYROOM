# MCP Research → Write Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Get Brave API Key (2 minutes)

1. Go to https://brave.com/search/api/
2. Sign up for a free account
3. Get your API key (free tier: 2,000 queries/month)

### Step 2: Configure (1 minute)

Add to `.env.local`:
```bash
BRAVE_API_KEY=your_api_key_here
```

Restart your dev server:
```bash
npm run dev
```

### Step 3: Start Researching (2 minutes)

1. Open http://localhost:3000/mcp-research
2. Enter a search query (e.g., "medieval blacksmithing")
3. Select relevant results
4. Click "Save Selected"

### Step 4: Generate Content

1. Switch to "Generate from Sources" tab
2. Select generation type (Outline, Scene, etc.)
3. Enter what you want to generate
4. Select which sources to use
5. Click "Generate"

## ✨ What You Get

### Before (Traditional AI)
```
AI: "Medieval blacksmiths typically worked from 9am to 5pm..."
You: "Is that true? 🤔"
```

### After (MCP Research → Write)
```
AI: "Medieval blacksmiths began work at dawn [Source 1], 
heating the forge to 2,500°F [Source 2]..."

[1] Medieval Daily Life - history.org
[2] Blacksmithing Temperatures - metalwork.edu

You: "Perfect! I can verify every fact. ✅"
```

## 💡 Pro Tips

1. **Tag Everything**
   - Use consistent tags: "Medieval", "Blacksmithing", "London"
   - Makes sources easy to find later

2. **Add Notes**
   - Write how you'll use each source
   - Note specific details you want to include

3. **Select Specific Sources**
   - Don't use all sources for every generation
   - Pick 3-5 most relevant sources
   - More focused = better output

4. **Verify Citations**
   - Click source links to verify facts
   - Check that AI didn't misinterpret

5. **Iterate**
   - Generate multiple versions
   - Try different source combinations
   - Refine prompts based on output

## 🎯 Use Cases

### Historical Fiction
Search for period-accurate details about daily life, technology, culture.

### Science Fiction
Research real science to ground your worldbuilding in plausibility.

### Contemporary Fiction
Find authentic details about professions, locations, procedures.

### Fantasy
Research historical/cultural inspirations for your fantasy world.

## 🔒 Security

- ✅ Brave Search is read-only (safe)
- ✅ No user consent required
- ✅ Sources stored locally
- ✅ No data sent to external services (except OpenAI for generation)

## 📊 Free Tier Limits

**Brave Search API (Free):**
- 2,000 queries/month
- ~66 searches/day
- More than enough for most writers

**OpenAI:**
- Uses your existing OpenAI API key
- GPT-4o for generation
- Typical cost: $0.01-0.05 per generation

## 🆘 Troubleshooting

### "MCP Not Available"
- Check `.env.local` has `BRAVE_API_KEY`
- Restart dev server
- Visit `/mcp-permissions` to verify

### No Search Results
- Verify API key is correct
- Check you haven't hit rate limit
- Try a different query

### Generation Fails
- Select at least one source
- Enter a specific prompt
- Check console for errors

## 📚 Full Documentation

- **Complete Guide:** `MCP_RESEARCH_WORKFLOW.md`
- **Security:** `MCP_SECURITY.md`
- **MCP Setup:** `MCP_SECURITY_QUICKSTART.md`

## 🎉 You're Ready!

Visit http://localhost:3000/mcp-research and start building your knowledge base!

---

**Questions?** Check the full documentation or open an issue on GitHub.
