# Demo Script 7-Min - File Locations Guide

## 🎬 INTRO (30 seconds)
**What to show:**
- Live site: `https://your-app.vercel.app`
- Homepage: `src/app/page.tsx`

---

## 🏗️ ARCHITECTURE & PRODUCTION QUALITY (2 minutes)

### Modular Architecture - File Structure

**API Layer (10+ routes):**
```
src/app/api/
├── chat/route.ts                    # Main AI conversation
├── character-chat/route.ts          # Character-specific AI
├── research-assistant/route.ts      # Web research with citations
├── critique/route.ts                # Story analysis
├── builder-chat/route.ts            # Builder mode AI
├── research-search/route.ts         # Web search
├── story-summary/route.ts           # AI story summaries
├── timeline/route.ts                # Timeline generation
├── convert-to-canon/route.ts        # Research to canon
├── generate-from-sources/route.ts   # WOW FACTOR - Grounded generation
└── sessions/route.ts                # Session management
```

**Component Layer:**
```
src/components/
├── ChatPanel.tsx                    # Shared AI chat interface
├── CharacterCreationModal.tsx       # Complex form with AI (500+ lines)
├── CharacterEditModal.tsx           # Character editing
├── TimelineView.tsx                 # Consistency visualization
├── BiblePanel.tsx                   # Story bible sidebar
├── PhaseSelector.tsx                # Workflow phase selector
├── WorkspaceNavigation.tsx          # Workspace switcher
├── WorkspaceNavigationBar.tsx       # Top navigation
├── SourceBasedGenerator.tsx         # WOW FACTOR - Source-based generation UI
└── SaveArtifactModal.tsx            # Save generated content
```

**Data Layer (Hooks):**
```
src/hooks/
├── useBible.ts                      # SHOW THIS - Main state management
├── useProjects.ts                   # Multi-project system
└── useMCP.ts                        # MCP integration (if on mcp branch)
```

**Type System:**
```
src/lib/types.ts                     # SHOW THIS - 20+ interfaces
```

### Error Handling Examples

**Show this file:**
```
src/app/api/chat/route.ts
```
Lines to highlight:
- Line 1-10: Imports and setup
- Line 20-30: Try-catch block
- Line 40-50: Stream error handling
- Line 60-70: Error response

**Alternative examples:**
```
src/app/api/research-assistant/route.ts  # Web research error handling
src/app/api/critique/route.ts            # Complex error handling
```

### TypeScript Strict Mode

**Show these files:**
```
tsconfig.json                        # Line 7: "strict": true
src/lib/types.ts                     # Complete type system
```

**Type examples to show:**
- Lines 1-20: `StoryBible` interface
- Lines 70-90: `Character` interface with nested types
- Lines 110-130: `ResearchNote` with citations

---

## 🤖 AI-NATIVE SPEED (1.5 minutes)

### Component Generation Example

**Show this file:**
```
src/components/CharacterCreationModal.tsx
```
- Total lines: ~600
- Built in: 30 minutes with AI
- Highlight: Complex form logic, AI integration, error handling

### Type System Design

**Show this file:**
```
src/lib/types.ts
```
- Lines 1-100: Core types
- AI suggested structure, you validated

### API Route Patterns

**Show consistent pattern across:**
```
src/app/api/chat/route.ts
src/app/api/character-chat/route.ts
src/app/api/critique/route.ts
```
All have same structure:
1. Imports
2. POST handler
3. Try-catch
4. OpenAI call
5. Stream handling
6. Error response

### Verification Commands

**Show in terminal:**
```bash
npm run build          # TypeScript validation
npm run lint           # ESLint checks
```

---

## ✨ THE "WOW" FACTOR (2 minutes)

### Research → Write Pipeline

**Backend Implementation:**
```
src/app/api/generate-from-sources/route.ts
```
Key sections:
- Lines 1-20: Setup and imports
- Lines 30-50: System prompt (CRITICAL - show this!)
- Lines 60-80: Source formatting
- Lines 90-110: OpenAI call with sources

**Frontend UI:**
```
src/components/SourceBasedGenerator.tsx
```
Key sections:
- Lines 1-30: State management
- Lines 50-80: Source display
- Lines 100-150: Generation form
- Lines 200-250: Citation rendering

