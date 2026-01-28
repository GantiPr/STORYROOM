/**
 * Character Database Operations
 * Canonical structured layer for character data
 */

import { prisma } from '../prisma';
import type { Character, CharacterRelationship } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type CharacterInput = {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'other';
  logline?: string;
  desire?: string;
  fear?: string;
  wound?: string;
  contradiction?: string;
  voiceTone?: string;
  voiceRhythm?: string;
  voiceVocabulary?: string;
  voiceQuirks?: string;
  arcStart?: string;
  arcMidpoint?: string;
  arcEnd?: string;
};

export type CharacterUpdate = Partial<CharacterInput>;

export type CharacterWithRelations = Character & {
  relationshipsFrom?: (CharacterRelationship & {
    toCharacter: Character;
  })[];
  relationshipsTo?: (CharacterRelationship & {
    fromCharacter: Character;
  })[];
};

// ============================================================================
// CHARACTER CRUD
// ============================================================================

/**
 * Get a character by ID
 */
export async function getCharacter(
  id: string,
  includeRelationships = false
): Promise<CharacterWithRelations | null> {
  return await prisma.character.findUnique({
    where: { id },
    include: includeRelationships
      ? {
          relationshipsFrom: {
            include: { toCharacter: true },
          },
          relationshipsTo: {
            include: { fromCharacter: true },
          },
        }
      : undefined,
  });
}

/**
 * List all characters for a project
 */
export async function listCharacters(
  projectId: string,
  includeRelationships = false
): Promise<CharacterWithRelations[]> {
  return await prisma.character.findMany({
    where: { projectId },
    include: includeRelationships
      ? {
          relationshipsFrom: {
            include: { toCharacter: true },
          },
          relationshipsTo: {
            include: { fromCharacter: true },
          },
        }
      : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * Search characters by name or role
 */
export async function searchCharacters(
  projectId: string,
  query: string
): Promise<Character[]> {
  return await prisma.character.findMany({
    where: {
      projectId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { role: { contains: query, mode: 'insensitive' } },
        { logline: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create a new character
 */
export async function createCharacter(
  projectId: string,
  data: CharacterInput
): Promise<Character> {
  return await prisma.character.create({
    data: {
      ...data,
      logline: data.logline || '',
      desire: data.desire || '',
      fear: data.fear || '',
      wound: data.wound || '',
      contradiction: data.contradiction || '',
      projectId,
    },
  });
}

/**
 * Update a character (upsert pattern)
 */
export async function upsertCharacter(
  id: string,
  projectId: string,
  data: CharacterInput
): Promise<Character> {
  return await prisma.character.upsert({
    where: { id },
    update: data,
    create: {
      id,
      ...data,
      logline: data.logline || '',
      desire: data.desire || '',
      fear: data.fear || '',
      wound: data.wound || '',
      contradiction: data.contradiction || '',
      projectId,
    },
  });
}

/**
 * Update character fields
 */
export async function updateCharacter(
  id: string,
  data: CharacterUpdate
): Promise<Character> {
  return await prisma.character.update({
    where: { id },
    data,
  });
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string): Promise<void> {
  await prisma.character.delete({
    where: { id },
  });
}

/**
 * Get characters by role
 */
export async function getCharactersByRole(
  projectId: string,
  role: string
): Promise<Character[]> {
  return await prisma.character.findMany({
    where: { projectId, role },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get protagonist(s)
 */
export async function getProtagonists(projectId: string): Promise<Character[]> {
  return getCharactersByRole(projectId, 'protagonist');
}

/**
 * Get antagonist(s)
 */
export async function getAntagonists(projectId: string): Promise<Character[]> {
  return getCharactersByRole(projectId, 'antagonist');
}

/**
 * Count characters in a project
 */
export async function countCharacters(projectId: string): Promise<number> {
  return await prisma.character.count({
    where: { projectId },
  });
}

// ============================================================================
// CHARACTER RELATIONSHIPS
// ============================================================================

/**
 * Create a relationship between two characters
 */
export async function createRelationship(
  projectId: string,
  fromCharacterId: string,
  toCharacterId: string,
  type: string,
  description: string,
  dynamic?: string
): Promise<CharacterRelationship> {
  return await prisma.characterRelationship.create({
    data: {
      projectId,
      fromCharacterId,
      toCharacterId,
      type,
      description,
      dynamic,
    },
  });
}

/**
 * Get all relationships for a character
 */
export async function getCharacterRelationships(
  characterId: string
): Promise<(CharacterRelationship & { toCharacter: Character; fromCharacter: Character })[]> {
  const [outgoing, incoming] = await Promise.all([
    prisma.characterRelationship.findMany({
      where: { fromCharacterId: characterId },
      include: { toCharacter: true, fromCharacter: true },
    }),
    prisma.characterRelationship.findMany({
      where: { toCharacterId: characterId },
      include: { toCharacter: true, fromCharacter: true },
    }),
  ]);

  return [...outgoing, ...incoming];
}

/**
 * Update a relationship
 */
export async function updateRelationship(
  id: string,
  data: {
    type?: string;
    description?: string;
    dynamic?: string;
  }
): Promise<CharacterRelationship> {
  return await prisma.characterRelationship.update({
    where: { id },
    data,
  });
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(id: string): Promise<void> {
  await prisma.characterRelationship.delete({
    where: { id },
  });
}

/**
 * Get relationship between two specific characters
 */
export async function getRelationshipBetween(
  fromCharacterId: string,
  toCharacterId: string
): Promise<CharacterRelationship | null> {
  return await prisma.characterRelationship.findUnique({
    where: {
      fromCharacterId_toCharacterId: {
        fromCharacterId,
        toCharacterId,
      },
    },
  });
}
