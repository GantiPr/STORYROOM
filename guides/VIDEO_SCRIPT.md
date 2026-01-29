# Storyroom Demo Video Script (Sub-10 Minutes)

## 🎬 INTRO (30 seconds)
**[Screen: Landing page]**
- "Hi, I'm [Name], and I built Storyroom - an AI-powered creative writing workspace"
- "The problem: Writers struggle with story development, research authenticity, and maintaining consistency"
- "Storyroom solves this with AI that challenges your ideas, grounds research in real sources, and helps you build complex narratives"
- "Let me show you what I built"

---

## 🎯 WHAT I BUILT (1 minute)

### Core Product Overview
**[Screen: Project dashboard]**
- "Storyroom is a full-stack Next.js application with 5 integrated workspaces:"
  - **Builder**: Interactive AI conversation for story exploration
  - **Characters**: Deep character development with AI assistance
  - **Research**: Web-powered research with citation tracking
  - **Critique**: Comprehensive story analysis
  - **MCP Research**: NEW - Hallucination-free content generation

### Key Innovation
- "The AI isn't a yes-man - it challenges weak ideas, questions assumptions, and pushes for depth"
- "Everything is grounded in structured data - no loose text blobs"
- "Multi-project system with SQLite backend for data persistence"

---

## 🎥 DEMO - CORE FEATURES (4 minutes)

### 1. Multi-Project System (30 seconds)
**[Screen: Projects page → Create new project]**
- "Start by creating a project - each story gets its own workspace"
- "AI generates summaries automatically"
- "All data stored locally with auto-save"
- **SHOW**: Create "Sci-Fi Thriller" project

### 2. Builder - Story Exploration (1 minute)
**[Screen: Builder workspace]**
- "Builder is where you explore ideas through conversation"
- "The AI challenges you - watch this:"
- **SHOW**: 
  - Type: "My protagonist is a detective who's haunted by his past"
  - AI response: "That's pretty generic. What specifically haunts him? What makes THIS detective different?"
- "It pushes you to avoid clichés and find specificity"
- **SHOW**: Link session to character

### 3. Characters - Deep Development (45 seconds)
**[Screen: Characters page]**
- "Characters have structured fields: desire, fear, wound, contradiction, arc"
- **SHOW**: Create character with AI assistance
- "The AI helps you avoid flat characters"
- **SHOW**: Character relationships, voice patterns
- "Everything links back to research and builder sessions"

### 4. MCP Research → Write (1 minute 15 seconds)
**[Screen: MCP Research page]**
- "This is the killer feature - hallucination-free content generation"
- **WORKFLOW DEMO**:
  1. **Search**: "Search for 'quantum computing basics'"
  2. **Save**: Add sources to knowledge base
  3. **Annotate**: Tag sources, add notes
  4. **Generate**: "Write a scene where a scientist explains quantum entanglement"
  5. **Result**: AI generates content with [Source 1], [Source 2] citations
- "Every fact is grounded in real sources - no AI hallucinations"
- "This is powered by MCP (Model Context Protocol) with Brave Search"

### 5. Critique - Story Analysis (30 seconds)
**[Screen: Critique page]**
- "Get comprehensive AI analysis of your entire story"
- **SHOW**: 
  - Strengths section
  - Gaps and inconsistencies
  - Clickable references that link to characters/research
- "Interactive sidebar for navigation"

---

## 🛠️ TECH CHOICES & ARCHITECTURE (2 minutes)

### Tech Stack
**[Screen: Code editor or architecture diagram]**
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, SQLite + Prisma ORM
- **AI**: OpenAI GPT-4o and GPT-4o-mini
- **MCP Integration**: Model Context Protocol for external tools
- **Search**: Brave Search MCP, Tavily API (optional)

### Why These Choices?

#### Next.js 14 + App Router
- "Server components for better performance"
- "API routes co-located with frontend"
- "Easy deployment to Vercel"

#### SQLite + Prisma
- "Started with localStorage - hit scaling issues"
- "Migrated to SQLite as canonical structured layer"
- "Proper relational data: characters, plot beats, timeline, locations"
- "Clean abstraction layer - simple API for complex queries"

#### MCP (Model Context Protocol)
- "Needed safe access to external tools (filesystem, search, databases)"
- "Built comprehensive security layer:"
  - Server allowlist
  - Tool permissions with scopes (read/write/execute)
  - User consent for write operations
  - Path sandboxing for filesystem access
  - Pattern blocking for dangerous operations
