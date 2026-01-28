# Reliability Guide

Production-ready reliability features for Storyroom's MCP integration.

## Overview

The reliability layer ensures Storyroom handles failures gracefully, prevents cascading failures, and provides a smooth user experience even when external services are unreliable.

## Features

### 1. Structured Errors

Clear, actionable error messages surfaced in the UI.

**Error Types:**
- `TIMEOUT` - Request took too long
- `RATE_LIMITED` - API rate limit exceeded
- `UNAUTHORIZED` - Authentication failed
- `SERVER_ERROR` - Server-side error
- `CIRCUIT_OPEN` - Service temporarily disabled
- `MCP_SERVER_NOT_FOUND` - MCP server not configured
- `MCP_TOOL_NOT_FOUND` - Tool not available
- `MCP_PERMISSION_DENIED` - Permission denied
- `MCP_CONSENT_REQUIRED` - User consent required

**Usage:**
```typescript
import { parseError, getUserMessage, isRetryable } from '@/lib/reliability/errors';

try {
  await someOperation();
} catch (error) {
  const structured = parseError(error);
  console.log(structured.userMessage); // User-friendly message
  console.log(structured.retryable); // Can we retry?
  console.log(structured.retryAfter); // How long to wait?
}
```

### 2. Retry Logic

Automatically retry failed operations with exponential backoff.

**Features:**
- Exponential backoff with jitter
- Configurable max attempts
- Only retries retryable errors
- Callback on each retry

**Usage:**
```typescript
import { withRetry } from '@/lib/reliability/retry';

const result = await withRetry(
  async () => {
    return await fetch('/api/data');
  },
  {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error);
    }
  }
);
```

**Variants:**
```typescript
// Linear backoff (for rate limiting)
await withLinearRetry(fn, 5000, 3); // 5s delay, 3 attempts

// Immediate retry (for transient errors)
await withImmediateRetry(fn, 2); // No delay, 2 attempts
```

### 3. Circuit Breaker

Stop spamming failing servers, fail fast when service is down.

**States:**
- `CLOSED` - Normal operation
- `OPEN` - Failing, reject requests immediately
- `HALF_OPEN` - Testing if service recovered

**Usage:**
```typescript
import { withCircuitBreaker } from '@/lib/reliability/circuitBreaker';

const result = await withCircuitBreaker(
  'brave-search', // Unique name per service
  async () => {
    return await callBraveSearch(query);
  },
  {
    failureThreshold: 5, // Open after 5 failures
    successThreshold: 2, // Close after 2 successes in half-open
    timeout: 60000, // Try again after 1 minute
    monitoringPeriod: 120000 // Count failures in 2 minute window
  }
);
```

**Monitoring:**
```typescript
import { getCircuitBreakerStats, resetCircuitBreaker } from '@/lib/reliability/circuitBreaker';

// Get stats
const stats = getCircuitBreakerStats('brave-search');
console.log(stats.state); // CLOSED, OPEN, or HALF_OPEN
console.log(stats.failureCount);

// Reset manually
resetCircuitBreaker('brave-search');
```

### 4. Timeout Control

Prevent operations from hanging indefinitely.

**Usage:**
```typescript
import { withTimeout, TIMEOUTS } from '@/lib/reliability/timeout';

const result = await withTimeout(
  async () => {
    return await longRunningOperation();
  },
  TIMEOUTS.MCP_TOOL_CALL, // 30 seconds
  'Operation timed out'
);
```

**Predefined Timeouts:**
```typescript
TIMEOUTS.MCP_TOOL_CALL = 30000; // 30 seconds
TIMEOUTS.MCP_SEARCH = 15000; // 15 seconds
TIMEOUTS.AI_CHAT = 60000; // 60 seconds
TIMEOUTS.AI_GENERATION = 120000; // 2 minutes
TIMEOUTS.DB_QUERY = 5000; // 5 seconds
```

