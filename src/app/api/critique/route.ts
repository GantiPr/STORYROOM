import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { StoryBible, StoryPhase } from "@/lib/types";
import { getPhaseInfo } from "@/lib/storyPhases";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bible }: { bible: StoryBible } = await request.json();

    // Build comprehensive context from all story elements
    const context = buildStoryContext(bible);
    const phase: StoryPhase = bible.phase || "discovery";
    const phaseInfo = getPhaseInfo(phase);

    const systemPrompt = `You are an expert story analyst and editor. Analyze the provided story content with a focus appropriate to the current story phase.

CURRENT PHASE: ${phaseInfo.name} (${phaseInfo.icon})
${phaseInfo.description}

PHASE-SPECIFIC ANALYSIS FOCUS:
${phaseInfo.focus.map(f => `- ${f}`).join('\n')}

${phase === "discovery" ? `
In DISCOVERY phase, focus on:
- **Strengths**: Clarity of concept, uniqueness, potential
- **Gaps**: Unclear premise, vague themes, missing core elements
- **Inconsistencies**: Contradictory concepts or unclear direction
- **Similarities**: Derivative concepts or overused tropes
- **Recommendations**: Ways to clarify and strengthen the core idea
` : phase === "structure" ? `
In STRUCTURE phase, focus on:
- **Strengths**: Solid plot architecture, clear beats, good pacing
- **Gaps**: Missing plot points, weak structure, unclear arcs
- **Inconsistencies**: Plot holes, illogical progression, broken cause-effect
- **Similarities**: Overused plot structures or predictable beats
- **Recommendations**: Structural improvements and alternative frameworks
` : phase === "development" ? `
In DEVELOPMENT phase, focus on:
- **Strengths**: Deep characterization, rich details, authentic world
- **Gaps**: Shallow characters, missing details, underdeveloped relationships
- **Inconsistencies**: Character behavior contradictions, world-building issues
- **Similarities**: Stock characters or clichéd relationships
- **Recommendations**: Ways to add depth, complexity, and authenticity
` : `
In REVISION phase, focus on:
- **Strengths**: What's polished and working well
- **Gaps**: Unresolved threads, missing payoffs, loose ends
- **Inconsistencies**: Any remaining contradictions or logic issues
- **Similarities**: Elements that still feel too similar to other works
- **Recommendations**: Final polish, cuts, and tightening opportunities
`}

When mentioning specific elements, include references like [Character: Name], [Research: Topic], or [Builder: Session Title] so they can be clicked.

Return your analysis as a JSON object with these exact keys: strengths, gaps, inconsistencies, similarities, recommendations. Each should be an array of strings.`;

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
    const report = JSON.parse(response || "{}");

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Critique error:", error);
    return NextResponse.json(
      { error: "Failed to analyze story" },
      { status: 500 }
    );
  }
}

function buildStoryContext(bible: StoryBible): string {
  let context = `# STORY ANALYSIS REQUEST\n\n`;
  
  // Basic Info
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
      context += `- Wound: ${char.wound}\n`;
      context += `- Contradiction: ${char.contradiction}\n`;
      context += `- Arc: ${char.arc.start} → ${char.arc.midpoint} → ${char.arc.end}\n`;
      if (char.relationships.length > 0) {
        context += `- Relationships: ${char.relationships.map(r => r.dynamic).join(", ")}\n`;
      }
    });
  } else {
    context += `No characters defined yet.\n`;
  }

  // Research
  context += `\n## Research Notes (${bible.research.length})\n`;
  if (bible.research.length > 0) {
    bible.research.forEach(note => {
      context += `\n### ${note.question}\n`;
      note.bullets.forEach(bullet => {
        context += `- ${bullet}\n`;
      });
      if (note.summary) {
        context += `Summary: ${note.summary}\n`;
      }
    });
  } else {
    context += `No research conducted yet.\n`;
  }

  // Builder Sessions
  const builderSessions = bible.builderSessions || [];
  context += `\n## Builder Sessions (${builderSessions.length})\n`;
  if (builderSessions.length > 0) {
    builderSessions.forEach(session => {
      context += `\n### ${session.title}\n`;
      if (session.summary) {
        context += `Summary: ${session.summary}\n`;
      }
      context += `Conversation highlights:\n`;
      // Include key messages (limit to avoid token overflow)
      const keyMessages = session.messages.slice(-6); // Last 6 messages
      keyMessages.forEach(msg => {
        const preview = msg.content.substring(0, 200);
        context += `- ${msg.role}: ${preview}${msg.content.length > 200 ? "..." : ""}\n`;
      });
    });
  } else {
    context += `No builder sessions yet.\n`;
  }

  // Plot
  context += `\n## Plot Structure (${bible.plot.length} beats)\n`;
  if (bible.plot.length > 0) {
    bible.plot.forEach(beat => {
      context += `\n### ${beat.label}\n`;
      context += `- Summary: ${beat.summary}\n`;
      context += `- Stakes: ${beat.stakes}\n`;
      context += `- Turn: ${beat.turn}\n`;
    });
  } else {
    context += `No plot structure defined yet.\n`;
  }

  return context;
}
