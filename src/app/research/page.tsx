"use client";

import { useState, useEffect, useRef } from "react";
import { useBible } from "@/hooks/useBible";
import type { ResearchNote } from "@/lib/types";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: string; domain: string; url: string; title: string }>;
};

export default function ResearchPage() {
  const { bible, setBible, isLoaded, isSaving } = useBible();
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showResearchChat, setShowResearchChat] = useState(false);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const handleCreateNote = () => {
    setShowResearchChat(true);
  };

  const handleSaveNoteFromChat = (note: ResearchNote) => {
    // Save the research note
    setBible(prev => ({
      ...prev,
      research: [...prev.research, note]
    }));

    // Update linked characters with this research note ID
    if (note.linkedTo && note.linkedTo.length > 0) {
      setBible(prev => ({
        ...prev,
        characters: prev.characters.map(char => {
          const isLinked = note.linkedTo?.some(link => link.type === "character" && link.id === char.id);
          if (isLinked) {
            return {
              ...char,
              researchNotes: [...(char.researchNotes || []), note.id]
            };
          }
          return char;
        })
      }));
    }

    setShowResearchChat(false);
    setSelectedNote(note);
  };

  const handleSaveNote = (note: ResearchNote) => {
    if (isCreating) {
      setBible(prev => ({
        ...prev,
        research: [...prev.research, note]
      }));
      setIsCreating(false);
    } else {
      setBible(prev => ({
        ...prev,
        research: prev.research.map(n => n.id === note.id ? note : n)
      }));
    }
    setSelectedNote(note);
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Delete this research note?")) {
      setBible(prev => ({
        ...prev,
        research: prev.research.filter(n => n.id !== noteId)
      }));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Research Library
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">Deep dive into your story's world with AI-powered research</p>
            </div>
            <div className="flex items-center gap-4">
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
              
              <Link
                href="/"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all hover:scale-105 border border-zinc-700"
              >
                ← Back to Story
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Research Notes List */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Research Notes
                  <span className="ml-2 text-sm text-zinc-500">({bible.research.length})</span>
                </h2>
                
                <button
                  onClick={handleCreateNote}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-emerald-900/50"
                >
                  + New
                </button>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                {bible.research.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-3xl">📚</span>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">No research notes yet</p>
                    <button
                      onClick={handleCreateNote}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-all"
                    >
                      Start Research
                    </button>
                  </div>
                ) : (
                  bible.research.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (selectedNote?.id === note.id) {
                          setSelectedNote(null);
                        } else {
                          setSelectedNote(note);
                          setIsCreating(false);
                        }
                      }}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedNote?.id === note.id
                          ? "bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border-emerald-600/50 shadow-lg shadow-emerald-900/20"
                          : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                      }`}
                    >
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                        {note.question || "Untitled Research"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">
                          {note.bullets.length} notes
                        </span>
                        {note.sources.length > 0 && (
                          <>
                            <span className="text-xs text-zinc-500">•</span>
                            <span className="text-xs text-zinc-500">
                              {note.sources.length} sources
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {selectedNote ? (
              <ResearchNoteDetail
                note={selectedNote}
                isCreating={isCreating}
                onSave={handleSaveNote}
                onDelete={() => handleDeleteNote(selectedNote.id)}
                onCancel={() => {
                  setSelectedNote(null);
                  setIsCreating(false);
                }}
              />
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8 flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                    <span className="text-5xl">🔬</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Start Your Research</h3>
                  <p className="text-zinc-400 mb-6 max-w-md">
                    Chat with AI to investigate topics, challenge assumptions, and gather scholarly sources for your story
                  </p>
                  <button
                    onClick={handleCreateNote}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-lg font-medium transition-all hover:scale-105 shadow-lg shadow-emerald-900/50"
                  >
                    Begin Research Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Research Chat Modal */}
      {showResearchChat && (
        <ResearchChatModal
          onClose={() => setShowResearchChat(false)}
          onSave={handleSaveNoteFromChat}
          nextNoteId={`R${bible.research.length + 1}`}
          storyContext={bible}
        />
      )}
    </div>
  );
}


// Research Chat Modal Component
function ResearchChatModal({
  onClose,
  onSave,
  nextNoteId,
  storyContext
}: {
  onClose: () => void;
  onSave: (note: ResearchNote) => void;
  nextNoteId: string;
  storyContext: any;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I'm your research assistant. I have access to scholarly sources and can help you investigate topics for your story. What would you like to research?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedNotes, setAgreedNotes] = useState<string[]>([]);
  const [sources, setSources] = useState<Array<{ id: string; domain: string; url: string; title: string }>>([]);
  const [linkedCharacters, setLinkedCharacters] = useState<string[]>([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // First, search for relevant sources
      const searchResponse = await fetch("/api/research-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input })
      });
      const searchData = await searchResponse.json();
      const foundSources = searchData.results || [];

      // Then get AI response with context
      const response = await fetch("/api/research-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          researchContext: {
            agreedNotes,
            sources: foundSources.slice(0, 5)
          },
          storyContext: {
            title: storyContext.title,
            premise: storyContext.premise,
            genre: storyContext.genre,
            themes: storyContext.themes
          }
        })
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      let tempMessages = [...messages, userMessage];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  assistantMessage += parsed.text;
                  setMessages([...tempMessages, { 
                    role: "assistant", 
                    content: assistantMessage,
                    sources: foundSources.slice(0, 3)
                  }]);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Add sources to the collection
      if (foundSources.length > 0) {
        setSources(prev => {
          const newSources = foundSources.slice(0, 3).filter(
            (s: any) => !prev.some(existing => existing.url === s.url)
          );
          return [...prev, ...newSources];
        });
      }

    } catch (error) {
      console.error("Research chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgreeToNote = (content: string) => {
    if (!agreedNotes.includes(content)) {
      setAgreedNotes(prev => [...prev, content]);
    }
  };

  const handleSaveResearch = () => {
    if (agreedNotes.length === 0) {
      alert("Please agree to at least one research note before saving.");
      return;
    }

    // Extract question from first user message or use default
    const firstUserMessage = messages.find(m => m.role === "user");
    const question = firstUserMessage?.content || "Research Session";

    const newNote: ResearchNote = {
      id: nextNoteId,
      question,
      bullets: agreedNotes,
      sources: sources.map((s, idx) => ({
        id: `S${idx + 1}`,
        domain: s.domain,
        url: s.url,
        title: s.title
      })),
      createdAt: new Date().toISOString(),
      linkedTo: linkedCharacters.map(charId => ({
        type: "character" as const,
        id: charId
      }))
    };

    onSave(newNote);
  };

  const toggleCharacterLink = (characterId: string) => {
    setLinkedCharacters(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Research Session</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-zinc-400">
                {agreedNotes.length} notes • {sources.length} sources
              </p>
              {linkedCharacters.length > 0 && (
                <>
                  <span className="text-zinc-600">•</span>
                  <p className="text-sm text-emerald-400">
                    Linked to {linkedCharacters.length} character{linkedCharacters.length !== 1 ? 's' : ''}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                onClick={() => setShowLinkMenu(!showLinkMenu)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
              >
                🔗 Link to Characters
                {linkedCharacters.length > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-600 rounded-full text-xs">
                    {linkedCharacters.length}
                  </span>
                )}
              </button>
              
              {showLinkMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 z-10 max-h-80 overflow-y-auto">
                  <div className="p-3 border-b border-zinc-700">
                    <p className="text-xs text-zinc-400">Select characters to link this research to:</p>
                  </div>
                  {storyContext.characters.length === 0 ? (
                    <div className="p-4 text-center text-sm text-zinc-500">
                      No characters yet
                    </div>
                  ) : (
                    <div className="p-2">
                      {storyContext.characters.map((char: any) => (
                        <button
                          key={char.id}
                          onClick={() => toggleCharacterLink(char.id)}
                          className={`w-full px-3 py-2 text-left rounded-lg text-sm transition-all flex items-center gap-2 ${
                            linkedCharacters.includes(char.id)
                              ? "bg-emerald-600 text-white"
                              : "hover:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          <span>{linkedCharacters.includes(char.id) ? "✓" : "○"}</span>
                          <span className="flex-1">{char.name || "Unnamed"}</span>
                          <span className="text-xs opacity-70">{char.id}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <button
              onClick={handleSaveResearch}
              disabled={agreedNotes.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              Save Research
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${msg.role === "user" ? "bg-emerald-600" : "bg-zinc-800"} rounded-2xl p-4`}>
                    <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <p className="text-xs text-zinc-400 mb-2">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, sidx) => (
                            <a
                              key={sidx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              [{sidx + 1}] {source.domain}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {msg.role === "assistant" && (
                      <button
                        onClick={() => handleAgreeToNote(msg.content)}
                        disabled={agreedNotes.includes(msg.content)}
                        className="mt-3 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded text-xs font-medium transition-all"
                      >
                        {agreedNotes.includes(msg.content) ? "✓ Agreed" : "Agree & Save Note"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75"></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Ask a research question..."
                  className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Agreed Notes Panel */}
          <div className="w-80 border-l border-zinc-800 p-6 overflow-y-auto custom-scrollbar bg-zinc-950/50">
            <h3 className="text-lg font-semibold text-white mb-4">Agreed Notes ({agreedNotes.length})</h3>
            {agreedNotes.length === 0 ? (
              <p className="text-sm text-zinc-500">Click "Agree & Save Note" on AI responses to add them here</p>
            ) : (
              <div className="space-y-3">
                {agreedNotes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <p className="text-sm text-zinc-300 flex-1">{note}</p>
                      <button
                        onClick={() => setAgreedNotes(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {sources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sources ({sources.length})</h3>
                <div className="space-y-2">
                  {sources.map((source, idx) => (
                    <div key={idx} className="p-2 bg-zinc-800/50 rounded border border-zinc-700/50">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 block"
                      >
                        [{idx + 1}] {source.domain}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Research Note Detail Component
function ResearchNoteDetail({
  note,
  isCreating,
  onSave,
  onDelete,
  onCancel
}: {
  note: ResearchNote;
  isCreating: boolean;
  onSave: (note: ResearchNote) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [editedNote, setEditedNote] = useState<ResearchNote>(note);
  const [newBullet, setNewBullet] = useState("");

  useEffect(() => {
    setEditedNote(note);
  }, [note]);

  const handleAddBullet = () => {
    if (newBullet.trim()) {
      setEditedNote(prev => ({
        ...prev,
        bullets: [...prev.bullets, newBullet.trim()]
      }));
      setNewBullet("");
    }
  };

  const handleRemoveBullet = (index: number) => {
    setEditedNote(prev => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">
          {isCreating ? "New Research Note" : "Research Note"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(editedNote)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-all"
          >
            Save
          </button>
          {!isCreating && (
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium transition-all"
            >
              Delete
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 custom-scrollbar">
        {/* Question/Topic */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Research Question/Topic</label>
          <input
            type="text"
            value={editedNote.question}
            onChange={(e) => setEditedNote(prev => ({ ...prev, question: e.target.value }))}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="What are you researching?"
          />
        </div>

        {/* Bullets/Notes */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Research Notes</label>
          <div className="space-y-2 mb-3">
            {editedNote.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <span className="text-zinc-400 mt-1">•</span>
                <p className="flex-1 text-zinc-200">{bullet}</p>
                <button
                  onClick={() => handleRemoveBullet(idx)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddBullet()}
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Add a research note..."
            />
            <button
              onClick={handleAddBullet}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-all"
            >
              Add
            </button>
          </div>
        </div>

        {/* Sources */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Sources ({editedNote.sources.length})
          </label>
          {editedNote.sources.length === 0 ? (
            <p className="text-sm text-zinc-500">No sources added yet</p>
          ) : (
            <div className="space-y-2">
              {editedNote.sources.map((source) => (
                <div key={source.id} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-300">{source.title || source.domain}</p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block"
                      >
                        {source.domain} →
                      </a>
                    </div>
                    <span className="text-xs text-zinc-500">[{source.id}]</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
