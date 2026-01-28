'use client';

import { useState, useEffect } from 'react';
import { useMCP } from '@/hooks/useMCP';

type SearchResult = {
  id: string;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  selected: boolean;
};

type SavedSource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  savedAt: string;
  tags: string[];
  notes?: string;
};

export default function MCPResearchPanel({
  onSourcesSaved,
  projectId
}: {
  onSourcesSaved?: (sources: SavedSource[]) => void;
  projectId?: string;
}) {
  const { callToolWithConsent, tools, loading: mcpLoading } = useMCP();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedSources, setSavedSources] = useState<SavedSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');
  const [selectedSource, setSelectedSource] = useState<SavedSource | null>(null);

  // Load saved sources from localStorage
  useEffect(() => {
    const key = projectId ? `mcp-sources-${projectId}` : 'mcp-sources-global';
    const saved = localStorage.getItem(key);
    if (saved) {
      setSavedSources(JSON.parse(saved));
    }
  }, [projectId]);

  // Save sources to localStorage
  const persistSources = (sources: SavedSource[]) => {
    const key = projectId ? `mcp-sources-${projectId}` : 'mcp-sources-global';
    localStorage.setItem(key, JSON.stringify(sources));
    setSavedSources(sources);
    onSourcesSaved?.(sources);
  };

  const handleSearch = async () => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      // Use Brave Search MCP tool
      const result = await callToolWithConsent(
        'brave',
        'brave_web_search',
        {
          query: query.trim(),
          count: 10
        }
      );

      // Parse results
      const searchResults = result.content
        .filter((item: any) => item.type === 'text')
        .map((item: any, idx: number) => {
          try {
            const data = JSON.parse(item.text);
            return data.results?.map((r: any, ridx: number) => ({
              id: `result-${idx}-${ridx}`,
              title: r.title || 'Untitled',
              url: r.url || '',
              snippet: r.description || '',
              domain: new URL(r.url).hostname,
              selected: false
            })) || [];
          } catch {
            return [];
          }
        })
        .flat();

      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Make sure Brave Search MCP server is configured.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleResultSelection = (id: string) => {
    setResults(prev =>
      prev.map(r => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const saveSelectedSources = () => {
    const selected = results.filter(r => r.selected);
    if (selected.length === 0) {
      alert('Please select at least one source to save.');
      return;
    }

    const newSources: SavedSource[] = selected.map(r => ({
      id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: r.title,
      url: r.url,
      domain: r.domain,
      snippet: r.snippet,
      savedAt: new Date().toISOString(),
      tags: [],
      notes: ''
    }));

    persistSources([...savedSources, ...newSources]);
    setResults(prev => prev.map(r => ({ ...r, selected: false })));
    setActiveTab('saved');
    alert(`Saved ${newSources.length} source(s) to your knowledge base!`);
  };

  const deleteSource = (id: string) => {
    if (confirm('Delete this source?')) {
      persistSources(savedSources.filter(s => s.id !== id));
      if (selectedSource?.id === id) {
        setSelectedSource(null);
      }
    }
  };

  const updateSourceNotes = (id: string, notes: string) => {
    persistSources(
      savedSources.map(s => (s.id === id ? { ...s, notes } : s))
    );
    if (selectedSource?.id === id) {
      setSelectedSource({ ...selectedSource, notes });
    }
  };

  const addTagToSource = (id: string, tag: string) => {
    if (!tag.trim()) return;
    persistSources(
      savedSources.map(s =>
        s.id === id && !s.tags.includes(tag.trim())
          ? { ...s, tags: [...s.tags, tag.trim()] }
          : s
      )
    );
  };

  const removeTagFromSource = (id: string, tag: string) => {
    persistSources(
      savedSources.map(s =>
        s.id === id ? { ...s, tags: s.tags.filter(t => t !== tag) } : s
      )
    );
  };

  const selectedCount = results.filter(r => r.selected).length;
  const braveSearchAvailable = tools.some(
    t => t.serverName === 'brave' && t.toolName === 'brave_web_search' && t.allowed
  );

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🔍</span>
              <span>MCP Research</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Powered by Brave Search • Save sources • Cite in your writing
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              braveSearchAvailable
                ? 'bg-green-600/20 text-green-400 border border-green-600/50'
                : 'bg-red-600/20 text-red-400 border border-red-600/50'
            }`}>
              {braveSearchAvailable ? '✓ MCP Connected' : '✗ MCP Not Available'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            🔍 Search
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'saved'
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            📚 Saved Sources ({savedSources.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'search' ? (
          <div>
            {/* Search Input */}
            <div className="mb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search for historical facts, scientific concepts, cultural details..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!braveSearchAvailable || isSearching}
                />
                <button
                  onClick={handleSearch}
                  disabled={!braveSearchAvailable || isSearching || !query.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
              {!braveSearchAvailable && (
                <p className="text-sm text-red-400 mt-2">
                  ⚠️ Brave Search MCP server not configured. See MCP_SECURITY_QUICKSTART.md
                </p>
              )}
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Results ({results.length})
                  </h3>
                  {selectedCount > 0 && (
                    <button
                      onClick={saveSelectedSources}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
                    >
                      <span>💾</span>
                      <span>Save {selectedCount} Selected</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {results.map((result) => (
                    <div
                      key={result.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        result.selected
                          ? 'bg-blue-900/30 border-blue-600/50'
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                      onClick={() => toggleResultSelection(result.id)}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={result.selected}
                          onChange={() => toggleResultSelection(result.id)}
                          className="mt-1 w-5 h-5 rounded border-zinc-600 bg-zinc-700 checked:bg-blue-600"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            {result.title}
                          </h4>
                          <p className="text-sm text-zinc-400 mb-2">
                            {result.snippet}
                          </p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {result.domain} →
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.length === 0 && !isSearching && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-3xl">🔍</span>
                </div>
                <p className="text-zinc-400">
                  Search for information to add to your knowledge base
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Saved Sources */}
            {savedSources.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
                <p className="text-zinc-400 mb-4">No saved sources yet</p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                >
                  Start Searching
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sources List */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                  {savedSources.map((source) => (
                    <div
                      key={source.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSource?.id === source.id
                          ? 'bg-emerald-900/30 border-emerald-600/50'
                          : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                      onClick={() => setSelectedSource(source)}
                    >
                      <h4 className="font-semibold text-white mb-1 line-clamp-2">
                        {source.title}
                      </h4>
                      <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
                        {source.snippet}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>{source.domain}</span>
                        <span>•</span>
                        <span>{new Date(source.savedAt).toLocaleDateString()}</span>
                      </div>
                      {source.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {source.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Source Detail */}
                {selectedSource && (
                  <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        Source Details
                      </h3>
                      <button
                        onClick={() => deleteSource(selectedSource.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-white mb-1">
                          {selectedSource.title}
                        </h4>
                        <a
                          href={selectedSource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {selectedSource.domain} →
                        </a>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Snippet
                        </label>
                        <p className="text-sm text-zinc-400">
                          {selectedSource.snippet}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Your Notes
                        </label>
                        <textarea
                          value={selectedSource.notes || ''}
                          onChange={(e) =>
                            updateSourceNotes(selectedSource.id, e.target.value)
                          }
                          placeholder="Add your notes about this source..."
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedSource.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-sm flex items-center gap-1"
                            >
                              {tag}
                              <button
                                onClick={() =>
                                  removeTagFromSource(selectedSource.id, tag)
                                }
                                className="hover:text-blue-300"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Add tag..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addTagToSource(
                                selectedSource.id,
                                e.currentTarget.value
                              );
                              e.currentTarget.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
