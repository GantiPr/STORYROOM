"use client";

import { useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Project, StoryPhase } from "@/lib/types";
import { PhaseSelector } from "@/components/PhaseSelector";
import { calculateStoryHealth, type HealthIndicator, type NextAction } from "@/lib/storyHealth";

export default function ProjectPage() {
  const { projects, activeProjectId, setActiveProjectId, isLoaded, updateProjectBible } = useProjects();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    const foundProject = projects.find(p => p.id === projectId);
    if (!foundProject) {
      router.push("/projects");
      return;
    }

    setProject(foundProject);
    setActiveProjectId(projectId);
  }, [projectId, projects, isLoaded, router, setActiveProjectId]);

  const handlePhaseChange = (phase: StoryPhase) => {
    if (!project) return;
    
    const updatedBible = { ...project.bible, phase };
    updateProjectBible(projectId, updatedBible);
    setProject({ ...project, bible: updatedBible });
  };

  const handleActionClick = (action: NextAction) => {
    // Store the prompt in localStorage if provided
    if (action.prompt) {
      localStorage.setItem('storyroom-seeded-prompt', action.prompt);
    }
    
    // Navigate to the target page
    router.push(`/${action.targetPage}`);
  };

  if (!isLoaded || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading project...</div>
      </div>
    );
  }

  const { bible } = project;
  const hasContent = bible.characters.length > 0 || 
                     bible.research.length > 0 || 
                     (bible.builderSessions && bible.builderSessions.length > 0);

  const health = calculateStoryHealth(bible);

  const getStatusColor = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'needs-attention': return 'text-red-400';
    }
  };

  const getStatusIcon = (status: HealthIndicator['status']) => {
    switch (status) {
      case 'good': return '🟢';
      case 'warning': return '🟡';
      case 'needs-attention': return '🔴';
    }
  };

  const getPriorityColor = (priority: NextAction['priority']) => {
    switch (priority) {
      case 'high': return 'border-red-600/50 bg-red-900/20';
      case 'medium': return 'border-yellow-600/50 bg-yellow-900/20';
      case 'low': return 'border-blue-600/50 bg-blue-900/20';
    }
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/story-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bible })
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Summary error:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-6">
            <Link
              href="/projects"
              className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
              title="Back to projects"
            >
              <span className="text-2xl">←</span>
            </Link>
            <div className="flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-zinc-400 mt-2">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {!hasContent ? (
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <span className="text-5xl">✨</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">Start Building Your Story</h3>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                Begin by creating characters, conducting research, or exploring ideas in the builder.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <Link
                  href="/builder"
                  className="p-6 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">🎭</div>
                  <div className="font-semibold text-white group-hover:text-blue-300 mb-2">Builder</div>
                  <div className="text-sm text-zinc-400">Explore themes and scenarios</div>
                </Link>
                
                <Link
                  href="/characters"
                  className="p-6 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-700/30 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">👥</div>
                  <div className="font-semibold text-white group-hover:text-purple-300 mb-2">Characters</div>
                  <div className="text-sm text-zinc-400">Create and develop characters</div>
                </Link>
                
                <Link
                  href="/research"
                  className="p-6 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/30 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">📚</div>
                  <div className="font-semibold text-white group-hover:text-emerald-300 mb-2">Research</div>
                  <div className="text-sm text-zinc-400">Gather authentic details</div>
                </Link>
                
                <Link
                  href="/critique"
                  className="p-6 bg-gradient-to-br from-red-900/20 to-orange-900/20 hover:from-red-900/30 hover:to-orange-900/30 border border-red-700/30 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="font-semibold text-white group-hover:text-red-300 mb-2">Critique</div>
                  <div className="text-sm text-zinc-400">Analyze your story</div>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Story Health Dashboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* Full Story Summary */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold text-white">Full Story Summary</h2>
                  <button
                    onClick={generateSummary}
                    disabled={isGeneratingSummary}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
                  >
                    {isGeneratingSummary ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </span>
                    ) : (
                      "✨ Generate Summary"
                    )}
                  </button>
                </div>

                {summary ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed">
                      {summary}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📖</div>
                    <p className="text-zinc-400 mb-4">
                      Generate an AI-powered narrative summary of your entire story
                    </p>
                    <button
                      onClick={generateSummary}
                      disabled={isGeneratingSummary}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-all"
                    >
                      Generate Summary
                    </button>
                  </div>
                )}
              </div>

              {/* Story Health Indicators */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
                <h2 className="text-2xl font-semibold text-white mb-6">Story Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {health.indicators.map((indicator) => (
                    <div
                      key={indicator.name}
                      className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{indicator.name}</h3>
                        <span className="text-2xl">{getStatusIcon(indicator.status)}</span>
                      </div>
                      <div className="mb-3">
                        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              indicator.status === 'good' ? 'bg-green-500' :
                              indicator.status === 'warning' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${indicator.score}%` }}
                          />
                        </div>
                      </div>
                      <p className={`text-sm ${getStatusColor(indicator.status)}`}>
                        {indicator.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Next Actions */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
                <h2 className="text-2xl font-semibold text-white mb-6">What to Work On Next</h2>
                {health.nextActions.length > 0 ? (
                  <div className="space-y-3">
                    {health.nextActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className={`w-full text-left p-4 rounded-lg border transition-all hover:scale-[1.02] ${getPriorityColor(action.priority)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">{action.title}</h3>
                            <p className="text-sm text-zinc-400">{action.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {action.priority === 'high' && (
                              <span className="px-2 py-1 bg-red-600/20 text-red-400 text-xs font-medium rounded">
                                High Priority
                              </span>
                            )}
                            <span className="text-zinc-400">→</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">✨</div>
                    <p className="text-zinc-400">Your story is in great shape! Keep developing.</p>
                  </div>
                )}
              </div>

              {/* Story Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-purple-900/20 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6 text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">{bible.characters.length}</div>
                  <div className="text-sm text-zinc-400">Characters</div>
                </div>
                <div className="bg-emerald-900/20 backdrop-blur-sm rounded-xl border border-emerald-700/30 p-6 text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">{bible.research.length}</div>
                  <div className="text-sm text-zinc-400">Research Notes</div>
                </div>
                <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-700/30 p-6 text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">{bible.builderSessions?.length || 0}</div>
                  <div className="text-sm text-zinc-400">Builder Sessions</div>
                </div>
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-xl border border-purple-700/30 p-6 text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {bible.canon?.length || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Canon Entries</div>
                </div>
                <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-sm rounded-xl border border-blue-700/30 p-6 text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                    {bible.artifacts?.length || 0}
                  </div>
                  <div className="text-sm text-zinc-400">Artifacts</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Workspace</h3>
              
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
              />
              
              <Link
                href="/builder"
                className="block p-6 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">🎭</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Builder</div>
                    <div className="text-xs text-zinc-500">{bible.builderSessions?.length || 0} sessions</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Explore themes, conflicts, and scenarios</div>
              </Link>
              
              <Link
                href="/characters"
                className="block p-6 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-700/30 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">👥</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">Characters</div>
                    <div className="text-xs text-zinc-500">{bible.characters.length} characters</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Create and develop character arcs</div>
              </Link>
              
              <Link
                href="/research"
                className="block p-6 bg-emerald-900/20 hover:bg-emerald-900/30 border border-emerald-700/30 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">📚</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">Research</div>
                    <div className="text-xs text-zinc-500">{bible.research.length} notes</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Gather authentic details and sources</div>
              </Link>
              
              <Link
                href="/critique"
                className="block p-6 bg-gradient-to-br from-red-900/20 to-orange-900/20 hover:from-red-900/30 hover:to-orange-900/30 border border-red-700/30 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">🔍</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-red-300 transition-colors">Critique</div>
                    <div className="text-xs text-zinc-500">AI Analysis</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Identify strengths and gaps</div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
