"use client";

import Link from "next/link";
import type { StoryBible } from "@/lib/types";

type WorkspaceNavigationProps = {
  currentPage: "dashboard" | "timeline" | "builder" | "characters" | "research" | "critique";
  bible: StoryBible;
};

export function WorkspaceNavigation({ currentPage, bible }: WorkspaceNavigationProps) {
  const pages = [
    {
      id: "dashboard",
      href: "/dashboard",
      icon: "📊",
      label: "Dashboard",
      subtitle: "Overview",
      description: "Story health and next actions",
      color: "bg-blue-900/20 hover:bg-blue-900/30 border-blue-700/30",
      hoverColor: "group-hover:text-blue-300"
    },
    {
      id: "timeline",
      href: "/timeline",
      icon: "⏱️",
      label: "Timeline",
      subtitle: "Consistency analysis",
      description: "Check chronology and detect issues",
      color: "bg-indigo-900/20 hover:bg-indigo-900/30 border-indigo-700/30",
      hoverColor: "group-hover:text-indigo-300"
    },
    {
      id: "builder",
      href: "/builder",
      icon: "🎭",
      label: "Builder",
      subtitle: `${bible.builderSessions?.length || 0} sessions`,
      description: "Explore themes, conflicts, and scenarios",
      color: "bg-blue-900/20 hover:bg-blue-900/30 border-blue-700/30",
      hoverColor: "group-hover:text-blue-300"
    },
    {
      id: "characters",
      href: "/characters",
      icon: "👥",
      label: "Characters",
      subtitle: `${bible.characters.length} characters`,
      description: "Create and develop character arcs",
      color: "bg-purple-900/20 hover:bg-purple-900/30 border-purple-700/30",
      hoverColor: "group-hover:text-purple-300"
    },
    {
      id: "research",
      href: "/research",
      icon: "📚",
      label: "Research",
      subtitle: `${bible.research.length} notes`,
      description: "Gather authentic details and sources",
      color: "bg-emerald-900/20 hover:bg-emerald-900/30 border-emerald-700/30",
      hoverColor: "group-hover:text-emerald-300"
    },
    {
      id: "critique",
      href: "/critique",
      icon: "🔍",
      label: "Critique",
      subtitle: "AI Analysis",
      description: "Identify strengths and gaps",
      color: "bg-gradient-to-br from-red-900/20 to-orange-900/20 hover:from-red-900/30 hover:to-orange-900/30 border-red-700/30",
      hoverColor: "group-hover:text-red-300"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white mb-4">Workspace</h3>
      
      {pages.map((page) => {
        const isActive = currentPage === page.id;
        
        // Don't show link to current page
        if (isActive) return null;
        
        return (
          <Link
            key={page.id}
            href={page.href}
            className={`block p-6 border rounded-xl transition-all group ${page.color}`}
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-3xl">{page.icon}</div>
              <div className="flex-1">
                <div className={`font-semibold text-white ${page.hoverColor} transition-colors`}>
                  {page.label}
                </div>
                <div className="text-xs text-zinc-500">{page.subtitle}</div>
              </div>
            </div>
            <div className="text-sm text-zinc-400">{page.description}</div>
          </Link>
        );
      })}
    </div>
  );
}
