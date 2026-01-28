/**
 * MCP Golden Test Suite
 * Verifies end-to-end MCP functionality with deterministic test cases
 */

import { MCPClient } from '../client';
import { mcpManager } from '../manager';
import type { MCPServerConfig, MCPToolCallResult } from '../types';

// Test timeout (MCP servers can be slow to start)
const TEST_TIMEOUT = 30000;

describe('MCP Infrastructure - Golden Tests', () => {
  describe('Memory Server (Graph-based)', () => {
    let client: MCPClient;
    const config: MCPServerConfig = {
      name: 'Memory Test',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-memory'],
      transport: 'stdio',
      enabled: true,
    };

    beforeAll(async () => {
      client = new MCPClient(config);
      await client.connect();
    }, TEST_TIMEOUT);

    afterAll(async () => {
      await client.disconnect();
    });

    test('should connect and list tools', () => {
      expect(client.isConnected()).toBe(true);
      const tools = client.getTools();
      expect(tools.length).toBeGreaterThan(0);
      
      // Verify expected tools exist (graph-based API)
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('create_entities');
      expect(toolNames).toContain('read_graph');
    });

    test('should create and read entities', async () => {
      const entityName = 'test_character';
      const entityType = 'character';
      const observations = ['brave', 'curious', 'protagonist'];

      // Create entity
      const createResult = await client.callTool('create_entities', {
        entities: [
          {
            name: entityName,
            entityType: entityType,
            observations: observations,
          },
        ],
      });

      expect(createResult).toBeDefined();
      expect(createResult.isError).not.toBe(true);
      expect(createResult.content).toBeDefined();

      // Read graph to verify
      const readResult = await client.callTool('read_graph', {});

      expect(readResult).toBeDefined();
      expect(readResult.content).toBeDefined();
      expect(readResult.content.length).toBeGreaterThan(0);
      
      const content = readResult.content[0];
      expect(content.type).toBe('text');
      expect(content.text).toContain(entityName);
    }, TEST_TIMEOUT);

    test('should handle empty graph gracefully', async () => {
      const result = await client.callTool('search_nodes', {
        query: 'nonexistent_entity_12345',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      // Should return empty results, not crash
    }, TEST_TIMEOUT);

    test('should create relations between entities', async () => {
      // Create two entities
      await client.callTool('create_entities', {
        entities: [
          {
            name: 'Alice',
            entityType: 'character',
            observations: ['protagonist'],
          },
          {
            name: 'Bob',
            entityType: 'character',
            observations: ['antagonist'],
          },
        ],
      });

      // Create relation
      const relationResult = await client.callTool('create_relations', {
        relations: [
          {
            from: 'Alice',
            to: 'Bob',
            relationType: 'opposes',
          },
        ],
      });

      expect(relationResult).toBeDefined();
      expect(relationResult.isError).not.toBe(true);

      // Verify relation exists
      const readResult = await client.callTool('read_graph', {});
      expect(readResult.content[0].text).toContain('Alice');
      expect(readResult.content[0].text).toContain('Bob');
    }, TEST_TIMEOUT);

    test('should handle complex entity data', async () => {
      const complexEntity = {
        name: 'ComplexCharacter',
        entityType: 'character',
        observations: [
          'Has strength: 10',
          'Has intelligence: 15',
          'Trait: brave',
          'Trait: curious',
        ],
      };

      // Create entity
      await client.callTool('create_entities', {
        entities: [complexEntity],
      });

      // Read back
      const result = await client.callTool('read_graph', {});

      expect(result.content[0].text).toContain('ComplexCharacter');
      expect(result.content[0].text).toContain('brave');
      expect(result.content[0].text).toContain('curious');
    }, TEST_TIMEOUT);
  });

  describe('MCP Manager', () => {
    test('should initialize without errors', async () => {
      expect(mcpManager.isInitialized()).toBe(true);
    });

    test('should report server status', () => {
      const status = mcpManager.getStatus();
      expect(Array.isArray(status)).toBe(true);
      
      // If servers are configured, they should be in the status
      status.forEach(server => {
        expect(server).toHaveProperty('name');
        expect(server).toHaveProperty('connected');
        expect(server).toHaveProperty('tools');
        expect(typeof server.connected).toBe('boolean');
        expect(typeof server.tools).toBe('number');
      });
    });

    test('should list all tools from all servers', () => {
      const allTools = mcpManager.getAllTools();
      expect(Array.isArray(allTools)).toBe(true);
      
      allTools.forEach(({ serverName, tool }) => {
        expect(typeof serverName).toBe('string');
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid tool names', async () => {
      const client = mcpManager.getClient('memory');
      if (!client) {
        console.warn('Memory server not configured, skipping test');
        return;
      }

      await expect(
        client.callTool('nonexistent_tool_xyz', {})
      ).rejects.toThrow();
    }, TEST_TIMEOUT);

    test('should handle invalid arguments', async () => {
      const client = mcpManager.getClient('memory');
      if (!client) {
        console.warn('Memory server not configured, skipping test');
        return;
      }

      // Missing required 'key' argument
      await expect(
        client.callTool('store', { value: 'test' })
      ).rejects.toThrow();
    }, TEST_TIMEOUT);

    test('should handle server not found', async () => {
      await expect(
        mcpManager.callTool('nonexistent_server', 'some_tool', {})
      ).rejects.toThrow('MCP server not found');
    });
  });

  describe('Connection Lifecycle', () => {
    test('should connect and disconnect cleanly', async () => {
      const config: MCPServerConfig = {
        name: 'Lifecycle Test',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        transport: 'stdio',
        enabled: true,
      };

      const client = new MCPClient(config);
      
      // Initially not connected
      expect(client.isConnected()).toBe(false);

      // Connect
      await client.connect();
      expect(client.isConnected()).toBe(true);
      expect(client.getTools().length).toBeGreaterThan(0);

      // Disconnect
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    }, TEST_TIMEOUT);

    test('should handle multiple connect calls', async () => {
      const config: MCPServerConfig = {
        name: 'Multi Connect Test',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        transport: 'stdio',
        enabled: true,
      };

      const client = new MCPClient(config);
      
      await client.connect();
      await client.connect(); // Should not error
      
      expect(client.isConnected()).toBe(true);
      
      await client.disconnect();
    }, TEST_TIMEOUT);
  });

  describe('Data Integrity', () => {
    let client: MCPClient;

    beforeAll(async () => {
      const config: MCPServerConfig = {
        name: 'Data Integrity Test',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        transport: 'stdio',
        enabled: true,
      };
      client = new MCPClient(config);
      await client.connect();
    }, TEST_TIMEOUT);

    afterAll(async () => {
      await client.disconnect();
    });

    test('should preserve special characters', async () => {
      const specialChars = 'Test with "quotes", \'apostrophes\', and symbols: @#$%^&*()';
      
      await client.callTool('create_entities', {
        entities: [
          {
            name: 'special_chars_test',
            entityType: 'test',
            observations: [specialChars],
          },
        ],
      });

      const result = await client.callTool('read_graph', {});

      expect(result.content[0].text).toContain('special_chars_test');
      expect(result.content[0].text).toContain('quotes');
    }, TEST_TIMEOUT);

    test('should handle unicode characters', async () => {
      const unicode = 'Unicode test: 你好世界 🎭 émojis 🚀';
      
      await client.callTool('create_entities', {
        entities: [
          {
            name: 'unicode_test',
            entityType: 'test',
            observations: [unicode],
          },
        ],
      });

      const result = await client.callTool('read_graph', {});

      expect(result.content[0].text).toContain('unicode_test');
      expect(result.content[0].text).toContain('🎭');
    }, TEST_TIMEOUT);

    test('should handle large observation lists', async () => {
      const largeObservations = Array.from({ length: 100 }, (_, i) => `Observation ${i}`);
      
      await client.callTool('create_entities', {
        entities: [
          {
            name: 'large_entity',
            entityType: 'test',
            observations: largeObservations,
          },
        ],
      });

      const result = await client.callTool('read_graph', {});

      expect(result.content[0].text).toContain('large_entity');
      expect(result.content[0].text?.length).toBeGreaterThan(1000);
    }, TEST_TIMEOUT);
  });
});

// Note: API endpoint tests require the Next.js server to be running
// Run these tests separately with the server running:
// 1. Start server: npm run dev
// 2. Run: npm run test:mcp:api

describe.skip('API Endpoints (requires server running)', () => {
  // Note: These tests require the Next.js server to be running
  // Run with: npm run test:e2e
  
  const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

  test('GET /api/mcp/status should return server status', async () => {
    const response = await fetch(`${BASE_URL}/api/mcp/status`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('initialized');
    expect(data).toHaveProperty('servers');
    expect(Array.isArray(data.servers)).toBe(true);
  });

  test('GET /api/mcp/tools should list all tools', async () => {
    const response = await fetch(`${BASE_URL}/api/mcp/tools`);
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty('tools');
    expect(data).toHaveProperty('toolsByServer');
    expect(data).toHaveProperty('totalTools');
    expect(Array.isArray(data.tools)).toBe(true);
  });

  test('POST /api/mcp/call should execute tools', async () => {
    const response = await fetch(`${BASE_URL}/api/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverName: 'memory',
        toolName: 'store',
        arguments: {
          key: 'api_test',
          value: 'test from API',
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('result');
    } else {
      // Server might not be configured, that's okay
      console.warn('Memory server not configured for API test');
    }
  });

  test('POST /api/mcp/call should validate required fields', async () => {
    const response = await fetch(`${BASE_URL}/api/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing serverName and toolName
        arguments: {},
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});
