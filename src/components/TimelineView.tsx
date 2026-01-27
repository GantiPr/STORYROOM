"use client";

import { useState } from "react";
import type { ConsistencyTimeline, TimelineEvent, TimelineIssue } from "@/lib/types";

type TimelineViewProps = {
  timeline: ConsistencyTimeline | null;
  isGenerating: boolean;
  onGenerate: () => void;
};

export function TimelineView({ timeline, isGenerating, onGenerate }: TimelineViewProps) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [filterCharacter, setFilterCharacter] = useState<string | null>(null);

  if (!timeline && !isGenerating) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-12">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <span className="text-5xl">⏱️</span>
          </div>
          <h3 className="text-2xl font-semibold text-white mb-3">Consistency Timeline</h3>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Generate a chronological timeline of all story events with consistency analysis
          </p>
          <button
            onClick={onGenerate}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-all"
          >
            🔍 Analyze Timeline
          </button>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-12">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400">Analyzing timeline and checking consistency...</p>
        </div>
      </div>
    );
  }

  if (!timeline) return null;

  const events = timeline.events;
  const issues = timeline.issues;

  // Get unique characters from events
  const allCharacters = Array.from(
    new Set(events.flatMap(e => e.involvedCharacters))
  );

  // Filter events by character if selected
  const filteredEvents = filterCharacter
    ? events.filter(e => e.involvedCharacters.includes(filterCharacter))
    : events;

  const getSeverityColor = (severity: TimelineIssue['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-600/50';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-600/50';
      case 'minor': return 'text-blue-400 bg-blue-900/20 border-blue-600/50';
    }
  };

  const getSourceColor = (sourceType: TimelineEvent['sourceType']) => {
    switch (sourceType) {
      case 'plot': return 'bg-blue-600/20 text-blue-400';
      case 'character-arc': return 'bg-purple-600/20 text-purple-400';
      case 'builder': return 'bg-cyan-600/20 text-cyan-400';
      case 'research': return 'bg-emerald-600/20 text-emerald-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">Consistency Timeline</h2>
            <p className="text-sm text-zinc-400">
              Generated {new Date(timeline.generatedAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onGenerate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-all"
          >
            🔄 Regenerate
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-900/20 rounded-lg border border-indigo-700/30">
            <div className="text-3xl font-bold text-indigo-400 mb-1">{events.length}</div>
            <div className="text-sm text-zinc-400">Total Events</div>
          </div>
          <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
            <div className="text-3xl font-bold text-purple-400 mb-1">{allCharacters.length}</div>
            <div className="text-sm text-zinc-400">Characters</div>
          </div>
          <div className={`p-4 rounded-lg border ${
            issues.length === 0 
              ? 'bg-green-900/20 border-green-700/30' 
              : 'bg-red-900/20 border-red-700/30'
          }`}>
            <div className={`text-3xl font-bold mb-1 ${
              issues.length === 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {issues.length}
            </div>
            <div className="text-sm text-zinc-400">Issues Found</div>
          </div>
        </div>
      </div>

      {/* Issues Section */}
      {issues.length > 0 && (
        <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">⚠️ Consistency Issues</h3>
          <div className="space-y-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide opacity-75">
                        {issue.type.replace(/-/g, ' ')}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded">
                        {issue.severity}
                      </span>
                    </div>
                    <h4 className="font-semibold mb-1">{issue.title}</h4>
                    <p className="text-sm opacity-90">{issue.description}</p>
                  </div>
                </div>
                {issue.suggestion && (
                  <div className="mt-3 pt-3 border-t border-current/20">
                    <p className="text-sm">
                      <span className="font-medium">Suggestion:</span> {issue.suggestion}
                    </p>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  {issue.affectedEvents.map(eventId => (
                    <button
                      key={eventId}
                      onClick={() => setSelectedEvent(eventId)}
                      className="text-xs px-2 py-1 bg-zinc-800/50 hover:bg-zinc-700 rounded transition-colors"
                    >
                      → {eventId}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Character Filter */}
      {allCharacters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-400">Filter by character:</span>
          <button
            onClick={() => setFilterCharacter(null)}
            className={`px-3 py-1 rounded-lg text-sm transition-all ${
              filterCharacter === null
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          {allCharacters.map(charId => (
            <button
              key={charId}
              onClick={() => setFilterCharacter(charId)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                filterCharacter === charId
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {charId}
            </button>
          ))}
        </div>
      )}

      {/* Timeline Events */}
      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
        <h3 className="text-xl font-semibold text-white mb-6">📅 Event Timeline</h3>
        
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            No events found for this filter
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600"></div>
            
            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event, idx) => {
                const isSelected = selectedEvent === event.id;
                const hasIssues = issues.some(i => i.affectedEvents.includes(event.id));
                
                return (
                  <div
                    key={event.id}
                    className={`relative pl-20 transition-all ${
                      isSelected ? 'scale-[1.02]' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-6 w-5 h-5 rounded-full border-4 ${
                      hasIssues 
                        ? 'bg-red-500 border-red-600' 
                        : 'bg-indigo-500 border-indigo-600'
                    } ${isSelected ? 'ring-4 ring-indigo-600/30' : ''}`}></div>
                    
                    {/* Event card */}
                    <div className={`p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-900/30 border-indigo-600'
                        : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                    }`}>
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-zinc-500">{event.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${getSourceColor(event.sourceType)}`}>
                              {event.sourceType}
                            </span>
                            {hasIssues && (
                              <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded">
                                ⚠️ Issue
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                          <p className="text-sm text-zinc-300">{event.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-indigo-400">{event.timestamp}</div>
                          {event.relativeTime !== undefined && (
                            <div className="text-xs text-zinc-500">T+{event.relativeTime}</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Characters involved */}
                      {event.involvedCharacters.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-zinc-500">Characters:</span>
                          {event.involvedCharacters.map(charId => (
                            <span
                              key={charId}
                              className="text-xs px-2 py-0.5 bg-purple-900/30 text-purple-400 rounded"
                            >
                              {charId}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Causality chains */}
                      {(event.causedBy || event.causes) && (
                        <div className="mt-3 pt-3 border-t border-zinc-700/50 space-y-2">
                          {event.causedBy && event.causedBy.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">← Caused by:</span>
                              {event.causedBy.map(id => (
                                <button
                                  key={id}
                                  onClick={() => setSelectedEvent(id)}
                                  className="px-2 py-0.5 bg-zinc-700/50 hover:bg-zinc-600 text-zinc-300 rounded transition-colors"
                                >
                                  {id}
                                </button>
                              ))}
                            </div>
                          )}
                          {event.causes && event.causes.length > 0 && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-zinc-500">→ Causes:</span>
                              {event.causes.map(id => (
                                <button
                                  key={id}
                                  onClick={() => setSelectedEvent(id)}
                                  className="px-2 py-0.5 bg-zinc-700/50 hover:bg-zinc-600 text-zinc-300 rounded transition-colors"
                                >
                                  {id}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
