# Storyroom

**Storyroom** is an AI-powered creative writing workspace that helps you develop compelling stories through interactive conversation, research, and critique.

## Features

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
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4o and GPT-4o-mini
- **Web Search**: Tavily API (optional)
- **Storage**: Browser localStorage + SQLite database

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
