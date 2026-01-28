"use client";

import Link from "next/link";

type PageNavigationProps = {
  currentPage: "dashboard" | "timeline" | "builder" | "characters" | "research" | "critique";
};

export function PageNavigation({ currentPage }: PageNavigationProps) {
  const pages = [
    { id: "dashboard", label: "📊 Dashboard", href: "/dashboard" },
    { id: "timeline", label: "⏱️ Timeline", href: "/timeline" },
    { id: "builder", label: "🎭 Builder", href: "/builder" },
    { id: "characters", label: "👥 Characters", href: "/characters" },
    { id: "research", label: "📚 Research", href: "/research" },
    { id: "critique", label: "🔍 Critique", href: "/critique" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {pages.map((page) => (
        <Link
          key={page.id}
          href={page.href}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            currentPage === page.id
              ? page.id === "dashboard"
                ? "bg-blue-600 text-white"
                : page.id === "timeline"
                ? "bg-indigo-600 text-white"
                : "bg-zinc-700 text-white"
              : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800"
          }`}
        >
          {page.label}
        </Link>
      ))}
    </div>
  );
}
