/**
 * Caching Layer
 * Cache read-only operations to reduce load and improve performance
 */

export type CacheOptions = {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  keyGenerator?: (...args: any[]) => string;
};

const DEFAULT_OPTIONS: Required<CacheOptions> = {
  ttl: 300000, // 5 minutes
  maxSize: 100,
  keyGenerator: (...args) => JSON.stringify(args),
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
};

/**
 * Simple in-memory cache with TTL and LRU eviction
 */
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at max size
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (ttl || this.options.ttl);

    this.cache.set(key, {
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache stats
   */
  getStats() {
    let totalAccess = 0;
    let expiredCount = 0;
    const now = Date.now();

    Array.from(this.cache.values()).forEach(entry => {
      totalAccess += entry.accessCount;
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      totalAccess,
      expiredCount,
      hitRate: totalAccess / (this.cache.size || 1),
    };
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let lruKey: string | undefined;
    let lruTime = Infinity;

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    });

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => {
      this.cache.delete(key);
    });
  }
}

/**
 * Cache registry for different cache instances
 */
class CacheRegistry {
  private caches = new Map<string, Cache<any>>();

  /**
   * Get or create cache
   */
  get<T>(name: string, options?: CacheOptions): Cache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new Cache<T>(options));
    }
    return this.caches.get(name)!;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    Array.from(this.caches.values()).forEach(cache => {
      cache.clear();
    });
  }

  /**
   * Cleanup all caches
   */
  cleanupAll(): void {
    Array.from(this.caches.values()).forEach(cache => {
      cache.cleanup();
    });
  }

  /**
   * Get stats for all caches
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    Array.from(this.caches.entries()).forEach(([name, cache]) => {
      stats[name] = cache.getStats();
    });
    return stats;
  }
}

// Singleton registry
export const caches = new CacheRegistry();

/**
 * Execute function with caching
 */
export async function withCache<T>(
  cacheName: string,
  key: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  const cache = caches.get<T>(cacheName, options);

  // Check cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    return cached;
  }

  // Execute and cache
  const result = await fn();
  cache.set(key, result, options?.ttl);

  return result;
}

/**
 * Memoize function with caching
 */
export function memoize<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cacheName: string,
  options?: CacheOptions
): T {
  const cache = caches.get(cacheName, options);
  const keyGen = options?.keyGenerator || DEFAULT_OPTIONS.keyGenerator;

  return (async (...args: any[]) => {
    const key = keyGen(...args);

    // Check cache
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute and cache
    const result = await fn(...args);
    cache.set(key, result, options?.ttl);

    return result;
  }) as T;
}

/**
 * Periodic cleanup of all caches
 */
setInterval(() => {
  caches.cleanupAll();
}, 60000); // Every minute

/**
 * Predefined caches
 */
export const CACHES = {
  MCP_TOOLS: 'mcp-tools',
  MCP_SEARCH: 'mcp-search',
  MCP_LIST_FILES: 'mcp-list-files',
  PROJECT_DATA: 'project-data',
  CHARACTER_DATA: 'character-data',
};
