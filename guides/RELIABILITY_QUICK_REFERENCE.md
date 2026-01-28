# Reliability Quick Reference

## Import Statements

```typescript
// Errors
import { parseError, StructuredError, ErrorCode } from '@/lib/reliability/errors';

// Retry
import { withRetry, withLinearRetry, withImmediateRetry } from '@/lib/reliability/retry';

// Circuit Breaker
import { withCircuitBreaker, getCircuitBreakerStats, resetCircuitBreaker } from '@/lib/reliability/circuitBreaker';

// Timeout
import { withTimeout, TIMEOUTS, AdaptiveTimeout } from '@/lib/reliability/timeout';

// Cache
import { withCache, CACHES, caches } from '@/lib/reliability/cache';

// Concurrency
import { 
  withConcurrencyLimit, 
  withRateLimitControl, 
  withQueue,
  CONCURRENCY_LIMITS,
  RATE_LIMITS 
} from '@/lib/reliability/concurrency';

// All-in-one
import { secureMCPManager } from '@/lib/mcp/secureManager';
```

## Common Patterns

### Pattern 1: External API Call

```typescript
const result = await withCircuitBreaker(
  'external-api',
  async () => {
    return withRetry(
      async () => {
        return withTimeout(
          async () => fetch('/api/external'),
          TIMEOUTS.HTTP_REQUEST,
          'API timed out'
        );
      },
      { maxAttempts: 3, initialDelay: 1000 }
    );
  },
  { failureThreshold: 5, timeout: 60000 }
);
```

### Pattern 2: Cached Read Operation

```typescript
const data = await withCache(
  CACHES.PROJECT_DATA,
  `project:${id}`,
  async () => {
    return withTimeout(
      async () => fetchProject(id),
      TIMEOUTS.DB_QUERY,
      'Database query timed out'
    );
  },
  { ttl: 300000 } // 5 minutes
);
```

### Pattern 3: Rate-Limited Operation

```typescript
const result = await withRateLimitControl(
  'brave-search',
  async () => {
    return withRetry(
      async () => callBraveSearch(query),
      { maxAttempts: 2 }
    );
  },
  RATE_LIMITS.MCP_BRAVE_SEARCH.maxTokens,
  RATE_LIMITS.MCP_BRAVE_SEARCH.refillRate
);
```

### Pattern 4: Concurrent Operations with Limit

```typescript
const results = await Promise.all(
  items.map(item =>
    withConcurrencyLimit(
      'process-items',
      async () => processItem(item),
      CONCURRENCY_LIMITS.AI_REQUESTS
    )
  )
);
```

### Pattern 5: Error Handling in API Route

```typescript
export async function POST(request: Request) {
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
}
```

### Pattern 6: MCP Tool Call (All Features)

```typescript
const result = await secureMCPManager.callToolSecure(
  'brave-search',
  'search',
  { query: 'research topic' },
  {
    userId: 'user-123',
    sessionId: 'session-456',
    userConsent: true,
    skipCache: false,
    timeout: 30000
  }
);

// Check result
if (result.isError) {
  console.error(result.content[0].text);
} else {
  console.log('Success!', result.reliability);
}
```

## Configuration Values

### Timeouts (milliseconds)

```typescript
MCP_TOOL_CALL: 30000      // 30 seconds
MCP_SEARCH: 15000         // 15 seconds
AI_CHAT: 60000            // 60 seconds
AI_GENERATION: 120000     // 2 minutes
DB_QUERY: 5000            // 5 seconds
HTTP_REQUEST: 10000       // 10 seconds
```

### Concurrency Limits

```typescript
MCP_TOOL_CALLS: 3         // Max 3 concurrent tool calls
MCP_SEARCHES: 2           // Max 2 concurrent searches
AI_REQUESTS: 5            // Max 5 concurrent AI requests
DB_WRITES: 10             // Max 10 concurrent writes
```

### Rate Limits (tokens per second)

```typescript
MCP_BRAVE_SEARCH: { maxTokens: 10, refillRate: 1 }
MCP_FILESYSTEM: { maxTokens: 20, refillRate: 5 }
AI_OPENAI: { maxTokens: 50, refillRate: 10 }
```

### Cache Names

```typescript
MCP_TOOLS: 'mcp-tools'
MCP_SEARCH: 'mcp-search'
MCP_LIST_FILES: 'mcp-list-files'
PROJECT_DATA: 'project-data'
CHARACTER_DATA: 'character-data'
```

### Circuit Breaker Defaults

```typescript
failureThreshold: 5       // Open after 5 failures
successThreshold: 2       // Close after 2 successes
timeout: 60000            // Try again after 1 minute
monitoringPeriod: 120000  // Count failures in 2 minute window
```

### Retry Defaults

```typescript
maxAttempts: 3
initialDelay: 1000        // 1 second
maxDelay: 30000           // 30 seconds
backoffMultiplier: 2
```

### Cache Defaults

```typescript
ttl: 300000               // 5 minutes
maxSize: 100              // 100 entries
```

## Error Codes

```typescript
// Network
TIMEOUT
NETWORK_ERROR
CONNECTION_REFUSED

// Rate Limiting
RATE_LIMITED
QUOTA_EXCEEDED

// Authentication
UNAUTHORIZED
INVALID_API_KEY

// Server
SERVER_ERROR
SERVICE_UNAVAILABLE
CIRCUIT_OPEN

// MCP
MCP_SERVER_NOT_FOUND
MCP_TOOL_NOT_FOUND
MCP_PERMISSION_DENIED
MCP_CONSENT_REQUIRED

// Validation
INVALID_INPUT
MISSING_PARAMETER

// Unknown
UNKNOWN_ERROR
```

## Monitoring

### Dashboard

Visit: `/mcp-reliability`

### API

```bash
# Get stats
curl http://localhost:3000/api/mcp/reliability

# Reset circuit breaker
curl -X POST http://localhost:3000/api/mcp/reliability \
  -H "Content-Type: application/json" \
  -d '{"action":"reset-circuit-breaker","target":"brave-search"}'

# Clear cache
curl -X POST http://localhost:3000/api/mcp/reliability \
  -H "Content-Type: application/json" \
  -d '{"action":"clear-cache","target":"mcp-search"}'
```

## Testing

```bash
# Run all reliability tests
npm test src/lib/reliability/__tests__

# Run specific test
npm test src/lib/reliability/__tests__/errors.test.ts
npm test src/lib/reliability/__tests__/retry.test.ts
npm test src/lib/reliability/__tests__/circuitBreaker.test.ts
```

## Cheat Sheet

| Feature | Use When | Example |
|---------|----------|---------|
| **Retry** | Transient failures | Network errors, timeouts |
| **Circuit Breaker** | Repeated failures | External service down |
| **Timeout** | Slow operations | Long-running API calls |
| **Cache** | Read-only data | Search results, file lists |
| **Concurrency Limit** | Resource protection | Prevent API storms |
| **Rate Limit** | API quotas | Brave Search, OpenAI |
| **Queue** | Sequential execution | Database writes |

## Decision Tree

```
Is it an external call?
├─ Yes
│  ├─ Can it fail repeatedly?
│  │  ├─ Yes → Use Circuit Breaker
│  │  └─ No → Use Retry
│  ├─ Can it be slow?
│  │  └─ Yes → Add Timeout
│  ├─ Is it read-only?
│  │  └─ Yes → Add Cache
│  └─ Has rate limits?
│     └─ Yes → Add Rate Limiter
└─ No
   ├─ Is it resource-intensive?
   │  └─ Yes → Add Concurrency Limit
   └─ Must be sequential?
      └─ Yes → Use Queue
```
