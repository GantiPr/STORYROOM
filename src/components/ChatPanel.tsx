"use client";

import { useRef, useState } from "react";
import type { ChatMessage, Mode, StoryBible } from "@/lib/types";

type Props = {
  mode: Mode;
  context: { mode: Mode; bible: StoryBible };
  messages: ChatMessage[];
  setMessages: (m: ChatMessage[]) => void;
  onBibleUpdate: (b: StoryBible) => void;
};

export default function ChatPanel({
  mode,
  context,
  messages,
  setMessages,
  onBibleUpdate,
}: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: nextMessages,
          bible: context.bible,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages([
          ...nextMessages,
          { role: "assistant", content: `Error: ${err}` },
        ]);
        return;
      }

      const data = (await res.json()) as {
        assistant: string;
        bible?: StoryBible;
      };

      setMessages([...nextMessages, { role: "assistant", content: data.assistant }]);
      if (data.bible) onBibleUpdate(data.bible);

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[75vh] flex-col">
      <div className="border-b border-zinc-800 px-4 py-3">
        <p className="text-sm text-zinc-300">
          Ask for: character sheets, plot beats, critique, or research with citations.
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={[
                  "inline-block max-w-[90%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-zinc-200 text-zinc-900"
                    : "bg-zinc-800 text-zinc-50",
                ].join(" ")}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-zinc-800 p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-md bg-zinc-950 px-3 py-2 text-sm outline-none ring-1 ring-zinc-800"
            placeholder={`Mode: ${mode}. Try: "Build my protagonist" or "Research Victorian London police ranks"`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? send() : null)}
            disabled={busy}
          />
          <button
            className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-60"
            onClick={send}
            disabled={busy}
          >
            {busy ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
