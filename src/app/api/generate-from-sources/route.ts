import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { type, prompt, sources, storyContext } = await request.json();

    if (!sources || sources.length === 0) {
      return NextResponse.json(
        { error: 'No sources provided' },
        { status: 400 }
      );
    }

    // Build source context
    const sourceContext = sources
      .map(
        (s: any, idx: number) =>
          `[Source ${idx + 1}] ${s.title}\n` +
          `URL: ${s.url}\n` +
          `Content: ${s.snippet}\n` +
          (s.notes ? `Notes: ${s.notes}\n` : '')
      )
      .join('\n\n');

    // Build system prompt based on generation type
    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'outline':
        systemPrompt = `You are a story outlining expert. Create detailed, structured outlines based ONLY on the provided research sources. Do not invent facts or details not supported by the sources. Always cite sources using [Source N] notation.

Story Context:
- Title: ${storyContext.title || 'Untitled'}
- Premise: ${storyContext.premise || 'Not specified'}
- Genre: ${storyContext.genre || 'Not specified'}
- Themes: ${storyContext.themes?.join(', ') || 'Not specified'}

Available Sources:
${sourceContext}

CRITICAL RULES:
1. Use ONLY information from the provided sources
2. Cite every fact with [Source N]
3. If sources don't support something, say "Not covered in sources"
4. Be specific and detailed
5. Structure the outline clearly with acts/sections`;

        userPrompt = `Create an outline for: ${prompt}

Use the sources provided above. Cite every fact. Structure it clearly.`;
        break;

      case 'scene':
        systemPrompt = `You are a scene-writing expert. Write vivid, authentic scenes based ONLY on the provided research sources. Ground every detail in the sources. Cite sources in parentheses.

Story Context:
- Title: ${storyContext.title || 'Untitled'}
- Premise: ${storyContext.premise || 'Not specified'}
- Genre: ${storyContext.genre || 'Not specified'}
${
  storyContext.characters?.length > 0
    ? `- Characters: ${storyContext.characters.map((c: any) => `${c.name} (${c.role})`).join(', ')}`
    : ''
}

Available Sources:
${sourceContext}

CRITICAL RULES:
1. Use ONLY details from the provided sources
2. Cite sources for specific details: (Source N)
3. Write in vivid, sensory prose
4. Stay authentic to the research
5. If sources lack detail, note it rather than inventing`;

        userPrompt = `Write a scene: ${prompt}

Use the sources provided above. Ground every detail in research. Cite sources.`;
        break;

      case 'worldbuilding':
        systemPrompt = `You are a worldbuilding expert. Create rich, detailed world elements based ONLY on the provided research sources. Every detail must be grounded in the sources.

Story Context:
- Title: ${storyContext.title || 'Untitled'}
- Premise: ${storyContext.premise || 'Not specified'}
- Genre: ${storyContext.genre || 'Not specified'}

Available Sources:
${sourceContext}

CRITICAL RULES:
1. Use ONLY information from the provided sources
2. Cite every fact with [Source N]
3. Organize by categories (politics, culture, geography, etc.)
4. Be specific and detailed
5. Note gaps in the research`;

        userPrompt = `Create worldbuilding details for: ${prompt}

Use the sources provided above. Cite everything. Organize clearly.`;
        break;

      case 'character-detail':
        systemPrompt = `You are a character development expert. Create authentic character details based ONLY on the provided research sources. Ground personality, habits, and background in real research.

Story Context:
- Title: ${storyContext.title || 'Untitled'}
- Premise: ${storyContext.premise || 'Not specified'}
${
  storyContext.characters?.length > 0
    ? `- Characters: ${storyContext.characters.map((c: any) => `${c.name} (${c.role}): ${c.logline}`).join('\n')}`
    : ''
}

Available Sources:
${sourceContext}

CRITICAL RULES:
1. Use ONLY information from the provided sources
2. Cite every detail with [Source N]
3. Make character traits authentic to the research
4. Include specific habits, speech patterns, beliefs
5. Note what sources don't cover`;

        userPrompt = `Create character details for: ${prompt}

Use the sources provided above. Ground everything in research. Cite sources.`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid generation type' },
          { status: 400 }
        );
    }

    // Stream the response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              const data = JSON.stringify({ text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate from sources error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content', message: error.message },
      { status: 500 }
    );
  }
}
