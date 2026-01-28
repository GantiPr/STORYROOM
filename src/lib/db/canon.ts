/**
 * Canon Entry Database Operations
 * Canonical structured layer for locked story facts
 */

import { prisma } from '../prisma';
import type { CanonEntry, Character, Location, ResearchNote } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type CanonEntryInput = {
  type: 'world-rule' | 'character-habit' | 'plot-constraint' | 'background-texture';
  content: string;
  reasoning?: string;
  sourceCitation?: string;
  characterId?: string;
  locationId?: string;
  researchNoteId?: string;
};

export type CanonEntryUpdate = Partial<CanonEntryInput>;

export type CanonEntryWithRelations = CanonEntry & {
  character?: Character | null;
  location?: Location | null;
  researchNote?: ResearchNote | null;
};

// ============================================================================
// CANON ENTRY CRUD
// ============================================================================

/**
 * Get a canon entry by ID
 */
export async function getCanonEntry(
  id: string,
  includeRelations = false
): Promise<CanonEntryWithRelations | null> {
  return await prisma.canonEntry.findUnique({
    where: { id },
    include: includeRelations
      ? {
          character: true,
          location: true,
          researchNote: true,
        }
      : undefined,
  });
}

/**
 * List all canon entries for a project
 */
export async function listCanonEntries(
  projectId: string,
  includeRelations = false
): Promise<CanonEntryWithRelations[]> {
  return await prisma.canonEntry.findMany({
    where: { projectId },
    include: includeRelations
      ? {
          character: true,
          location: true,
          researchNote: true,
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get canon entries by type
 */
export async function getCanonEntriesByType(
  projectId: string,
  type: string
): Promise<CanonEntry[]> {
  return await prisma.canonEntry.findMany({
    where: { projectId, type },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get canon entries for a character
 */
export async function getCharacterCanon(characterId: string): Promise<CanonEntry[]> {
  return await prisma.canonEntry.findMany({
    where: { characterId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get canon entries for a location
 */
export async function getLocationCanon(locationId: string): Promise<CanonEntry[]> {
  return await prisma.canonEntry.findMany({
    where: { locationId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get canon entries from a research note
 */
export async function getResearchCanon(researchNoteId: string): Promise<CanonEntry[]> {
  return await prisma.canonEntry.findMany({
    where: { researchNoteId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new canon entry
 */
export async function addCanonEntry(
  projectId: string,
  data: CanonEntryInput
): Promise<CanonEntry> {
  return await prisma.canonEntry.create({
    data: {
      ...data,
      projectId,
    },
  });
}

/**
 * Update a canon entry
 */
export async function updateCanonEntry(
  id: string,
  data: CanonEntryUpdate
): Promise<CanonEntry> {
  return await prisma.canonEntry.update({
    where: { id },
    data,
  });
}

/**
 * Delete a canon entry
 */
export async function deleteCanonEntry(id: string): Promise<void> {
  await prisma.canonEntry.delete({
    where: { id },
  });
}

/**
 * Search canon entries
 */
export async function searchCanonEntries(
  projectId: string,
  query: string
): Promise<CanonEntry[]> {
  return await prisma.canonEntry.findMany({
    where: {
      projectId,
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        { reasoning: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Count canon entries in a project
 */
export async function countCanonEntries(projectId: string): Promise<number> {
  return await prisma.canonEntry.count({
    where: { projectId },
  });
}

// ============================================================================
// CANON ANALYSIS
// ============================================================================

/**
 * Get canon entries grouped by type
 */
export async function getCanonByType(projectId: string): Promise<{
  worldRules: CanonEntry[];
  characterHabits: CanonEntry[];
  plotConstraints: CanonEntry[];
  backgroundTexture: CanonEntry[];
}> {
  const entries = await listCanonEntries(projectId);

  return {
    worldRules: entries.filter((e) => e.type === 'world-rule'),
    characterHabits: entries.filter((e) => e.type === 'character-habit'),
    plotConstraints: entries.filter((e) => e.type === 'plot-constraint'),
    backgroundTexture: entries.filter((e) => e.type === 'background-texture'),
  };
}

/**
 * Get all canon for the story bible
 */
export async function getStoryCanon(
  projectId: string
): Promise<CanonEntryWithRelations[]> {
  return await listCanonEntries(projectId, true);
}

/**
 * Validate canon consistency (check for conflicts)
 */
export async function validateCanonConsistency(
  projectId: string
): Promise<{
  valid: boolean;
  conflicts: Array<{
    entry1: CanonEntry;
    entry2: CanonEntry;
    reason: string;
  }>;
}> {
  const entries = await listCanonEntries(projectId);
  const conflicts: Array<{
    entry1: CanonEntry;
    entry2: CanonEntry;
    reason: string;
  }> = [];

  // Simple conflict detection: same character with contradicting habits
  const characterHabits = entries.filter((e) => e.type === 'character-habit');

  for (let i = 0; i < characterHabits.length; i++) {
    for (let j = i + 1; j < characterHabits.length; j++) {
      const e1 = characterHabits[i];
      const e2 = characterHabits[j];

      if (e1.characterId === e2.characterId) {
        // Check for contradictions in content
        // This is a simple check - could be enhanced with NLP
        const content1Lower = e1.content.toLowerCase();
        const content2Lower = e2.content.toLowerCase();

        if (
          (content1Lower.includes('never') && content2Lower.includes('always')) ||
          (content1Lower.includes('always') && content2Lower.includes('never'))
        ) {
          conflicts.push({
            entry1: e1,
            entry2: e2,
            reason: 'Potential contradiction in character habits',
          });
        }
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
  };
}
