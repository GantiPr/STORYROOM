import { parseError, ErrorCode, StructuredError, getUserMessage, isRetryable, getRetryDelay } from '../errors';

describe('Error Parsing', () => {
  test('should parse timeout error', () => {
    const error = new Error('Request timeout');
    error.name = 'TimeoutError';
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.TIMEOUT);
    expect(structured.retryable).toBe(true);
    expect(structured.retryAfter).toBe(5);
  });

  test('should parse rate limit error', () => {
    const error: any = new Error('Rate limit exceeded');
    error.status = 429;
    error.headers = { 'retry-after': '60' };
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.RATE_LIMITED);
    expect(structured.retryable).toBe(true);
    expect(structured.retryAfter).toBe('60'); // String from header
  });

  test('should parse authentication error', () => {
    const error: any = new Error('Unauthorized');
    error.status = 401;
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(structured.retryable).toBe(false);
  });

  test('should parse server error', () => {
    const error: any = new Error('Internal server error');
    error.status = 500;
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.SERVER_ERROR);
    expect(structured.retryable).toBe(true);
  });

  test('should parse circuit breaker error', () => {
    const error = new Error('Circuit breaker open');
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.CIRCUIT_OPEN);
    expect(structured.retryable).toBe(true);
    expect(structured.retryAfter).toBe(60);
  });

  test('should parse MCP specific errors', () => {
    const error1 = new Error('MCP server not found');
    expect(parseError(error1).code).toBe(ErrorCode.MCP_SERVER_NOT_FOUND);

    const error2 = new Error('Tool not found');
    expect(parseError(error2).code).toBe(ErrorCode.MCP_TOOL_NOT_FOUND);

    const error3 = new Error('Permission denied');
    expect(parseError(error3).code).toBe(ErrorCode.MCP_PERMISSION_DENIED);

    const error4 = new Error('User consent required');
    expect(parseError(error4).code).toBe(ErrorCode.MCP_CONSENT_REQUIRED);
  });

  test('should parse unknown error', () => {
    const error = new Error('Something went wrong');
    
    const structured = parseError(error);
    
    expect(structured.code).toBe(ErrorCode.UNKNOWN_ERROR);
    expect(structured.retryable).toBe(true);
  });

  test('should return already structured error', () => {
    const original = new StructuredError(
      ErrorCode.TIMEOUT,
      'User message',
      'Technical message',
      true,
      10
    );
    
    const parsed = parseError(original);
    
    expect(parsed).toBe(original);
  });
});

describe('Error Utilities', () => {
  test('getUserMessage should return user-friendly message', () => {
    const error = new Error('Request timeout');
    error.name = 'TimeoutError';
    
    const message = getUserMessage(error);
    
    expect(message).toBe('The request took too long. Please try again.');
  });

  test('isRetryable should check if error is retryable', () => {
    const retryableError = new Error('Request timeout');
    retryableError.name = 'TimeoutError';
    
    const nonRetryableError: any = new Error('Unauthorized');
    nonRetryableError.status = 401;
    
    expect(isRetryable(retryableError)).toBe(true);
    expect(isRetryable(nonRetryableError)).toBe(false);
  });

  test('getRetryDelay should return delay in milliseconds', () => {
    const error: any = new Error('Rate limit exceeded');
    error.status = 429;
    error.headers = { 'retry-after': '30' };
    
    const delay = getRetryDelay(error);
    
    expect(delay).toBe(30000); // 30 seconds in ms
  });
});

describe('StructuredError', () => {
  test('should create structured error', () => {
    const error = new StructuredError(
      ErrorCode.TIMEOUT,
      'User message',
      'Technical message',
      true,
      10,
      { foo: 'bar' }
    );
    
    expect(error.code).toBe(ErrorCode.TIMEOUT);
    expect(error.userMessage).toBe('User message');
    expect(error.technicalMessage).toBe('Technical message');
    expect(error.retryable).toBe(true);
    expect(error.retryAfter).toBe(10);
    expect(error.context).toEqual({ foo: 'bar' });
  });

  test('should serialize to JSON', () => {
    const error = new StructuredError(
      ErrorCode.TIMEOUT,
      'User message',
      'Technical message',
      true,
      10
    );
    
    const json = error.toJSON();
    
    expect(json).toEqual({
      code: ErrorCode.TIMEOUT,
      userMessage: 'User message',
      technicalMessage: 'Technical message',
      retryable: true,
      retryAfter: 10,
      context: undefined,
    });
  });
});
