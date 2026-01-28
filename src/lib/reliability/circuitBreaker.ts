/**
 * Circuit Breaker Pattern
 * Stop spamming failing servers, fail fast when service is down
 */

import { StructuredError, ErrorCode } from './errors';

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

export type CircuitBreakerOptions = {
  failureThreshold?: number; // Number of failures before opening
  successThreshold?: number; // Number of successes to close from half-open
  timeout?: number; // Time in ms before trying again (half-open)
  monitoringPeriod?: number; // Time window for counting failures
};

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  monitoringPeriod: 120000, // 2 minutes
};

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private options: Required<CircuitBreakerOptions>;
  private recentFailures: number[] = [];

  constructor(
    public name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < (this.nextAttemptTime || 0)) {
        throw new StructuredError(
          ErrorCode.CIRCUIT_OPEN,
          `${this.name} is temporarily unavailable due to repeated failures. Please try again in ${Math.ceil(((this.nextAttemptTime || 0) - Date.now()) / 1000)} seconds.`,
          `Circuit breaker open for ${this.name}`,
          true,
          Math.ceil(((this.nextAttemptTime || 0) - Date.now()) / 1000)
        );
      }

      // Transition to half-open
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      console.log(`Circuit breaker ${this.name}: OPEN -> HALF_OPEN`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        this.recentFailures = [];
        console.log(`Circuit breaker ${this.name}: HALF_OPEN -> CLOSED`);
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.recentFailures.push(now);

    // Remove old failures outside monitoring period
    this.recentFailures = this.recentFailures.filter(
      (time) => now - time < this.options.monitoringPeriod
    );

    if (this.state === CircuitState.HALF_OPEN) {
      // Failed during test, go back to open
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.options.timeout;
      console.log(`Circuit breaker ${this.name}: HALF_OPEN -> OPEN`);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we should open
      if (this.recentFailures.length >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTime = now + this.options.timeout;
        console.log(
          `Circuit breaker ${this.name}: CLOSED -> OPEN (${this.recentFailures.length} failures)`
        );
      }
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      state: this.state,
      failureCount: this.recentFailures.length,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.recentFailures = [];
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    console.log(`Circuit breaker ${this.name}: RESET`);
  }
}

/**
 * Circuit breaker registry
 */
class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create circuit breaker
   */
  get(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  /**
   * Get stats for all breakers
   */
  getAllStats() {
    const stats: Record<string, any> = {};
    Array.from(this.breakers.entries()).forEach(([name, breaker]) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    Array.from(this.breakers.values()).forEach(breaker => {
      breaker.reset();
    });
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// Singleton registry
export const circuitBreakers = new CircuitBreakerRegistry();

/**
 * Execute function with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  const breaker = circuitBreakers.get(name, options);
  return breaker.execute(fn);
}

/**
 * Get circuit breaker stats
 */
export function getCircuitBreakerStats(name?: string) {
  if (name) {
    const breaker = circuitBreakers.get(name);
    return breaker.getStats();
  }
  return circuitBreakers.getAllStats();
}

/**
 * Reset circuit breaker
 */
export function resetCircuitBreaker(name?: string): void {
  if (name) {
    circuitBreakers.reset(name);
  } else {
    circuitBreakers.resetAll();
  }
}
