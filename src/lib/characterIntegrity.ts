import type { Character, StoryBible } from "./types";

export type IntegrityIssue = {
  type: "missing-core" | "arc-stall" | "motivation-gap" | "contradiction-weak" | "fear-ignored";
  severity: "critical" | "warning" | "suggestion";
  message: string;
  suggestion: string;
};

export type CharacterIntegrity = {
  character: Character;
  score: number; // 0-100
  status: "strong" | "needs-work" | "incomplete";
  issues: IntegrityIssue[];
  strengths: string[];
};

export function analyzeCharacterIntegrity(character: Character, bible: StoryBible): CharacterIntegrity {
  const issues: IntegrityIssue[] = [];
  const strengths: string[] = [];
  let score = 100;

  // Check Core Elements
  if (!character.desire || character.desire.length < 10) {
    issues.push({
      type: "missing-core",
      severity: "critical",
      message: "Core want is missing or too vague",
      suggestion: "Define what this character desperately wants. Be specific - not just 'happiness' but 'to prove their father wrong about their career choice'",
    });
    score -= 25;
  } else {
    strengths.push("Clear core desire defined");
  }

  if (!character.fear || character.fear.length < 10) {
    issues.push({
      type: "missing-core",
      severity: "critical",
      message: "Core fear is missing or too vague",
      suggestion: "What does this character fear most? This should be the opposite of what they want, or what stands in their way emotionally.",
    });
    score -= 25;
  } else {
    strengths.push("Core fear established");
  }

  if (!character.wound || character.wound.length < 10) {
    issues.push({
      type: "missing-core",
      severity: "warning",
      message: "Character wound is missing",
      suggestion: "What past trauma or failure shaped this character? This explains why they fear what they fear.",
    });
    score -= 15;
  } else {
    strengths.push("Backstory wound defined");
  }

  if (!character.contradiction || character.contradiction.length < 10) {
    issues.push({
      type: "contradiction-weak",
      severity: "critical",
      message: "Internal contradiction is missing or weak",
      suggestion: "Great characters have internal conflicts. What two opposing forces pull at this character? (e.g., 'Wants connection but pushes people away')",
    });
    score -= 25;
  } else {
    strengths.push("Internal contradiction creates tension");
  }

  // Check Arc Progression
  const hasArc = character.arc?.start && character.arc?.end;
  if (!hasArc) {
    issues.push({
      type: "arc-stall",
      severity: "warning",
      message: "Character arc is incomplete",
      suggestion: "Define where this character starts emotionally and where they end. How do they change?",
    });
    score -= 15;
  } else {
    // Check if arc addresses the core elements
    const arcStart = character.arc.start.toLowerCase();
    const arcEnd = character.arc.end.toLowerCase();
    
    if (arcStart === arcEnd) {
      issues.push({
        type: "arc-stall",
        severity: "warning",
        message: "Character arc shows no growth",
        suggestion: "The character's emotional state at the end should be different from the start. How do they change?",
      });
      score -= 10;
    } else {
      strengths.push("Character arc shows transformation");
    }
  }

  // Check Desire-Fear Alignment
  if (character.desire && character.fear) {
    const desireLower = character.desire.toLowerCase();
    const fearLower = character.fear.toLowerCase();
    
    // Check if they're too similar (should be opposing)
    if (desireLower.includes(fearLower.split(' ')[0]) || fearLower.includes(desireLower.split(' ')[0])) {
      issues.push({
        type: "motivation-gap",
        severity: "suggestion",
        message: "Desire and fear might be too similar",
        suggestion: "The strongest characters have desires and fears that oppose each other, creating internal conflict.",
      });
      score -= 5;
    }
  }

  // Check Relationships
  if (!character.relationships || character.relationships.length === 0) {
    issues.push({
      type: "motivation-gap",
      severity: "suggestion",
      message: "No relationships defined",
      suggestion: "Characters are defined by their relationships. Who challenges them? Who supports them? Who do they love or hate?",
    });
    score -= 10;
  } else if (character.relationships.length >= 2) {
    strengths.push(`${character.relationships.length} relationships add complexity`);
  }

  // Determine status
  let status: CharacterIntegrity['status'];
  if (score >= 80) {
    status = "strong";
  } else if (score >= 50) {
    status = "needs-work";
  } else {
    status = "incomplete";
  }

  return {
    character,
    score: Math.max(0, score),
    status,
    issues,
    strengths,
  };
}

export function generateIntegrityPrompts(integrity: CharacterIntegrity): string[] {
  const prompts: string[] = [];
  const char = integrity.character;

  // Generate specific prompts based on issues
  integrity.issues.forEach(issue => {
    switch (issue.type) {
      case "missing-core":
        if (issue.message.includes("want")) {
          prompts.push(`What does ${char.name} desperately want? What drives every decision they make?`);
        } else if (issue.message.includes("fear")) {
          prompts.push(`What is ${char.name}'s deepest fear? What keeps them up at night?`);
        }
        break;
      case "contradiction-weak":
        prompts.push(`What internal conflict tears ${char.name} apart? What two opposing forces pull at them?`);
        break;
      case "arc-stall":
        prompts.push(`How does ${char.name} change from the beginning to the end of the story? What do they learn?`);
        break;
      case "motivation-gap":
        if (issue.message.includes("relationships")) {
          prompts.push(`Who are the key people in ${char.name}'s life? How do these relationships challenge or support them?`);
        }
        break;
    }
  });

  return prompts.slice(0, 3); // Return top 3 prompts
}

export function checkSceneIntegrity(
  character: Character,
  sceneDescription: string
): {
  isConsistent: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const sceneLower = sceneDescription.toLowerCase();
  const charName = character.name.toLowerCase();

  // Check if character is acting against their fear without motivation
  if (character.fear) {
    const fearKeywords = character.fear.toLowerCase().split(' ').filter(w => w.length > 4);
    const fearMentioned = fearKeywords.some(keyword => sceneLower.includes(keyword));
    
    if (fearMentioned && !sceneLower.includes('overcome') && !sceneLower.includes('face')) {
      warnings.push(`${character.name} is confronting their fear (${character.fear}). Is there sufficient motivation for this?`);
      suggestions.push("Show the internal struggle or external pressure that forces them to face this fear.");
    }
  }

  // Check if scene advances or stalls arc
  if (character.arc?.start && character.arc?.end) {
    const arcStartKeywords = character.arc.start.toLowerCase().split(' ').filter(w => w.length > 4);
    const arcEndKeywords = character.arc.end.toLowerCase().split(' ').filter(w => w.length > 4);
    
    const showsGrowth = arcEndKeywords.some(keyword => sceneLower.includes(keyword));
    const showsStart = arcStartKeywords.some(keyword => sceneLower.includes(keyword));
    
    if (!showsGrowth && !showsStart) {
      warnings.push(`This scene doesn't seem to advance ${character.name}'s arc from "${character.arc.start}" to "${character.arc.end}"`);
      suggestions.push("Consider how this scene moves the character closer to their transformation.");
    }
  }

  // Check if desire is being pursued
  if (character.desire) {
    const desireKeywords = character.desire.toLowerCase().split(' ').filter(w => w.length > 4);
    const desireMentioned = desireKeywords.some(keyword => sceneLower.includes(keyword));
    
    if (!desireMentioned && sceneLower.includes(charName)) {
      suggestions.push(`How does this scene relate to ${character.name}'s core desire: "${character.desire}"?`);
    }
  }

  return {
    isConsistent: warnings.length === 0,
    warnings,
    suggestions,
  };
}
