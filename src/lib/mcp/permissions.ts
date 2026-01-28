/**
 * MCP Security & Permissions Layer
 * Gates all tool execution with allowlists, scopes, and sandboxing
 */

import type { MCPTool } from './types';

// ============================================================================
// PERMISSION CONFIGURATION
// ============================================================================

export type PermissionScope = 'read' | 'write' | 'execute';

export type ServerPermission = {
  enabled: boolean;
  allowedTools?: string[]; // If undefined, all tools allowed
  deniedTools?: string[]; // Explicit deny list
  defaultScope?: PermissionScope;
  requiresUserConsent?: boolean;
};

export type ToolPermission = {
  scope: PermissionScope;
  requiresUserConsent: boolean;
  sandboxPath?: string; // For filesystem operations
  allowedPatterns?: string[]; // Regex patterns for allowed operations
  deniedPatterns?: string[]; // Regex patterns for denied operations
};

// ============================================================================
// SERVER ALLOWLIST
// ============================================================================

export const SERVER_PERMISSIONS: Record<string, ServerPermission> = {
  // Memory server - safe, read/write allowed
  memory: {
    enabled: true,
    defaultScope: 'write',
    requiresUserConsent: false,
  },

  // AgentQL - Web scraping and automation
  agentql: {
    enabled: true,
    defaultScope: 'execute',
    requiresUserConsent: true, // Requires consent for web automation
  },

  // Bright Data - Web scraping proxy and data collection
  brightdata: {
    enabled: true,
    defaultScope: 'execute',
    requiresUserConsent: true, // Requires consent for web scraping
  },

  // Filesystem - HIGH RISK - read-only by default
  filesystem: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: true,
    allowedTools: [
      'read_file',
      'read_multiple_files',
      'list_directory',
      'search_files',
      'get_file_info',
    ],
    deniedTools: [
      'write_file', // Requires explicit opt-in
      'create_directory',
      'move_file',
      'delete_file',
    ],
  },

  // GitHub - read-only by default
  github: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: true,
    allowedTools: [
      'get_file_contents',
      'search_repositories',
      'list_commits',
      'get_issue',
      'search_code',
      'create_issue', // Allow but requires consent
    ],
    deniedTools: [
      'create_or_update_file',
      'push_files',
      'create_pull_request',
      'fork_repository',
    ],
  },

  // Brave Search - safe, read-only
  brave: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: false,
  },

  // SQLite - HIGH RISK - read-only by default
  sqlite: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: true,
    allowedTools: ['read_query', 'list_tables', 'describe_table'],
    deniedTools: ['write_query', 'execute_query', 'create_table'],
  },

  // Postgres - HIGH RISK - read-only by default
  postgres: {
    enabled: true,
    defaultScope: 'read',
    requiresUserConsent: true,
    allowedTools: ['read_query', 'list_tables', 'describe_table'],
    deniedTools: ['write_query', 'execute_query', 'create_table'],
  },
};

// ============================================================================
// TOOL-SPECIFIC PERMISSIONS
// ============================================================================

export const TOOL_PERMISSIONS: Record<string, ToolPermission> = {
  // Filesystem tools
  read_file: {
    scope: 'read',
    requiresUserConsent: false,
    sandboxPath: process.env.MCP_SANDBOX_PATH || process.cwd(),
    deniedPatterns: [
      '.*\\.env.*', // No reading .env files
    ],
  },
  write_file: {
    scope: 'write',
    requiresUserConsent: true,
    sandboxPath: process.env.MCP_SANDBOX_PATH || process.cwd(),
    deniedPatterns: [
      '.*\\.env.*', // No writing to .env files
      '.*\\.git.*', // No writing to .git
      '.*node_modules.*', // No writing to node_modules
      '.*package\\.json', // No modifying package.json
      '.*tsconfig\\.json', // No modifying tsconfig
    ],
  },
  delete_file: {
    scope: 'write',
    requiresUserConsent: true,
    sandboxPath: process.env.MCP_SANDBOX_PATH || process.cwd(),
    deniedPatterns: [
      '.*\\.env.*',
      '.*\\.git/.*',
      '.*node_modules.*',
      '.*package\\.json',
    ],
  },

  // GitHub tools
  create_or_update_file: {
    scope: 'write',
    requiresUserConsent: true,
  },
  create_issue: {
    scope: 'write',
    requiresUserConsent: true,
  },
  create_pull_request: {
    scope: 'write',
    requiresUserConsent: true,
  },

  // Database tools
  write_query: {
    scope: 'write',
    requiresUserConsent: true,
    deniedPatterns: [
      'DROP\\s+TABLE',
      'DROP\\s+DATABASE',
      'TRUNCATE',
      'DELETE\\s+FROM.*WHERE\\s+1\\s*=\\s*1',
    ],
  },
  execute_query: {
    scope: 'execute',
    requiresUserConsent: true,
  },
};

// ============================================================================
// SENSITIVE DATA PATTERNS (for redaction)
// ============================================================================

