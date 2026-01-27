"use client";

import type { StoryBible } from "@/lib/types";

type Props = {
  bible: StoryBible;
  setBible: (b: StoryBible) => void;
};

export default function BiblePanel({ bible, setBible }: Props) {
  return (
    <div className="h-[75vh] overflow-auto p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Story Bible</h2>
        <p className="text-sm text-zinc-300">
          Structured canon. The assistant updates this when asked.
        </p>
      </div>

      <section className="mb-6 space-y-2">
        <label className="text-xs uppercase tracking-wide text-zinc-400">Title</label>
        <input
          className="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm ring-1 ring-zinc-800 outline-none"
          value={bible.title}
          onChange={(e) => setBible({ ...bible, title: e.target.value })}
        />

        <label className="mt-3 block text-xs uppercase tracking-wide text-zinc-400">
          Premise
        </label>
        <textarea
          className="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm ring-1 ring-zinc-800 outline-none"
          rows={3}
          value={bible.premise}
          onChange={(e) => setBible({ ...bible, premise: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-zinc-400">
              Genre
            </label>
            <input
              className="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm ring-1 ring-zinc-800 outline-none"
              value={bible.genre}
              onChange={(e) => setBible({ ...bible, genre: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-zinc-400">
              Themes (comma)
            </label>
            <input
              className="w-full rounded-md bg-zinc-950 px-3 py-2 text-sm ring-1 ring-zinc-800 outline-none"
              value={bible.themes.join(", ")}
              onChange={(e) =>
                setBible({
                  ...bible,
                  themes: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-zinc-200">Characters</h3>
        <div className="space-y-3">
          {bible.characters.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No characters yet. Ask the assistant: “Create a protagonist character sheet.”
            </p>
          ) : (
            bible.characters.map((c, index) => (
              <div key={c.id} className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 mr-3">
                    <input
                      className="w-full font-medium bg-transparent border-none outline-none text-white"
                      value={c.name}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, name: e.target.value };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                      placeholder="Character name"
                    />
                    <select
                      className="text-xs text-zinc-400 bg-transparent border-none outline-none mt-1"
                      value={c.role}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, role: e.target.value as any };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                    >
                      <option value="protagonist">Protagonist</option>
                      <option value="antagonist">Antagonist</option>
                      <option value="supporting">Supporting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-400">{c.id}</p>
                </div>
                
                <textarea
                  className="w-full mt-2 text-sm text-zinc-200 bg-transparent border-none outline-none resize-none"
                  value={c.logline}
                  onChange={(e) => {
                    const updatedCharacters = [...bible.characters];
                    updatedCharacters[index] = { ...c, logline: e.target.value };
                    setBible({ ...bible, characters: updatedCharacters });
                  }}
                  placeholder="Character logline"
                  rows={2}
                />
                
                <div className="mt-3 space-y-2">
                  <div>
                    <label className="text-xs text-zinc-500">Desire:</label>
                    <input
                      className="w-full text-xs text-zinc-300 bg-transparent border-none outline-none ml-2"
                      value={c.desire}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, desire: e.target.value };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                      placeholder="What they want"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-500">Fear:</label>
                    <input
                      className="w-full text-xs text-zinc-300 bg-transparent border-none outline-none ml-2"
                      value={c.fear}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, fear: e.target.value };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                      placeholder="What they're afraid of"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-500">Wound:</label>
                    <input
                      className="w-full text-xs text-zinc-300 bg-transparent border-none outline-none ml-2"
                      value={c.wound}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, wound: e.target.value };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                      placeholder="Past trauma or hurt"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-zinc-500">Contradiction:</label>
                    <input
                      className="w-full text-xs text-zinc-300 bg-transparent border-none outline-none ml-2"
                      value={c.contradiction}
                      onChange={(e) => {
                        const updatedCharacters = [...bible.characters];
                        updatedCharacters[index] = { ...c, contradiction: e.target.value };
                        setBible({ ...bible, characters: updatedCharacters });
                      }}
                      placeholder="Internal conflict or paradox"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-8">
        <h3 className="mb-2 text-sm font-semibold text-zinc-200">Plot Beats</h3>
        <div className="space-y-3">
          {bible.plot.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No beats yet. Ask: “Draft a 9-beat act structure for this premise.”
            </p>
          ) : (
            bible.plot.map((b) => (
              <div key={b.id} className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{b.label}</p>
                  <p className="text-xs text-zinc-400">{b.id}</p>
                </div>
                <p className="mt-2 text-sm text-zinc-200">{b.summary}</p>
                <p className="mt-2 text-xs text-zinc-300">
                  <span className="text-zinc-500">Stakes:</span> {b.stakes}
                </p>
                <p className="mt-1 text-xs text-zinc-300">
                  <span className="text-zinc-500">Turn:</span> {b.turn}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-zinc-200">Research Library</h3>
        <div className="space-y-3">
          {bible.research.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No research notes yet. Switch to Research mode and ask a factual question.
            </p>
          ) : (
            bible.research.map((n) => (
              <div key={n.id} className="rounded-lg bg-zinc-950 p-3 ring-1 ring-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{n.question}</p>
                  <p className="text-xs text-zinc-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-200">
                  {n.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
                <div className="mt-3 text-xs text-zinc-400">
                  Sources:{" "}
                  {n.sources.map((s) => (
                    <span key={s.id} className="mr-2">
                      [{s.id}] {s.domain}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
