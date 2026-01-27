import type { StoryBible } from "./types";

export type HealthStatus = "good" | "warning" | "needs-attention";

export type HealthIndicator = {
  name: string;
  status: HealthStatus;
  score: number; // 0-100
  reason: string;
};

export type NextAction = {
  id: string;
  title: string;
  description: string;
  targetPage: "builder" | "characters" | "research" | "critique";
  prompt?: string; // Auto-seed this prompt when clicked
  priority: "high" | "medium" | "low";
};

export function calculateStoryHealth(bible: StoryBible): {
  indicators: HealthIndicator[];
  nextActions: NextAction[];
  snapshot: string;
} {
  const indicators: HealthIndicator[] = [];
  const nextActions: NextAction[] = [];

  // 1. Character Depth
  const characterScore = calculateCharacterDepth(bible);
  indicators.push({
    name: "Character Depth",
    status: characterScore >= 70 ? "good" : characterScore >= 40 ? "warning" : "needs-attention",
    score: characterScore,
    reason: characterScore >= 70 
      ? "Characters have clear motivations and arcs"
      : characterScore >= 40
      ? "Some characters need more development"
      : "Characters lack depth and complexity",
  });

  // 2. Plot Clarity
  const plotScore = calculatePlotClarity(bible);
  indicators.push({
    name: "Plot Clarity",
    status: plotScore >= 70 ? "good" : plotScore >= 40 ? "warning" : "needs-attention",
    score: plotScore,
    reason: plotScore >= 70
      ? "Story structure is clear and well-defined"
      : plotScore >= 40
      ? "Plot needs more structure or beats"
      : "Plot structure is unclear or missing",
  });

  // 3. Research Grounding
  const researchScore = calculateResearchGrounding(bible);
  indicators.push({
    name: "Research Grounding",
    status: researchScore >= 70 ? "good" : researchScore >= 40 ? "warning" : "needs-attention",
    score: researchScore,
    reason: researchScore >= 70
      ? "Story is well-researched and grounded"
      : researchScore >= 40
      ? "Some areas could use more research"
      : "Story needs more authentic details",
  });

  // 4. Internal Consistency
  const consistencyScore = calculateConsistency(bible);
  indicators.push({
    name: "Internal Consistency",
    status: consistencyScore >= 70 ? "good" : consistencyScore >= 40 ? "warning" : "needs-attention",
    score: consistencyScore,
    reason: consistencyScore >= 70
      ? "Story elements are consistent"
      : consistencyScore >= 40
      ? "Minor inconsistencies to address"
      : "Significant gaps or contradictions",
  });

  // Generate next actions based on health
  nextActions.push(...generateNextActions(bible, indicators));

  // Generate snapshot
  const snapshot = generateSnapshot(bible, indicators);

  return { indicators, nextActions, snapshot };
}

function calculateCharacterDepth(bible: StoryBible): number {
  if (bible.characters.length === 0) return 0;

  let totalScore = 0;
  bible.characters.forEach(char => {
    let charScore = 0;
    
    // Basic info (20 points)
    if (char.name && char.role) charScore += 10;
    if (char.logline && char.logline.length > 20) charScore += 10;
    
    // Core traits (40 points)
    if (char.desire && char.desire.length > 10) charScore += 10;
    if (char.fear && char.fear.length > 10) charScore += 10;
    if (char.wound && char.wound.length > 10) charScore += 10;
    if (char.contradiction && char.contradiction.length > 10) charScore += 10;
    
    // Arc (20 points)
    if (char.arc?.start && char.arc.start.length > 10) charScore += 7;
    if (char.arc?.midpoint && char.arc.midpoint.length > 10) charScore += 7;
    if (char.arc?.end && char.arc.end.length > 10) charScore += 6;
    
    // Relationships (20 points)
    if (char.relationships && char.relationships.length > 0) charScore += 10;
    if (char.relationships && char.relationships.length > 2) charScore += 10;
    
    totalScore += charScore;
  });

  return Math.min(100, Math.round(totalScore / bible.characters.length));
}

function calculatePlotClarity(bible: StoryBible): number {
  let score = 0;

  // Premise (30 points)
  if (bible.premise && bible.premise.length > 30 && !bible.premise.includes("...")) {
    score += 30;
  } else if (bible.premise && bible.premise.length > 10) {
    score += 15;
  }

  // Plot beats (40 points)
  if (bible.plot.length >= 5) {
    score += 40;
  } else if (bible.plot.length >= 3) {
    score += 25;
  } else if (bible.plot.length >= 1) {
    score += 10;
  }

  // Builder sessions (30 points)
  const sessions = bible.builderSessions || [];
  if (sessions.length >= 3) {
    score += 30;
  } else if (sessions.length >= 1) {
    score += 15;
  }

  return Math.min(100, score);
}

