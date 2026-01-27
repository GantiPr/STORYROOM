import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, researchContext, storyContext } = await req.json();

    const systemPrompt = `You are a research assistant helping a writer develop their story. Your role is to:

1. Help investigate topics relevant to their story (historical periods, scientific concepts, cultural practices, etc.)
2. Challenge assumptions and identify potential plot holes or character inconsistencies
3. Suggest areas that need more research
4. Provide factual, well-sourced information
5. Ask probing questions to deepen their understanding

${storyContext ? `STORY CONTEXT:\n${JSON.stringify(storyContext, null, 2)}` : ""}

${researchContext ? `CURRENT RESEARCH:\n${JSON.stringify(researchContext, null, 2)}` : ""}

When providing information:
- Be specific and detailed
- Cite general knowledge areas (e.g., "According to historical records..." or "In psychology, this is known as...")
- Suggest specific search terms or sources the writer could explore
- Point out contradictions or areas that need clarification
- Format your responses with clear bullet points when listing facts

Focus on helping the writer build a believable, well-researched story world.`;

    const stream = await anthropic.messages.stream({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Research assistant error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
