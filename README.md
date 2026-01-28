# Storyroom

**Storyroom** is an AI-powered creative writing workspace that helps you develop compelling stories through interactive conversation, research, and critique.

## Features

### 🔍 **MCP Research → Write** (NEW!)
AI-powered research workflow that prevents hallucination:
- **Search:** Use Brave Search MCP to find authentic sources
- **Save:** Build a project-specific knowledge base
- **Annotate:** Tag and add notes to organize research
- **Generate:** AI creates outlines/scenes using ONLY your sources
- **Cite:** Every fact is cited with [Source N] notation

No more AI making up facts. Every detail is grounded in real research.

### 🎭 **Builder**
Explore your story through interactive AI conversation. The AI challenges your assumptions, offers alternatives, and helps you develop:
- Themes and core concepts
- Character conflicts and dynamics
- Plot scenarios and "what if" explorations
- Emotional beats and story structure
- Comedy and dramatic moments

The AI acts as a creative partner who pushes back on weak ideas and helps you discover stronger choices.

### 👥 **Characters**
Create and develop complex characters with depth:
- Character profiles with desires, fears, wounds, and contradictions
- Character arcs (start, midpoint, end)
- Voice and speaking patterns
- Relationships and dynamics
- Link characters to research and builder sessions
- AI assistant that challenges generic character traits and pushes for specificity

### 📚 **Research**
Conduct web research with AI assistance:
- Search the web for authentic details
- AI extracts and summarizes information with citations
- Save research notes with source links
- Link research to characters
- AI challenges unrealistic assumptions and identifies plot holes

### 🔍 **Critique**
Get comprehensive AI analysis of your story:
- Identifies strengths and what's working well
- Points out gaps and missing elements
- Finds inconsistencies and logical issues
- Detects potential similarities to existing media
- Provides actionable recommendations
- Interactive sidebar showing all story content
- Clickable references that link to specific characters, research, and sessions

### 📁 **Multi-Project System**
Manage multiple story projects:
- Create unlimited projects, each with its own story
- AI-generated story summaries
- Project dashboard with stats and quick navigation
- All data stored locally in your browser
- Auto-save functionality

## Getting Started

### Prerequisites
- Node.js 18+ installed
- OpenAI API key
- (Optional) Tavily API key for web research

### Installation

1. Clone the repository:
```bash
git clone https://github.com/GantiPr/STORYROOM.git
cd STORYROOM
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory:
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (for research mode)
TAVILY_API_KEY=your_tavily_api_key_here
```

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Creating Your First Project

1. **Start at the Projects Page**: When you first open Storyroom, you'll see the projects landing page
2. **Create a New Project**: Click "New Project" and give your story a name and description
3. **Access Your Workspace**: Click on your project to open the project dashboard

### Working in Your Project

From the project dashboard, you can access four main workspaces:

#### **Builder** - Explore Ideas
- Start a new session or continue an existing one
- Chat with the AI about themes, conflicts, scenarios, and plot ideas
- The AI will challenge your assumptions and offer alternatives
- Generate AI summaries of your conversations
- Link sessions to specific characters

#### **Characters** - Develop People
- Create new characters or edit existing ones
- Fill in character details through conversation with the AI
- The AI pushes you to avoid clichés and create depth
- View related research and builder sessions for each character
- Export character sheets

#### **Research** - Build Authenticity
- Ask questions about historical periods, scientific concepts, cultural practices, etc.
- AI searches the web and provides cited information
- Save research notes with source links
- Link research to characters
- AI challenges unrealistic elements in your story

#### **Critique** - Analyze Your Story
- Generate comprehensive AI analysis of your entire story
- View strengths, gaps, inconsistencies, and similarities to other media
- Click on references to navigate to specific content
- Use the sidebar to browse all your story elements
- Get actionable recommendations for improvement

### AI Conversation Style

The AI in Storyroom is designed to be a **challenging creative partner**, not a yes-man:
- It questions weak ideas and offers alternatives
- It points out clichés and overused tropes
- It asks "why?" and "what if?" to push you deeper
- It challenges assumptions about characters, plot, and world-building
- It's supportive but honest - focused on making your story exceptional

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM (Canonical Structured Layer)
- **AI**: OpenAI GPT-4o and GPT-4o-mini
- **Web Search**: Tavily API (optional)
- **Storage**: SQLite for all story data (no more localStorage blobs!)
- **MCP Integration**: Model Context Protocol with security layer

## Database Architecture

Storyroom uses **SQLite as the canonical structured layer** for all story data. No more loose text blobs!

### Structured Entities
- **Characters**: Proper fields for desire, fear, wound, contradiction, voice, arc
- **Plot Beats**: Ordered structure with acts, stakes, and character links
- **Timeline Events**: Chronological events with character and location links
- **Locations**: Hierarchical worldbuilding with parent/child relationships
- **Research**: Tagged notes with sources and citations
- **Canon**: Locked story facts linked to research and entities
- **Relationships**: Explicit character-to-character relationships

### Clean Abstraction Layer
```typescript
// Simple, intuitive API
const character = await getCharacter(id);
const beats = await listBeats(projectId);
await linkBeatToCharacter(beatId, characterId);
const timeline = await getCharacterTimeline(characterId);
```

See `DATABASE_ARCHITECTURE.md` for complete documentation.

## MCP Security & Permissions

Storyroom includes a comprehensive security layer for MCP (Model Context Protocol) integration, enabling safe access to external tools like filesystem, GitHub, and databases.

### Security Features

- ✅ **Server Allowlist** - Only approved servers can be used
- ✅ **Tool Permissions** - Granular control over which tools are available
- ✅ **User Consent** - Explicit approval required for write operations
- ✅ **Path Sandboxing** - Filesystem access restricted to workspace
- ✅ **Pattern Blocking** - Automatic denial of dangerous operations
- ✅ **Data Redaction** - Sensitive information removed from logs
- ✅ **Scopes** - Read/write/execute permission levels

### Quick Setup

1. Set sandbox path in `.env.local`:
```bash
MCP_SANDBOX_PATH=/path/to/your/workspace
```

2. Review permissions in `src/lib/mcp/permissions.ts`

3. Visit `/mcp-permissions` to manage tool access

### Documentation

- **Quick Start**: `MCP_SECURITY_QUICKSTART.md`
- **Full Guide**: `MCP_SECURITY.md`
- **Migration**: `MCP_MIGRATION_GUIDE.md`

All MCP operations are logged, validated, and secured before execution.

## Project Structure

```
storyroom/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── builder-chat/
│   │   │   ├── character-chat/
│   │   │   ├── chat/
│   │   │   ├── critique/
│   │   │   ├── research-assistant/
│   │   │   ├── research-search/
│   │   │   ├── sessions/
│   │   │   └── story-summary/
│   │   ├── builder/          # Builder workspace
│   │   ├── characters/       # Characters workspace
│   │   ├── critique/         # Critique workspace
│   │   ├── project/          # Individual project pages
│   │   ├── projects/         # Projects landing page
│   │   └── research/         # Research workspace
│   ├── components/           # React components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utility functions and types
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

## Data Storage

- **Projects**: Stored in browser localStorage
- **Story Bible**: Stored in browser localStorage per project
- **Sessions**: Backed up to SQLite database
- **Auto-save**: Changes are automatically saved after 1 second of inactivity

All your data stays on your machine - nothing is sent to external servers except AI API calls.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ for writers who want to create exceptional stories.