**Research Search:**
```
src/app/api/research-search/route.ts
```
- Tavily API integration
- Source extraction

**Page that ties it together:**
```
src/app/research/page.tsx
```
- Full research workflow
- Source management
- Generation interface

### Demo Flow

1. **Open live site** → Navigate to Research page
2. **Search** → Type "quantum computing" → Show results
3. **Save sources** → Click to add to knowledge base
4. **Generate** → Write prompt → Show output with [Source 1] citations
5. **Verify** → Click citation → Opens original source

---

## 💻 CODE DEEP DIVE (1.5 minutes)

### 1. Next.js App Router

**Show file structure:**
```
src/app/
├── page.tsx                         # Homepage (Server Component)
├── dashboard/page.tsx               # Dashboard (Client Component)
├── characters/page.tsx              # Characters page
├── research/page.tsx                # Research page
└── api/                             # API routes
```

**Example to show:**
```
src/app/dashboard/page.tsx
```
- Lines 1-20: "use client" directive, imports
- Lines 30-50: useBible hook usage
- Lines 100-150: Component render

### 2. localStorage as Database

**Show this file:**
```
src/hooks/useBible.ts
```
Key sections to highlight:
- Lines 10-20: Storage keys
- Lines 30-60: `loadBibleFromStorage()` - Project-specific loading
- Lines 70-100: `setBible()` - Auto-save logic
- Lines 110-130: `saveSession()` - Backup to API

**Show the logic:**
```typescript
// Line 75-95
const setBible = useCallback((updater) => {
  setBibleState(prev => {
    const newBible = typeof updater === 'function' ? updater(prev) : updater;
    
    // Save to project-specific key
    const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (activeProjectId) {
      const projects = JSON.parse(localStorage.getItem("storyroom-projects"));
      const updatedProjects = projects.map(p => 
        p.id === activeProjectId ? { ...p, bible: newBible } : p
      );
      localStorage.setItem("storyroom-projects", JSON.stringify(updatedProjects));
    }
    
    return newBible;
  });
}, []);
```

### 3. Streaming AI Responses

**Show this file:**
```
src/app/api/chat/route.ts
```
Key sections:
- Lines 40-60: OpenAI streaming setup
- Lines 70-100: ReadableStream implementation
- Lines 110-130: Chunk processing

**Code to highlight:**
```typescript
// Lines 50-80
const stream = await openai.chat.completions.create({
  model: "gpt-4o",
  messages,
  stream: true,
});

const encoder = new TextEncoder();
const readable = new ReadableStream({
  async start(controller) {
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      controller.enqueue(encoder.encode(content));
    }
    controller.close();
  }
});

return new Response(readable);
```

### 4. Multi-Project System

**Show this file:**
```
src/hooks/useProjects.ts
```
Key sections:
- Lines 10-30: State management
- Lines 40-70: `createProject()` - Immediate localStorage save
- Lines 80-100: `updateProject()`
- Lines 110-130: `setActiveProjectId()` - Synchronous save

**Code to highlight:**
```typescript
// Lines 50-75
const createProject = useCallback((name, description) => {
  const newProject = {
    id: `P${Date.now()}`,
    name,
    bible: { ...defaultBible, title: name },
    createdAt: new Date().toISOString(),
  };
  
  const updatedProjects = [...projects, newProject];
  setProjects(updatedProjects);
  setActiveProjectId(newProject.id);
  
  // Immediate localStorage save (synchronous)
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
  localStorage.setItem(ACTIVE_PROJECT_KEY, newProject.id);
  
  return newProject;
}, [projects]);
```

**UI to show:**
```
src/app/projects/page.tsx            # Projects landing page
src/app/dashboard/page.tsx           # Project dashboard
```

---

## 🚀 PRODUCTION DEPLOYMENT (30 seconds)

### Deployment Files

**Package.json:**
```
package.json
```
Show:
- Line 5-7: Node.js version requirement
- Line 8-12: Build scripts
- Line 14-25: Dependencies

**TypeScript Config:**
```
tsconfig.json
```
Show:
- Line 7: `"strict": true`
- Line 20-22: Path aliases

**Environment Variables:**
```
.env.local (DON'T SHOW - has secrets!)
```
Just mention:
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`

**Vercel Settings:**
- Show Vercel dashboard (blur sensitive info)
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next`

