/**
 * Location Database Operations
 * Canonical structured layer for worldbuilding and locations
 */

import { prisma } from '../prisma';
import type { Location } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export type LocationInput = {
  name: string;
  type: string; // city, building, region, planet, etc.
  description: string;
  parentId?: string;
  significance?: string;
  atmosphere?: string;
};

export type LocationUpdate = Partial<LocationInput>;

export type LocationWithHierarchy = Location & {
  parent?: Location | null;
  children?: Location[];
};

// ============================================================================
// LOCATION CRUD
// ============================================================================

/**
 * Get a location by ID
 */
export async function getLocation(
  id: string,
  includeHierarchy = false
): Promise<LocationWithHierarchy | null> {
  return await prisma.location.findUnique({
    where: { id },
    include: includeHierarchy
      ? {
          parent: true,
          children: true,
        }
      : undefined,
  });
}

/**
 * List all locations for a project
 */
export async function listLocations(
  projectId: string,
  includeHierarchy = false
): Promise<LocationWithHierarchy[]> {
  return await prisma.location.findMany({
    where: { projectId },
    include: includeHierarchy
      ? {
          parent: true,
          children: true,
        }
      : undefined,
    orderBy: { name: 'asc' },
  });
}

/**
 * Get locations by type
 */
export async function getLocationsByType(
  projectId: string,
  type: string
): Promise<Location[]> {
  return await prisma.location.findMany({
    where: { projectId, type },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get top-level locations (no parent)
 */
export async function getRootLocations(projectId: string): Promise<Location[]> {
  return await prisma.location.findMany({
    where: { projectId, parentId: null },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get child locations
 */
export async function getChildLocations(parentId: string): Promise<Location[]> {
  return await prisma.location.findMany({
    where: { parentId },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create a new location
 */
export async function addLocation(
  projectId: string,
  data: LocationInput
): Promise<Location> {
  return await prisma.location.create({
    data: {
      ...data,
      projectId,
    },
  });
}

/**
 * Update a location
 */
export async function updateLocation(
  id: string,
  data: LocationUpdate
): Promise<Location> {
  return await prisma.location.update({
    where: { id },
    data,
  });
}

/**
 * Delete a location
 */
export async function deleteLocation(id: string): Promise<void> {
  await prisma.location.delete({
    where: { id },
  });
}

/**
 * Search locations
 */
export async function searchLocations(
  projectId: string,
  query: string
): Promise<Location[]> {
  return await prisma.location.findMany({
    where: {
      projectId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Count locations in a project
 */
export async function countLocations(projectId: string): Promise<number> {
  return await prisma.location.count({
    where: { projectId },
  });
}

// ============================================================================
// LOCATION HIERARCHY
// ============================================================================

/**
 * Get full location hierarchy (tree structure)
 */
export async function getLocationHierarchy(
  projectId: string
): Promise<LocationWithHierarchy[]> {
  const roots = await prisma.location.findMany({
    where: { projectId, parentId: null },
    include: {
      children: {
        include: {
          children: {
            include: {
              children: true, // 3 levels deep
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return roots;
}

/**
 * Get location path (breadcrumb trail)
 */
export async function getLocationPath(id: string): Promise<Location[]> {
  const path: Location[] = [];
  let currentId: string | null = id;

  while (currentId) {
    const location = await prisma.location.findUnique({
      where: { id: currentId },
    });

    if (!location) break;

    path.unshift(location);
    currentId = location.parentId;
  }

  return path;
}

/**
 * Move location to new parent
 */
export async function moveLocation(
  id: string,
  newParentId: string | null
): Promise<Location> {
  return await prisma.location.update({
    where: { id },
    data: { parentId: newParentId },
  });
}

/**
 * Get all descendants of a location
 */
export async function getLocationDescendants(id: string): Promise<Location[]> {
  const descendants: Location[] = [];
  const queue = [id];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await getChildLocations(currentId);

    descendants.push(...children);
    queue.push(...children.map((c) => c.id));
  }

  return descendants;
}

// ============================================================================
// LOCATION ANALYSIS
// ============================================================================

/**
 * Get locations grouped by type
 */
export async function getLocationsByTypeGrouped(projectId: string): Promise<
  Record<string, Location[]>
> {
  const locations = await listLocations(projectId);
  const grouped: Record<string, Location[]> = {};

  for (const location of locations) {
    if (!grouped[location.type]) {
      grouped[location.type] = [];
    }
    grouped[location.type].push(location);
  }

  return grouped;
}

/**
 * Get most significant locations
 */
export async function getSignificantLocations(
  projectId: string
): Promise<Location[]> {
  return await prisma.location.findMany({
    where: {
      projectId,
      significance: { not: null },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Create location hierarchy from flat list
 */
export async function createLocationHierarchy(
  projectId: string,
  locations: Array<{
    name: string;
    type: string;
    description: string;
    parentName?: string;
  }>
): Promise<Location[]> {
  const created: Map<string, Location> = new Map();

  // First pass: create all locations without parents
  for (const loc of locations) {
    const location = await addLocation(projectId, {
      name: loc.name,
      type: loc.type,
      description: loc.description,
    });
    created.set(loc.name, location);
  }

  // Second pass: set up parent relationships
  for (const loc of locations) {
    if (loc.parentName) {
      const location = created.get(loc.name);
      const parent = created.get(loc.parentName);

      if (location && parent) {
        await updateLocation(location.id, { parentId: parent.id });
      }
    }
  }

  return Array.from(created.values());
}
