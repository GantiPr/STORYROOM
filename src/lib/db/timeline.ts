/**
 * Timeline Database Operations
 * Canonical structured layer for timeline events
 */

import { prisma } from '../prisma';
import type { TimelineEvent, TimelineEventCharacter, Character, Location } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type TimelineEventInput = {
  title: string;
  description: string;
  type: 'scene' | 'backstory' | 'world-event' | 'character-moment';
  timestamp?: string;
  order: number;
  duration?: string;
  act?: number;
  chapter?: number;
  plotBeatId?: string;
  locationId?: string;
};

export type TimelineEventUpdate = Partial<TimelineEventInput>;

export type TimelineEventWithRelations = TimelineEvent & {
  characters?: (TimelineEventCharacter & {
    character: Character;
  })[];
  location?: Location | null;
};

// ============================================================================
// TIMELINE EVENT CRUD
// ============================================================================

/**
 * Get a timeline event by ID
 */
export async function getTimelineEvent(
  id: string,
  includeRelations = false
): Promise<TimelineEventWithRelations | null> {
  return await prisma.timelineEvent.findUnique({
    where: { id },
    include: includeRelations
      ? {
          characters: {
            include: { character: true },
          },
          location: true,
        }
      : undefined,
  });
}

/**
 * List all timeline events for a project
 */
export async function listTimelineEvents(
  projectId: string,
  includeRelations = false
): Promise<TimelineEventWithRelations[]> {
  return await prisma.timelineEvent.findMany({
    where: { projectId },
    include: includeRelations
      ? {
          characters: {
            include: { character: true },
          },
          location: true,
        }
      : undefined,
    orderBy: { order: 'asc' },
  });
}

/**
 * Get timeline events by type
 */
export async function getEventsByType(
  projectId: string,
  type: string
): Promise<TimelineEvent[]> {
  return await prisma.timelineEvent.findMany({
    where: { projectId, type },
    orderBy: { order: 'asc' },
  });
}

/**
 * Get timeline events by act
 */
export async function getEventsByAct(
  projectId: string,
  act: number
): Promise<TimelineEvent[]> {
  return await prisma.timelineEvent.findMany({
    where: { projectId, act },
    orderBy: { order: 'asc' },
  });
}

/**
 * Get timeline events by chapter
 */
export async function getEventsByChapter(
  projectId: string,
  chapter: number
): Promise<TimelineEvent[]> {
  return await prisma.timelineEvent.findMany({
    where: { projectId, chapter },
    orderBy: { order: 'asc' },
  });
}

/**
 * Create a new timeline event
 */
export async function addTimelineEvent(
  projectId: string,
  data: TimelineEventInput
): Promise<TimelineEvent> {
  return await prisma.timelineEvent.create({
    data: {
      ...data,
      projectId,
    },
  });
}

/**
 * Update a timeline event
 */
export async function updateTimelineEvent(
  id: string,
  data: TimelineEventUpdate
): Promise<TimelineEvent> {
  return await prisma.timelineEvent.update({
    where: { id },
    data,
  });
}

/**
 * Delete a timeline event
 */
export async function deleteTimelineEvent(id: string): Promise<void> {
  await prisma.timelineEvent.delete({
    where: { id },
  });
}

/**
 * Reorder timeline events
 */
export async function reorderTimelineEvents(
  eventIds: string[],
  startOrder = 0
): Promise<void> {
  await prisma.$transaction(
    eventIds.map((id, index) =>
      prisma.timelineEvent.update({
        where: { id },
        data: { order: startOrder + index },
      })
    )
  );
}

/**
 * Count timeline events in a project
 */
export async function countTimelineEvents(projectId: string): Promise<number> {
  return await prisma.timelineEvent.count({
    where: { projectId },
  });
}

// ============================================================================
// CHARACTER-EVENT LINKING
// ============================================================================

/**
 * Link a character to a timeline event
 */
export async function linkEventToCharacter(
  timelineEventId: string,
  characterId: string,
  role?: string
): Promise<TimelineEventCharacter> {
  return await prisma.timelineEventCharacter.create({
    data: {
      timelineEventId,
      characterId,
      role,
    },
  });
}

/**
 * Unlink a character from a timeline event
 */
export async function unlinkEventFromCharacter(
  timelineEventId: string,
  characterId: string
): Promise<void> {
  await prisma.timelineEventCharacter.deleteMany({
    where: {
      timelineEventId,
      characterId,
    },
  });
}

/**
 * Get all characters in a timeline event
 */
export async function getEventCharacters(
  timelineEventId: string
): Promise<Character[]> {
  const links = await prisma.timelineEventCharacter.findMany({
    where: { timelineEventId },
    include: { character: true },
  });

  return links.map((link) => link.character);
}

/**
 * Get all timeline events for a character
 */
export async function getCharacterEvents(
  characterId: string
): Promise<TimelineEvent[]> {
  const links = await prisma.timelineEventCharacter.findMany({
    where: { characterId },
    include: { timelineEvent: true },
  });

  return links.map((link) => link.timelineEvent).sort((a, b) => a.order - b.order);
}

// ============================================================================
// TIMELINE ANALYSIS
// ============================================================================

/**
 * Get timeline grouped by act
 */
export async function getTimelineByAct(projectId: string): Promise<{
  act1: TimelineEvent[];
  act2: TimelineEvent[];
  act3: TimelineEvent[];
  unassigned: TimelineEvent[];
}> {
  const events = await listTimelineEvents(projectId);

  return {
    act1: events.filter((e) => e.act === 1),
    act2: events.filter((e) => e.act === 2),
    act3: events.filter((e) => e.act === 3),
    unassigned: events.filter((e) => !e.act),
  };
}

/**
 * Get timeline grouped by type
 */
export async function getTimelineByType(projectId: string): Promise<{
  scenes: TimelineEvent[];
  backstory: TimelineEvent[];
  worldEvents: TimelineEvent[];
  characterMoments: TimelineEvent[];
}> {
  const events = await listTimelineEvents(projectId);

  return {
    scenes: events.filter((e) => e.type === 'scene'),
    backstory: events.filter((e) => e.type === 'backstory'),
    worldEvents: events.filter((e) => e.type === 'world-event'),
    characterMoments: events.filter((e) => e.type === 'character-moment'),
  };
}

/**
 * Get character's timeline (all events they're in)
 */
export async function getCharacterTimeline(
  characterId: string
): Promise<TimelineEventWithRelations[]> {
  const links = await prisma.timelineEventCharacter.findMany({
    where: { characterId },
    include: {
      timelineEvent: {
        include: {
          characters: {
            include: { character: true },
          },
          location: true,
        },
      },
    },
  });

  return links
    .map((link) => link.timelineEvent)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get events at a location
 */
export async function getLocationEvents(
  locationId: string
): Promise<TimelineEvent[]> {
  return await prisma.timelineEvent.findMany({
    where: { locationId },
    orderBy: { order: 'asc' },
  });
}

/**
 * Search timeline events
 */
export async function searchTimelineEvents(
  projectId: string,
  query: string
): Promise<TimelineEvent[]> {
  return await prisma.timelineEvent.findMany({
    where: {
      projectId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { order: 'asc' },
  });
}
