/**
 * Project Database Operations
 * Canonical structured layer for projects and story bible
 */

import { prisma } from '../prisma';
import type { Project } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type ProjectInput = {
  name: string;
  description?: string;
  title?: string;
  premise?: string;
  genre?: string;
  themes?: string[]; // Will be JSON stringified
  phase?: 'discovery' | 'development' | 'drafting' | 'revision';
};

export type ProjectUpdate = Partial<ProjectInput>;

export type ProjectWithStats = Project & {
  stats: {
    characters: number;
    plotBeats: number;
    timelineEvents: number;
    locations: number;
    research: number;
    canon: number;
  };
};

// ============================================================================
// PROJECT CRUD
// ============================================================================

/**
 * Get a project by ID
 */
export async function getProject(id: string): Promise<Project | null> {
  return await prisma.project.findUnique({
    where: { id },
  });
}

/**
 * Get a project with stats
 */
export async function getProjectWithStats(id: string): Promise<ProjectWithStats | null> {
  const project = await getProject(id);
  if (!project) return null;

  const [
    characters,
    plotBeats,
    timelineEvents,
    locations,
    research,
    canon,
  ] = await Promise.all([
    prisma.character.count({ where: { projectId: id } }),
    prisma.plotBeat.count({ where: { projectId: id } }),
    prisma.timelineEvent.count({ where: { projectId: id } }),
    prisma.location.count({ where: { projectId: id } }),
    prisma.researchNote.count({ where: { projectId: id } }),
    prisma.canonEntry.count({ where: { projectId: id } }),
  ]);

  return {
    ...project,
    stats: {
      characters,
      plotBeats,
      timelineEvents,
      locations,
      research,
      canon,
    },
  };
}

/**
 * List all projects
 */
export async function listProjects(): Promise<Project[]> {
  return await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Create a new project
 */
export async function createProject(data: ProjectInput): Promise<Project> {
  return await prisma.project.create({
    data: {
      ...data,
      themes: data.themes ? JSON.stringify(data.themes) : null,
    },
  });
}

/**
 * Update a project
 */
export async function updateProject(
  id: string,
  data: ProjectUpdate
): Promise<Project> {
  const updateData: any = { ...data };

  if (data.themes !== undefined) {
    updateData.themes = JSON.stringify(data.themes);
  }

  return await prisma.project.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Delete a project (cascades to all related data)
 */
export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id },
  });
}

/**
 * Search projects
 */
export async function searchProjects(query: string): Promise<Project[]> {
  return await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { premise: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// ============================================================================
// PROJECT METADATA
// ============================================================================

/**
 * Update project phase
 */
export async function updateProjectPhase(
  id: string,
  phase: 'discovery' | 'development' | 'drafting' | 'revision'
): Promise<Project> {
  return await updateProject(id, { phase });
}

/**
 * Update story bible metadata
 */
export async function updateStoryBible(
  id: string,
  data: {
    title?: string;
    premise?: string;
    genre?: string;
    themes?: string[];
  }
): Promise<Project> {
  return await updateProject(id, data);
}

/**
 * Get project by phase
 */
export async function getProjectsByPhase(
  phase: string
): Promise<Project[]> {
  return await prisma.project.findMany({
    where: { phase },
    orderBy: { updatedAt: 'desc' },
  });
}

// ============================================================================
// PROJECT ANALYSIS
// ============================================================================

/**
 * Get project health metrics
 */
export async function getProjectHealth(id: string): Promise<{
  completeness: number; // 0-100
  balance: {
    hasCharacters: boolean;
    hasPlot: boolean;
    hasTimeline: boolean;
    hasWorldbuilding: boolean;
    hasResearch: boolean;
  };
  recommendations: string[];
}> {
  const stats = await getProjectWithStats(id);
  if (!stats) {
    throw new Error('Project not found');
  }

  const balance = {
    hasCharacters: stats.stats.characters > 0,
    hasPlot: stats.stats.plotBeats > 0,
    hasTimeline: stats.stats.timelineEvents > 0,
    hasWorldbuilding: stats.stats.locations > 0,
    hasResearch: stats.stats.research > 0,
  };

  const completenessFactors = [
    balance.hasCharacters ? 20 : 0,
    balance.hasPlot ? 20 : 0,
    balance.hasTimeline ? 20 : 0,
    balance.hasWorldbuilding ? 20 : 0,
    balance.hasResearch ? 20 : 0,
  ];

  const completeness = completenessFactors.reduce((a, b) => a + b, 0);

  const recommendations: string[] = [];
  if (!balance.hasCharacters) recommendations.push('Add characters to your story');
  if (!balance.hasPlot) recommendations.push('Define plot beats and structure');
  if (!balance.hasTimeline) recommendations.push('Create timeline events');
  if (!balance.hasWorldbuilding) recommendations.push('Build your story world with locations');
  if (!balance.hasResearch) recommendations.push('Conduct research to ground your story');

  return {
    completeness,
    balance,
    recommendations,
  };
}

/**
 * Get project summary
 */
export async function getProjectSummary(id: string): Promise<{
  project: Project;
  stats: {
    characters: number;
    plotBeats: number;
    timelineEvents: number;
    locations: number;
    research: number;
    canon: number;
  };
  recentActivity: {
    lastCharacterUpdate?: Date;
    lastPlotUpdate?: Date;
    lastTimelineUpdate?: Date;
  };
}> {
  const projectWithStats = await getProjectWithStats(id);
  if (!projectWithStats) {
    throw new Error('Project not found');
  }

  // Get most recent updates
  const [lastCharacter, lastPlotBeat, lastTimelineEvent] = await Promise.all([
    prisma.character.findFirst({
      where: { projectId: id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.plotBeat.findFirst({
      where: { projectId: id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
    prisma.timelineEvent.findFirst({
      where: { projectId: id },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    }),
  ]);

  return {
    project: projectWithStats,
    stats: projectWithStats.stats,
    recentActivity: {
      lastCharacterUpdate: lastCharacter?.updatedAt,
      lastPlotUpdate: lastPlotBeat?.updatedAt,
      lastTimelineUpdate: lastTimelineEvent?.updatedAt,
    },
  };
}

/**
 * Count total projects
 */
export async function countProjects(): Promise<number> {
  return await prisma.project.count();
}
