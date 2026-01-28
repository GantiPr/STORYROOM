"use client";

import { useMCP } from '@/hooks/useMCP';
import { useState } from 'react';

type TestResult = {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
};

export default function MCPTestPage() {
  const { status, tools, callTool, callToolWithConsent, loading, error, refresh } = useMCP();
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedTool, setSelectedTool] = useState('');
  const [toolArgs, setToolArgs] = useState('{}');
  const [result, setResult] = useState<any>(null);
  const [calling, setCalling] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [runningTests, setRunningTests] = useState(false);

  // Golden test suite
  const runGoldenTests = async () => {
    setRunningTests(true);
    const tests: TestResult[] = [
      { name: 'Server Connection', status: 'pending' },
      { name: 'List Tools', status: 'pending' },
      { name: 'Create Entity', status: 'pending' },
      { name: 'Read Graph', status: 'pending' },
      { name: 'Delete Entity', status: 'pending' },
    ];
    setTestResults([...tests]);

    const updateTest = (index: number, updates: Partial<TestResult>) => {
      setTestResults(prev => {
        const newResults = [...prev];
        newResults[index] = { ...newResults[index], ...updates };
        return newResults;
      });
    };

    try {
      // Test 1: Server Connection
      updateTest(0, { status: 'running' });
      const start1 = Date.now();
      await refresh();
      const hasConnectedServers = status?.servers.some(s => s.connected);
      updateTest(0, {
        status: hasConnectedServers ? 'passed' : 'failed',
        message: hasConnectedServers 
          ? `${status?.servers.filter(s => s.connected).length} server(s) connected`
          : 'No servers connected',
        duration: Date.now() - start1,
      });

      if (!hasConnectedServers) {
        throw new Error('No servers connected - cannot continue tests');
      }

      // Find memory server
      const memoryServer = status?.servers.find(s => s.name.toLowerCase().includes('memory'));
      if (!memoryServer) {
        throw new Error('Memory server not found - please enable it in config');
      }

      // Test 2: List Tools
      updateTest(1, { status: 'running' });
      const start2 = Date.now();
      const memoryTools = tools.filter(t => t.serverName === memoryServer.name);
      const hasRequiredTools = memoryTools.some(t => t.toolName === 'create_entities') &&
                               memoryTools.some(t => t.toolName === 'read_graph');
      updateTest(1, {
        status: hasRequiredTools ? 'passed' : 'failed',
        message: hasRequiredTools
          ? `Found ${memoryTools.length} tools (create_entities, read_graph, etc.)`
          : 'Missing required tools',
        duration: Date.now() - start2,
      });

      // Test 3: Create Entity
      updateTest(2, { status: 'running' });
      const start3 = Date.now();
      const testEntityName = `test_${Date.now()}`;
      
      const createResult = await callToolWithConsent(memoryServer.name, 'create_entities', {
        entities: [
          {
            name: testEntityName,
            entityType: 'character',
            observations: ['Golden test data', 'Once upon a time...'],
          },
        ],
      });
      
      const createSuccess = createResult && createResult.content && createResult.content.length > 0;
      
      updateTest(2, {
        status: createSuccess ? 'passed' : 'failed',
        message: createSuccess
          ? `Created entity: ${testEntityName}`
          : 'Create operation failed',
        duration: Date.now() - start3,
      });

      // Test 4: Read Graph
      updateTest(3, { status: 'running' });
      const start4 = Date.now();
      const readResult = await callTool(memoryServer.name, 'read_graph', {});
      
      const graphData = readResult?.content?.[0]?.text || '';
      const containsEntity = graphData.includes(testEntityName);
      
      updateTest(3, {
        status: containsEntity ? 'passed' : 'failed',
        message: containsEntity
          ? 'Graph contains created entity'
          : `Graph data: "${graphData.substring(0, 50)}..."`,
        duration: Date.now() - start4,
      });

      // Test 5: Delete Entity
      updateTest(4, { status: 'running' });
      const start5 = Date.now();
      const deleteResult = await callToolWithConsent(memoryServer.name, 'delete_entities', {
        entityNames: [testEntityName],
      });
      
      const deleteSuccess = deleteResult && deleteResult.content && deleteResult.content.length > 0;
      
      updateTest(4, {
        status: deleteSuccess ? 'passed' : 'failed',
        message: deleteSuccess
          ? 'Entity deleted successfully'
          : 'Delete operation failed',
        duration: Date.now() - start5,
      });

    } catch (err: any) {
      console.error('Test suite error:', err);
      // Mark remaining tests as failed
      setTestResults(prev => prev.map(t => 
        t.status === 'pending' || t.status === 'running'
          ? { ...t, status: 'failed', message: err.message }
          : t
      ));
    } finally {
      setRunningTests(false);
    }
  };

  const handleCallTool = async () => {
    if (!selectedServer || !selectedTool) {
      alert('Please select a server and tool');
      return;
    }

    setCalling(true);
    setResult(null);

    try {
      const args = JSON.parse(toolArgs);
      // Use callToolWithConsent to automatically handle consent prompts
      const toolResult = await callToolWithConsent(selectedServer, selectedTool, args);
      setResult(toolResult);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setCalling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading MCP status...</div>
      </div>
    );
  }

  const toolsByServer = tools.reduce((acc, tool) => {
    if (!acc[tool.serverName]) acc[tool.serverName] = [];
    acc[tool.serverName].push({
      name: tool.toolName,
      description: tool.description,
    });
    return acc;
  }, {} as Record<string, any[]>);

  const selectedToolDetails = tools.find(
    t => t.serverName === selectedServer && t.toolName === selectedTool
  );

  const allTestsPassed = testResults.length > 0 && testResults.every(t => t.status === 'passed');
  const anyTestsFailed = testResults.some(t => t.status === 'failed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent mb-2">
            MCP Test Console
          </h1>
          <p className="text-zinc-400">Verify end-to-end MCP functionality</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-600/50 rounded-lg text-red-400">
            Error: {error}
          </div>
        )}

        {/* Golden Test Suite */}
        <div className="mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Golden Test Suite</h2>
              <p className="text-sm text-zinc-400 mt-1">Verify deterministic behavior with known-good baseline</p>
            </div>
            <button
              onClick={runGoldenTests}
              disabled={runningTests || status?.servers.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
            >
              {runningTests ? '⏳ Running Tests...' : '🧪 Run Golden Tests'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-2">
              {testResults.map((test, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    test.status === 'passed'
                      ? 'bg-green-900/20 border-green-600/50'
                      : test.status === 'failed'
                      ? 'bg-red-900/20 border-red-600/50'
                      : test.status === 'running'
                      ? 'bg-blue-900/20 border-blue-600/50'
                      : 'bg-zinc-800/30 border-zinc-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {test.status === 'passed' && '✅'}
                        {test.status === 'failed' && '❌'}
                        {test.status === 'running' && '⏳'}
                        {test.status === 'pending' && '⏸️'}
                      </span>
                      <div>
                        <h3 className="font-semibold text-white">{test.name}</h3>
                        {test.message && (
                          <p className="text-sm text-zinc-400 mt-1">{test.message}</p>
                        )}
                      </div>
                    </div>
                    {test.duration && (
                      <span className="text-xs text-zinc-500">{test.duration}ms</span>
                    )}
                  </div>
                </div>
              ))}

              {/* Summary */}
              {!runningTests && testResults.length > 0 && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  allTestsPassed
                    ? 'bg-green-900/20 border-green-600/50'
                    : anyTestsFailed
                    ? 'bg-red-900/20 border-red-600/50'
                    : 'bg-zinc-800/30 border-zinc-700/50'
                }`}>
                  <p className="font-semibold text-white">
                    {allTestsPassed && '🎉 All tests passed! MCP infrastructure is working correctly.'}
                    {anyTestsFailed && '⚠️ Some tests failed. Check configuration and server status.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {testResults.length === 0 && (
            <div className="text-center py-8 text-zinc-400">
              <p>No tests run yet</p>
              <p className="text-sm mt-2">Click "Run Golden Tests" to verify your MCP setup</p>
            </div>
          )}
        </div>

        {/* Server Status */}
        <div className="mb-6 bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Server Status</h2>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
            >
              🔄 Refresh
            </button>
          </div>

          {status?.servers.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              <p className="mb-2">No MCP servers configured</p>
              <p className="text-sm">Edit <code className="bg-zinc-800 px-2 py-1 rounded">src/lib/mcp/config.ts</code> to add servers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {status?.servers.map((server) => (
                <div
                  key={server.name}
                  className={`p-4 rounded-lg border ${
                    server.connected
                      ? 'bg-green-900/20 border-green-600/50'
                      : 'bg-red-900/20 border-red-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{server.name}</h3>
                    <span className="text-2xl">{server.connected ? '✅' : '❌'}</span>
                  </div>
                  <p className="text-sm text-zinc-400">
                    {server.tools} tool{server.tools !== 1 ? 's' : ''} available
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manual Tool Testing - Only show if tools exist */}
        {tools.length > 0 && (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Manual Tool Testing</h2>
            <p className="text-sm text-zinc-400 mb-6">Test individual tools with custom arguments</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Tool Selection */}
              <div>
                <div className="space-y-4">
                  {/* Server Selection */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Select Server
                    </label>
                    <select
                      value={selectedServer}
                      onChange={(e) => {
                        setSelectedServer(e.target.value);
                        setSelectedTool('');
                      }}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a server...</option>
                      {Object.keys(toolsByServer).map((serverName) => (
                        <option key={serverName} value={serverName}>
                          {serverName} ({toolsByServer[serverName].length} tools)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tool Selection */}
                  {selectedServer && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Select Tool
                      </label>
                      <select
                        value={selectedTool}
                        onChange={(e) => setSelectedTool(e.target.value)}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Choose a tool...</option>
                        {toolsByServer[selectedServer]?.map((tool) => (
                          <option key={tool.name} value={tool.name}>
                            {tool.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Tool Details */}
                  {selectedToolDetails && (
                    <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <h3 className="font-semibold text-white mb-2">{selectedToolDetails.toolName}</h3>
                      <p className="text-sm text-zinc-400 mb-3">{selectedToolDetails.description}</p>
                      <div className="flex gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          selectedToolDetails.allowed 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {selectedToolDetails.allowed ? '✓ Allowed' : '✗ Blocked'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                          {selectedToolDetails.scope}
                        </span>
                        {selectedToolDetails.requiresConsent && (
                          <span className="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded">
                            Requires Consent
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Arguments */}
                  {selectedTool && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Arguments (JSON)
                      </label>
                      <textarea
                        value={toolArgs}
                        onChange={(e) => setToolArgs(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  )}

                  {/* Call Button */}
                  <button
                    onClick={handleCallTool}
                    disabled={!selectedServer || !selectedTool || calling}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                  >
                    {calling ? 'Calling...' : '🚀 Call Tool'}
                  </button>
                </div>
              </div>

              {/* Right: Result */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Result</h3>

                {result ? (
                  <div className="space-y-4">
                    {result.error ? (
                      <div className="p-4 bg-red-900/20 border border-red-600/50 rounded-lg text-red-400">
                        <p className="font-semibold mb-2">Error</p>
                        <p className="text-sm">{result.error}</p>
                      </div>
                    ) : (
                      <>
                        {result.content?.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded">
                                {item.type}
                              </span>
                            </div>
                            {item.text && (
                              <pre className="text-sm text-zinc-200 whitespace-pre-wrap overflow-x-auto">
                                {item.text}
                              </pre>
                            )}
                            {item.data && (
                              <pre className="text-xs text-zinc-400 mt-2 overflow-x-auto">
                                {item.data}
                              </pre>
                            )}
                          </div>
                        ))}

                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                            View Raw Response
                          </summary>
                          <pre className="mt-2 p-4 bg-zinc-900 rounded overflow-x-auto text-zinc-300">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </details>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400">
                    <p>No result yet</p>
                    <p className="text-sm mt-2">Call a tool to see the result here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
