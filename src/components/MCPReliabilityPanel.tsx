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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-400">Loading reliability stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-400">Failed to load reliability stats</div>
      </div>
    );
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
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            MCP Reliability Monitor
          </h2>
          <p className="text-zinc-400 mt-2">Real-time monitoring of circuit breakers, caches, and concurrency</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              autoRefresh 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </button>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Circuit Breakers */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Circuit Breakers</h3>
          <button
            onClick={() => resetCircuitBreaker()}
            className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-sm font-medium transition-all"
          >
            Reset All
          </button>
        </div>

        {Object.keys(stats.circuitBreakers).length === 0 ? (
          <p className="text-center py-8 text-zinc-400">No circuit breakers active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.circuitBreakers).map(([name, breaker]) => (
              <div key={name} className="border border-zinc-700/50 rounded-lg p-4 bg-zinc-800/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getStateIcon(breaker.state)}</span>
                      <span className="font-semibold text-white">{name}</span>
                      <span className={`text-sm font-medium ${getStateColor(breaker.state)}`}>
                        {breaker.state}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-zinc-400">Failures:</span>{' '}
                        <span className="font-medium text-white">{breaker.failureCount}</span>
                      </div>
                      {breaker.state === 'HALF_OPEN' && (
                        <div>
                          <span className="text-zinc-400">Successes:</span>{' '}
                          <span className="font-medium text-white">{breaker.successCount}</span>
                        </div>
                      )}
                      {breaker.lastFailureTime && (
                        <div>
                          <span className="text-zinc-400">Last Failure:</span>{' '}
                          <span className="font-medium text-white">
                            {new Date(breaker.lastFailureTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {breaker.nextAttemptTime && (
                        <div>
                          <span className="text-zinc-400">Retry At:</span>{' '}
                          <span className="font-medium text-white">
                            {new Date(breaker.nextAttemptTime).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => resetCircuitBreaker(name)}
                    className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 text-xs font-medium transition-all"
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
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Concurrency Control</h3>

        {Object.keys(stats.concurrency).length === 0 ? (
          <p className="text-center py-8 text-zinc-400">No concurrency controls active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.concurrency).map(([name, data]: [string, any]) => (
              <div key={name} className="border border-zinc-700/50 rounded-lg p-3 bg-zinc-800/30">
                <div className="font-semibold text-white mb-2">{name}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {data.available !== undefined && (
                    <div>
                      <span className="text-zinc-400">Available:</span>{' '}
                      <span className="font-medium text-white">{data.available}</span>
                    </div>
                  )}
                  {data.queueLength !== undefined && (
                    <div>
                      <span className="text-zinc-400">Queue:</span>{' '}
                      <span className="font-medium text-white">{data.queueLength}</span>
                    </div>
                  )}
                  {data.tokens !== undefined && (
                    <div>
                      <span className="text-zinc-400">Tokens:</span>{' '}
                      <span className="font-medium text-white">{data.tokens.toFixed(1)}</span>
                    </div>
                  )}
                  {data.length !== undefined && (
                    <div>
                      <span className="text-zinc-400">Queue Length:</span>{' '}
                      <span className="font-medium text-white">{data.length}</span>
                    </div>
                  )}
                  {data.running !== undefined && (
                    <div>
                      <span className="text-zinc-400">Running:</span>{' '}
                      <span className="font-medium text-white">{data.running ? 'Yes' : 'No'}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caches */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-white">Caches</h3>
          <button
            onClick={() => clearCache()}
            className="px-3 py-1 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-sm font-medium transition-all"
          >
            Clear All
          </button>
        </div>

        {Object.keys(stats.caches).length === 0 ? (
          <p className="text-center py-8 text-zinc-400">No caches active</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(stats.caches).map(([name, cache]: [string, any]) => (
              <div key={name} className="border border-zinc-700/50 rounded-lg p-3 bg-zinc-800/30">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-2">{name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-zinc-400">Size:</span>{' '}
                        <span className="font-medium text-white">
                          {cache.size}/{cache.maxSize}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Hits:</span>{' '}
                        <span className="font-medium text-white">{cache.totalAccess}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Hit Rate:</span>{' '}
                        <span className="font-medium text-white">{cache.hitRate.toFixed(2)}</span>
                      </div>
                      {cache.expiredCount > 0 && (
                        <div>
                          <span className="text-zinc-400">Expired:</span>{' '}
                          <span className="font-medium text-yellow-400">
                            {cache.expiredCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => clearCache(name)}
                    className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 text-xs font-medium transition-all"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 text-center">
        Last updated: {new Date(stats.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