- "This enables the hallucination-free research workflow"

#### Reliability Layer
- "Built production-grade reliability features:"
  - Retry logic with exponential backoff
  - Circuit breaker pattern for failing services
  - Request timeout handling
  - Response caching
  - Concurrency limiting
- "All MCP operations are logged and monitored"

---

## ⚖️ TRADE-OFFS (1 minute)

### What I Prioritized
- ✅ **User experience over complexity**: Simple, intuitive UI
- ✅ **Data structure over flexibility**: Structured entities vs. free-form text
- ✅ **Security over convenience**: User consent required for write operations
- ✅ **Reliability over speed**: Retry logic and circuit breakers add latency

### What I Sacrificed
- ❌ **Real-time collaboration**: Single-user focus for MVP
- ❌ **Cloud sync**: Local-first approach (data stays on your machine)
- ❌ **Mobile optimization**: Desktop-first experience
- ❌ **Advanced export formats**: Basic export only

### Technical Debt
- "TypeScript strict mode issues in production build - fixed with explicit type annotations"
- "MCP server configuration requires manual setup - could be streamlined"
- "No automated testing yet - would add Jest/Playwright for production"

---

## 💼 BUSINESS IMPACT (45 seconds)

### Target Market
- "Writers, screenwriters, novelists, game designers"
- "Anyone building complex narratives"

### Value Proposition
- **Time savings**: Research and critique automation
- **Quality improvement**: AI challenges weak ideas
- **Authenticity**: Grounded research prevents factual errors
- **Consistency**: Structured data catches plot holes

### Monetization Potential
- **Freemium model**: Basic features free, advanced AI features paid
- **Usage-based pricing**: Pay per AI generation
- **Team plans**: Collaboration features for writing rooms
- **API access**: Let other tools integrate with Storyroom

### Market Differentiation
- "Most AI writing tools are 'yes-men' that generate generic content"
- "Storyroom challenges you and grounds everything in real research"
- "Structured data layer prevents the 'blob of text' problem"

---

## 🚀 NEXT STEPS (45 seconds)

### Immediate Priorities
1. **Testing & QA**: Add comprehensive test suite (Jest, Playwright)
2. **Performance optimization**: Lazy loading, code splitting
3. **Export features**: PDF, Markdown, Final Draft format
4. **Mobile responsiveness**: Optimize for tablets and phones

### Future Features
1. **Real-time collaboration**: Multiple writers on same project
2. **Version control**: Track changes, revert to previous versions
3. **Advanced timeline**: Visual timeline with consistency checking
4. **Plugin system**: Let users add custom MCP servers
5. **Cloud sync**: Optional backup to cloud storage
6. **AI model selection**: Let users choose GPT-4, Claude, etc.

### Long-term Vision
- "Build the go-to platform for serious storytellers"
- "Integrate with industry tools (Final Draft, Scrivener)"
- "Community features: share templates, research libraries"
- "Educational content: storytelling courses powered by AI"

---

## 🎬 CLOSING (15 seconds)
**[Screen: Project dashboard with completed story]**
- "Storyroom helps writers build better stories through AI that challenges, research that grounds, and structure that scales"
- "Check out the repo on GitHub, and thanks for watching!"
- **[Show GitHub link and contact info]**

---

## 📊 TIMING BREAKDOWN
- Intro: 30s
- What I Built: 1m
- Demo: 4m
- Tech Choices: 2m
- Trade-offs: 1m
- Business Impact: 45s
- Next Steps: 45s
- Closing: 15s
**TOTAL: ~10 minutes**

---

## 🎯 DEMO TIPS

### Preparation
- Have a pre-created project with some data
- Prepare specific prompts that show AI pushback
- Have research sources ready to add
- Clear browser cache for clean demo

### Screen Recording
- Use 1920x1080 resolution
- Hide personal info (API keys, emails)
- Use zoom/highlight for important UI elements
- Keep cursor movements smooth

### Presentation Style
- Speak clearly and confidently
- Show enthusiasm for the product
- Acknowledge limitations honestly
- Focus on unique value propositions

### What to Emphasize
1. **AI that challenges** - not a yes-man
2. **Hallucination-free research** - grounded in sources
3. **Structured data** - not text blobs
4. **Security layer** - production-ready MCP integration
5. **Reliability features** - enterprise-grade error handling
