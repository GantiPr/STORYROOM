/**
 * MCP Permissions Tests
 * Test security and permission checks
 */

import { PermissionChecker } from '../permissions';

describe('PermissionChecker', () => {
  describe('Server Allowlist', () => {
    it('should allow enabled servers', () => {
      expect(PermissionChecker.isServerAllowed('memory')).toBe(true);
    });

    it('should deny disabled servers', () => {
      expect(PermissionChecker.isServerAllowed('unknown-server')).toBe(false);
    });
  });

  describe('Tool Allowlist', () => {
    it('should allow whitelisted tools', () => {
      expect(PermissionChecker.isToolAllowed('filesystem', 'read_file')).toBe(true);
    });

    it('should deny blacklisted tools', () => {
      expect(PermissionChecker.isToolAllowed('filesystem', 'write_file')).toBe(false);
    });

    it('should deny tools on disabled servers', () => {
      expect(PermissionChecker.isToolAllowed('unknown-server', 'any_tool')).toBe(false);
    });
  });

  describe('User Consent', () => {
    it('should require consent for write operations', () => {
      expect(PermissionChecker.requiresUserConsent('filesystem', 'write_file')).toBe(true);
    });

    it('should not require consent for safe operations', () => {
      expect(PermissionChecker.requiresUserConsent('memory', 'create_entities')).toBe(false);
    });
  });

  describe('Tool Scope', () => {
    it('should return correct scope for read tools', () => {
      expect(PermissionChecker.getToolScope('read_file')).toBe('read');
    });

    it('should return correct scope for write tools', () => {
      expect(PermissionChecker.getToolScope('write_file')).toBe('write');
    });

    it('should default to read scope', () => {
      expect(PermissionChecker.getToolScope('unknown_tool')).toBe('read');
    });
  });

  describe('Pattern Validation', () => {
    it('should deny operations matching denied patterns', () => {
      const result = PermissionChecker.validateToolArgs('write_file', {
        path: '.env',
      });
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('denied pattern');
    });

    it('should allow operations not matching denied patterns', () => {
      const result = PermissionChecker.validateToolArgs('write_file', {
        path: 'story.txt',
      });
      expect(result.allowed).toBe(true);
    });

    it('should deny .git directory operations', () => {
      const result = PermissionChecker.validateToolArgs('write_file', {
        path: '.git/config',
      });
      expect(result.allowed).toBe(false);
    });

    it('should deny node_modules operations', () => {
      const result = PermissionChecker.validateToolArgs('delete_file', {
        path: 'node_modules/package/index.js',
      });
      expect(result.allowed).toBe(false);
    });

    it('should deny DROP TABLE queries', () => {
      const result = PermissionChecker.validateToolArgs('write_query', {
        query: 'DROP TABLE users',
      });
      expect(result.allowed).toBe(false);
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact API keys', () => {
      const text = 'api_key=sk_test_1234567890abcdefghij';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('sk_test_1234567890abcdefghij');
    });

    it('should redact tokens', () => {
      const text = 'token=ghp_1234567890abcdefghijklmnopqrst';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('ghp_1234567890abcdefghijklmnopqrst');
    });

    it('should redact AWS keys', () => {
      const text = 'AKIAIOSFODNN7EXAMPLE';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('AKIAIOSFODNN7EXAMPLE');
    });

    it('should redact passwords', () => {
      const text = 'password=mySecretPass123';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('mySecretPass123');
    });

    it('should redact database URLs', () => {
      const text = 'postgres://user:pass@localhost:5432/db';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('postgres://user:pass@localhost:5432/db');
    });

    it('should redact JWT tokens', () => {
      const text = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toContain('[REDACTED]');
      expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should not redact normal text', () => {
      const text = 'This is a normal story about characters';
      const redacted = PermissionChecker.redactSensitiveData(text);
      expect(redacted).toBe(text);
    });
  });

  describe('Comprehensive Permission Check', () => {
    it('should allow safe operations', async () => {
      const result = await PermissionChecker.checkPermission(
        'memory',
        'create_entities',
        { entities: [] }
      );
      expect(result.allowed).toBe(true);
      expect(result.requiresConsent).toBe(false);
    });

    it('should deny operations on disabled servers', async () => {
      const result = await PermissionChecker.checkPermission(
        'unknown-server',
        'any_tool',
        {}
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not in the allowlist');
    });

    it('should deny blacklisted tools', async () => {
      const result = await PermissionChecker.checkPermission(
        'filesystem',
        'write_file',
        { path: 'test.txt' }
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not allowed');
    });

    it('should deny operations matching denied patterns', async () => {
      const result = await PermissionChecker.checkPermission(
        'filesystem',
        'read_file',
        { path: '.env' }
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('denied pattern');
    });

    it('should require consent for write operations', async () => {
      const result = await PermissionChecker.checkPermission(
        'github',
        'create_issue',
        { title: 'Test' }
      );
      expect(result.requiresConsent).toBe(true);
    });
  });
});
