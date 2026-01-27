import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { Mode, StoryBible, ChatMessage, ResearchNote, ResearchSource } from "@/lib/types";
import { fetchAndExtractReadableText } from "@/lib/webExtract";
import { tavilySearch } from "@/lib/webSearch";

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

function systemPrompt(mode: Mode) {
  return `
You are Storyroom, an assistant for creative writers.

Operating principles:
- Canon (Story Bible) is the source of truth for the story.
- Research notes are grounded in web sources and MUST include citations like [S1], [S2].
- If mode is "research", prioritize factual accuracy and citations. If you cannot find support, say so.
- If mode is "develop", update the story bible only when asked, and keep changes consistent.

Modes:
- brainstorm: divergent, imaginative, no need for web.
- develop: deepen characters/plot in structured form.
- research: use web research and return cited notes.
- critique: find weaknesses, contradictions, missing motivations, pacing issues.

When you update the bible, you MUST return a complete updated bible JSON object.
Keep outputs concise unless user asks for length.
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
      temperature: mode === "brainstorm" ? 0.9 : 0.5,
      messages: [
        { role: "system", content: systemPrompt(mode) },
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
