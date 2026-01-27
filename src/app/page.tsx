"use client";

import { useMemo, useState } from "react";
import type { ChatMessage, Mode } from "@/lib/types";
import { useBible } from "@/hooks/useBible";
import ChatPanel from "@/components/ChatPanel";
import BiblePanel from "@/components/BiblePanel";

export default function Home() {
  const [mode, setMode] = useState<Mode>("develop");
  const { bible, setBible, isLoaded, isSaving, manualSave } = useBible();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome to Storyroom. Tell me your premise, or ask me to build a character, plot beats, or research something for authenticity.",
    },
  ]);

  const context = useMemo(() => {
    // Keep context compact; we'll improve later with retrieval + summarization.
    return {
      mode,
      bible,
    };
  }, [mode, bible]);

  // Don't render until bible is loaded to prevent hydration issues
  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Storyroom</h1>
            <p className="text-sm text-zinc-300">
              A story bible + research assistant with citations.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-3">
              <a
                href="/characters"
                className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                Characters
              </a>
              <a
                href="/research"
                className="px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
              >
                Research
              </a>
            </nav>
            
            <div className="flex items-center gap-3">
              {/* Save Status & Button */}
              <div className="flex items-center gap-2">
                {isSaving ? (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Saved
                  </div>
                )}
                <button
                  onClick={manualSave}
                  disabled={isSaving}
                  className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded text-zinc-300 transition-colors"
                >
                  Save Now
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-zinc-300">Mode</label>
                <select
                  className="rounded-md bg-zinc-900 px-3 py-2 text-sm outline-none ring-1 ring-zinc-800"
                  value={mode}
                  onChange={(e) => setMode(e.target.value as Mode)}
                >
                  <option value="brainstorm">Brainstorm</option>
                  <option value="develop">Develop</option>
                  <option value="research">Research</option>
                  <option value="critique">Critique</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-zinc-900/40 ring-1 ring-zinc-800">
            <ChatPanel
              mode={mode}
              context={context}
              messages={messages}
              setMessages={setMessages}
              onBibleUpdate={setBible}
            />
          </div>

          <div className="rounded-xl bg-zinc-900/40 ring-1 ring-zinc-800">
            <BiblePanel bible={bible} setBible={setBible} />
          </div>
        </div>
      </div>
    </main>
  );
}