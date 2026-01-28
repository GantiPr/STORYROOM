"use client";

import Link from "next/link";
import type { StoryBible } from "@/lib/types";

type WorkspaceNavigationBarProps = {
  currentPage: "dashboard" | "timeline" | "builder" | "characters" | "research" | "critique";
  bible: StoryBible;
};

export function WorkspaceNavigationBar({ currentPage, bible }: WorkspaceNavigationBarProps) {
  const pages = [
    {
      id: "dashboard",
      href: "/dashboard",
      icon: "📊",
      label: "Dashboard",
      color: "bg-blue-600"
    },
    {
      id: "timeline",
      href: "/timeline",
      icon: "⏱️",
      label: "Timeline",
      color: "bg-indigo-600"
    },
    {
      id: "builder",
      href: "/builder",
      icon: "🎭",
      label: "Builder",
      count: bible.builderSessions?.length || 0,
      color: "bg-blue-600"
    },
    {
      id: "characters",
      href: "/characters",
      icon: "👥",
      label: "Characters",
      count: bible.characters.length,
      color: "bg-purple-600"
    },
    {
      id: "research",
      href: "/research",
      icon: "📚",
      label: "Research",
      count: bible.research.length,
      color: "bg-emerald-600"
    },
    {
      id: "critique",
      href: "/critique",
      icon: "🔍",
      label: "Critique",
      color: "bg-gradient-to-r from-red-600 to-orange-600"
    }
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {pages.map((page) => {
        const isActive = currentPage === page.id;
        
        // Don't show link to current page
        if (isActive) return null;
        
        return (
          <Link
            key={page.id}
            href={page.href}
            className="px-6 py-3 rounded-lg font-medium transition-all bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <span className="flex items-center gap-2">
              <span>{page.icon}</span>
              <span>{page.label}</span>
              {page.count !== undefined && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-700">
                  {page.count}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
