/**
 * Secure MCP Manager
 * Wraps MCPManager with security and permission checks + reliability features
 */

import { mcpManager } from './manager';
import { PermissionChecker } from './permissions';
import type { MCPToolCallResult } from './types';
import {
  withRetry,
  withCircuitBreaker,
  withTimeout,
  withCache,
  withConcurrencyLimit,
  parseError,
  StructuredError,
  TIMEOUTS,
  CONCURRENCY_LIMITS,
  CACHES,
} from '../reliability';

export type ToolExecutionContext = {
  userId?: string;
  sessionId?: string;
  userConsent?: boolean;
  metadata?: Record<string, any>;
  skipCache?: boolean;
  timeout?: number;
};

export type SecureToolCallResult = MCPToolCallResult & {
  permissionCheck: {
    allowed: boolean;
    reason?: string;
    scope: string;
    consentRequired: boolean;
    consentGiven: boolean;
  };
  reliability?: {
    cached: boolean;
    retries: number;
    duration: number;
  };
};

/**
 * Secure wrapper around MCP Manager with reliability features
 */
export class SecureMCPManager {
  private consentCache: Map<string, boolean> = new Map();

  /**
   * Call a tool with full security checks and reliability features
   */
  async callToolSecure(
    serverName: string,
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext = {}
  ): Promise<SecureToolCallResult> {
    const startTime = Date.now();
    let retries = 0;
    let cached = false;

    try {
      // 1. Permission check
      const permissionCheck = await PermissionChecker.checkPermission(
        serverName,
        toolName,
        args
      );

      if (!permissionCheck.allowed) {
        return {
          content: [
            {
              type: 'text',
              text: `Permission denied: ${permissionCheck.reason}`,
            },
          ],
          isError: true,
          permissionCheck: {
            allowed: false,
            reason: permissionCheck.reason,
            scope: PermissionChecker.getToolScope(toolName),
            consentRequired: permissionCheck.requiresConsent,
            consentGiven: false,
          },
        };
      }

      // 2. Check user consent (if required)
      if (permissionCheck.requiresConsent) {
        const consentKey = `${serverName}:${toolName}`;
        const hasConsent = context.userConsent || this.consentCache.get(consentKey);

        if (!hasConsent) {
          return {
            content: [
              {
                type: 'text',
                text: `User consent required for tool: ${toolName}`,
              },
            ],
            isError: true,
            permissionCheck: {
              allowed: false,
              reason: 'User consent required but not provided',
              scope: PermissionChecker.getToolScope(toolName),
              consentRequired: true,
              consentGiven: false,
            },
          };
        }

        // Cache consent for this session
        this.consentCache.set(consentKey, true);
      }

      // 3. Check if cacheable (read-only operations)
      const scope = PermissionChecker.getToolScope(toolName);
      const isCacheable = scope === 'read' && !context.skipCache;
      const cacheKey = `${serverName}:${toolName}:${JSON.stringify(args)}`;

      // 4. Execute with reliability features
      const executeWithReliability = async () => {
        // Concurrency control
        return withConcurrencyLimit(
          `mcp-${serverName}`,
          async () => {
            // Circuit breaker
            return withCircuitBreaker(
              `mcp-${serverName}`,
              async () => {
                // Timeout
                return withTimeout(
                  async () => {
                    // Retry with backoff
                    return withRetry(
                      async () => {
                        // Redact sensitive data from args before logging
                        const redactedArgs = this.redactArgs(args);
                        console.log(`🔒 Secure tool call: ${serverName}.${toolName}`, {
                          args: redactedArgs,
                          scope,
                          userId: context.userId,
                          sessionId: context.sessionId,
                        });

                        // Execute the tool
                        const result = await mcpManager.callTool(serverName, toolName, args);
                        return result;
                      },
                      {
                        maxAttempts: 3,
                        initialDelay: 1000,
                        onRetry: (attempt, error) => {
                          retries = attempt;
                          console.log(
                            `Retry ${attempt}/3 for ${serverName}.${toolName}:`,
                            parseError(error).userMessage
                          );
                        },
                      }
                    );
                  },
                  context.timeout || TIMEOUTS.MCP_TOOL_CALL,
                  `${serverName}.${toolName} timed out`
                );
              },
              {
                failureThreshold: 5,
                timeout: 60000,
              }
            );
          },
          CONCURRENCY_LIMITS.MCP_TOOL_CALLS
        );
      };

      // 5. Execute with or without cache
      let result: MCPToolCallResult;

      if (isCacheable) {
        result = await withCache(
          CACHES.MCP_TOOLS,
          cacheKey,
          executeWithReliability,
          { ttl: 300000 } // 5 minutes
        );
        cached = true;
      } else {
        result = await executeWithReliability();
      }

      // 6. Redact sensitive data from result
      const redactedResult = this.redactResult(result);

      // 7. Log execution (with redacted data)
      const duration = Date.now() - startTime;
      this.logExecution({
        serverName,
        toolName,
        args: this.redactArgs(args),
        result: redactedResult,
        duration,
        context,
        success: !result.isError,
        cached,
        retries,
      });

      return {
        ...redactedResult,
        permissionCheck: {
          allowed: true,
          scope,
          consentRequired: permissionCheck.requiresConsent,
          consentGiven: true,
        },
        reliability: {
          cached,
          retries,
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const structuredError = parseError(error);

      // Log error (with redacted data)
      this.logExecution({
        serverName,
        toolName,
        args: this.redactArgs(args),
        error: structuredError.userMessage,
        duration,
        context,
        success: false,
        cached,
        retries,
      });

      return {
        content: [
          {
            type: 'text',
            text: structuredError.userMessage,
          },
        ],
        isError: true,
        permissionCheck: {
          allowed: true,
          scope: PermissionChecker.getToolScope(toolName),
          consentRequired: false,
          consentGiven: true,
        },
        reliability: {
          cached,
          retries,
          duration,
        },
      };
    }
  }

  /**
   * Grant consent for a tool (for the current session)
   */
  grantConsent(serverName: string, toolName: string): void {
    const consentKey = `${serverName}:${toolName}`;
    this.consentCache.set(consentKey, true);
    console.log(`✅ Consent granted: ${consentKey}`);
  }

  /**
   * Revoke consent for a tool
   */
  revokeConsent(serverName: string, toolName: string): void {
    const consentKey = `${serverName}:${toolName}`;
    this.consentCache.delete(consentKey);
    console.log(`❌ Consent revoked: ${consentKey}`);
  }

  /**
   * Clear all consent cache
   */
  clearConsentCache(): void {
    this.consentCache.clear();
    console.log('🗑️  Consent cache cleared');
  }

  /**
   * Get all tools with their permission status
   */
  getToolsWithPermissions(): Array<{
    serverName: string;
    toolName: string;
    description: string;
    allowed: boolean;
    scope: string;
    requiresConsent: boolean;
  }> {
    const allTools = mcpManager.getAllTools();

    return allTools.map(({ serverName, tool }) => ({
      serverName,
      toolName: tool.name,
      description: tool.description,
      allowed: PermissionChecker.isToolAllowed(serverName, tool.name),
      scope: PermissionChecker.getToolScope(tool.name),
      requiresConsent: PermissionChecker.requiresUserConsent(serverName, tool.name),
    }));
  }

  /**
   * Redact sensitive data from arguments
   */
  private redactArgs(args: Record<string, any>): Record<string, any> {
    const redacted: Record<string, any> = {};

    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string') {
        redacted[key] = PermissionChecker.redactSensitiveData(value);
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactArgs(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive data from result
   */
  private redactResult(result: MCPToolCallResult): MCPToolCallResult {
    return {
      ...result,
      content: result.content.map((item) => {
        if (item.type === 'text' && item.text) {
          return {
            ...item,
            text: PermissionChecker.redactSensitiveData(item.text),
          };
        }
        return item;
      }),
    };
  }

  /**
   * Log tool execution (with redacted data)
   */
  private logExecution(log: {
    serverName: string;
    toolName: string;
    args: Record<string, any>;
    result?: MCPToolCallResult;
    error?: string;
    duration: number;
    context: ToolExecutionContext;
    success: boolean;
  }): void {
    // In production, send this to a secure logging service
    // For now, just console.log with limited data
    console.log('📊 Tool execution log:', {
      server: log.serverName,
      tool: log.toolName,
      scope: PermissionChecker.getToolScope(log.toolName),
      duration: `${log.duration}ms`,
      success: log.success,
      userId: log.context.userId,
      sessionId: log.context.sessionId,
      // DO NOT log full args or result - they may contain sensitive data
      // Only log metadata
    });

    // TODO: Send to secure logging service (e.g., CloudWatch, Datadog)
    // await sendToLoggingService({
    //   timestamp: new Date().toISOString(),
    //   ...log,
    // });
  }
}

// Singleton instance
export const secureMCPManager = new SecureMCPManager();
