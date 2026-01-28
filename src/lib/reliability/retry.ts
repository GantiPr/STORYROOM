/**
 * Retry Logic with Exponential Backoff
 * Automatically retry failed operations with increasing delays
 */

import { isRetryable, parseError } from './errors';

export type RetryOptions = {
  maxAttempts?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: any) => void;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Add jitter to prevent thundering herd
 */
function addJitter(delay: number): number {
  const jitter = Math.random() * 0.3 * delay; // ±30% jitter
  return delay + jitter;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryable(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === opts.maxAttempts) {
        throw error;
      }

      // Calculate delay
      const baseDelay = calculateDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );
      const delay = addJitter(baseDelay);

      // Notify retry
      opts.onRetry(attempt, error);

      console.log(
        `Retry attempt ${attempt}/${opts.maxAttempts} after ${Math.round(delay)}ms`,
        parseError(error).userMessage
      );

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry with custom backoff strategy
 */
export async function withCustomRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: any, attempt: number) => boolean,
  getDelay: (attempt: number) => number,
  maxAttempts = 3
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!shouldRetry(error, attempt) || attempt === maxAttempts) {
        throw error;
      }

      const delay = getDelay(attempt);
      console.log(`Custom retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry with linear backoff (for rate limiting)
 */
export async function withLinearRetry<T>(
  fn: () => Promise<T>,
  delay = 5000,
  maxAttempts = 3
): Promise<T> {
  return withCustomRetry(
    fn,
    (error) => isRetryable(error),
    () => delay,
    maxAttempts
  );
}

/**
 * Retry immediately (for transient errors)
 */
export async function withImmediateRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 2
): Promise<T> {
  return withRetry(fn, {
    maxAttempts,
    initialDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1,
  });
}
