/**
 * Structured Error Types
 * Clear, actionable errors surfaced in UI
 */

export enum ErrorCode {
  // Network errors
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  CIRCUIT_OPEN = 'CIRCUIT_OPEN',
  
  // MCP specific
  MCP_SERVER_NOT_FOUND = 'MCP_SERVER_NOT_FOUND',
  MCP_TOOL_NOT_FOUND = 'MCP_TOOL_NOT_FOUND',
  MCP_PERMISSION_DENIED = 'MCP_PERMISSION_DENIED',
  MCP_CONSENT_REQUIRED = 'MCP_CONSENT_REQUIRED',
  
  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class StructuredError extends Error {
  code: ErrorCode;
  userMessage: string;
  technicalMessage: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  context?: Record<string, any>;

  constructor(
    code: ErrorCode,
    userMessage: string,
    technicalMessage: string,
    retryable = false,
    retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(userMessage);
    this.name = 'StructuredError';
    this.code = code;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.context = context;
  }

  toJSON() {
    return {
      code: this.code,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      context: this.context,
    };
  }
}

/**
 * Parse error into structured format
 */
export function parseError(error: any): StructuredError {
  // Already structured
  if (error instanceof StructuredError) {
    return error;
  }

  // Network timeout
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return new StructuredError(
      ErrorCode.TIMEOUT,
      'The request took too long. Please try again.',
      error.message || 'Request timeout',
      true,
      5
    );
  }

  // Rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    const retryAfter = error.headers?.['retry-after'] || 60;
    return new StructuredError(
      ErrorCode.RATE_LIMITED,
      `Rate limit exceeded. Please wait ${retryAfter} seconds and try again.`,
      error.message || 'Rate limit exceeded',
      true,
      retryAfter
    );
  }

  // Quota exceeded
  if (error.message?.includes('quota') || error.message?.includes('limit exceeded')) {
    return new StructuredError(
      ErrorCode.QUOTA_EXCEEDED,
      'API quota exceeded. Please check your API key limits.',
      error.message || 'Quota exceeded',
      false
    );
  }

  // Authentication
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return new StructuredError(
      ErrorCode.UNAUTHORIZED,
      'Authentication failed. Please check your API key.',
      error.message || 'Unauthorized',
      false
    );
  }

  // Invalid API key
  if (error.message?.includes('api key') || error.message?.includes('invalid key')) {
    return new StructuredError(
      ErrorCode.INVALID_API_KEY,
      'Invalid API key. Please check your configuration.',
      error.message || 'Invalid API key',
      false
    );
  }

  // Server errors
  if (error.status >= 500 || error.message?.includes('server error')) {
    return new StructuredError(
      ErrorCode.SERVER_ERROR,
      'Server error. Please try again in a moment.',
      error.message || 'Server error',
      true,
      10
    );
  }

  // Service unavailable
  if (error.status === 503 || error.message?.includes('unavailable')) {
    return new StructuredError(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable. Please try again later.',
      error.message || 'Service unavailable',
      true,
      30
    );
  }

  // Circuit breaker
  if (error.message?.includes('circuit') || error.message?.includes('breaker')) {
    return new StructuredError(
      ErrorCode.CIRCUIT_OPEN,
      'Service is temporarily disabled due to repeated failures. Please try again in a few minutes.',
      error.message || 'Circuit breaker open',
      true,
      60
    );
  }

  // MCP specific
  if (error.message?.includes('MCP server not found')) {
    return new StructuredError(
      ErrorCode.MCP_SERVER_NOT_FOUND,
      'MCP server not configured. Please check your setup.',
      error.message,
      false
    );
  }

  if (error.message?.includes('Tool not found')) {
    return new StructuredError(
      ErrorCode.MCP_TOOL_NOT_FOUND,
      'Tool not available. Please check your MCP configuration.',
      error.message,
      false
    );
  }

  if (error.message?.includes('Permission denied')) {
    return new StructuredError(
      ErrorCode.MCP_PERMISSION_DENIED,
      'Permission denied. This tool is not allowed.',
      error.message,
      false
    );
  }

  if (error.message?.includes('consent required')) {
    return new StructuredError(
      ErrorCode.MCP_CONSENT_REQUIRED,
      'User consent required for this operation.',
      error.message,
      false
    );
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return new StructuredError(
      ErrorCode.NETWORK_ERROR,
      'Network error. Please check your connection and try again.',
      error.message || 'Network error',
      true,
      5
    );
  }

  // Unknown error
  return new StructuredError(
    ErrorCode.UNKNOWN_ERROR,
    'An unexpected error occurred. Please try again.',
    error.message || 'Unknown error',
    true,
    5,
    { originalError: error.toString() }
  );
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: any): string {
  const structured = parseError(error);
  return structured.userMessage;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: any): boolean {
  const structured = parseError(error);
  return structured.retryable;
}

/**
 * Get retry delay in milliseconds
 */
export function getRetryDelay(error: any): number {
  const structured = parseError(error);
  return (structured.retryAfter || 5) * 1000;
}
