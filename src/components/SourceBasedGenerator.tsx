'use client';

import { useState } from 'react';

type SavedSource = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  notes?: string;
  tags: string[];
};

type GenerationType = 'outline' | 'scene' | 'worldbuilding' | 'character-detail';

export default function SourceBasedGenerator({
  sources,
  storyContext
}: {
  sources: SavedSource[];
  storyContext: any;
}) {
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [generationType, setGenerationType] = useState<GenerationType>('outline');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleSource = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedSources(sources.map(s => s.id));
  };

  const deselectAll = () => {
    setSelectedSources([]);
  };

  const generate = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source to use.');
      return;
    }

    if (!prompt.trim()) {
      alert('Please enter what you want to generate.');
      return;
    }

    setIsGenerating(true);
    setOutput('');

    try {
      const selectedSourceData = sources.filter(s =>
        selectedSources.includes(s.id)
      );

      const response = await fetch('/api/generate-from-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: generationType,
          prompt,
          sources: selectedSourceData,
          storyContext: {
            title: storyContext.title,
            premise: storyContext.premise,
            genre: storyContext.genre,
            themes: storyContext.themes,
            characters: storyContext.characters?.map((c: any) => ({
              name: c.name,
              role: c.role,
              logline: c.logline
            }))
          }
        })
      });

      if (!response.ok) throw new Error('Generation failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  generatedText += parsed.text;
                  setOutput(generatedText);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert('Copied to clipboard!');
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <span>✨</span>
          <span>AI Generator (Source-Based)</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Generate outlines, scenes, and worldbuilding using only your saved sources
          — prevents hallucination
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Generation Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              What to Generate
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGenerationType('outline')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  generationType === 'outline'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                📋 Outline
              </button>
              <button
                onClick={() => setGenerationType('scene')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  generationType === 'scene'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                🎬 Scene
              </button>
              <button
                onClick={() => setGenerationType('worldbuilding')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  generationType === 'worldbuilding'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                🌍 Worldbuilding
              </button>
              <button
                onClick={() => setGenerationType('character-detail')}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  generationType === 'character-detail'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                👤 Character Detail
              </button>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              What do you want?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                generationType === 'outline'
                  ? 'e.g., "Create a 3-act outline for a heist in medieval London"'
                  : generationType === 'scene'
                  ? 'e.g., "Write a scene where the protagonist discovers the secret passage"'
                  : generationType === 'worldbuilding'
                  ? 'e.g., "Describe the political structure of the kingdom"'
                  : 'e.g., "Detail the protagonist\'s daily routine and habits"'
              }
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
            />
          </div>

          {/* Source Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-300">
                Select Sources ({selectedSources.length}/{sources.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-zinc-400 hover:text-zinc-300"
                >
                  Clear
                </button>
              </div>
            </div>

            {sources.length === 0 ? (
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-center">
                <p className="text-sm text-zinc-400">
                  No sources saved yet. Search and save sources first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedSources.includes(source.id)
                        ? 'bg-purple-900/30 border-purple-600/50'
                        : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                    onClick={() => toggleSource(source.id)}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(source.id)}
                        onChange={() => toggleSource(source.id)}
                        className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-700 checked:bg-purple-600"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white line-clamp-1">
                          {source.title}
                        </p>
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {source.domain}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generate}
            disabled={isGenerating || selectedSources.length === 0 || !prompt.trim()}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all text-lg"
          >
            {isGenerating ? '✨ Generating...' : '✨ Generate'}
          </button>
        </div>

        {/* Right: Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-zinc-300">
              Generated Content
            </label>
            {output && (
              <button
                onClick={copyToClipboard}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                📋 Copy
              </button>
            )}
          </div>

          <div className="bg-zinc-800/50 rounded-lg border border-zinc-700/50 p-4 min-h-[500px] max-h-[500px] overflow-y-auto custom-scrollbar">
            {output ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-zinc-200 font-sans">
                  {output}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-700 flex items-center justify-center">
                    <span className="text-3xl">✨</span>
                  </div>
                  <p className="text-zinc-400 text-sm">
                    {isGenerating
                      ? 'Generating content...'
                      : 'Configure and click Generate to create content'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Source Citations */}
          {output && selectedSources.length > 0 && (
            <div className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">
                📚 Sources Used
              </h4>
              <div className="space-y-1">
                {sources
                  .filter(s => selectedSources.includes(s.id))
                  .map((source, idx) => (
                    <a
                      key={source.id}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-blue-400 hover:text-blue-300"
                    >
                      [{idx + 1}] {source.title} - {source.domain}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
