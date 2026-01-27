import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { Mode, StoryBible, ChatMessage, ResearchNote, ResearchSource, StoryPhase } from "@/lib/types";
import { fetchAndExtractReadableText } from "@/lib/webExtract";
import { tavilySearch } from "@/lib/webSearch";
import { getPhaseGuidance } from "@/lib/storyPhases";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BodySchema = z.object({
  mode: z.custom<Mode>(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    })
  ),
  bible: z.any(),
});

function systemPrompt(mode: Mode, phase: StoryPhase = "discovery") {
  const phaseGuidance = getPhaseGuidance(phase);
  
  return `
You are Storyroom, a creative writing partner who challenges writers to think deeper.

${phaseGuidance}

YOUR PERSONALITY:
- You're thoughtful, curious, and occasionally skeptical
- You ask "why?" and "what if?" to push ideas further
- You point out potential issues, clichés, or underdeveloped concepts
- You offer alternatives and counterpoints, not just agreement
- You're supportive but honest - you want the story to be great, not just "good enough"

CONVERSATION STYLE:
- When a writer suggests something, consider if it's the strongest choice
- If you see a potential problem, bring it up: "I'm wondering if..." or "Have you considered..."
- Offer 2-3 alternatives when you disagree, don't just say no
- Ask probing questions: "What makes this character different from X?" or "Why would they do that?"
- Challenge assumptions: "Is that really the most interesting conflict here?"
- Be conversational and engaging, not robotic or overly agreeable

AVOID:
- Starting responses with "Absolutely!" or "Great idea!"
- Agreeing without adding value or questioning
- Being a yes-man - push back when something could be stronger
- Generic praise without specifics

Operating principles:
- Canon (Story Bible) is the source of truth for the story
- Research notes are grounded in web sources and MUST include citations like [S1], [S2]
- If mode is "research", prioritize factual accuracy and citations
- If mode is "develop", update the story bible only when asked, and keep changes consistent

Modes:
- builder: divergent, imaginative, challenge assumptions, play devil's advocate
- develop: deepen characters/plot in structured form, question weak motivations
- research: use web research and return cited notes
- critique: find weaknesses, contradictions, missing motivations, pacing issues

When you update the bible, you MUST return a complete updated bible JSON object.
Keep outputs concise (2-4 paragraphs) unless user asks for length.
`.trim();
}

async function llmJSON<T>(schema: z.ZodType<T>, prompt: string) {
  const resp = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [{ role: "system", content: "Return ONLY valid JSON." }, { role: "user", content: prompt }],
  });

  const text = resp.choices[0]?.message?.content ?? "";
  const json = JSON.parse(text);
  return schema.parse(json);
}

