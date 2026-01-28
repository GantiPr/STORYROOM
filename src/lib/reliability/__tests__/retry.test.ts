import { withRetry, withLinearRetry, withImmediateRetry } from '../retry';
import { StructuredError, ErrorCode } from '../errors';

describe('Retry Logic', () => {
  test('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue('success');
    
    const result = await withRetry(fn);
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should retry on retryable error', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(
        new StructuredError(
          ErrorCode.TIMEOUT,
          'Timeout',
          'Timeout',
          true
        )
      )
      .mockResolvedValue('success');
    
    const result = await withRetry(fn, { maxAttempts: 3, initialDelay: 10 });
    
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  test('should not retry on non-retryable error', async () => {
    const fn = jest.fn().mockRejectedValue(
      new StructuredError(
        ErrorCode.UNAUTHORIZED,
        'Unauthorized',
        'Unauthorized',
        false
      )
    );
    
    await expect(withRetry(fn, { maxAttempts: 3 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('should throw after max attempts', async () => {
    const fn = jest.fn().mockRejectedValue(
      new StructuredError(
        ErrorCode.TIMEOUT,
        'Timeout',
        'Timeout',
        true
      )
    );
    
    await expect(withRetry(fn, { maxAttempts: 3, initialDelay: 10 })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  test('should call onRetry callback', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(
        new StructuredError(ErrorCode.TIMEOUT, 'Timeout', 'Timeout', true)
      )
      .mockResolvedValue('success');
    
    const onRetry = jest.fn();
    
    await withRetry(fn, { maxAttempts: 3, initialDelay: 10, onRetry });
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(StructuredError));
  });

  test('should use exponential backoff', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(
        new StructuredError(ErrorCode.TIMEOUT, 'Timeout', 'Timeout', true)
      )
      .mockRejectedValueOnce(
        new StructuredError(ErrorCode.TIMEOUT, 'Timeout', 'Timeout', true)
      )
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withRetry(fn, { 
      maxAttempts: 3, 
      initialDelay: 100,
      backoffMultiplier: 2 
    });
    const duration = Date.now() - start;
    
    // Should wait ~100ms + ~200ms = ~300ms (with jitter)
    expect(duration).toBeGreaterThan(250);
    expect(duration).toBeLessThan(500);
  });
});

describe('Linear Retry', () => {
  test('should retry with fixed delay', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(
        new StructuredError(ErrorCode.TIMEOUT, 'Timeout', 'Timeout', true)
      )
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withLinearRetry(fn, 100, 3);
    const duration = Date.now() - start;
    
    // Should wait ~100ms
    expect(duration).toBeGreaterThan(80);
    expect(duration).toBeLessThan(200);
  });
});

describe('Immediate Retry', () => {
  test('should retry immediately without delay', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(
        new StructuredError(ErrorCode.TIMEOUT, 'Timeout', 'Timeout', true)
      )
      .mockResolvedValue('success');
    
    const start = Date.now();
    await withImmediateRetry(fn, 2);
    const duration = Date.now() - start;
    
    // Should be very fast (< 50ms)
    expect(duration).toBeLessThan(50);
  });
});