### Deployment Fixes

**Show this commit history:**
```bash
git log --oneline -10
```

Highlight commits:
- "fix: TypeScript build errors"
- "fix: disable Prisma for Vercel"
- "chore: specify Node.js version"

**Show the fix:**
```
src/app/api/sessions/route.ts
```
- Lines 1-10: Commented out Prisma
- Lines 15-25: Mock responses for compatibility

---

## 🎯 CLOSING (30 seconds)

**Show live site:**
- Homepage: `https://your-app.vercel.app`
- Navigate through: Projects → Dashboard → Research → Characters
- Show completed story with research citations

**Show GitHub:**
- Repository: `https://github.com/GantiPr/STORYROOM`
- README.md
- File structure

---

## 📁 QUICK REFERENCE - FILES TO HAVE OPEN

### Must Show (Core Demo):
1. `src/hooks/useBible.ts` - State management
2. `src/lib/types.ts` - Type system
3. `src/app/api/chat/route.ts` - Streaming example
4. `src/app/api/generate-from-sources/route.ts` - WOW FACTOR backend
5. `src/components/SourceBasedGenerator.tsx` - WOW FACTOR frontend
6. `src/hooks/useProjects.ts` - Multi-project system
7. `package.json` - Production config
8. `tsconfig.json` - TypeScript strict mode

### Good to Show (Supporting):
9. `src/components/CharacterCreationModal.tsx` - AI-generated complexity
10. `src/app/api/research-assistant/route.ts` - Error handling example
11. `src/app/dashboard/page.tsx` - Next.js App Router example
12. `src/app/projects/page.tsx` - Multi-project UI

### Don't Show:
- `.env.local` - Contains API keys
- `node_modules/` - Too messy
- `.next/` - Build artifacts
- Any files with TODO comments

---

## 🎬 SCREEN RECORDING SETUP

### VS Code Setup:
1. Open these files in tabs (in order):
   - `src/hooks/useBible.ts`
   - `src/lib/types.ts`
   - `src/app/api/chat/route.ts`
   - `src/app/api/generate-from-sources/route.ts`
   - `src/components/SourceBasedGenerator.tsx`
   - `src/hooks/useProjects.ts`

2. Set font size: 16-18pt (readable in video)

3. Use a clean theme: Dark+ or GitHub Dark

4. Hide:
   - Minimap (View → Show Minimap)
   - Breadcrumbs (View → Show Breadcrumbs)
   - Activity bar (View → Appearance → Activity Bar)

### Browser Setup:
1. Open tabs:
   - Live site homepage
   - Live site research page
   - GitHub repository
   - Vercel dashboard (optional)

2. Clear browser history/bookmarks bar

3. Use incognito mode to avoid showing personal bookmarks

### Terminal Setup:
1. Clear history: `clear`
2. Set font size: 16-18pt
3. Use a clean prompt (no git branch info)

---

## 🎯 TIMING GUIDE

| Section | Time | Files to Show |
|---------|------|---------------|
| Intro | 0:00-0:30 | Live site |
| Architecture | 0:30-2:30 | File tree, useBible.ts, types.ts |
| AI Speed | 2:30-4:00 | CharacterCreationModal.tsx, terminal |
| Wow Factor | 4:00-6:00 | generate-from-sources/route.ts, SourceBasedGenerator.tsx, live demo |
| Code Deep Dive | 6:00-7:30 | chat/route.ts, useProjects.ts |
| Deployment | 7:30-8:00 | package.json, Vercel dashboard |
| Closing | 8:00-8:30 | Live site, GitHub |

**Total: ~8 minutes** (leaves buffer for 10-min limit)

---

## 💡 PRO TIPS

1. **Record in segments** - Don't try to do it all in one take
2. **Use zoom** - Zoom in on code sections (Cmd/Ctrl + +)
3. **Highlight code** - Select the lines you're talking about
4. **Pause between sections** - Makes editing easier
5. **Have a script** - But don't read it word-for-word
6. **Show, don't tell** - Let the code speak
7. **Be enthusiastic** - Show you're proud of what you built
8. **Practice transitions** - Smooth switching between files/browser
9. **Test your audio** - Clear voice is crucial
10. **Edit ruthlessly** - Cut anything that doesn't add value
