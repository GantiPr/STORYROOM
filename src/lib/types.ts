export type Mode = "brainstorm" | "develop" | "research" | "critique";

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
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
