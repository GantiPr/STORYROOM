import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { StoryBible } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { bible }: { bible: StoryBible } = await request.json();

    const context = buildStoryContext(bible);

    const systemPrompt = `You are a creative writing assistant. Generate a compelling, cohesive story summary based on all the provided story elements (characters, research, builder sessions, plot).

Your summary should:
- Be 3-5 paragraphs long
- Weave together the key characters, themes, and plot elements
- Highlight the central conflict and stakes
- Capture the tone and genre
- Feel like a professional story synopsis or back-cover blurb
- Be engaging and make the reader want to know more

Write in a narrative style, not as a list. Make it flow naturally.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
      temperature: 0.8,
    });

    const summary = completion.choices[0].message.content;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

function buildStoryContext(bible: StoryBible): string {
  let context = `# STORY SUMMARY REQUEST\n\n`;
  
  context += `## Basic Info\n`;
  context += `Title: ${bible.title}\n`;
  context += `Premise: ${bible.premise}\n`;
  context += `Genre: ${bible.genre}\n`;
  context += `Themes: ${bible.themes.join(", ")}\n\n`;

  // Characters
  if (bible.characters.length > 0) {
    context += `## Characters\n`;
    bible.characters.forEach(char => {
      context += `\n### ${char.name} (${char.role})\n`;
      context += `${char.logline}\n`;
      context += `- Desire: ${char.desire}\n`;
      context += `- Fear: ${char.fear}\n`;
      context += `- Arc: ${char.arc.start} → ${char.arc.end}\n`;
    });
    context += `\n`;
  }

  // Research insights
  if (bible.research.length > 0) {
    context += `## Research & World Details\n`;
    bible.research.slice(0, 5).forEach(note => {
      context += `\n### ${note.question}\n`;
      note.bullets.slice(0, 3).forEach(bullet => {
        context += `- ${bullet}\n`;
      });
    });
    context += `\n`;
  }

  // Builder sessions
  const builderSessions = bible.builderSessions || [];
  if (builderSessions.length > 0) {
    context += `## Story Development Notes\n`;
    builderSessions.forEach(session => {
      if (session.summary) {
        context += `\n### ${session.title}\n`;
        context += `${session.summary}\n`;
      }
    });
    context += `\n`;
  }

  // Plot
  if (bible.plot.length > 0) {
    context += `## Plot Structure\n`;
    bible.plot.forEach(beat => {
      context += `\n### ${beat.label}\n`;
      context += `${beat.summary}\n`;
    });
  }

  return context;
}
