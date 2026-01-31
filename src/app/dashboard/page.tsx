"use client";

import { useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Project, StoryPhase } from "@/lib/types";
import { PhaseSelector } from "@/components/PhaseSelector";
import { calculateStoryHealth, type HealthIndicator, type NextAction } from "@/lib/storyHealth";
import { WorkspaceNavigation } from "@/components/WorkspaceNavigation";

export default function DashboardPage() {
  const { projects, activeProjectId, isLoaded, updateProjectBible } = useProjects();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryGenerated, setSummaryGenerated] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!activeProjectId) {
      router.push("/projects");
      return;
    }

    const foundProject = projects.find(p => p.id === activeProjectId);
    if (!foundProject) {
      router.push("/projects");
      return;
    }

    setProject(foundProject);
  }, [activeProjectId, projects, isLoaded, router]);

  // Auto-generate summary once when project loads with content
  useEffect(() => {
    if (!project || summaryGenerated || isGeneratingSummary) return;

    const hasContent = project.bible.characters.length > 0 || 
                       project.bible.research.length > 0 || 
                       (project.bible.builderSessions && project.bible.builderSessions.length > 0);
    
    if (hasContent) {
      setSummaryGenerated(true);
      
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
    if (!project || !activeProjectId) return;
    
    const updatedBible = { ...project.bible, phase };
    updateProjectBible(activeProjectId, updatedBible);
    setProject({ ...project, bible: updatedBible });
  };

  const handleActionClick = (action: NextAction) => {
    if (action.prompt) {
      localStorage.setItem('storyroom-seeded-prompt', action.prompt);
    }
    router.push(`/${action.targetPage}`);
  };

  const generateSummary = async () => {
    if (!project) return;
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
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  if (!isLoaded || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading dashboard...</div>
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
      default: return '⚪';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header with Navigation */}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-12">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <span className="text-5xl">✨</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Start Building Your Story</h3>
                  <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                    Begin by creating characters, conducting research, or exploring ideas in the builder.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Sidebar - Workspace Navigation */}
            <div className="space-y-4">
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
              />
              
              {/* Workspace Navigation */}
              <WorkspaceNavigation currentPage="dashboard" bible={bible} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* HERO: What to Work On Next */}
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="text-4xl">🎯</div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">What to Work On Next</h2>
                    <p className="text-zinc-400 text-sm mt-1">Your personalized action plan</p>
                  </div>
                </div>
                {health.nextActions.length > 0 ? (
                  <div className="space-y-3">
                    {health.nextActions.map((action, index) => {
                      // Only the first item gets "hot" styling
                      const isFirstItem = index === 0;
                      const isHighPriority = action.priority === 'high';
                      
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleActionClick(action)}
                          className={`w-full text-left p-5 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                            isFirstItem && isHighPriority
                              ? 'bg-red-900/20 border-red-600/50 hover:bg-red-900/30 hover:border-red-600 hover:shadow-xl shadow-red-900/20'
                              : isFirstItem
                              ? 'bg-yellow-900/20 border-yellow-600/50 hover:bg-yellow-900/30 hover:border-yellow-600 hover:shadow-xl'
                              : 'bg-zinc-800/30 border-zinc-700/30 hover:bg-zinc-800/50 hover:border-zinc-600/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-white text-lg mb-2">{action.title}</h3>
                              <p className="text-sm text-zinc-300">{action.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isFirstItem && isHighPriority && (
                                <span className="px-3 py-1.5 bg-red-600/30 text-red-300 text-xs font-bold rounded-lg">
                                  HIGH PRIORITY
                                </span>
                              )}
                              <span className={isFirstItem ? "text-white text-xl" : "text-zinc-500 text-lg"}>→</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✨</div>
                    <p className="text-xl text-white font-semibold mb-2">You&apos;re all caught up!</p>
                    <p className="text-zinc-400">Your story is in great shape. Keep developing.</p>
                  </div>
                )}
              </div>

              {/* Story Health Indicators - Compact Status Bar */}
              <div className="bg-zinc-900/20 backdrop-blur-sm rounded-lg border border-zinc-700/20 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Story Health</h3>
                    <span className="text-xs text-zinc-600">Diagnostics</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{getHealthSummary()}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {health.indicators.map((indicator) => (
                    <div
                      key={indicator.name}
                      className="p-1.5 bg-zinc-800/20 rounded border border-zinc-700/20"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-zinc-500">{indicator.name}</span>
                        <span className="text-xs">{getStatusIcon(indicator.status)}</span>
                      </div>
                      <div className="h-0.5 bg-zinc-700/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            indicator.status === 'good' ? 'bg-green-500/40' :
                            indicator.status === 'warning' ? 'bg-yellow-500/40' :
                            'bg-red-500/30'
                          }`}
                          style={{ width: `${indicator.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full Story Summary */}
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

            {/* Sidebar - Workspace Navigation */}
            <div className="space-y-4">
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
              />
              
              {/* Workspace Navigation */}
              <WorkspaceNavigation currentPage="dashboard" bible={bible} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
