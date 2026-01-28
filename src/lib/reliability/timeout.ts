/**
 * Timeout Utilities
 * Prevent operations from hanging indefinitely
 */

import { StructuredError, ErrorCode } from './errors';

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new StructuredError(
              ErrorCode.TIMEOUT,
              `${timeoutMessage}. Please try again.`,
              `Timeout after ${timeoutMs}ms`,
              true,
              5
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Execute function with adaptive timeout
 * Timeout increases based on previous execution times
 */
export class AdaptiveTimeout {
  private executionTimes: number[] = [];
  private maxSamples = 10;

  constructor(
    private baseTimeout: number,
    private multiplier = 2
  ) {}

  /**
   * Execute with adaptive timeout
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const timeout = this.getTimeout();
    const startTime = Date.now();

    try {
      const result = await withTimeout(fn, timeout);
      const executionTime = Date.now() - startTime;
      this.recordExecutionTime(executionTime);
      return result;
    } catch (error) {
      // If timeout, increase timeout for next time
      if (error instanceof StructuredError && error.code === ErrorCode.TIMEOUT) {
        this.recordExecutionTime(timeout);
      }
      throw error;
    }
  }

  /**
   * Get current timeout based on history
   */
  private getTimeout(): number {
    if (this.executionTimes.length === 0) {
      return this.baseTimeout;
    }

    // Use 95th percentile of execution times
    const sorted = [...this.executionTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index];

    return Math.max(this.baseTimeout, p95 * this.multiplier);
  }

  /**
   * Record execution time
   */
  private recordExecutionTime(time: number): void {
    this.executionTimes.push(time);

    // Keep only recent samples
    if (this.executionTimes.length > this.maxSamples) {
      this.executionTimes.shift();
    }
  }

  /**
   * Reset history
   */
  reset(): void {
    this.executionTimes = [];
  }
}

/**
 * Timeout configurations for different operations
 */
export const TIMEOUTS = {
  // MCP operations
  MCP_TOOL_CALL: 30000, // 30 seconds
  MCP_LIST_TOOLS: 10000, // 10 seconds
  MCP_SEARCH: 15000, // 15 seconds

  // AI operations
  AI_CHAT: 60000, // 60 seconds
  AI_GENERATION: 120000, // 2 minutes
  AI_SUMMARY: 30000, // 30 seconds

  // Database operations
  DB_QUERY: 5000, // 5 seconds
  DB_TRANSACTION: 10000, // 10 seconds

  // Network operations
  HTTP_REQUEST: 10000, // 10 seconds
  FILE_UPLOAD: 60000, // 60 seconds
  FILE_DOWNLOAD: 60000, // 60 seconds
};
