'use client';

import { useState, useEffect } from 'react';
import { useBible } from '@/hooks/useBible';
import MCPResearchPanel from '@/components/MCPResearchPanel';
import SourceBasedGenerator from '@/components/SourceBasedGenerator';
import Link from 'next/link';

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

export default function MCPResearchPage() {
  const { bible, isLoaded } = useBible();
  const [sources, setSources] = useState<SavedSource[]>([]);
  const [activeTab, setActiveTab] = useState<'search' | 'generate'>('search');

  // Load sources when bible is loaded
  useEffect(() => {
    if (isLoaded && bible.id) {
      const key = `mcp-sources-${bible.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setSources(JSON.parse(saved));
      }
    }
  }, [isLoaded, bible.id]);

  const handleSourcesSaved = (newSources: SavedSource[]) => {
    setSources(newSources);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                MCP Research Studio
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">
                Search → Save → Generate • Powered by Brave Search MCP
              </p>
            </div>
            <Link
              href="/projects"
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
            >
              ← Back to Projects
            </Link>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-300 mb-1">
                  How the Research → Write Loop Works
                </h3>
                <ol className="text-sm text-zinc-300 space-y-1 list-decimal list-inside">
                  <li>
                    <strong>Search:</strong> Use Brave Search MCP to find authentic sources
                  </li>
                  <li>
                    <strong>Save:</strong> Select and save sources to your knowledge base
                  </li>
                  <li>
                    <strong>Annotate:</strong> Add notes and tags to organize your research
                  </li>
                  <li>
                    <strong>Generate:</strong> AI creates outlines/scenes using ONLY your sources
                  </li>
                  <li>
                    <strong>Cite:</strong> Every fact is cited, preventing hallucination
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            🔍 Search & Save Sources
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'generate'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            ✨ Generate from Sources ({sources.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'search' ? (
          <MCPResearchPanel
            onSourcesSaved={handleSourcesSaved}
            projectId={bible.id}
          />
        ) : (
          <SourceBasedGenerator sources={sources} storyContext={bible} />
        )}

        {/* Stats Footer */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="text-2xl font-bold text-blue-400">{sources.length}</div>
            <div className="text-sm text-zinc-400">Saved Sources</div>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="text-2xl font-bold text-emerald-400">
              {new Set(sources.flatMap(s => s.tags)).size}
            </div>
            <div className="text-sm text-zinc-400">Unique Tags</div>
          </div>
          <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
            <div className="text-2xl font-bold text-purple-400">
              {sources.filter(s => s.notes && s.notes.length > 0).length}
            </div>
            <div className="text-sm text-zinc-400">Annotated Sources</div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 p-6 bg-gradient-to-br from-emerald-900/20 to-blue-900/20 rounded-xl border border-emerald-700/30">
          <h3 className="text-lg font-semibold text-emerald-300 mb-3">
            💡 Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>
                <strong>Tag your sources</strong> by topic (e.g., "Medieval Warfare",
                "Psychology") for easy filtering
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>
                <strong>Add notes</strong> to sources with key takeaways and how you'll
                use them
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>
                <strong>Select specific sources</strong> for generation to keep content
                focused and relevant
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>
                <strong>AI cites every fact</strong> with [Source N] notation - verify
                citations by clicking source links
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">→</span>
              <span>
                <strong>No hallucination:</strong> AI only uses your saved sources, not
                its training data
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
