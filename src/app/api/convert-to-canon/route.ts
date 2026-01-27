import { NextResponse } from "next/server";
import OpenAI from "openai";
import { nanoid } from "nanoid";
import type { CanonEntry } from "@/lib/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { researchBullet, researchId, canonType, storyContext, appliedTo } = await request.json();

    const systemPrompt = `You are a story development assistant helping convert research into story canon.

Your job is to take a research finding and convert it into a concrete, actionable story element.

CANON TYPES:
- **world-rule**: A rule about how the world works (physics, magic, society, technology)
- **character-habit**: A specific behavior, mannerism, or routine for a character
- **plot-constraint**: A limitation or requirement that affects the plot
- **background-texture**: Authentic details that add realism (sounds, smells, procedures, terminology)

GUIDELINES:
1. Be specific and concrete - avoid vague statements
2. Make it immediately usable in writing
3. Keep the original research citation
4. Ensure it fits the story's tone and genre
5. Make it memorable and distinctive

STORY CONTEXT:
${JSON.stringify(storyContext, null, 2)}

Return a JSON object with:
{
  "content": "The canon entry (1-2 sentences, specific and concrete)",
  "reasoning": "Why this matters for the story (1 sentence)"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Convert this research finding into a ${canonType}:\n\n${researchBullet}\n\nMake it specific and immediately usable in the story.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");

    // Extract citation from research bullet
    const citationMatch = researchBullet.match(/\[S\d+\]/g);
    const citation = citationMatch ? citationMatch.join(", ") : "[Research]";

    const canonEntry: CanonEntry = {
      id: `CE_${nanoid(6)}`,
      type: canonType,
      content: response.content,
      sourceResearchId: researchId,
      sourceCitation: citation,
      createdAt: new Date().toISOString(),
      appliedTo: appliedTo || undefined,
    };

    return NextResponse.json({ 
      canonEntry,
      reasoning: response.reasoning 
    });
  } catch (error) {
    console.error("Convert to canon error:", error);
    return NextResponse.json(
      { error: "Failed to convert to canon" },
      { status: 500 }
    );
  }
}
