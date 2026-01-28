/**
 * Concurrency Control
 * Prevent parallel tool storms and manage concurrent operations
 */

import { StructuredError, ErrorCode } from './errors';

/**
 * Semaphore for limiting concurrent operations
 */
export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * Acquire a permit
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    // Wait for permit
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release a permit
   */
  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }

  /**
   * Get available permits
   */
  available(): number {
    return this.permits;
  }

  /**
   * Get queue length
   */
  queueLength(): number {
    return this.queue.length;
  }
}

/**
 * Execute function with semaphore
 */
export async function withSemaphore<T>(
  semaphore: Semaphore,
  fn: () => Promise<T>
): Promise<T> {
  await semaphore.acquire();
  try {
    return await fn();
  } finally {
    semaphore.release();
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillRate: number, // tokens per second
    private refillInterval = 1000 // milliseconds
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Try to consume a token
   */
  async consume(tokens = 1): Promise<void> {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return;
    }

    // Calculate wait time
    const tokensNeeded = tokens - this.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000;

    // Wait and try again
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    return this.consume(tokens);
  }

  /**
   * Check if tokens are available
   */
  canConsume(tokens = 1): boolean {
    this.refill();
    return this.tokens >= tokens;
  }

  /**
   * Refill tokens based on time elapsed
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= this.refillInterval) {
      const tokensToAdd = (elapsed / 1000) * this.refillRate;
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Get current token count
   */
  getTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

/**
 * Execute function with rate limiting
 */
export async function withRateLimit<T>(
  rateLimiter: RateLimiter,
  fn: () => Promise<T>
): Promise<T> {
  await rateLimiter.consume();
  return fn();
}

/**
 * Queue for sequential execution
 */
export class Queue {
  private queue: Array<() => Promise<any>> = [];
  private running = false;

  /**
   * Add task to queue
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.running) {
        this.process();
      }
    });
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    if (this.running || this.queue.length === 0) {
      return;
    }

    this.running = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }

    this.running = false;
  }

  /**
   * Get queue length
   */
  length(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

/**
 * Concurrency limiter registry
 */
class ConcurrencyRegistry {
  private semaphores = new Map<string, Semaphore>();
  private rateLimiters = new Map<string, RateLimiter>();
  private queues = new Map<string, Queue>();

  /**
   * Get or create semaphore
   */
  getSemaphore(name: string, permits: number): Semaphore {
    if (!this.semaphores.has(name)) {
      this.semaphores.set(name, new Semaphore(permits));
    }
    return this.semaphores.get(name)!;
  }

  /**
   * Get or create rate limiter
   */
  getRateLimiter(name: string, maxTokens: number, refillRate: number): RateLimiter {
    if (!this.rateLimiters.has(name)) {
      this.rateLimiters.set(name, new RateLimiter(maxTokens, refillRate));
    }
    return this.rateLimiters.get(name)!;
  }

  /**
   * Get or create queue
   */
  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue());
    }
    return this.queues.get(name)!;
  }

  /**
   * Get stats
   */
  getStats() {
    const stats: Record<string, any> = {};

    Array.from(this.semaphores.entries()).forEach(([name, semaphore]) => {
      stats[`semaphore:${name}`] = {
        available: semaphore.available(),
        queueLength: semaphore.queueLength(),
      };
    });

    Array.from(this.rateLimiters.entries()).forEach(([name, rateLimiter]) => {
      stats[`rateLimiter:${name}`] = {
        tokens: rateLimiter.getTokens(),
      };
    });

    Array.from(this.queues.entries()).forEach(([name, queue]) => {
      stats[`queue:${name}`] = {
        length: queue.length(),
        running: queue.isRunning(),
      };
    });

    return stats;
  }
}

// Singleton registry
export const concurrency = new ConcurrencyRegistry();

/**
 * Predefined concurrency limits
 */
export const CONCURRENCY_LIMITS = {
  // MCP operations
  MCP_TOOL_CALLS: 3, // Max 3 concurrent tool calls
  MCP_SEARCHES: 2, // Max 2 concurrent searches

  // AI operations
  AI_REQUESTS: 5, // Max 5 concurrent AI requests

  // Database operations
  DB_WRITES: 10, // Max 10 concurrent writes
};

/**
 * Predefined rate limits
 */
export const RATE_LIMITS = {
  // MCP operations (tokens per second)
  MCP_BRAVE_SEARCH: { maxTokens: 10, refillRate: 1 }, // 1 per second, burst of 10
  MCP_FILESYSTEM: { maxTokens: 20, refillRate: 5 }, // 5 per second, burst of 20

  // AI operations
  AI_OPENAI: { maxTokens: 50, refillRate: 10 }, // 10 per second, burst of 50
};

/**
 * Execute with concurrency limit
 */
export async function withConcurrencyLimit<T>(
  name: string,
  fn: () => Promise<T>,
  limit: number
): Promise<T> {
  const semaphore = concurrency.getSemaphore(name, limit);
  return withSemaphore(semaphore, fn);
}

/**
 * Execute with rate limit
 */
export async function withRateLimitControl<T>(
  name: string,
  fn: () => Promise<T>,
  maxTokens: number,
  refillRate: number
): Promise<T> {
  const rateLimiter = concurrency.getRateLimiter(name, maxTokens, refillRate);
  return withRateLimit(rateLimiter, fn);
}

/**
 * Execute in queue (sequential)
 */
export async function withQueue<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const queue = concurrency.getQueue(name);
  return queue.enqueue(fn);
}