export const SENSITIVE_PATTERNS = [
  // API Keys & Tokens
  /api[_-]?key[_-]?=?['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/gi,
  /token[_-]?=?['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/gi,
  /bearer\s+([a-zA-Z0-9_\-\.]{20,})/gi,
  
  // AWS
  /AKIA[0-9A-Z]{16}/g,
  /aws[_-]?secret[_-]?access[_-]?key[_-]?=?['\"]?([a-zA-Z0-9/+=]{40})['\"]?/gi,
  
  // GitHub
  /gh[ps]_[a-zA-Z0-9]{36}/g,
  /github[_-]?token[_-]?=?['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/gi,
  
  // Private keys
  /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  
  // Passwords
  /password[_-]?=?['\"]?([^\s'\"]{8,})['\"]?/gi,
  /passwd[_-]?=?['\"]?([^\s'\"]{8,})['\"]?/gi,
  
  // Database connection strings
  /(?:postgres|mysql|mongodb):\/\/[^\s]+/gi,
  
  // JWT tokens
  /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
];

// ============================================================================
// PERMISSION CHECKER
// ============================================================================

export class PermissionChecker {
  /**
   * Check if a server is allowed to be used
   */
  static isServerAllowed(serverName: string): boolean {
    const permission = SERVER_PERMISSIONS[serverName];
    return permission?.enabled ?? false;
  }

  /**
   * Check if a tool is allowed on a server
   */
  static isToolAllowed(serverName: string, toolName: string): boolean {
    const serverPerm = SERVER_PERMISSIONS[serverName];
    
    if (!serverPerm?.enabled) {
      return false;
    }

    // Check explicit deny list
    if (serverPerm.deniedTools?.includes(toolName)) {
      return false;
    }

    // Check allow list (if defined)
    if (serverPerm.allowedTools && !serverPerm.allowedTools.includes(toolName)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a tool requires user consent
   */
  static requiresUserConsent(serverName: string, toolName: string): boolean {
    const toolPerm = TOOL_PERMISSIONS[toolName];
    if (toolPerm?.requiresUserConsent) {
      return true;
    }

    const serverPerm = SERVER_PERMISSIONS[serverName];
    return serverPerm?.requiresUserConsent ?? false;
  }

  /**
   * Get tool scope
   */
  static getToolScope(toolName: string): PermissionScope {
    return TOOL_PERMISSIONS[toolName]?.scope ?? 'read';
  }

  /**
   * Validate tool arguments against patterns
   */
  static validateToolArgs(
    toolName: string,
    args: Record<string, any>
  ): { allowed: boolean; reason?: string } {
    const toolPerm = TOOL_PERMISSIONS[toolName];
    
    if (!toolPerm) {
      return { allowed: true };
    }

    // Check denied patterns
    if (toolPerm.deniedPatterns) {
      for (const pattern of toolPerm.deniedPatterns) {
        const regex = new RegExp(pattern, 'i');
        const argsStr = JSON.stringify(args);
        
        if (regex.test(argsStr)) {
          return {
            allowed: false,
            reason: `Operation matches denied pattern: ${pattern}`,
          };
        }
      }
    }

    // Check allowed patterns (if defined)
    if (toolPerm.allowedPatterns) {
      const argsStr = JSON.stringify(args);
      const matchesAny = toolPerm.allowedPatterns.some((pattern) => {
        const regex = new RegExp(pattern, 'i');
        return regex.test(argsStr);
      });

      if (!matchesAny) {
        return {
          allowed: false,
          reason: 'Operation does not match any allowed pattern',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Validate filesystem path is within sandbox
   */
  static validateSandboxPath(toolName: string, path: string): boolean {
    const toolPerm = TOOL_PERMISSIONS[toolName];
    
    if (!toolPerm?.sandboxPath) {
      return true; // No sandbox restriction
    }

    const sandboxPath = toolPerm.sandboxPath;
    const resolvedPath = require('path').resolve(path);
    const resolvedSandbox = require('path').resolve(sandboxPath);

    return resolvedPath.startsWith(resolvedSandbox);
  }

  /**
   * Redact sensitive data from logs
   */
  static redactSensitiveData(data: string): string {
    let redacted = data;

    for (const pattern of SENSITIVE_PATTERNS) {
      redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
  }

  /**
   * Comprehensive permission check before tool execution
   */
  static async checkPermission(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<{ allowed: boolean; reason?: string; requiresConsent: boolean }> {
    // 1. Check server allowlist
    if (!this.isServerAllowed(serverName)) {
      return {
        allowed: false,
        reason: `Server "${serverName}" is not in the allowlist`,
        requiresConsent: false,
      };
    }

    // 2. Check tool allowlist
    if (!this.isToolAllowed(serverName, toolName)) {
      return {
        allowed: false,
        reason: `Tool "${toolName}" is not allowed on server "${serverName}"`,
        requiresConsent: false,
      };
    }

    // 3. Validate tool arguments
    const argsValidation = this.validateToolArgs(toolName, args);
    if (!argsValidation.allowed) {
      return {
        allowed: false,
        reason: argsValidation.reason,
        requiresConsent: false,
      };
    }

    // 4. Check sandbox path (for filesystem operations)
    if (args.path && !this.validateSandboxPath(toolName, args.path)) {
      return {
        allowed: false,
        reason: 'Path is outside the allowed sandbox directory',
        requiresConsent: false,
      };
    }

    // 5. Check if user consent is required
    const requiresConsent = this.requiresUserConsent(serverName, toolName);

    return {
      allowed: true,
      requiresConsent,
    };
  }
}