**Adaptive Timeout:**
```typescript
import { AdaptiveTimeout } from '@/lib/reliability/timeout';

const adaptiveTimeout = new AdaptiveTimeout(5000, 2); // Base 5s, 2x multiplier

// Timeout adapts based on execution history
const result = await adaptiveTimeout.execute(async () => {
  return await operation();
});
```

### 5. Caching

Cache read-only operations to reduce load and improve performance.

**Features:**
- TTL (time to live)
- LRU eviction
- Automatic cleanup
- Per-cache stats

**Usage:**
```typescript
import { withCache, CACHES } from '@/lib/reliability/cache';

const result = await withCache(
  CACHES.MCP_SEARCH, // Cache name
  `search:${query}`, // Cache key
  async () => {
    return await performSearch(query);
  },
  { ttl: 300000 } // 5 minutes
);
```

**Predefined Caches:**
```typescript
CACHES.MCP_TOOLS = 'mcp-tools';
CACHES.MCP_SEARCH = 'mcp-search';
CACHES.MCP_LIST_FILES = 'mcp-list-files';
CACHES.PROJECT_DATA = 'project-data';
CACHES.CHARACTER_DATA = 'character-data';
```

**Manual Cache Control:**
```typescript
import { caches } from '@/lib/reliability/cache';

const cache = caches.get('my-cache');

// Get
const value = cache.get('key');

// Set
cache.set('key', value, 60000); // 1 minute TTL

// Delete
cache.delete('key');

// Clear
cache.clear();

// Stats
const stats = cache.getStats();
console.log(stats.size, stats.hitRate);
```

### 6. Concurrency Control

Prevent parallel tool storms and manage concurrent operations.

**Semaphore (limit concurrent operations):**
```typescript
import { withConcurrencyLimit, CONCURRENCY_LIMITS } from '@/lib/reliability/concurrency';

const result = await withConcurrencyLimit(
  'mcp-tools',
  async () => {
    return await callTool();
  },
  CONCURRENCY_LIMITS.MCP_TOOL_CALLS // Max 3 concurrent
);
```

**Rate Limiter (token bucket):**
```typescript
import { withRateLimitControl, RATE_LIMITS } from '@/lib/reliability/concurrency';

const result = await withRateLimitControl(
  'brave-search',
  async () => {
    return await search(query);
  },
  RATE_LIMITS.MCP_BRAVE_SEARCH.maxTokens, // 10 tokens
  RATE_LIMITS.MCP_BRAVE_SEARCH.refillRate // 1 per second
);
```

**Queue (sequential execution):**
```typescript
import { withQueue } from '@/lib/reliability/concurrency';

const result = await withQueue(
  'db-writes',
  async () => {
    return await writeToDatabase(data);
  }
);
```

## Integration

### Secure MCP Manager

The `SecureMCPManager` integrates all reliability features:

```typescript
import { secureMCPManager } from '@/lib/mcp/secureManager';

const result = await secureMCPManager.callToolSecure(
  'brave-search',
  'search',
  { query: 'historical research' },
  {
    userId: 'user-123',
    sessionId: 'session-456',
    userConsent: true,
    skipCache: false,
    timeout: 30000
  }
);

// Result includes reliability metadata
console.log(result.reliability.cached); // Was it cached?
console.log(result.reliability.retries); // How many retries?
console.log(result.reliability.duration); // How long did it take?
```

### API Routes

All MCP API routes use structured errors:

```typescript
import { parseError } from '@/lib/reliability/errors';

try {
  const result = await operation();
  return NextResponse.json({ success: true, result });
} catch (error) {
  const structured = parseError(error);
  
  return NextResponse.json(
    {
      success: false,
      error: structured.userMessage,
      code: structured.code,
      retryable: structured.retryable,
      retryAfter: structured.retryAfter,
    },
    { status: 500 }
  );
}
```

## Monitoring

### Reliability Dashboard

Visit `/mcp-reliability` to see:
- Circuit breaker states
- Concurrency stats
- Cache hit rates
- Real-time updates

### API Endpoint

