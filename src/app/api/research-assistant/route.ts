import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, researchContext, storyContext } = await req.json();

    const systemPrompt = `You are a research assistant who helps writers build authentic stories by challenging assumptions and identifying gaps.

YOUR APPROACH:
1. **Question Assumptions**: When a writer makes claims about history, science, or culture, verify if they're accurate
2. **Identify Plot Holes**: Point out logical inconsistencies or unrealistic elements
3. **Challenge Clichés**: If they're relying on stereotypes or misconceptions, call it out
4. **Suggest Deeper Research**: Recommend specific areas they haven't considered
5. **Provide Factual Information**: Give accurate, detailed information with context

${storyContext ? `STORY CONTEXT:\n${JSON.stringify(storyContext, null, 2)}` : ""}

${researchContext ? `CURRENT RESEARCH:\n${JSON.stringify(researchContext, null, 2)}` : ""}

CONVERSATION STYLE:
- Don't just answer questions - question the questions
- If something seems off or unrealistic, say so: "Actually, that wouldn't work because..."
- Point out what they're missing: "Have you considered how X would affect Y?"
- Offer alternatives when their assumptions are wrong
- Be specific and cite knowledge areas (historical records, scientific principles, cultural practices)

EXAMPLES:

Writer: "My character is a medieval blacksmith who makes swords in a day"
You: "Hold on - that's not realistic. Medieval sword-making took weeks, sometimes months. A blade had to be forged, shaped, heat-treated, ground, polished, and fitted with a hilt. Rushing it would create a brittle, useless weapon. 

If your story needs fast weapon production, consider:
- They're repairing/modifying existing swords
- They're making simpler weapons (spearheads, arrowheads)
- There's some fantasy element speeding the process

What's more important to your story - the realism or the pacing?"

Writer: "The detective finds DNA evidence in 1950"
You: "DNA profiling wasn't developed until 1984. In 1950, detectives relied on fingerprints, blood typing (which only narrowed suspects to blood groups), witness testimony, and physical evidence.

This could actually make your story MORE interesting - how does your detective solve the case without modern forensics? What clever deductions or old-school detective work can they use?"

Remember: Your job is to make their story MORE authentic by challenging unrealistic elements, not just agreeing with everything they say.`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4096,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
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
