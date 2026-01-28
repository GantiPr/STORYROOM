/**
 * Research Database Operations
 * Canonical structured layer for research notes
 */

import { prisma } from '../prisma';
import type { ResearchNote } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type ResearchNoteInput = {
  question: string;
  bullets: string[]; // Will be JSON stringified
  sources: Array<{
    id: string;
    domain: string;
    url: string;
    title: string;
  }>; // Will be JSON stringified
  summary?: string;
  tags?: string[]; // Will be JSON stringified
};

export type ResearchNoteUpdate = Partial<ResearchNoteInput>;

// ============================================================================
// RESEARCH NOTE CRUD
// ============================================================================

/**
 * Get a research note by ID
 */
export async function getResearchNote(id: string): Promise<ResearchNote | null> {
  return await prisma.researchNote.findUnique({
    where: { id },
  });
}

/**
 * List all research notes for a project
 */
export async function listResearchNotes(projectId: string): Promise<ResearchNote[]> {
  return await prisma.researchNote.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Create a new research note
 */
export async function addResearchNote(
  projectId: string,
  data: ResearchNoteInput
): Promise<ResearchNote> {
  return await prisma.researchNote.create({
    data: {
      question: data.question,
      bullets: JSON.stringify(data.bullets),
      sources: JSON.stringify(data.sources),
      summary: data.summary,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      projectId,
    },
  });
}

/**
 * Update a research note
 */
export async function updateResearchNote(
  id: string,
  data: ResearchNoteUpdate
): Promise<ResearchNote> {
  const updateData: any = {};

  if (data.question !== undefined) updateData.question = data.question;
  if (data.bullets !== undefined) updateData.bullets = JSON.stringify(data.bullets);
  if (data.sources !== undefined) updateData.sources = JSON.stringify(data.sources);
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

  return await prisma.researchNote.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a research note
 */
export async function deleteResearchNote(id: string): Promise<void> {
  await prisma.researchNote.delete({
    where: { id },
  });
}

/**
 * Search research notes
 */
export async function searchResearchNotes(
  projectId: string,
  query: string
): Promise<ResearchNote[]> {
  return await prisma.researchNote.findMany({
    where: {
      projectId,
      OR: [
        { question: { contains: query, mode: 'insensitive' } },
        { bullets: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get research notes by tag
 */
export async function getResearchNotesByTag(
  projectId: string,
  tag: string
): Promise<ResearchNote[]> {
  const notes = await listResearchNotes(projectId);

  return notes.filter((note) => {
    if (!note.tags) return false;
    const tags = JSON.parse(note.tags);
    return tags.includes(tag);
  });
}

/**
 * Get all unique tags from research notes
 */
export async function getAllResearchTags(projectId: string): Promise<string[]> {
  const notes = await listResearchNotes(projectId);
  const tagSet = new Set<string>();

  for (const note of notes) {
    if (note.tags) {
      const tags = JSON.parse(note.tags);
      tags.forEach((tag: string) => tagSet.add(tag));
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Count research notes in a project
 */
export async function countResearchNotes(projectId: string): Promise<number> {
  return await prisma.researchNote.count({
    where: { projectId },
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse research note (convert JSON strings back to objects)
 */
export function parseResearchNote(note: ResearchNote): ResearchNoteInput {
  return {
    question: note.question,
    bullets: JSON.parse(note.bullets),
    sources: JSON.parse(note.sources),
    summary: note.summary || undefined,
    tags: note.tags ? JSON.parse(note.tags) : undefined,
  };
}

/**
 * Get research notes with parsed data
 */
export async function listResearchNotesParsed(
  projectId: string
): Promise<(ResearchNote & { parsed: ResearchNoteInput })[]> {
  const notes = await listResearchNotes(projectId);

  return notes.map((note) => ({
    ...note,
    parsed: parseResearchNote(note),
  }));
}