function calculateResearchGrounding(bible: StoryBible): number {
  let score = 0;

  // Research notes (60 points)
  if (bible.research.length >= 5) {
    score += 60;
  } else if (bible.research.length >= 3) {
    score += 40;
  } else if (bible.research.length >= 1) {
    score += 20;
  }

  // Research linked to characters (40 points)
  const linkedResearch = bible.characters.filter(c => 
    c.researchNotes && c.researchNotes.length > 0
  ).length;
  
  if (linkedResearch >= 2) {
    score += 40;
  } else if (linkedResearch >= 1) {
    score += 20;
  }

  return Math.min(100, score);
}

function calculateConsistency(bible: StoryBible): number {
  let score = 100; // Start at perfect, deduct for issues

  // Check for basic inconsistencies
  const hasCharacters = bible.characters.length > 0;
  const hasPlot = bible.plot.length > 0 || (bible.builderSessions && bible.builderSessions.length > 0);
  const hasPremise = bible.premise && bible.premise.length > 30;

  // Deduct if missing core elements
  if (hasCharacters && !hasPremise) score -= 20;
  if (hasPlot && bible.characters.length === 0) score -= 30;
  if (bible.characters.length > 3 && bible.research.length === 0) score -= 15;

  // Check character arcs
  bible.characters.forEach(char => {
    if (!char.arc?.start || !char.arc?.end) score -= 5;
    if (char.desire && char.fear && char.desire === char.fear) score -= 10;
  });

  return Math.max(0, score);
}

function generateNextActions(bible: StoryBible, indicators: HealthIndicator[]): NextAction[] {
  const actions: NextAction[] = [];

  // Character-based actions
  if (indicators[0].status !== "good") {
    const weakCharacters = bible.characters.filter(c => 
      !c.desire || !c.fear || !c.wound || !c.contradiction
    );
    
    if (weakCharacters.length > 0) {
      actions.push({
        id: "develop-character",
        title: `Deepen ${weakCharacters[0].name}'s character`,
        description: "Add missing motivations, fears, or internal contradictions",
        targetPage: "characters",
        priority: "high",
      });
    } else if (bible.characters.length === 0) {
      actions.push({
        id: "create-character",
        title: "Create your first character",
        description: "Start by defining your protagonist",
        targetPage: "characters",
        priority: "high",
      });
    }
  }

  // Plot-based actions
  if (indicators[1].status !== "good") {
    if (!bible.premise || bible.premise.includes("...")) {
      actions.push({
        id: "clarify-premise",
        title: "Clarify your story premise",
        description: "Define what your story is about in 2-3 sentences",
        targetPage: "builder",
        prompt: "Help me clarify my story premise. What is this story really about?",
        priority: "high",
      });
    } else if (bible.plot.length < 3) {
      actions.push({
        id: "structure-plot",
        title: "Build your plot structure",
        description: "Define key story beats and turning points",
        targetPage: "builder",
        prompt: "Help me structure my plot. What are the key beats and turning points?",
        priority: "high",
      });
    }
  }

  // Research-based actions
  if (indicators[2].status !== "good") {
    actions.push({
      id: "add-research",
      title: "Ground your story in research",
      description: "Add authentic details about your story's world",
      targetPage: "research",
      priority: "medium",
    });
  }

  // Consistency-based actions
  if (indicators[3].status !== "good") {
    actions.push({
      id: "run-critique",
      title: "Identify story inconsistencies",
      description: "Get AI analysis of gaps and contradictions",
      targetPage: "critique",
      priority: "medium",
    });
  }

  // Phase-specific actions
  const phase = bible.phase || "discovery";
  if (phase === "discovery" && bible.characters.length > 0 && bible.plot.length === 0) {
    actions.push({
      id: "explore-conflicts",
      title: "Explore central conflicts",
      description: "What obstacles stand in your characters' way?",
      targetPage: "builder",
      prompt: "What are the central conflicts in my story? What obstacles do my characters face?",
      priority: "high",
    });
  }

  // Limit to top 4 actions
  return actions.slice(0, 4);
}

function generateSnapshot(bible: StoryBible, indicators: HealthIndicator[]): string {
  const phase = bible.phase || "discovery";
  const charCount = bible.characters.length;
  const researchCount = bible.research.length;
  const avgScore = Math.round(indicators.reduce((sum, i) => sum + i.score, 0) / indicators.length);

  if (avgScore >= 70) {
    return `Your story is taking shape nicely. You have ${charCount} character${charCount !== 1 ? 's' : ''} and ${researchCount} research note${researchCount !== 1 ? 's' : ''}. Focus on deepening what you have.`;
  } else if (avgScore >= 40) {
    return `You're building momentum. ${charCount > 0 ? `Your ${charCount} character${charCount !== 1 ? 's' : ''} need more depth.` : 'Start by creating your main characters.'} ${phase === 'discovery' ? 'Keep exploring ideas.' : 'Time to add structure.'}`;
  } else {
    return `You're in the early stages. ${charCount === 0 ? 'Create your first character to get started.' : 'Focus on clarifying your core concept and character motivations.'}`;
  }
}