```bash
# Get stats
GET /api/mcp/reliability

# Reset circuit breaker
POST /api/mcp/reliability
{
  "action": "reset-circuit-breaker",
  "target": "brave-search" // or omit for all
}

# Clear cache
POST /api/mcp/reliability
{
  "action": "clear-cache",
  "target": "mcp-search" // or omit for all
}
```

## Best Practices

### 1. Always Use Structured Errors

```typescript
// ❌ Bad
throw new Error('Something went wrong');

// ✅ Good
throw new StructuredError(
  ErrorCode.SERVER_ERROR,
  'Failed to save data. Please try again.',
  'Database connection failed',
  true,
  10
);
```

### 2. Wrap External Calls

```typescript
// ❌ Bad
const result = await fetch('/api/external');

// ✅ Good
const result = await withRetry(
  async () => {
    return withTimeout(
      async () => fetch('/api/external'),
      TIMEOUTS.HTTP_REQUEST,
      'External API timed out'
    );
  },
  { maxAttempts: 3 }
);
```

### 3. Use Circuit Breakers for External Services

```typescript
// ❌ Bad
const result = await callExternalAPI();

// ✅ Good
const result = await withCircuitBreaker(
  'external-api',
  async () => callExternalAPI(),
  { failureThreshold: 5, timeout: 60000 }
);
```

### 4. Cache Read-Only Operations

```typescript
// ❌ Bad
const data = await fetchData(id);

// ✅ Good
const data = await withCache(
  'data-cache',
  `data:${id}`,
  async () => fetchData(id),
  { ttl: 300000 }
);
```

### 5. Limit Concurrent Operations

```typescript
// ❌ Bad
await Promise.all(items.map(item => processItem(item)));

// ✅ Good
await Promise.all(
  items.map(item =>
    withConcurrencyLimit(
      'process-items',
      async () => processItem(item),
      5 // Max 5 concurrent
    )
  )
);
```

## Testing

Run reliability tests:

```bash
npm test src/lib/reliability/__tests__
```

Tests cover:
- Error parsing and classification
- Retry logic with backoff
- Circuit breaker state transitions
- Timeout behavior
- Cache operations
- Concurrency control

## Configuration

### Timeouts

Edit `src/lib/reliability/timeout.ts`:

```typescript
export const TIMEOUTS = {
  MCP_TOOL_CALL: 30000,
  MCP_SEARCH: 15000,
  AI_CHAT: 60000,
  // Add more...
};
```

### Concurrency Limits

Edit `src/lib/reliability/concurrency.ts`:

```typescript
export const CONCURRENCY_LIMITS = {
  MCP_TOOL_CALLS: 3,
  MCP_SEARCHES: 2,
  AI_REQUESTS: 5,
  // Add more...
};
```

### Cache TTLs

Edit `src/lib/reliability/cache.ts`:

```typescript
export const CACHES = {
  MCP_TOOLS: 'mcp-tools', // Default 5 min TTL
  MCP_SEARCH: 'mcp-search',
  // Add more...
};
```

## Troubleshooting

### Circuit Breaker Stuck Open

**Symptom:** All requests fail immediately with "Circuit breaker open"

**Solution:**
1. Check `/mcp-reliability` dashboard
2. Verify external service is working
3. Reset circuit breaker manually
4. Investigate root cause of failures

### High Cache Miss Rate

**Symptom:** Cache hit rate < 50%

**Solution:**
1. Check cache TTL (may be too short)
2. Verify cache keys are consistent
3. Check if cache is being cleared too often
4. Increase cache size if needed

### Timeout Errors

**Symptom:** Frequent timeout errors

**Solution:**
1. Check if timeout is too aggressive
2. Use adaptive timeout for variable operations
3. Investigate slow operations
4. Consider increasing timeout for specific operations

### Rate Limiting

**Symptom:** "Rate limit exceeded" errors

**Solution:**
1. Check API rate limits
2. Adjust rate limiter configuration
3. Add caching to reduce API calls
4. Implement request queuing

## Next Steps

1. Monitor reliability dashboard regularly
2. Adjust timeouts based on real usage
3. Fine-tune circuit breaker thresholds
4. Add custom error types as needed
5. Implement logging/alerting for production
