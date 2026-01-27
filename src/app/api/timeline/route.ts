import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { StoryBible } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bible }: { bible: StoryBible } = await request.json();

    // Build comprehensive story context
    const context = buildTimelineContext(bible);

    const systemPrompt = `You are a story consistency analyst specializing in timeline construction and temporal logic.

Your job is to:
1. Extract ALL events from the story (plot beats, character arcs, builder sessions, research)
2. Order them chronologically
3. Track character ages at each event
4. Map cause → effect chains
5. Flag temporal contradictions, unmotivated reversals, and inconsistencies

Return a JSON object with:
{
  "events": [
    {
      "id": "E1",
      "title": "Brief event name",
      "description": "What happens",
      "timestamp": "Year 1, Day 5" or "Chapter 3" or "Age 25" (extract from context),
      "relativeTime": 5 (numeric for sorting - days, years, etc.),
      "involvedCharacters": ["C1", "C2"],
      "sourceType": "plot" | "builder" | "character-arc" | "research",
      "sourceId": "B1" (the beat/session/character ID),
      "causedBy": ["E0"] (optional - events that caused this),
      "causes": ["E2"] (optional - events this causes)
    }
  ],
  "issues": [
    {
      "id": "I1",
      "type": "temporal-contradiction" | "unmotivated-reversal" | "age-inconsistency" | "cause-effect-break",
      "severity": "critical" | "warning" | "minor",
      "title": "Brief issue name",
      "description": "Detailed explanation of the problem",
      "affectedEvents": ["E1", "E5"],
      "affectedCharacters": ["C1"],
      "suggestion": "How to fix it"
    }
  ]
}

ISSUE TYPES:
- **temporal-contradiction**: Events happen in impossible order (e.g., character dies then appears later)
- **unmotivated-reversal**: Character changes behavior/belief without cause
- **age-inconsistency**: Character's age doesn't match timeline
- **cause-effect-break**: Effect happens without cause, or cause doesn't lead to stated effect

Be thorough but focus on REAL issues, not nitpicks.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
      temperature: 0.3, // Lower temperature for consistency analysis
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");

    return NextResponse.json({
      timeline: {
        events: response.events || [],
        issues: response.issues || [],
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Timeline generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}

function buildTimelineContext(bible: StoryBible): string {
  let context = `# STORY TIMELINE ANALYSIS\n\n`;

  // Basic info
  context += `## Story Overview\n`;
  context += `Title: ${bible.title}\n`;
  context += `Premise: ${bible.premise}\n`;
  context += `Genre: ${bible.genre}\n\n`;

  // Characters with ages/timeline info
  context += `## Characters\n`;
  bible.characters.forEach(char => {
    context += `\n### ${char.name} (${char.id})\n`;
    context += `Role: ${char.role}\n`;
    if (char.arc.start) context += `Arc Start: ${char.arc.start}\n`;
    if (char.arc.midpoint) context += `Arc Midpoint: ${char.arc.midpoint}\n`;
    if (char.arc.end) context += `Arc End: ${char.arc.end}\n`;
    context += `Desire: ${char.desire}\n`;
    context += `Fear: ${char.fear}\n`;
  });

  // Plot beats (chronological structure)
  context += `\n## Plot Structure\n`;
  bible.plot.forEach((beat, idx) => {
    context += `\n### Beat ${idx + 1}: ${beat.label}\n`;
    context += `Summary: ${beat.summary}\n`;
    context += `Stakes: ${beat.stakes}\n`;
    context += `Turn: ${beat.turn}\n`;
  });

  // Builder sessions (may contain events)
  const builderSessions = bible.builderSessions || [];
  if (builderSessions.length > 0) {
    context += `\n## Builder Sessions (Story Development)\n`;
    builderSessions.forEach(session => {
      context += `\n### ${session.title} (${session.id})\n`;
      if (session.summary) {
        context += `Summary: ${session.summary}\n`;
      }
      // Include last few messages for context
      const recentMessages = session.messages.slice(-4);
      context += `Recent discussion:\n`;
      recentMessages.forEach(msg => {
        const preview = msg.content.substring(0, 150);
        context += `- ${msg.role}: ${preview}${msg.content.length > 150 ? "..." : ""}\n`;
      });
    });
  }

  // Research (may contain timeline info)
  if (bible.research.length > 0) {
    context += `\n## Research Notes\n`;
    bible.research.forEach(note => {
      context += `\n### ${note.question} (${note.id})\n`;
      note.bullets.slice(0, 3).forEach(bullet => {
        context += `- ${bullet}\n`;
      });
    });
  }

  // Canon (established rules)
  const canon = bible.canon || [];
  if (canon.length > 0) {
    context += `\n## Established Canon\n`;
    canon.forEach(c => {
      context += `- [${c.type}] ${c.content}\n`;
    });
  }

  return context;
}
