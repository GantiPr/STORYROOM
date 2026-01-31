import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { Character, ChatMessage } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, currentCharacter }: { 
      messages: ChatMessage[]; 
      currentCharacter: Partial<Character> & { mainPurpose?: string };
    } = await req.json();

    const userLast = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Client-side extraction as backup
    const extractCharacterFromText = (text: string) => {
      const extracted: Record<string, string> = {};
      
      // Name extraction
      const namePatterns = [
        /(?:name is|named|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:is|was)/i
      ];
      for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match) extracted.name = match[1];
      }
      
      // Role extraction
      if (/protagonist|main character|hero/i.test(text)) extracted.role = "protagonist";
      if (/antagonist|villain|bad guy/i.test(text)) extracted.role = "antagonist";
      if (/supporting|side character/i.test(text)) extracted.role = "supporting";
      
      // Desire extraction
      const desirePatterns = [
        /(?:wants to|desires to|goal is to|trying to)\s+([^.!?]+)/i,
        /(?:wants|desires|needs)\s+([^.!?]+)/i
      ];
      for (const pattern of desirePatterns) {
        const match = text.match(pattern);
        if (match) extracted.desire = match[1].trim();
      }
      
      // Fear extraction
      const fearPatterns = [
        /(?:afraid of|fears|scared of)\s+([^.!?]+)/i,
        /(?:fear is|phobia of)\s+([^.!?]+)/i
      ];
      for (const pattern of fearPatterns) {
        const match = text.match(pattern);
        if (match) extracted.fear = match[1].trim();
      }
      
      return Object.keys(extracted).length > 0 ? extracted : null;
    };

    const systemPrompt = `
You are a character development assistant who challenges writers to create deeper, more complex characters.

CRITICAL: You MUST ALWAYS return JSON in this exact format:
{
  "assistant": "your conversational response here",
  "character": {
    // include ANY character fields mentioned or implied
  }
}

Current character state:
${JSON.stringify(currentCharacter, null, 2)}

YOUR APPROACH:
- Question surface-level choices and push for depth
- Point out clichés or overused character types
- Ask probing questions about motivations and contradictions
- Suggest complications and moral gray areas
- Challenge weak or unclear character traits

CONVERSATION STYLE:
- When they describe a character, ask "why?" and "what makes them unique?"
- If something feels generic, say so and offer alternatives
- Push for internal contradictions and complexity
- Question motivations: "Is that really what drives them, or is there something deeper?"
- Point out when desires/fears/wounds don't create interesting conflict

EXTRACTION RULES:
- If user mentions a name → include "name": "the name"
- If user mentions role/type → include "role": "protagonist/antagonist/supporting/other"
- If user mentions what character wants → include "desire": "what they want"
- If user mentions fears → include "fear": "what they fear"
- If user mentions backstory/trauma → include "wound": "past hurt"
- If user mentions internal conflict → include "contradiction": "the conflict"
- If user mentions how they speak → include "voice": {"cadence": "speaking style"}
- If user mentions character arc → include "arc": {"start": "...", "midpoint": "...", "end": "..."}
- If user describes the character → include "logline": "brief description"

EXAMPLE INTERACTIONS:

User: "My character is Sarah, a detective"
Response: {
  "assistant": "A detective - that's a starting point, but it's pretty standard. What makes Sarah different from every other detective? What if her methods are questionable? Or she's solving crimes for the wrong reasons? Let's dig deeper into what makes HER unique.",
  "character": {
    "name": "Sarah",
    "role": "protagonist",
    "logline": "A detective"
  }
}

User: "She wants to solve her father's murder"
Response: {
  "assistant": "Okay, that's more personal. But here's a question: what if solving it means discovering something terrible about her father? The best character desires come with a cost. What's she willing to sacrifice to get this answer?",
  "character": {
    "desire": "To solve her father's murder"
  }
}

User: "She's afraid of failing"
Response: {
  "assistant": "Fear of failure is universal - let's make it specific to HER. Is she afraid because she already failed someone important? Because failure means she's like someone she hates? The more specific the fear, the more we feel it. What's the root?",
  "character": {
    "fear": "Failing"
  }
}

Remember: Your job is to make characters BETTER by challenging weak choices and pushing for depth, not just agreeing with everything.
`.trim();

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: "You MUST return valid JSON with both 'assistant' and 'character' fields. Even if no character updates, return 'character': null." },
        ...messages,
      ],
    });

    const content = resp.choices[0]?.message?.content ?? "";
    console.log('🔧 Raw AI response:', content);
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      console.log('🔧 Parsed JSON:', parsed);
      
      if (parsed.assistant && typeof parsed.assistant === 'string') {
        return NextResponse.json({
          assistant: parsed.assistant,
          character: parsed.character || null
        });
      } else {
        throw new Error('Invalid JSON structure');
      }
    } catch (parseError) {
      console.warn('🔧 JSON parsing failed:', parseError);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          console.log('🔧 Extracted JSON:', extracted);
          return NextResponse.json({
            assistant: extracted.assistant || content,
            character: extracted.character || null
          });
        } catch (extractError) {
          console.warn('🔧 JSON extraction failed:', extractError);
        }
      }
      
      // Final fallback: return just the assistant message with backup extraction
      const backupExtraction = extractCharacterFromText(userLast);
      return NextResponse.json({
        assistant: content,
        character: backupExtraction
      });
    }

  } catch (error) {
    console.error("Character chat error:", error);
    return NextResponse.json(
      { assistant: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}