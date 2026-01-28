/**
 * Plot Beat Database Operations
 * Canonical structured layer for plot structure
 */

import { prisma } from '../prisma';
import type { PlotBeat, PlotBeatCharacter, Character } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type PlotBeatInput = {
  label: string;
  summary: string;
  stakes?: string;
  turn?: string;
  order: number;
  act?: number;
};

export type PlotBeatUpdate = Partial<PlotBeatInput>;

export type PlotBeatWithCharacters = PlotBeat & {
  characters: (PlotBeatCharacter & {
    character: Character;
  })[];
};

// ============================================================================
// PLOT BEAT CRUD
// ============================================================================

/**
 * Get a plot beat by ID
 */
export async function getPlotBeat(
  id: string,
  includeCharacters = false
): Promise<PlotBeatWithCharacters | null> {
  return await prisma.plotBeat.findUnique({
    where: { id },
    include: includeCharacters
      ? {
          characters: {
            include: { character: true },
          },
        }
      : undefined,
  });
}

/**
 * List all plot beats for a project
 */
export async function listBeats(
  projectId: string,
  includeCharacters = false
): Promise<PlotBeatWithCharacters[]> {
  return await prisma.plotBeat.findMany({
    where: { projectId },
    include: includeCharacters
      ? {
          characters: {
            include: { character: true },
          },
        }
      : undefined,
    orderBy: { order: 'asc' },
  });
}

/**
 * Get plot beats by act
 */
export async function getBeatsByAct(
  projectId: string,
  act: number
): Promise<PlotBeat[]> {
  return await prisma.plotBeat.findMany({
    where: { projectId, act },
    orderBy: { order: 'asc' },
  });
}

/**
 * Create a new plot beat
 */
export async function addBeat(
  projectId: string,
  data: PlotBeatInput
): Promise<PlotBeat> {
  return await prisma.plotBeat.create({
    data: {
      ...data,
      stakes: data.stakes || '',
      turn: data.turn || '',
      projectId,
    },
  });
}

/**
 * Update a plot beat
 */
export async function updateBeat(
  id: string,
  data: PlotBeatUpdate
): Promise<PlotBeat> {
  return await prisma.plotBeat.update({
    where: { id },
    data,
  });
}

/**
 * Delete a plot beat
 */
export async function deleteBeat(id: string): Promise<void> {
  await prisma.plotBeat.delete({
    where: { id },
  });
}

/**
 * Reorder plot beats
 */
export async function reorderBeats(
  beatIds: string[],
  startOrder = 0
): Promise<void> {
  await prisma.$transaction(
    beatIds.map((id, index) =>
      prisma.plotBeat.update({
        where: { id },
        data: { order: startOrder + index },
      })
    )
  );
}

/**
 * Count plot beats in a project
 */
export async function countBeats(projectId: string): Promise<number> {
  return await prisma.plotBeat.count({
    where: { projectId },
  });
}

// ============================================================================
// CHARACTER-BEAT LINKING
// ============================================================================

/**
 * Link a character to a plot beat
 */
export async function linkBeatToCharacter(
  plotBeatId: string,
  characterId: string,
  role?: string
): Promise<PlotBeatCharacter> {
  return await prisma.plotBeatCharacter.create({
    data: {
      plotBeatId,
      characterId,
      role,
    },
  });
}

/**
 * Unlink a character from a plot beat
 */
export async function unlinkBeatFromCharacter(
  plotBeatId: string,
  characterId: string
): Promise<void> {
  await prisma.plotBeatCharacter.deleteMany({
    where: {
      plotBeatId,
      characterId,
    },
  });
}

/**
 * Get all characters in a plot beat
 */
export async function getBeatCharacters(
  plotBeatId: string
): Promise<Character[]> {
  const links = await prisma.plotBeatCharacter.findMany({
    where: { plotBeatId },
    include: { character: true },
  });

  return links.map((link) => link.character);
}

/**
 * Get all plot beats for a character
 */
export async function getCharacterBeats(
  characterId: string
): Promise<PlotBeat[]> {
  const links = await prisma.plotBeatCharacter.findMany({
    where: { characterId },
    include: { plotBeat: true },
  });

  return links.map((link) => link.plotBeat).sort((a, b) => a.order - b.order);
}

/**
 * Update character's role in a beat
 */
export async function updateBeatCharacterRole(
  plotBeatId: string,
  characterId: string,
  role: string
): Promise<PlotBeatCharacter> {
  // Find the link
  const link = await prisma.plotBeatCharacter.findFirst({
    where: { plotBeatId, characterId },
  });

  if (!link) {
    throw new Error('Character not linked to this beat');
  }

  return await prisma.plotBeatCharacter.update({
    where: { id: link.id },
    data: { role },
  });
}

// ============================================================================
// PLOT STRUCTURE HELPERS
// ============================================================================

/**
 * Get the three-act structure
 */
export async function getThreeActStructure(projectId: string): Promise<{
  act1: PlotBeat[];
  act2: PlotBeat[];
  act3: PlotBeat[];
}> {
  const [act1, act2, act3] = await Promise.all([
    getBeatsByAct(projectId, 1),
    getBeatsByAct(projectId, 2),
    getBeatsByAct(projectId, 3),
  ]);

  return { act1, act2, act3 };
}

/**
 * Get key structural beats
 */
export async function getKeyBeats(projectId: string): Promise<{
  incitingIncident?: PlotBeat;
  midpoint?: PlotBeat;
  climax?: PlotBeat;
  resolution?: PlotBeat;
}> {
  const beats = await listBeats(projectId);

  return {
    incitingIncident: beats.find((b) =>
      b.label.toLowerCase().includes('inciting')
    ),
    midpoint: beats.find((b) => b.label.toLowerCase().includes('midpoint')),
    climax: beats.find((b) => b.label.toLowerCase().includes('climax')),
    resolution: beats.find((b) => b.label.toLowerCase().includes('resolution')),
  };
}

/**
 * Create standard three-act structure template
 */
export async function createThreeActTemplate(
  projectId: string
): Promise<PlotBeat[]> {
  const template = [
    // Act 1
    { label: 'Opening Image', act: 1, order: 0 },
    { label: 'Inciting Incident', act: 1, order: 1 },
    { label: 'First Plot Point', act: 1, order: 2 },
    // Act 2
    { label: 'Rising Action', act: 2, order: 3 },
    { label: 'Midpoint', act: 2, order: 4 },
    { label: 'All Is Lost', act: 2, order: 5 },
    { label: 'Second Plot Point', act: 2, order: 6 },
    // Act 3
    { label: 'Climax', act: 3, order: 7 },
    { label: 'Resolution', act: 3, order: 8 },
    { label: 'Closing Image', act: 3, order: 9 },
  ];

  return await prisma.$transaction(
    template.map((beat) =>
      prisma.plotBeat.create({
        data: {
          ...beat,
          summary: '',
          stakes: '',
          turn: '',
          projectId,
        },
      })
    )
  );
}
