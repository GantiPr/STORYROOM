"use client";

import { useState } from "react";
import { useBible } from "@/hooks/useBible";
import { TimelineView } from "@/components/TimelineView";
import { WorkspaceNavigationBar } from "@/components/WorkspaceNavigationBar";

export default function TimelinePage() {
  const { bible, setBible, isLoaded, isSaving } = useBible();
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);

  // Load existing timeline from bible
  const timeline = bible.timeline || null;

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
      
      // Save timeline to bible
      setBible(prev => ({
        ...prev,
        timeline: data.timeline
      }));
    } catch (error) {
      console.error("Timeline error:", error);
      alert("Failed to generate timeline. Please try again.");
    } finally {
      setIsGeneratingTimeline(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading timeline...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header with Navigation */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Timeline
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">AI-powered tool that generates a chronological timeline of all story events with consistency analysis</p>
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
                    <span className="font-semibold text-white">Why this matters:</span> AI-powered tool that detects logical gaps, contradictions, and unmotivated character changes by analyzing chronology and cause-effect relationships across your entire story.
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
          <WorkspaceNavigationBar currentPage="timeline" bible={bible} />
        </div>

        {/* Timeline Content */}
        <TimelineView
          timeline={timeline}
          isGenerating={isGeneratingTimeline}
          onGenerate={generateTimeline}
        />
      </div>
    </div>
  );
}
