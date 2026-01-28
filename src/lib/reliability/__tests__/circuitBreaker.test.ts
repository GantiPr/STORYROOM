import { withCircuitBreaker, getCircuitBreakerStats, resetCircuitBreaker, CircuitState } from '../circuitBreaker';
import { ErrorCode } from '../errors';

describe('Circuit Breaker', () => {
  beforeEach(() => {
    resetCircuitBreaker(); // Reset all breakers before each test
  });

  test('should execute successfully when closed', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await withCircuitBreaker('test', fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should open after threshold failures', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    
    // Fail 5 times (default threshold)
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', fn, { failureThreshold: 5 })).rejects.toThrow();
    }
    
    const stats = getCircuitBreakerStats('test');
    expect(stats.state).toBe(CircuitState.OPEN);
  });

  test('should reject immediately when open', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', fn, { failureThreshold: 5 })).rejects.toThrow();
    }
    
    // Next call should fail immediately without calling fn
    const callCount = fn.mock.calls.length;
    await expect(withCircuitBreaker('test', fn, { failureThreshold: 5 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(callCount); // No additional calls
  });

  test('should transition to half-open after timeout', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    const breakerName = 'test-half-open';
    
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker(breakerName, fn, { 
        failureThreshold: 5,
        timeout: 100 // 100ms timeout
      })).rejects.toThrow();
    }
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Next call should transition to half-open and succeed
    fn.mockResolvedValue('success');
    const result = await withCircuitBreaker(breakerName, fn, { failureThreshold: 5, timeout: 100 });
    
    expect(result).toBe('success');
    const stats = getCircuitBreakerStats(breakerName);
    expect(stats.state).toBe(CircuitState.HALF_OPEN);
  });

  test('should close after success threshold in half-open', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    const breakerName = 'test-close';
    
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker(breakerName, fn, { 
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 100
      })).rejects.toThrow();
    }
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Succeed twice to close
    fn.mockResolvedValue('success');
    await withCircuitBreaker(breakerName, fn, { failureThreshold: 5, successThreshold: 2, timeout: 100 });
    
    // Second success should close the circuit
    await withCircuitBreaker(breakerName, fn, { failureThreshold: 5, successThreshold: 2, timeout: 100 });
    
    const stats = getCircuitBreakerStats(breakerName);
    expect(stats.state).toBe(CircuitState.CLOSED);
  });

  test('should reopen if failure in half-open', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', fn, { 
        failureThreshold: 5,
        timeout: 100
      })).rejects.toThrow();
    }
    
    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Fail in half-open state
    await expect(withCircuitBreaker('test', fn, { failureThreshold: 5, timeout: 100 })).rejects.toThrow();
    
    const stats = getCircuitBreakerStats('test');
    expect(stats.state).toBe(CircuitState.OPEN);
  });

  test('should track failures in monitoring period', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    
    // Fail 3 times
    for (let i = 0; i < 3; i++) {
      await expect(withCircuitBreaker('test', fn, { 
        failureThreshold: 5,
        monitoringPeriod: 1000
      })).rejects.toThrow();
    }
    
    const stats = getCircuitBreakerStats('test');
    expect(stats.failureCount).toBe(3);
    expect(stats.state).toBe(CircuitState.CLOSED); // Not enough to open
  });

  test('should reset circuit breaker', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed'));
    
    // Open the circuit
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test', fn, { failureThreshold: 5 })).rejects.toThrow();
    }
    
    // Reset
    resetCircuitBreaker('test');
    
    const stats = getCircuitBreakerStats('test');
    expect(stats.state).toBe(CircuitState.CLOSED);
    expect(stats.failureCount).toBe(0);
  });

  test('should handle multiple circuit breakers', async () => {
    const fn1 = jest.fn().mockRejectedValue(new Error('Failed'));
    const fn2 = jest.fn().mockResolvedValue('success');
    
    // Open circuit 1
    for (let i = 0; i < 5; i++) {
      await expect(withCircuitBreaker('test1', fn1, { failureThreshold: 5 })).rejects.toThrow();
    }
    
    // Circuit 2 should still work
    await withCircuitBreaker('test2', fn2);
    
    const stats1 = getCircuitBreakerStats('test1');
    const stats2 = getCircuitBreakerStats('test2');
    
    expect(stats1.state).toBe(CircuitState.OPEN);
    expect(stats2.state).toBe(CircuitState.CLOSED);
  });
});
