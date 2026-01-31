"use client";

import { useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import type { Project, StoryPhase, ConsistencyTimeline } from "@/lib/types";
import { PhaseSelector } from "@/components/PhaseSelector";
import { calculateStoryHealth, type HealthIndicator, type NextAction } from "@/lib/storyHealth";
import { TimelineView } from "@/components/TimelineView";

export default function ProjectPage() {
  const { projects, setActiveProjectId, isLoaded, updateProjectBible } = useProjects();
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [timeline, setTimeline] = useState<ConsistencyTimeline | null>(null);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "timeline">("dashboard");
  const [summaryGenerated, setSummaryGenerated] = useState(false);

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

  // Auto-generate summary once when project loads with content
  useEffect(() => {
    if (!project || summaryGenerated || isGeneratingSummary) return;

    const hasContent = project.bible.characters.length > 0 || 
                       project.bible.research.length > 0 || 
                       (project.bible.builderSessions && project.bible.builderSessions.length > 0);
    
    if (hasContent) {
      setSummaryGenerated(true);
      
      // Generate summary
      const doGenerate = async () => {
        setIsGeneratingSummary(true);
        try {
          const response = await fetch("/api/story-summary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bible: project.bible })
          });

          if (!response.ok) throw new Error("Failed to generate summary");

          const data = await response.json();
          setSummary(data.summary);
        } catch (error) {
          console.error("Summary error:", error);
        } finally {
          setIsGeneratingSummary(false);
        }
      };
      
      doGenerate();
    }
  }, [project, summaryGenerated, isGeneratingSummary]);

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

  const getHealthSummary = () => {
    const strong = health.indicators.filter(i => i.status === 'good').map(i => i.name);
    const needsWork = health.indicators.filter(i => i.status === 'needs-attention').map(i => i.name);
    const warning = health.indicators.filter(i => i.status === 'warning').map(i => i.name);

    if (needsWork.length === 0 && warning.length === 0) {
      return "Your story is in excellent shape across all areas.";
    }

    const parts = [];
    if (strong.length > 0) {
      parts.push(`strong in ${strong.join(' and ').toLowerCase()}`);
    }
    if (needsWork.length > 0) {
      parts.push(`needs ${needsWork.join(' and ').toLowerCase()}`);
    } else if (warning.length > 0) {
      parts.push(`could improve ${warning.join(' and ').toLowerCase()}`);
    }

    return `Your story is ${parts.join(', but ')}.`;
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

  const generateTimeline = async () => {
    setIsGeneratingTimeline(true);
    try {
      const response = await fetch("/api/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bible })
      });

      if (!response.ok) throw new Error("Failed to generate timeline");

      const data = await response.json();
      setTimeline(data.timeline);
    } catch (error) {
      console.error("Timeline error:", error);
      alert("Failed to generate timeline. Please try again.");
    } finally {
      setIsGeneratingTimeline(false);
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

        {/* Tab Navigation */}
        {hasContent && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "timeline"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              ⏱️ Timeline
            </button>
          </div>
        )}

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
                  className="p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">🎭</div>
                  <div className="font-semibold text-white group-hover:text-blue-300 mb-2">Builder</div>
                  <div className="text-sm text-zinc-400">Explore themes and scenarios</div>
                </Link>
                
                <Link
                  href="/characters"
                  className="p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">👥</div>
                  <div className="font-semibold text-white group-hover:text-blue-300 mb-2">Characters</div>
                  <div className="text-sm text-zinc-400">Create and develop characters</div>
                </Link>
                
                <Link
                  href="/research"
                  className="p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">📚</div>
                  <div className="font-semibold text-white group-hover:text-blue-300 mb-2">Research</div>
                  <div className="text-sm text-zinc-400">Gather authentic details</div>
                </Link>
                
                <Link
                  href="/critique"
                  className="p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
                >
                  <div className="text-4xl mb-3">🔍</div>
                  <div className="font-semibold text-white group-hover:text-blue-300 mb-2">Critique</div>
                  <div className="text-sm text-zinc-400">Analyze your story</div>
                </Link>
              </div>
            </div>
          </div>
        ) : activeTab === "timeline" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline View */}
            <div className="lg:col-span-2">
              <TimelineView
                timeline={timeline}
                isGenerating={isGeneratingTimeline}
                onGenerate={generateTimeline}
              />
            </div>

            {/* Navigation Sidebar */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white mb-4">Workspace</h3>
              
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
              />
              
              <Link
                href="/builder"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
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
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">👥</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Characters</div>
                    <div className="text-xs text-zinc-500">{bible.characters.length} characters</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Create and develop character arcs</div>
              </Link>
              
              <Link
                href="/research"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">📚</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Research</div>
                    <div className="text-xs text-zinc-500">{bible.research.length} notes</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Gather authentic details and sources</div>
              </Link>
              
              <Link
                href="/critique"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">🔍</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Critique</div>
                    <div className="text-xs text-zinc-500">AI Analysis</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Identify strengths and gaps</div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - Story Health Dashboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* HERO: What to Work On Next */}
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-sm rounded-xl border-2 border-blue-600/50 shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🎯</div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">What to Work On Next</h2>
                    <p className="text-blue-300 text-sm mt-1">Your personalized action plan</p>
                  </div>
                </div>
                {health.nextActions.length > 0 ? (
                  <div className="space-y-3">
                    {health.nextActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:scale-[1.02] hover:shadow-xl ${getPriorityColor(action.priority)}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-white text-lg mb-2">{action.title}</h3>
                            <p className="text-sm text-zinc-300">{action.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {action.priority === 'high' && (
                              <span className="px-3 py-1.5 bg-red-600/30 text-red-300 text-xs font-bold rounded-lg">
                                HIGH PRIORITY
                              </span>
                            )}
                            <span className="text-white text-xl">→</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-xl text-white font-semibold mb-2">You&apos;re all caught up!</p>
                    <p className="text-blue-300">Your story is in great shape. Keep developing.</p>
                  </div>
                )}
              </div>

              {/* Story Health Indicators - Single Row Diagnostics */}
              <div className="bg-zinc-900/30 backdrop-blur-sm rounded-lg border border-zinc-700/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Story Health</h3>
                  <span className="text-xs text-zinc-500">Diagnostics</span>
                </div>
                <p className="text-sm text-zinc-300 mb-3">{getHealthSummary()}</p>
                <div className="grid grid-cols-4 gap-2">
                  {health.indicators.map((indicator) => (
                    <div
                      key={indicator.name}
                      className="p-2 bg-zinc-800/30 rounded border border-zinc-700/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-zinc-400">{indicator.name}</span>
                        <span className="text-sm">{getStatusIcon(indicator.status)}</span>
                      </div>
                      <div className="h-1 bg-zinc-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            indicator.status === 'good' ? 'bg-green-500/60' :
                            indicator.status === 'warning' ? 'bg-yellow-500/60' :
                            'bg-red-500/60'
                          }`}
                          style={{ width: `${indicator.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Story Summary - Collapsed by default */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">Full Story Summary</h2>
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
                      "✨ Generate"
                    )}
                  </button>
                </div>

                {summary ? (
                  <div className="prose prose-invert max-w-none">
                    <div className="text-zinc-200 whitespace-pre-wrap leading-relaxed text-sm">
                      {summary}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📖</div>
                    <p className="text-zinc-400 text-sm">
                      Generate an AI-powered narrative summary
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Sidebar - Navigation & Stats */}
            <div className="space-y-4">
              {/* Story Stats - Compact */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Story Stats</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-purple-900/10 rounded-lg">
                    <span className="text-sm text-zinc-300">👥 Characters</span>
                    <span className="text-lg font-bold text-purple-400">{bible.characters.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-emerald-900/10 rounded-lg">
                    <span className="text-sm text-zinc-300">📚 Research</span>
                    <span className="text-lg font-bold text-emerald-400">{bible.research.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-900/10 rounded-lg">
                    <span className="text-sm text-zinc-300">🎭 Sessions</span>
                    <span className="text-lg font-bold text-blue-400">{bible.builderSessions?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-900/10 rounded-lg">
                    <span className="text-sm text-zinc-300">🔒 Canon</span>
                    <span className="text-lg font-bold text-purple-400">{bible.canon?.length || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-cyan-900/10 rounded-lg">
                    <span className="text-sm text-zinc-300">✏️ Artifacts</span>
                    <span className="text-lg font-bold text-cyan-400">{bible.artifacts?.length || 0}</span>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-4">Workspace</h3>
              
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
              />
              
              <Link
                href="/builder"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
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
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">👥</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Characters</div>
                    <div className="text-xs text-zinc-500">{bible.characters.length} characters</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Create and develop character arcs</div>
              </Link>
              
              <Link
                href="/research"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">📚</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Research</div>
                    <div className="text-xs text-zinc-500">{bible.research.length} notes</div>
                  </div>
                </div>
                <div className="text-sm text-zinc-400">Gather authentic details and sources</div>
              </Link>
              
              <Link
                href="/critique"
                className="block p-6 bg-zinc-800/30 hover:bg-zinc-800/50 border border-zinc-700/30 hover:border-zinc-600/50 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-3xl">🔍</div>
                  <div className="flex-1">
                    <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">Critique</div>
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
