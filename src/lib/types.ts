export type Mode = "builder" | "develop" | "research" | "critique";

export type StoryPhase = "discovery" | "structure" | "development" | "revision";

export type ArtifactType = "scene-sketch" | "beat-proposal" | "character-moment" | "dialogue-sample" | "world-detail";

export type Artifact = {
  id: string; // e.g. "ART1"
  type: ArtifactType;
  title: string;
  content: string;
  sourceSessionId: string; // Links back to builder session
  sourceMessageIndex?: number; // Which message in the session
  linkedToCanon?: string[]; // Canon entry IDs this influenced
  linkedToCharacters?: string[]; // Character IDs
  linkedToBeats?: string[]; // Plot beat IDs
  createdAt: string;
  tags?: string[];
};

export type BuilderSession = {
  id: string; // e.g. "BS1"
  title: string;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
  summary?: string; // AI-generated summary of key learnings
  linkedTo?: Array<{
    type: "character";
    id: string;
  }>;
  artifacts?: Artifact[]; // Saved outputs from this session
  createdAt: string;
  updatedAt: string;
};

export type ResearchSource = {
  id: string; // e.g. "S1"
  url: string;
  title: string;
  domain: string;
};

export type ResearchNote = {
  id: string; // e.g. "N1"
  question: string;
  bullets: string[]; // each bullet should include citations like [S1]
  sources: ResearchSource[];
  createdAt: string;
  linkedTo?: {
    type: "character" | "plot" | "world";
    id: string;
  }[];
  summary?: string; // AI-generated session summary
  tags?: string[]; // Primary keys/tags for organizing research
  canonEntries?: CanonEntry[]; // Research converted to story canon
};

export type CanonEntry = {
  id: string;
  type: "world-rule" | "character-habit" | "plot-constraint" | "background-texture";
  content: string;
  sourceResearchId: string; // Links back to research note
  sourceCitation: string; // e.g., "[S1]"
  reasoning?: string; // Why this matters for the story
  createdAt: string;
  appliedTo?: string; // Character ID, plot beat ID, etc.
};

export type Character = {
  id: string; // e.g. "C1"
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "other";
  logline: string;
  desire: string;
  fear: string;
  wound: string;
  contradiction: string;
  voice: {
    cadence: string;
    tells: string[];
    tabooWords: string[];
  };
  relationships: { characterId: string; dynamic: string }[];
  arc: { start: string; midpoint: string; end: string };
  researchNotes?: string[]; // IDs of linked research notes
};

export type PlotBeat = {
  id: string; // e.g. "B1"
  label: string; // Inciting Incident, Midpoint, etc.
  summary: string;
  stakes: string;
  turn: string; // what changes
};

export type StoryBible = {
  title: string;
  premise: string;
  genre: string;
  themes: string[];
  characters: Character[];
  plot: PlotBeat[];
  research: ResearchNote[];
  builderSessions?: BuilderSession[];
  artifacts?: Artifact[]; // All saved artifacts across sessions
  phase?: StoryPhase; // Current workflow phase
  canon?: CanonEntry[]; // Story canon derived from research
  timeline?: ConsistencyTimeline; // Generated timeline with consistency analysis
};

export type Project = {
  id: string;
  name: string;
  description: string;
  bible: StoryBible;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type TimelineEvent = {
  id: string;
  title: string;
  description: string;
  timestamp: string; // "Year 1, Day 5" or "Chapter 3" or "Age 25"
  relativeTime?: number; // For sorting (days, years, etc.)
  involvedCharacters: string[]; // Character IDs
  sourceType: "plot" | "builder" | "character-arc" | "research";
  sourceId: string;
  causedBy?: string[]; // Event IDs that caused this
  causes?: string[]; // Event IDs this causes
};

export type TimelineIssue = {
  id: string;
  type: "temporal-contradiction" | "unmotivated-reversal" | "age-inconsistency" | "cause-effect-break";
  severity: "critical" | "warning" | "minor";
  title: string;
  description: string;
  affectedEvents: string[]; // Event IDs
  affectedCharacters?: string[]; // Character IDs
  suggestion?: string;
};

export type ConsistencyTimeline = {
  events: TimelineEvent[];
  issues: TimelineIssue[];
  generatedAt: string;
};
