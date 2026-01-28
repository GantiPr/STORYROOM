/**
 * Database Abstraction Layer
 * Clean API for interacting with SQLite canonical data
 */

export * from './characters';
export * from './plotBeats';
export * from './timeline';
export * from './locations';
export * from './research';
export * from './canon';
export * from './projects';
export * from './relationships';

// Re-export Prisma client for direct access when needed
export { prisma } from '../prisma';
