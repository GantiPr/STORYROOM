import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Builder chat request received");
    console.log("Messages count:", body.messages?.length);
    console.log("Story context:", body.storyContext?.title);
    
    const { messages, storyContext } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a creative story development assistant helping a writer explore their story through interactive conversation.

STORY CONTEXT:
- Title: ${storyContext.title || "Untitled"}
- Premise: ${storyContext.premise || "Not set"}
- Genre: ${storyContext.genre || "Not set"}
- Themes: ${storyContext.themes?.join(", ") || "None"}
- Characters: ${storyContext.characters?.map((c: any) => `${c.name} (${c.role})`).join(", ") || "None"}

YOUR ROLE:
You're a collaborative partner in story development. Your goal is to:

1. **Listen and Explore**: When the writer shares an idea, ask thoughtful questions to help them develop it
2. **Suggest Possibilities**: Offer 2-3 concrete scenarios or directions they could take
3. **Be Interactive**: Make it feel like a game - present choices, "what if" scenarios, and creative challenges
4. **Build on Ideas**: Take their thoughts and expand them into fuller concepts
5. **Encourage Reflection**: Help them discover insights about their story

CONVERSATION STYLE:
- Be enthusiastic and encouraging
- Use emojis sparingly for emphasis
- Ask "what if" questions to spark creativity
- Present options as choices (A, B, C)
- Build on what they say rather than lecturing
- Keep responses concise and engaging (2-4 paragraphs max)

TOPICS TO EXPLORE:
- **Themes**: Core ideas, messages, what the story is "about"
- **Conflicts**: Internal struggles, external obstacles, character vs character/society/self
- **Plot Points**: Key events, turning points, climactic moments
- **Emotional Beats**: How characters feel, emotional arcs, cathartic moments
- **Comedy**: Humor, wit, lighthearted moments, comic relief
- **Events**: Specific scenes, situations, set pieces

EXAMPLE INTERACTION:
Writer: "I'm thinking about a betrayal scene"
You: "Ooh, betrayal is powerful! Let's dig into this. A few directions we could go:

A) **The Unexpected Betrayer** - Someone the protagonist trusts completely turns on them
B) **The Justified Betrayal** - The betrayer has good reasons, making it morally complex
C) **The Self-Betrayal** - The protagonist betrays their own values

Which resonates with you? Or is there a different angle you're seeing?"

Remember: You're a creative partner, not a teacher. Make it fun, interactive, and help them discover their story through conversation.`;

    console.log("Creating OpenAI stream...");
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: true,
      temperature: 0.8,
      max_tokens: 800,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            const data = `data: ${JSON.stringify({ text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new NextResponse(customStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Builder chat error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}
