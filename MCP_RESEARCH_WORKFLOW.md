# MCP Research → Write Workflow

## Overview

The Research → Write workflow is a productized feature that makes MCP add obvious value to writing. It prevents AI hallucination by grounding all generated content in real, cited sources.

## The Problem It Solves

**Before:** AI generates content from its training data, often inventing "facts" that sound plausible but are wrong (hallucination).

**After:** AI generates content using ONLY your saved research sources, with every fact cited. No hallucination.

## The Workflow

```
1. SEARCH
   ↓
   Use Brave Search MCP to find authentic sources
   
2. SAVE
   ↓
   Select and save relevant sources to your knowledge base
   
3. ANNOTATE
   ↓
   Add notes and tags to organize your research
   
4. GENERATE
   ↓
   AI creates outlines/scenes using ONLY your sources
   
5. CITE
   ↓
   Every fact is cited with [Source N] notation
```

## Features

### 1. MCP Research Panel

**Location:** `/mcp-research`

**Capabilities:**
- Search the web using Brave Search MCP
- View search results with titles, snippets, and domains
- Select multiple results to save
- Save sources to project-specific knowledge base
- Organize sources with tags
- Add personal notes to each source
- View all saved sources in one place

**Key Benefits:**
- Real-time web search without leaving the app
- Persistent source library per project
- Easy organization and retrieval

### 2. Source Management

**Features:**
- Project-specific source storage (localStorage)
- Tag-based organization
- Personal annotations
- Source metadata (title, URL, domain, snippet, save date)
- Quick filtering and search

**Use Cases:**
- Historical research for period pieces
- Scientific concepts for sci-fi
- Cultural details for authentic worldbuilding
- Real locations and geography
- Technical processes and procedures

### 3. AI Generator (Source-Based)

**Generation Types:**

#### 📋 Outline
- Creates structured story outlines
- Organizes by acts/sections
- Cites sources for every plot point
- Identifies gaps in research

**Example Prompt:**
> "Create a 3-act outline for a heist in medieval London"

#### 🎬 Scene
- Writes vivid, detailed scenes
- Grounds every detail in sources
- Uses sensory, authentic prose
- Cites sources inline

**Example Prompt:**
> "Write a scene where the protagonist discovers the secret passage in the castle"

#### 🌍 Worldbuilding
- Creates rich world details
- Organizes by categories (politics, culture, geography)
- Every detail sourced from research
- Notes gaps for further research

**Example Prompt:**
> "Describe the political structure and social hierarchy of the kingdom"

#### 👤 Character Detail
- Develops authentic character traits
- Grounds personality in research
- Creates specific habits and speech patterns
- Links character to cultural/historical context

**Example Prompt:**
> "Detail the protagonist's daily routine as a medieval blacksmith"

### 4. Citation System

**How It Works:**
- AI cites every fact with `[Source N]` notation
- Sources listed at bottom of generated content
- Click source links to verify facts
- Full transparency on what came from where

**Example Output:**
```
The medieval blacksmith would begin work at dawn [Source 1], 
heating the forge to approximately 2,500°F [Source 2]. The 
most common tools included the anvil, hammer, and tongs [Source 3].

Sources Used:
[1] Medieval Daily Life - history.org
[2] Blacksmithing Temperatures - metalwork.edu
[3] Tools of the Trade - medievalcrafts.com
```

## Setup

### 1. Configure Brave Search MCP

Add to `.env.local`:
```bash
BRAVE_API_KEY=your_brave_api_key_here
```

Get your API key from: https://brave.com/search/api/

### 2. Enable in MCP Config

Already enabled in `src/lib/mcp/config.ts`:
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

### 3. Verify Permissions

Already configured in `src/lib/mcp/permissions.ts`:
```typescript
brave: {
  enabled: true,
  defaultScope: 'read',
  requiresUserConsent: false,
}
```

## Usage Guide

### Step 1: Search for Sources

1. Navigate to `/mcp-research`
2. Enter your search query (e.g., "medieval blacksmithing techniques")
3. Click "Search"
4. Review results

### Step 2: Save Sources

1. Check the boxes next to relevant results
2. Click "Save N Selected"
3. Sources are saved to your project's knowledge base

### Step 3: Annotate Sources

1. Switch to "Saved Sources" tab
2. Click on a source to view details
3. Add personal notes about how you'll use it
4. Add tags for organization (e.g., "Blacksmithing", "Medieval", "Crafts")

### Step 4: Generate Content

1. Switch to "Generate from Sources" tab
2. Select generation type (Outline, Scene, Worldbuilding, Character Detail)
3. Enter what you want to generate
4. Select which sources to use
5. Click "Generate"

### Step 5: Review & Use

1. Review generated content
2. Verify citations by clicking source links
3. Copy content to your writing
4. Refine as needed

## Best Practices

### Research Strategy

