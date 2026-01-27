import type { StoryPhase } from "./types";

export const PHASE_INFO: Record<StoryPhase, {
  name: string;
  description: string;
  icon: string;
  color: string;
  focus: string[];
  aiGuidance: string;
}> = {
  discovery: {
    name: "Discovery",
    description: "Exploring ideas, premise, and core concepts",
    icon: "💡",
    color: "from-yellow-600 to-orange-600",
    focus: [
      "What's the core idea?",
      "Who are the main characters?",
      "What's the central conflict?",
      "What themes resonate?",
    ],
    aiGuidance: `You're in DISCOVERY phase. Focus on:
- Helping explore and clarify the core concept
- Asking "what if?" to expand possibilities
- Identifying what makes this story unique
- Questioning vague or generic ideas
- Encouraging experimentation without commitment
- Pointing out potential themes and conflicts

Be open and exploratory. Challenge ideas that feel derivative or unclear. Help the writer find what excites them.`,
  },
  structure: {
    name: "Structure",
    description: "Building the story framework and plot architecture",
    icon: "🏗️",
    color: "from-blue-600 to-cyan-600",
    focus: [
      "What's the story structure?",
      "What are the key plot beats?",
      "How do character arcs develop?",
      "What's the pacing?",
    ],
    aiGuidance: `You're in STRUCTURE phase. Focus on:
- Helping build a solid story framework
- Identifying missing plot beats or structural weaknesses
- Ensuring character arcs align with plot
- Questioning pacing and escalation
- Pointing out structural clichés (chosen one, love triangle, etc.)
- Suggesting alternative structures if the current one feels weak

Be analytical. Challenge weak structure. Ensure cause-and-effect logic.`,
  },
  development: {
    name: "Development",
    description: "Deepening characters, scenes, and story details",
    icon: "✍️",
    color: "from-purple-600 to-pink-600",
    focus: [
      "Are characters fully realized?",
      "Do scenes have depth?",
      "Is the world authentic?",
      "Are relationships complex?",
    ],
    aiGuidance: `You're in DEVELOPMENT phase. Focus on:
- Deepening character psychology and relationships
- Adding texture and specificity to scenes
- Ensuring world-building is consistent and authentic
- Questioning surface-level emotions or motivations
- Pointing out where more research is needed
- Identifying opportunities for subtext and complexity

Be detail-oriented. Push for depth over breadth. Challenge shallow characterization.`,
  },
  revision: {
    name: "Revision",
    description: "Refining, tightening, and fixing inconsistencies",
    icon: "🔍",
    color: "from-red-600 to-orange-600",
    focus: [
      "Are there plot holes?",
      "Do character actions make sense?",
      "Is everything paid off?",
      "What can be cut or tightened?",
    ],
    aiGuidance: `You're in REVISION phase. Focus on:
- Identifying contradictions and plot holes
- Pointing out unresolved threads or missing payoffs
- Questioning character decisions that don't track
- Suggesting what can be cut or streamlined
- Ensuring thematic consistency
- Checking if promises to the reader are kept

Be critical and precise. Point out every inconsistency. Help tighten and polish.`,
  },
};

export function getPhaseGuidance(phase: StoryPhase = "discovery"): string {
  return PHASE_INFO[phase].aiGuidance;
}

export function getPhaseInfo(phase: StoryPhase = "discovery") {
  return PHASE_INFO[phase];
}
