'use client';

import { useState, useEffect } from 'react';

type ToolPermission = {
  serverName: string;
  toolName: string;
  description: string;
  allowed: boolean;
  scope: string;
  requiresConsent: boolean;
};

export default function MCPPermissionsPanel() {
  const [tools, setTools] = useState<ToolPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'allowed' | 'denied' | 'consent'>('all');

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mcp/permissions');
      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantConsent = async (serverName: string, toolName: string) => {
    try {
      await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant',
          serverName,
          toolName,
        }),
      });
      alert(`Consent granted for ${serverName}.${toolName}`);
    } catch (error) {
      console.error('Failed to grant consent:', error);
      alert('Failed to grant consent');
    }
  };

  const revokeConsent = async (serverName: string, toolName: string) => {
    try {
      await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revoke',
          serverName,
          toolName,
        }),
      });
      alert(`Consent revoked for ${serverName}.${toolName}`);
    } catch (error) {
      console.error('Failed to revoke consent:', error);
      alert('Failed to revoke consent');
    }
  };

  const clearAllConsent = async () => {
    if (!confirm('Clear all consent? You will need to re-approve tools.')) {
      return;
    }

    try {
      await fetch('/api/mcp/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      alert('All consent cleared');
    } catch (error) {
      console.error('Failed to clear consent:', error);
      alert('Failed to clear consent');
    }
  };

  const filteredTools = tools.filter((tool) => {
    if (filter === 'allowed') return tool.allowed;
    if (filter === 'denied') return !tool.allowed;
    if (filter === 'consent') return tool.requiresConsent;
    return true;
  });

  const groupedTools = filteredTools.reduce((acc, tool) => {
    if (!acc[tool.serverName]) {
      acc[tool.serverName] = [];
    }
    acc[tool.serverName].push(tool);
    return acc;
  }, {} as Record<string, ToolPermission[]>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading permissions...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">MCP Security & Permissions</h1>
        <p className="text-gray-600">
          Manage tool access, scopes, and user consent for MCP servers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{tools.length}</div>
          <div className="text-sm text-gray-600">Total Tools</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {tools.filter((t) => t.allowed).length}
          </div>
          <div className="text-sm text-gray-600">Allowed</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {tools.filter((t) => !t.allowed).length}
          </div>
          <div className="text-sm text-gray-600">Denied</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {tools.filter((t) => t.requiresConsent).length}
          </div>
          <div className="text-sm text-gray-600">Requires Consent</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All Tools
        </button>
        <button
          onClick={() => setFilter('allowed')}
          className={`px-4 py-2 rounded ${
            filter === 'allowed' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          Allowed
        </button>
        <button
          onClick={() => setFilter('denied')}
          className={`px-4 py-2 rounded ${
            filter === 'denied' ? 'bg-red-600 text-white' : 'bg-gray-200'
          }`}
        >
          Denied
        </button>
        <button
          onClick={() => setFilter('consent')}
          className={`px-4 py-2 rounded ${
            filter === 'consent' ? 'bg-yellow-600 text-white' : 'bg-gray-200'
          }`}
        >
          Requires Consent
        </button>
        <button
          onClick={clearAllConsent}
          className="ml-auto px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Clear All Consent
        </button>
      </div>

      {/* Tools by Server */}
      <div className="space-y-6">
        {Object.entries(groupedTools).map(([serverName, serverTools]) => (
          <div key={serverName} className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">{serverName}</h2>
            <div className="space-y-2">
              {serverTools.map((tool) => (
                <div
                  key={`${tool.serverName}-${tool.toolName}`}
                  className="flex items-start gap-4 p-3 bg-gray-50 rounded"
                >
                  <div className="flex-1">
                    <div className="font-mono font-semibold">{tool.toolName}</div>
                    <div className="text-sm text-gray-600">{tool.description}</div>
                    <div className="flex gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          tool.allowed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tool.allowed ? '✓ Allowed' : '✗ Denied'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        {tool.scope}
                      </span>
                      {tool.requiresConsent && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                          ⚠ Requires Consent
                        </span>
                      )}
                    </div>
                  </div>
                  {tool.requiresConsent && tool.allowed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => grantConsent(tool.serverName, tool.toolName)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Grant
                      </button>
                      <button
                        onClick={() => revokeConsent(tool.serverName, tool.toolName)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