1. **Start Broad, Then Narrow**
   - Begin with general searches
   - Save overview sources
   - Then search for specific details

2. **Tag Consistently**
   - Use consistent tag names
   - Create a tagging system (e.g., "Location: London", "Time: Medieval")
   - Tags make sources easy to find later

3. **Annotate Immediately**
   - Add notes while research is fresh
   - Note specific details you want to use
   - Flag sources for different scenes/chapters

### Generation Strategy

1. **Select Relevant Sources**
   - Don't use all sources for every generation
   - Pick 3-5 most relevant sources
   - More focused = better output

2. **Be Specific in Prompts**
   - Bad: "Write a scene"
   - Good: "Write a scene where the blacksmith forges a sword while teaching his apprentice"

3. **Verify Citations**
   - Click source links to verify facts
   - Check that citations match content
   - Flag any unsupported claims

4. **Iterate**
   - Generate multiple versions
   - Try different source combinations
   - Refine prompts based on output

## Technical Details

### Data Storage

**Sources:**
- Stored in localStorage per project
- Key format: `mcp-sources-{projectId}`
- Persists across sessions
- Can be exported/imported

**Structure:**
```typescript
type SavedSource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  savedAt: string;
  tags: string[];
  notes?: string;
};
```

### API Endpoints

**Search:**
- Uses MCP `/api/mcp/call` endpoint
- Server: `brave`
- Tool: `brave_web_search`
- Returns: Search results with titles, URLs, snippets

**Generation:**
- Endpoint: `/api/generate-from-sources`
- Method: POST
- Streaming: Yes (Server-Sent Events)
- Model: GPT-4o

### Security

- Brave Search requires API key
- No user consent needed (read-only)
- All sources stored locally
- No data sent to external services except OpenAI

## Troubleshooting

### "MCP Not Available" Error

**Cause:** Brave Search MCP server not configured

**Solution:**
1. Add `BRAVE_API_KEY` to `.env.local`
2. Restart dev server
3. Check `/mcp-permissions` to verify server is connected

### No Search Results

**Cause:** Invalid API key or rate limit

**Solution:**
1. Verify API key is correct
2. Check Brave API dashboard for rate limits
3. Try a different search query

### Generation Fails

**Cause:** No sources selected or invalid prompt

**Solution:**
1. Select at least one source
2. Enter a specific prompt
3. Check console for errors

### Sources Not Saving

**Cause:** localStorage full or disabled

**Solution:**
1. Check browser localStorage settings
2. Clear old data if needed
3. Try a different browser

## Examples

### Example 1: Historical Fiction

**Goal:** Write a scene in medieval London

**Workflow:**
1. Search: "medieval London daily life"
2. Search: "medieval blacksmith workshop"
3. Search: "medieval London streets 1400s"
4. Save 5-6 relevant sources
5. Tag: "London", "Medieval", "Daily Life"
6. Generate: Scene type
7. Prompt: "Write a scene where a blacksmith walks through London streets to his workshop at dawn"

**Result:** Authentic scene with cited details about streets, sounds, smells, and blacksmith work.

### Example 2: Science Fiction

**Goal:** Create worldbuilding for a space station

**Workflow:**
1. Search: "space station life support systems"
2. Search: "artificial gravity rotating habitats"
3. Search: "space station social structure"
4. Save 4-5 technical sources
5. Tag: "Space Station", "Technology", "Society"
6. Generate: Worldbuilding type
7. Prompt: "Describe the life support and social structure of a rotating space station"

**Result:** Technically accurate worldbuilding with cited engineering details.

### Example 3: Character Development

**Goal:** Create authentic character details for a surgeon

**Workflow:**
1. Search: "surgeon daily routine"
2. Search: "surgical training and education"
3. Search: "surgeon personality traits studies"
4. Save 3-4 sources
5. Tag: "Medical", "Character", "Profession"
6. Generate: Character Detail type
7. Prompt: "Detail the daily routine, habits, and personality traits of a trauma surgeon"

**Result:** Realistic character details grounded in research about actual surgeons.

## Future Enhancements

### Planned Features

- [ ] Export sources to bibliography format
- [ ] Import sources from files/URLs
- [ ] Share source libraries between projects
- [ ] Advanced filtering (by date, domain, tag)
- [ ] Source quality ratings
- [ ] Automatic fact-checking
- [ ] Integration with existing Research page
- [ ] Bulk source management
- [ ] Source version history

### Integration Opportunities

- Link sources to characters
- Attach sources to scenes
- Reference sources in Bible entries
- Export sources with story
- Collaborative source sharing

## Support

For issues or questions:
1. Check MCP server status at `/mcp-permissions`
2. Verify Brave API key in `.env.local`
3. Check browser console for errors
4. See `MCP_SECURITY.md` for security details

---

**Status:** Production-ready
**Last Updated:** January 27, 2026
**Version:** 1.0.0
