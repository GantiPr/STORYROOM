import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import type { Character, ChatMessage } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CharacterUpdateSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["protagonist", "antagonist", "supporting", "other"]).optional(),
  logline: z.string().optional(),
  desire: z.string().optional(),
  fear: z.string().optional(),
  wound: z.string().optional(),
  contradiction: z.string().optional(),
  mainPurpose: z.string().optional(),
  voice: z.object({
    cadence: z.string().optional(),
    tells: z.array(z.string()).optional(),
    tabooWords: z.array(z.string()).optional(),
  }).optional(),
  arc: z.object({
    start: z.string().optional(),
    midpoint: z.string().optional(),
    end: z.string().optional(),
  }).optional(),
});

const ResponseSchema = z.object({
  assistant: z.string(),
  character: CharacterUpdateSchema.optional(),
});

export async function POST(req: Request) {
  try {
    const { messages, currentCharacter }: { 
      messages: ChatMessage[]; 
      currentCharacter: Partial<Character> & { mainPurpose?: string };
    } = await req.json();

    const userLast = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    // Client-side extraction as backup
    const extractCharacterFromText = (text: string) => {
      const extracted: any = {};
      
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
You are a character development assistant. Your job is to help create compelling characters AND extract character information from conversations.

CRITICAL: You MUST ALWAYS return JSON in this exact format:
{
  "assistant": "your conversational response here",
  "character": {
    // include ANY character fields mentioned or implied
  }
}

Current character state:
${JSON.stringify(currentCharacter, null, 2)}

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

EXAMPLES:

User: "My character is Sarah, a detective"
Response: {
  "assistant": "Great! Sarah sounds like an interesting detective character. What drives her to solve cases?",
  "character": {
    "name": "Sarah",
    "role": "protagonist",
    "logline": "A detective"
  }
}

User: "She wants to solve her father's murder but is afraid of failing"
Response: {
  "assistant": "That's a powerful motivation! The fear of failure adds great tension. What happened in her past that makes her so afraid of failing?",
  "character": {
    "desire": "To solve her father's murder",
    "fear": "Failing at solving cases"
  }
}

User: "She lost her first big case and an innocent person died"
Response: {
  "assistant": "That's a devastating wound that would haunt any detective. How does this affect how she approaches new cases?",
  "character": {
    "wound": "Lost her first big case and an innocent person died",
    "contradiction": "Wants to solve cases but fears her mistakes will hurt people"
  }
}

Always be conversational and helpful while ALWAYS extracting character data.
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

  } catch (error: any) {
    console.error("Character chat error:", error);
    return NextResponse.json(
      { assistant: "Sorry, I encountered an error. Please try again." },
      { status: 500 }
    );
  }
}