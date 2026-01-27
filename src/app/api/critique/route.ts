import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { StoryBible, StoryPhase } from "@/lib/types";
import { getPhaseInfo } from "@/lib/storyPhases";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bible, mode, scope }: { 
      bible: StoryBible; 
      mode: string;
      scope: { type: string; targetId?: string; targetName?: string };
    } = await request.json();

    // Build context based on scope
    const context = buildStoryContext(bible, scope);
    const phase: StoryPhase = bible.phase || "discovery";
    const phaseInfo = getPhaseInfo(phase);

    // Mode-specific prompts
    const modePrompts = {
      structural: `Analyze the STRUCTURAL elements: plot architecture, pacing, stakes, cause-and-effect chains, and story beats. Focus on whether the story has a solid foundation and logical progression.`,
      character: `Analyze CHARACTER elements: motivation consistency, character development, believability, internal contradictions, and whether characters act according to their established traits.`,
      thematic: `Analyze THEMATIC elements: theme clarity, message resonance, thematic drift, and whether the themes are woven naturally into the story without being preachy.`,
      continuity: `Perform a CONTINUITY AUDIT: find contradictions, timeline issues, inconsistent details, and any elements that break internal logic or established rules.`
    };

    // Scope-specific instructions
    const scopeInstructions = scope.type === "whole-story" 
      ? "Analyze the entire story comprehensively."
      : scope.type === "one-character"
      ? `Focus ONLY on the character "${scope.targetName}" (ID: ${scope.targetId}). Analyze their consistency, development, and role in the story.`
      : scope.type === "one-act"
      ? "Focus on a specific act or section of the story."
      : "Focus on evaluating a specific plot decision or story choice.";

    const systemPrompt = `You are an expert story analyst. ${modePrompts[mode as keyof typeof modePrompts]}

${scopeInstructions}

CURRENT PHASE: ${phaseInfo.name}
${phaseInfo.description}

Return your analysis as a JSON object with these exact keys:
- strengths: array of specific things working well
- issues: array of problems, inconsistencies, or weaknesses found
- recommendations: array of actionable suggestions to improve

Be specific, surgical, and focused. Avoid overwhelming feedback - prioritize the most important points.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    const analysisResult = JSON.parse(response || "{}");

    // Add mode and scope to the report
    const report = {
      ...analysisResult,
      mode,
      scope
    };

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Critique error:", error);
    return NextResponse.json(
      { error: "Failed to analyze story" },
      { status: 500 }
    );
  }
}

function buildStoryContext(bible: StoryBible, scope: { type: string; targetId?: string; targetName?: string }): string {
  let context = `# STORY ANALYSIS REQUEST\n\n`;
  
  // If scoped to one character, focus only on that character
  if (scope.type === "one-character" && scope.targetId) {
    const character = bible.characters.find(c => c.id === scope.targetId);
    if (!character) {
      return "Character not found.";
    }

    context += `## Character Analysis: ${character.name}\n\n`;
    context += `**Role**: ${character.role}\n`;
    context += `**Logline**: ${character.logline}\n\n`;
    context += `**Core Traits**:\n`;
    context += `- Desire: ${character.desire}\n`;
    context += `- Fear: ${character.fear}\n`;
    context += `- Wound: ${character.wound}\n`;
    context += `- Contradiction: ${character.contradiction}\n\n`;
    context += `**Character Arc**:\n`;
    context += `- Start: ${character.arc.start}\n`;
    context += `- Midpoint: ${character.arc.midpoint}\n`;
    context += `- End: ${character.arc.end}\n\n`;
    
    if (character.voice.cadence || character.voice.tells.length > 0) {
      context += `**Voice**:\n`;
      if (character.voice.cadence) context += `- Cadence: ${character.voice.cadence}\n`;
      if (character.voice.tells.length > 0) context += `- Tells: ${character.voice.tells.join(", ")}\n`;
      if (character.voice.tabooWords.length > 0) context += `- Taboo Words: ${character.voice.tabooWords.join(", ")}\n`;
      context += `\n`;
    }

    if (character.relationships.length > 0) {
      context += `**Relationships**:\n`;
      character.relationships.forEach(rel => {
        const otherChar = bible.characters.find(c => c.id === rel.characterId);
        context += `- ${otherChar?.name || rel.characterId}: ${rel.dynamic}\n`;
      });
      context += `\n`;
    }

    // Include related research
    const relatedResearch = bible.research.filter(r => 
      r.linkedTo?.some(l => l.type === "character" && l.id === scope.targetId)
    );
    if (relatedResearch.length > 0) {
      context += `**Related Research**:\n`;
      relatedResearch.forEach(note => {
        context += `- ${note.question}\n`;
      });
    }

    return context;
  }

  // Otherwise, provide full story context
  context += `## Story Overview\n`;
  context += `Title: ${bible.title}\n`;
  context += `Premise: ${bible.premise}\n`;
  context += `Genre: ${bible.genre}\n`;
  context += `Themes: ${bible.themes.join(", ")}\n\n`;

  // Characters
  context += `## Characters (${bible.characters.length})\n`;
  if (bible.characters.length > 0) {
    bible.characters.forEach(char => {
      context += `\n### ${char.name} (${char.role})\n`;
      context += `- Logline: ${char.logline}\n`;
      context += `- Desire: ${char.desire}\n`;
      context += `- Fear: ${char.fear}\n`;
      context += `- Contradiction: ${char.contradiction}\n`;
      context += `- Arc: ${char.arc.start} → ${char.arc.midpoint} → ${char.arc.end}\n`;
    });
  }

  // Research (summarized)
  context += `\n## Research Notes (${bible.research.length})\n`;
  if (bible.research.length > 0) {
    bible.research.forEach(note => {
      context += `- ${note.question}\n`;
    });
  }

  // Builder Sessions (summarized)
  const builderSessions = bible.builderSessions || [];
  context += `\n## Builder Sessions (${builderSessions.length})\n`;
  if (builderSessions.length > 0) {
    builderSessions.forEach(session => {
      context += `- ${session.title}${session.summary ? `: ${session.summary}` : ""}\n`;
    });
  }

  // Plot
  context += `\n## Plot Structure (${bible.plot.length} beats)\n`;
  if (bible.plot.length > 0) {
    bible.plot.forEach(beat => {
      context += `- ${beat.label}: ${beat.summary}\n`;
    });
  }

  return context;
}