export async function POST(req: Request) {
  try {
    const body = BodySchema.parse(await req.json());
    const mode = body.mode;
    const bible: StoryBible = body.bible;
    const messages: ChatMessage[] = body.messages;

    const userLast = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // RESEARCH MODE: do web search + extract + create a research note
    if (mode === "research") {
      const tavilyKey = process.env.TAVILY_API_KEY;
      if (!tavilyKey) {
        return NextResponse.json(
          {
            assistant:
              "Research mode needs a search API key (recommended: TAVILY_API_KEY). Add it to .env.local or switch modes.",
          },
          { status: 200 }
        );
      }

      const searchResults = await tavilySearch(userLast);
      const topUrls = searchResults.slice(0, 5);

      const pages = await Promise.allSettled(
        topUrls.map(async (r, idx) => {
          try {
            const extracted = await fetchAndExtractReadableText(r.url);
            return {
              id: `S${idx + 1}`,
              url: r.url,
              title: extracted.title || r.title || r.url,
              domain: new URL(r.url).hostname.replace(/^www\./, ""),
              text: extracted.text.slice(0, 12000),
            };
          } catch (error) {
            console.warn(`Failed to extract from ${r.url}:`, error);
            return {
              id: `S${idx + 1}`,
              url: r.url,
              title: r.title || r.url,
              domain: new URL(r.url).hostname.replace(/^www\./, ""),
              text: `Content unavailable from ${r.url}`,
            };
          }
        })
      );

      // Filter out failed extractions and get successful ones
      const successfulPages = pages
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(page => !page.text.startsWith('Content unavailable'));

      const sources: ResearchSource[] = successfulPages.map((p) => ({
        id: p.id,
        url: p.url,
        title: p.title,
        domain: p.domain,
      }));

      if (successfulPages.length === 0) {
        return NextResponse.json({
          assistant: "I found some search results but couldn't access the content from those sites. They may be blocking automated requests. Try searching for different terms or sources.",
        });
      }

      const NoteSchema = z.object({
        bullets: z.array(z.string()).min(5).max(10),
      });

      const note = await llmJSON(
        NoteSchema,
        `
Question: ${userLast}

Write 6-8 research bullets that are useful for a novelist.
Rules:
- Every bullet MUST end with one or more citations like [S1] or [S2][S4].
- Do not invent facts not supported by sources.
- Prefer concrete details (terminology, timelines, constraints, real-world texture).

Sources:
${successfulPages
  .map(
    (p) => `(${p.id}) ${p.title} — ${p.url}\n${p.text}\n`
  )
  .join("\n")}
`.trim()
      );

      const researchNote: ResearchNote = {
        id: `N_${nanoid(6)}`,
        question: userLast,
        bullets: note.bullets,
        sources,
        createdAt: new Date().toISOString(),
      };

      const updatedBible: StoryBible = {
        ...bible,
        research: [researchNote, ...(bible.research ?? [])],
      };

      return NextResponse.json({
        assistant:
          "Added research notes to your Research Library. Want me to translate any of this into setting constraints, character habits, or scene beats?",
        bible: updatedBible,
      });
    }

    // NON-RESEARCH: respond + optionally update the bible if the user requests it
    const shouldUpdate =
      (/update|add|create|write|draft|build|generate|expand|develop|fill|detail|flesh out|improve/i.test(userLast) &&
       /character|plot|beat|premise|theme|bible/i.test(userLast)) ||
      /update.*bible|bible.*update|fill.*bible|expand.*character|develop.*character|character.*sheet|character.*details/i.test(userLast);

    if (shouldUpdate) {
      const BibleSchema = z.any(); // keep flexible for now; we’ll tighten later with zod
      const updated = await llmJSON(
        BibleSchema,
        `
You are updating a Story Bible JSON object based on user requests.

User request: ${userLast}

Current bible JSON:
${JSON.stringify(bible, null, 2)}

Return:
{
  "assistant": "<short confirmation + what you changed>",
  "bible": <the full updated bible JSON>
}

Rules:
- ALWAYS update the bible when the user asks to expand, develop, or add details to characters, plot, or other story elements.
- If expanding character details, fill in ALL relevant fields: name, role, logline, desire, fear, wound, contradiction, voice, relationships, arc.
- If creating new characters, assign stable ids like "C1", "C2" (continue numbering from existing characters).
- If creating plot beats, use ids like "B1", "B2".
- Keep existing fields unless changes are requested.
- Ensure internal consistency across all story elements.
- When developing characters, be specific and detailed in all fields.
`.trim()
      );

      return NextResponse.json(updated);
    }

    // Plain response (no bible mutation)
    const resp = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: mode === "builder" ? 0.9 : 0.5,
      messages: [
        { role: "system", content: systemPrompt(mode, bible.phase) },
        {
          role: "system",
          content: `Current bible (canon): ${JSON.stringify(bible)}`,
        },
        ...messages,
      ],
    });

    const assistant = resp.choices[0]?.message?.content ?? "…";
    return NextResponse.json({ assistant });
  } catch (e: any) {
    return new NextResponse(e?.message ?? "Unknown error", { status: 400 });
  }
}
