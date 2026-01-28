'use client';

import { useState, useEffect } from 'react';

type CircuitBreakerStats = {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
};

type ReliabilityStats = {
  circuitBreakers: Record<string, CircuitBreakerStats>;
  concurrency: Record<string, any>;
  caches: Record<string, any>;
  timestamp: string;
};

export default function MCPReliabilityPanel() {
  const [stats, setStats] = useState<ReliabilityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/mcp/reliability');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch reliability stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCircuitBreaker = async (name?: string) => {
    try {
      const response = await fetch('/api/mcp/reliability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-circuit-breaker', target: name }),
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to reset circuit breaker:', error);
    }
  };

  const clearCache = async (name?: string) => {
    try {
      const response = await fetch('/api/mcp/reliability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache', target: name }),
      });

      if (response.ok) {
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return <div className="p-4">Loading reliability stats...</div>;
  }

  if (!stats) {
    return <div className="p-4">Failed to load reliability stats</div>;
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return 'text-green-600';
      case 'OPEN':
        return 'text-red-600';
      case 'HALF_OPEN':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return '✅';
      case 'OPEN':
        return '🔴';
      case 'HALF_OPEN':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">MCP Reliability Monitor</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded ${
              autoRefresh ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </button>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Circuit Breakers */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Circuit Breakers</h3>
          <button
            onClick={() => resetCircuitBreaker()}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Reset All
          </button>
        </div>

        {Object.keys(stats.circuitBreakers).length === 0 ? (
          <p className="text-gray-500">No circuit breakers active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.circuitBreakers).map(([name, breaker]) => (
              <div key={name} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStateIcon(breaker.state)}</span>
                      <span className="font-semibold">{name}</span>
                      <span className={`text-sm font-medium ${getStateColor(breaker.state)}`}>
                        {breaker.state}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Failures:</span>{' '}
                        <span className="font-medium">{breaker.failureCount}</span>
                      </div>
                      {breaker.state === 'HALF_OPEN' && (
                        <div>
                          <span className="text-gray-600">Successes:</span>{' '}
                          <span className="font-medium">{breaker.successCount}</span>
                        </div>
                      )}
                      {breaker.lastFailureTime && (
                        <div>
                          <span className="text-gray-600">Last Failure:</span>{' '}
                          <span className="font-medium">
                            {new Date(breaker.lastFailureTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {breaker.nextAttemptTime && (
                        <div>
                          <span className="text-gray-600">Retry At:</span>{' '}
                          <span className="font-medium">
                            {new Date(breaker.nextAttemptTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => resetCircuitBreaker(name)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Concurrency */}
      <div className="border rounded-lg p-4">
        <h3 className="text-xl font-semibold mb-4">Concurrency Control</h3>

        {Object.keys(stats.concurrency).length === 0 ? (
          <p className="text-gray-500">No concurrency controls active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.concurrency).map(([name, data]: [string, any]) => (
              <div key={name} className="border rounded p-3 bg-gray-50">
                <div className="font-semibold mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {data.available !== undefined && (
                    <div>
                      <span className="text-gray-600">Available:</span>{' '}
                      <span className="font-medium">{data.available}</span>
                    </div>
                  )}
                  {data.queueLength !== undefined && (
                    <div>
                      <span className="text-gray-600">Queue:</span>{' '}
                      <span className="font-medium">{data.queueLength}</span>
                    </div>
                  )}
                  {data.tokens !== undefined && (
                    <div>
                      <span className="text-gray-600">Tokens:</span>{' '}
                      <span className="font-medium">{data.tokens.toFixed(1)}</span>
                    </div>
                  )}
                  {data.length !== undefined && (
                    <div>
                      <span className="text-gray-600">Queue Length:</span>{' '}
                      <span className="font-medium">{data.length}</span>
                    </div>
                  )}
                  {data.running !== undefined && (
                    <div>
                      <span className="text-gray-600">Running:</span>{' '}
                      <span className="font-medium">{data.running ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caches */}
      <div className="border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Caches</h3>
          <button
            onClick={() => clearCache()}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
          >
            Clear All
          </button>
        </div>

        {Object.keys(stats.caches).length === 0 ? (
          <p className="text-gray-500">No caches active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.caches).map(([name, cache]: [string, any]) => (
              <div key={name} className="border rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold mb-2">{name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Size:</span>{' '}
                        <span className="font-medium">
                          {cache.size}/{cache.maxSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Hits:</span>{' '}
                        <span className="font-medium">{cache.totalAccess}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Hit Rate:</span>{' '}
                        <span className="font-medium">{cache.hitRate.toFixed(2)}</span>
                      </div>
                      {cache.expiredCount > 0 && (
                        <div>
                          <span className="text-gray-600">Expired:</span>{' '}
                          <span className="font-medium text-yellow-600">
                            {cache.expiredCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => clearCache(name)}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
