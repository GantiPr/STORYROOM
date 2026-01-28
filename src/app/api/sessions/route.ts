import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StoryBible } from "@/lib/types";

// GET - Load the latest session or all sessions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'latest') {
      // Get the most recently updated session
      const session = await prisma.storySession.findFirst({
        orderBy: { updatedAt: 'desc' },
        include: {
          characters: true,
          plotBeats: true,
          research: true,
          builderSessions: true,
        },
      });

      if (!session) {
        return NextResponse.json({ session: null });
      }

      // Convert database format to StoryBible format
      const bible: StoryBible = {
        title: session.title,
        premise: session.premise,
        genre: session.genre,
        themes: JSON.parse(session.themes),
        characters: session.characters.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role as any,
          logline: c.logline,
          desire: c.desire,
          fear: c.fear,
          wound: c.wound,
          contradiction: c.contradiction,
          voice: JSON.parse(c.voice),
          relationships: JSON.parse(c.relationships),
          arc: JSON.parse(c.arc),
        })),
        plot: session.plotBeats.map((p) => ({
          id: p.id,
          label: p.label,
          summary: p.summary,
          stakes: p.stakes,
          turn: p.turn,
        })),
        research: session.research.map((r) => ({
          id: r.id,
          question: r.question,
          bullets: JSON.parse(r.bullets),
          sources: JSON.parse(r.sources),
          createdAt: r.createdAt,
        })),
        builderSessions: session.builderSessions?.map((b) => ({
          id: b.id,
          title: b.title,
          messages: JSON.parse(b.messages),
          summary: b.summary || undefined,
          linkedTo: b.linkedTo ? JSON.parse(b.linkedTo) : undefined,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })) || [],
      };

      return NextResponse.json({ session: bible, sessionId: session.id });
    } else {
      // Get all sessions (for future session management)
      const sessions = await prisma.storySession.findMany({
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          premise: true,
          genre: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Error loading sessions:', error);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

// POST - Save current session
export async function POST(request: Request) {
  try {
    const { bible, sessionId }: { bible: StoryBible; sessionId?: string } = await request.json();

    const sessionData = {
      title: bible.title,
      premise: bible.premise,
      genre: bible.genre,
      themes: JSON.stringify(bible.themes),
    };

    let session;

    if (sessionId) {
      // Update existing session
      session = await prisma.storySession.update({
        where: { id: sessionId },
        data: sessionData,
      });

      // Delete existing related data
      await prisma.character.deleteMany({ where: { sessionId } });
      await prisma.plotBeat.deleteMany({ where: { sessionId } });
      await prisma.researchNote.deleteMany({ where: { sessionId } });
      await prisma.builderSession.deleteMany({ where: { sessionId } });
    } else {
      // Create new session
      session = await prisma.storySession.create({
        data: sessionData,
      });
    }

    // Create characters
    if (bible.characters.length > 0) {
      await prisma.character.createMany({
        data: bible.characters.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          logline: c.logline,
          desire: c.desire,
          fear: c.fear,
          wound: c.wound,
          contradiction: c.contradiction,
          voice: JSON.stringify(c.voice),
          relationships: JSON.stringify(c.relationships),
          arc: JSON.stringify(c.arc),
          sessionId: session.id,
        })),
      });
    }

    // Create plot beats
    if (bible.plot.length > 0) {
      await prisma.plotBeat.createMany({
        data: bible.plot.map((p) => ({
          id: p.id,
          label: p.label,
          summary: p.summary,
          stakes: p.stakes,
          turn: p.turn,
          sessionId: session.id,
        })),
      });
    }

    // Create research notes
    if (bible.research.length > 0) {
      await prisma.researchNote.createMany({
        data: bible.research.map((r) => ({
          id: r.id,
          question: r.question,
          bullets: JSON.stringify(r.bullets),
          sources: JSON.stringify(r.sources),
          createdAt: r.createdAt,
          sessionId: session.id,
        })),
      });
    }

    // Create builder sessions
    if (bible.builderSessions && bible.builderSessions.length > 0) {
      await prisma.builderSession.createMany({
        data: bible.builderSessions.map((b) => ({
          id: b.id,
          title: b.title,
          messages: JSON.stringify(b.messages),
          summary: b.summary || null,
          linkedTo: b.linkedTo ? JSON.stringify(b.linkedTo) : null,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          sessionId: session.id,
        })),
      });
    }

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}