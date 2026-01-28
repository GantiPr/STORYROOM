"use client";

import { useState } from "react";
import { useBible } from "@/hooks/useBible";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WorkspaceNavigationBar } from "@/components/WorkspaceNavigationBar";

type CritiqueMode = "structural" | "character" | "thematic" | "continuity";

type CritiqueScope = {
  type: "whole-story" | "one-character" | "one-act" | "one-decision";
  targetId?: string; // Character ID, act number, etc.
  targetName?: string;
};

type CritiqueReport = {
  mode: CritiqueMode;
  scope: CritiqueScope;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  severity?: "critical" | "moderate" | "minor";
};

export default function CritiquePage() {
  const { bible, isLoaded, isSaving } = useBible();
  const [report, setReport] = useState<CritiqueReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMode, setSelectedMode] = useState<CritiqueMode>("structural");
  const [selectedScope, setSelectedScope] = useState<CritiqueScope>({ type: "whole-story" });
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const router = useRouter();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const analyzeStory = async () => {
    setIsAnalyzing(true);
    try {
      // Build scope with target info
      const scope: CritiqueScope = { ...selectedScope };
      if (selectedScope.type === "one-character" && selectedCharacterId) {
        const character = bible.characters.find(c => c.id === selectedCharacterId);
        scope.targetId = selectedCharacterId;
        scope.targetName = character?.name;
      }

      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bible,
          mode: selectedMode,
          scope
        })
      });

      if (!response.ok) throw new Error("Failed to analyze story");

      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      console.error("Critique error:", error);
      alert("Failed to analyze story. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const hasContent = bible.characters.length > 0 || 
                     bible.research.length > 0 || 
                     (bible.builderSessions && bible.builderSessions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Story Critique
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">AI-powered tool that provides surgical analysis with focused, actionable feedback</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="group relative">
                <button className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <div className="absolute right-0 top-full mt-2 w-80 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-white">Why this matters:</span> Surgical analysis of specific story aspects (structure, character, theme, continuity) provides focused, actionable feedback instead of overwhelming general critiques.
                  </p>
                </div>
              </div>
              {/* Save Status */}
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                {isSaving ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-zinc-300">Saving...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-zinc-300">Saved</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Workspace Navigation Bar */}
          <WorkspaceNavigationBar currentPage="critique" bible={bible} />
        </div>

        {/* Content */}
        {!hasContent ? (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">No Story Content Yet</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                Create characters, conduct research, or start builder sessions to get a critique of your story.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/builder"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
                >
                  Start Building
                </Link>
                <Link
                  href="/characters"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all"
                >
                  Create Characters
                </Link>
              </div>
            </div>
          </div>
        ) : !report ? (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Critique Mode</h2>
              <p className="text-zinc-400 mb-6">Choose what aspect of your story to analyze</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedMode("structural")}
                  className={`p-6 rounded-xl border text-left transition-all ${
                    selectedMode === "structural"
                      ? "bg-blue-900/30 border-blue-600 shadow-lg shadow-blue-900/20"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🏗️</span>
                    <h3 className="text-lg font-semibold text-white">Structural</h3>
                  </div>
                  <p className="text-sm text-zinc-400">Plot, pacing, stakes, and story structure</p>
                </button>

                <button
                  onClick={() => setSelectedMode("character")}
                  className={`p-6 rounded-xl border text-left transition-all ${
                    selectedMode === "character"
                      ? "bg-purple-900/30 border-purple-600 shadow-lg shadow-purple-900/20"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">👤</span>
                    <h3 className="text-lg font-semibold text-white">Character</h3>
                  </div>
                  <p className="text-sm text-zinc-400">Motivation, consistency, and development</p>
                </button>

                <button
                  onClick={() => setSelectedMode("thematic")}
                  className={`p-6 rounded-xl border text-left transition-all ${
                    selectedMode === "thematic"
                      ? "bg-emerald-900/30 border-emerald-600 shadow-lg shadow-emerald-900/20"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">💡</span>
                    <h3 className="text-lg font-semibold text-white">Thematic</h3>
                  </div>
                  <p className="text-sm text-zinc-400">Theme drift, resonance, and message clarity</p>
                </button>

                <button
                  onClick={() => setSelectedMode("continuity")}
                  className={`p-6 rounded-xl border text-left transition-all ${
                    selectedMode === "continuity"
                      ? "bg-red-900/30 border-red-600 shadow-lg shadow-red-900/20"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🔍</span>
                    <h3 className="text-lg font-semibold text-white">Continuity</h3>
                  </div>
                  <p className="text-sm text-zinc-400">Contradictions, timeline, and consistency</p>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Analysis Scope</h2>
              <p className="text-zinc-400 mb-6">Focus the critique on a specific area</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedScope({ type: "whole-story" })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedScope.type === "whole-story"
                      ? "bg-blue-900/20 border-blue-600/50"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📖</span>
                    <div>
                      <div className="font-semibold text-white">Whole Story</div>
                      <div className="text-sm text-zinc-400">Analyze the entire narrative</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedScope({ type: "one-character" })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedScope.type === "one-character"
                      ? "bg-purple-900/20 border-purple-600/50"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div className="flex-1">
                      <div className="font-semibold text-white">One Character</div>
                      <div className="text-sm text-zinc-400">Focus on a specific character</div>
                    </div>
                  </div>
                </button>

                {selectedScope.type === "one-character" && bible.characters.length > 0 && (
                  <div className="ml-11 mt-2">
                    <select
                      value={selectedCharacterId}
                      onChange={(e) => setSelectedCharacterId(e.target.value)}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select a character...</option>
                      {bible.characters.map((char) => (
                        <option key={char.id} value={char.id}>
                          {char.name || char.id} ({char.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => setSelectedScope({ type: "one-act" })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedScope.type === "one-act"
                      ? "bg-emerald-900/20 border-emerald-600/50"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎬</span>
                    <div>
                      <div className="font-semibold text-white">One Act</div>
                      <div className="text-sm text-zinc-400">Analyze a specific story section</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedScope({ type: "one-decision" })}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedScope.type === "one-decision"
                      ? "bg-orange-900/20 border-orange-600/50"
                      : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <div className="font-semibold text-white">One Decision</div>
                      <div className="text-sm text-zinc-400">Evaluate a specific plot choice</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Run Analysis Button */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8 text-center">
              <button
                onClick={analyzeStory}
                disabled={isAnalyzing || (selectedScope.type === "one-character" && !selectedCharacterId)}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/50"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing...
                  </span>
                ) : (
                  "🔍 Run Critique"
                )}
              </button>
              {selectedScope.type === "one-character" && !selectedCharacterId && (
                <p className="text-sm text-yellow-500 mt-3">Please select a character first</p>
              )}
            </div>
          </div>
        ) : !report ? (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Ready for Analysis</h3>
              <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                I'll analyze your story for strengths, gaps, inconsistencies, and potential similarities to other works.
              </p>
              
              {/* Story Stats */}
              <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div className="text-2xl font-bold text-purple-400">{bible.characters.length}</div>
                  <div className="text-sm text-zinc-400">Characters</div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div className="text-2xl font-bold text-emerald-400">{bible.research.length}</div>
                  <div className="text-sm text-zinc-400">Research Notes</div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div className="text-2xl font-bold text-blue-400">{bible.builderSessions?.length || 0}</div>
                  <div className="text-sm text-zinc-400">Builder Sessions</div>
                </div>
              </div>
              
              <button
                onClick={analyzeStory}
                disabled={isAnalyzing}
                className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-lg transition-all hover:scale-105 shadow-lg shadow-red-900/50"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Analyzing Your Story...
                  </span>
                ) : (
                  "🔍 Analyze My Story"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    {report.mode === "structural" && "🏗️ Structural Analysis"}
                    {report.mode === "character" && "👤 Character Analysis"}
                    {report.mode === "thematic" && "💡 Thematic Analysis"}
                    {report.mode === "continuity" && "🔍 Continuity Audit"}
                  </h2>
                  <p className="text-zinc-400 mt-1">
                    Scope: {report.scope.type === "whole-story" && "Whole Story"}
                    {report.scope.type === "one-character" && `Character: ${report.scope.targetName}`}
                    {report.scope.type === "one-act" && "One Act"}
                    {report.scope.type === "one-decision" && "One Decision"}
                  </p>
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
                >
                  ← New Analysis
                </button>
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-xl border border-green-700/30 shadow-xl p-6">
              <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                <span>✅</span>
                <span>Strengths</span>
              </h3>
              {report.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                      <span className="whitespace-pre-wrap">{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No specific strengths identified.</p>
              )}
            </div>

            {/* Issues */}
            <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl border border-red-700/30 shadow-xl p-6">
              <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>Issues Found</span>
              </h3>
              {report.issues.length > 0 ? (
                <ul className="space-y-3">
                  {report.issues.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                      <span className="whitespace-pre-wrap">{issue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No issues detected.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-blue-700/30 shadow-xl p-6">
              <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Recommendations</span>
              </h3>
              {report.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-blue-500 mt-1 flex-shrink-0">{idx + 1}.</span>
                      <span className="whitespace-pre-wrap">{rec}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No specific recommendations.</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/characters"
                  className="p-4 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-700/30 rounded-lg transition-all group"
                >
                  <div className="text-3xl mb-2">👥</div>
                  <div className="font-medium text-white group-hover:text-purple-300">Edit Characters</div>
                  <div className="text-sm text-zinc-400 mt-1">Develop character arcs and relationships</div>
                </Link>
                
                <Link
                  href="/research"
                  className="p-4 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/30 rounded-lg transition-all group"
                >
                  <div className="text-3xl mb-2">📚</div>
                  <div className="font-medium text-white group-hover:text-emerald-300">Add Research</div>
                  <div className="text-sm text-zinc-400 mt-1">Fill gaps with authentic details</div>
                </Link>
                
                <Link
                  href="/builder"
                  className="p-4 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30 rounded-lg transition-all group"
                >
                  <div className="text-3xl mb-2">🎭</div>
                  <div className="font-medium text-white group-hover:text-blue-300">Explore Ideas</div>
                  <div className="text-sm text-zinc-400 mt-1">Brainstorm themes and scenarios</div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
