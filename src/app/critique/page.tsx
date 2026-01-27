"use client";

import { useState } from "react";
import { useBible } from "@/hooks/useBible";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CritiqueReport = {
  strengths: string[];
  gaps: string[];
  inconsistencies: string[];
  similarities: string[];
  recommendations: string[];
};

type QuickAction = {
  type: "character" | "research" | "builder";
  id: string;
  label: string;
  description: string;
};

// Helper to parse and render text with clickable references
function parseReferences(text: string, bible: any, onAction: (action: QuickAction) => void) {
  // Match patterns like [Character: Name], [Research: Topic], [Builder: Title]
  const pattern = /\[(Character|Research|Builder):\s*([^\]]+)\]/g;
  const parts: JSX.Element[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${key++}`}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const type = match[1].toLowerCase() as "character" | "research" | "builder";
    const name = match[2].trim();
    
    // Find the actual item
    let item = null;
    let id = "";
    
    if (type === "character") {
      item = bible.characters.find((c: any) => c.name.toLowerCase() === name.toLowerCase());
      id = item?.id || "";
    } else if (type === "research") {
      item = bible.research.find((r: any) => 
        r.question.toLowerCase().includes(name.toLowerCase())
      );
      id = item?.id || "";
    } else if (type === "builder") {
      item = bible.builderSessions?.find((s: any) => 
        s.title.toLowerCase().includes(name.toLowerCase())
      );
      id = item?.id || "";
    }

    if (item) {
      const colorClass = 
        type === "character" ? "text-purple-400 hover:text-purple-300 border-purple-600/50" :
        type === "research" ? "text-emerald-400 hover:text-emerald-300 border-emerald-600/50" :
        "text-blue-400 hover:text-blue-300 border-blue-600/50";

      parts.push(
        <button
          key={`ref-${key++}`}
          onClick={() => onAction({
            type,
            id,
            label: name,
            description: type === "character" ? item.logline : 
                        type === "research" ? `${item.bullets?.length || 0} insights` :
                        `${item.messages?.length || 0} messages`
          })}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border ${colorClass} transition-all hover:scale-105 font-medium`}
        >
          {type === "character" && "👤"}
          {type === "research" && "📖"}
          {type === "builder" && "🎭"}
          {name}
        </button>
      );
    } else {
      // If item not found, just show the text
      parts.push(<span key={`text-${key++}`}>{match[0]}</span>);
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${key++}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

export default function CritiquePage() {
  const { bible, isLoaded, isSaving } = useBible();
  const [report, setReport] = useState<CritiqueReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null);
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
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bible })
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

  const handleQuickAction = (action: QuickAction) => {
    setSelectedAction(action);
    // Navigate to the appropriate page
    if (action.type === "character") {
      router.push("/characters");
    } else if (action.type === "research") {
      router.push("/research");
    } else if (action.type === "builder") {
      router.push("/builder");
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
              <p className="text-zinc-400 mt-2 text-lg">AI-powered analysis of your story's strengths and weaknesses</p>
            </div>
            <div className="flex items-center gap-4">
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
              
              <Link
                href="/builder"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                🎭 Builder
              </Link>
              
              <Link
                href="/characters"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                👥 Characters
              </Link>
              
              <Link
                href="/research"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                📚 Research
              </Link>
              
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all hover:scale-105 border border-zinc-700"
              >
                ← Projects
              </Link>
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Story Content */}
            <div className="lg:col-span-1 space-y-4">
              {/* Characters */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
                <h3 className="text-lg font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  <span>👥</span>
                  <span>Characters</span>
                  <span className="ml-auto text-xs bg-purple-600/20 px-2 py-1 rounded">
                    {bible.characters.length}
                  </span>
                </h3>
                {bible.characters.length > 0 ? (
                  <div className="space-y-2">
                    {bible.characters.map(char => (
                      <button
                        key={char.id}
                        onClick={() => handleQuickAction({
                          type: "character",
                          id: char.id,
                          label: char.name,
                          description: char.logline
                        })}
                        className={`w-full text-left p-3 rounded-lg border transition-all group ${
                          selectedAction?.type === "character" && selectedAction?.id === char.id
                            ? "bg-purple-900/50 border-purple-600"
                            : "bg-zinc-800/50 hover:bg-purple-900/30 border-zinc-700/50 hover:border-purple-600/50"
                        }`}
                      >
                        <div className="font-medium text-white group-hover:text-purple-300 transition-colors">
                          {char.name}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">{char.role}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No characters yet</p>
                )}
                <Link
                  href="/characters"
                  className="mt-3 block w-full text-center px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm transition-all"
                >
                  View All →
                </Link>
              </div>

              {/* Research Notes */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
                <h3 className="text-lg font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <span>📚</span>
                  <span>Research</span>
                  <span className="ml-auto text-xs bg-emerald-600/20 px-2 py-1 rounded">
                    {bible.research.length}
                  </span>
                </h3>
                {bible.research.length > 0 ? (
                  <div className="space-y-2">
                    {bible.research.slice(0, 5).map(note => (
                      <button
                        key={note.id}
                        onClick={() => handleQuickAction({
                          type: "research",
                          id: note.id,
                          label: note.question,
                          description: `${note.bullets.length} insights`
                        })}
                        className={`w-full text-left p-3 rounded-lg border transition-all group ${
                          selectedAction?.type === "research" && selectedAction?.id === note.id
                            ? "bg-emerald-900/50 border-emerald-600"
                            : "bg-zinc-800/50 hover:bg-emerald-900/30 border-zinc-700/50 hover:border-emerald-600/50"
                        }`}
                      >
                        <div className="text-sm text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                          {note.question}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">{note.bullets.length} insights</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No research yet</p>
                )}
                <Link
                  href="/research"
                  className="mt-3 block w-full text-center px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg text-sm transition-all"
                >
                  View All →
                </Link>
              </div>

              {/* Builder Sessions */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <span>🎭</span>
                  <span>Builder</span>
                  <span className="ml-auto text-xs bg-blue-600/20 px-2 py-1 rounded">
                    {bible.builderSessions?.length || 0}
                  </span>
                </h3>
                {bible.builderSessions && bible.builderSessions.length > 0 ? (
                  <div className="space-y-2">
                    {bible.builderSessions.slice(0, 5).map(session => (
                      <button
                        key={session.id}
                        onClick={() => handleQuickAction({
                          type: "builder",
                          id: session.id,
                          label: session.title,
                          description: session.summary || `${session.messages.length} messages`
                        })}
                        className={`w-full text-left p-3 rounded-lg border transition-all group ${
                          selectedAction?.type === "builder" && selectedAction?.id === session.id
                            ? "bg-blue-900/50 border-blue-600"
                            : "bg-zinc-800/50 hover:bg-blue-900/30 border-zinc-700/50 hover:border-blue-600/50"
                        }`}
                      >
                        <div className="text-sm text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                          {session.title}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">{session.messages.length} messages</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500">No sessions yet</p>
                )}
                <Link
                  href="/builder"
                  className="mt-3 block w-full text-center px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-sm transition-all"
                >
                  View All →
                </Link>
              </div>
            </div>

            {/* Main Content - Critique Report */}
            <div className="lg:col-span-3 space-y-6">
            {/* Strengths */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-sm rounded-xl border border-green-700/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                <span>✅</span>
                <span>Strengths</span>
              </h2>
              {report.strengths.length > 0 ? (
                <ul className="space-y-3">
                  {report.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                      <span>{parseReferences(strength, bible, handleQuickAction)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No specific strengths identified yet.</p>
              )}
            </div>

            {/* Gaps */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl border border-yellow-700/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <span>⚠️</span>
                <span>Gaps & Missing Elements</span>
              </h2>
              {report.gaps.length > 0 ? (
                <ul className="space-y-3">
                  {report.gaps.map((gap, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-yellow-500 mt-1 flex-shrink-0">•</span>
                      <span>{parseReferences(gap, bible, handleQuickAction)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No significant gaps found.</p>
              )}
            </div>

            {/* Inconsistencies */}
            <div className="bg-gradient-to-br from-red-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl border border-red-700/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                <span>❌</span>
                <span>Inconsistencies</span>
              </h2>
              {report.inconsistencies.length > 0 ? (
                <ul className="space-y-3">
                  {report.inconsistencies.map((issue, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-red-500 mt-1 flex-shrink-0">•</span>
                      <span>{parseReferences(issue, bible, handleQuickAction)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No inconsistencies detected.</p>
              )}
            </div>

            {/* Similarities */}
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl border border-purple-700/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-purple-400 mb-4 flex items-center gap-2">
                <span>🎬</span>
                <span>Potential Similarities</span>
              </h2>
              {report.similarities.length > 0 ? (
                <ul className="space-y-3">
                  {report.similarities.map((similarity, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-purple-500 mt-1 flex-shrink-0">•</span>
                      <span>{parseReferences(similarity, bible, handleQuickAction)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No obvious similarities to existing works detected.</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-blue-700/30 shadow-xl p-6">
              <h2 className="text-2xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <span>💡</span>
                <span>Recommendations</span>
              </h2>
              {report.recommendations.length > 0 ? (
                <ul className="space-y-3">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-200 p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-blue-500 mt-1 flex-shrink-0">{idx + 1}.</span>
                      <span>{parseReferences(rec, bible, handleQuickAction)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-400">No specific recommendations at this time.</p>
              )}
            </div>

            {/* Re-analyze Button */}
            <div className="text-center pt-6">
              <button
                onClick={analyzeStory}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all hover:scale-105"
              >
                {isAnalyzing ? "Re-analyzing..." : "🔄 Re-analyze Story"}
              </button>
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
          </div>
        )}
      </div>
    </div>
  );
}
