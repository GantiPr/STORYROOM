/**
 * Relationship Database Operations
 * Helper functions for managing entity relationships
 */

import { prisma } from '../prisma';

// ============================================================================
// CROSS-ENTITY RELATIONSHIPS
// ============================================================================

/**
 * Get all entities related to a character
 */
export async function getCharacterRelatedEntities(characterId: string): Promise<{
  plotBeats: any[];
  timelineEvents: any[];
  canonEntries: any[];
}> {
  const [plotBeats, timelineEvents, canonEntries] = await Promise.all([
    prisma.plotBeatCharacter.findMany({
      where: { characterId },
      include: { plotBeat: true },
    }),
    prisma.timelineEventCharacter.findMany({
      where: { characterId },
      include: { timelineEvent: true },
    }),
    prisma.canonEntry.findMany({
      where: { characterId },
    }),
  ]);

  return {
    plotBeats: plotBeats.map((pbc) => pbc.plotBeat),
    timelineEvents: timelineEvents.map((tec) => tec.timelineEvent),
    canonEntries,
  };
}

/**
 * Get all entities at a location
 */
export async function getLocationRelatedEntities(locationId: string): Promise<{
  timelineEvents: any[];
  canonEntries: any[];
}> {
  const [timelineEvents, canonEntries] = await Promise.all([
    prisma.timelineEvent.findMany({
      where: { locationId },
    }),
    prisma.canonEntry.findMany({
      where: { locationId },
    }),
  ]);

  return {
    timelineEvents,
    canonEntries,
  };
}

/**
 * Get all entities linked to a research note
 */
export async function getResearchRelatedEntities(researchNoteId: string): Promise<{
  canonEntries: any[];
}> {
  const canonEntries = await prisma.canonEntry.findMany({
    where: { researchNoteId },
  });

  return {
    canonEntries,
  };
}

/**
 * Link multiple characters to a plot beat
 */
export async function linkCharactersToPlotBeat(
  plotBeatId: string,
  characterIds: string[]
): Promise<void> {
  await prisma.$transaction(
    characterIds.map((characterId) =>
      prisma.plotBeatCharacter.create({
        data: {
          plotBeatId,
          characterId,
        },
      })
    )
  );
}

/**
 * Link multiple characters to a timeline event
 */
export async function linkCharactersToTimelineEvent(
  timelineEventId: string,
  characterIds: string[]
): Promise<void> {
  await prisma.$transaction(
    characterIds.map((characterId) =>
      prisma.timelineEventCharacter.create({
        data: {
          timelineEventId,
          characterId,
        },
      })
    )
  );
}

/**
 * Get character interaction matrix
 * Shows which characters appear together in events
 */
export async function getCharacterInteractionMatrix(
  projectId: string
): Promise<Map<string, Set<string>>> {
  const events = await prisma.timelineEvent.findMany({
    where: { projectId },
    include: {
      characters: {
        include: { character: true },
      },
    },
  });

  const matrix = new Map<string, Set<string>>();

  for (const event of events) {
    const characterIds = event.characters.map((c) => c.characterId);

    for (const id1 of characterIds) {
      if (!matrix.has(id1)) {
        matrix.set(id1, new Set());
      }

      for (const id2 of characterIds) {
        if (id1 !== id2) {
          matrix.get(id1)!.add(id2);
        }
      }
    }
  }

  return matrix;
}

/**
 * Get character co-occurrence count
 */
export async function getCharacterCoOccurrence(
  characterId1: string,
  characterId2: string
): Promise<number> {
  const events1 = await prisma.timelineEventCharacter.findMany({
    where: { characterId: characterId1 },
    select: { timelineEventId: true },
  });

  const events2 = await prisma.timelineEventCharacter.findMany({
    where: { characterId: characterId2 },
    select: { timelineEventId: true },
  });

  const eventIds1 = new Set(events1.map((e) => e.timelineEventId));
  const eventIds2 = new Set(events2.map((e) => e.timelineEventId));

  let count = 0;
  for (const id of eventIds1) {
    if (eventIds2.has(id)) {
      count++;
    }
  }

  return count;
}

/**
 * Get location usage frequency
 */
export async function getLocationUsageFrequency(
  projectId: string
): Promise<Map<string, number>> {
  const events = await prisma.timelineEvent.findMany({
    where: { projectId, locationId: { not: null } },
    select: { locationId: true },
  });

  const frequency = new Map<string, number>();

  for (const event of events) {
    if (event.locationId) {
      frequency.set(event.locationId, (frequency.get(event.locationId) || 0) + 1);
    }
  }

  return frequency;
}

/**
 * Get most used locations
 */
export async function getMostUsedLocations(
  projectId: string,
  limit = 10
): Promise<Array<{ location: any; count: number }>> {
  const frequency = await getLocationUsageFrequency(projectId);

  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const locations = await Promise.all(
    sorted.map(async ([locationId, count]) => {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
      });
      return { location, count };
    })
  );

  return locations;
}

/**
 * Get character screen time (number of events they're in)
 */
export async function getCharacterScreenTime(
  projectId: string
): Promise<Map<string, number>> {
  const characters = await prisma.character.findMany({
    where: { projectId },
    include: {
      timelineEvents: true,
    },
  });

  const screenTime = new Map<string, number>();

  for (const character of characters) {
    screenTime.set(character.id, character.timelineEvents.length);
  }

  return screenTime;
}

/**
 * Get most active characters
 */
export async function getMostActiveCharacters(
  projectId: string,
  limit = 10
): Promise<Array<{ character: any; eventCount: number }>> {
  const screenTime = await getCharacterScreenTime(projectId);

  const sorted = Array.from(screenTime.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const characters = await Promise.all(
    sorted.map(async ([characterId, eventCount]) => {
      const character = await prisma.character.findUnique({
        where: { id: characterId },
      });
      return { character, eventCount };
    })
  );

  return characters;
}
