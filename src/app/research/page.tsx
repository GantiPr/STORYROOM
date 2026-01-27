"use client";

import { useState, useEffect, useRef } from "react";
import { useBible } from "@/hooks/useBible";
import type { ResearchNote, CanonEntry } from "@/lib/types";
import { ConvertToCanonModal } from "@/components/ConvertToCanonModal";
import Link from "next/link";

type ParsedPoint = {
  id: string;
  content: string;
  isSelected: boolean;
};

type AgreedNote = {
  content: string;
  sources: Array<{ id: string; domain: string; url: string; title: string }>;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ id: string; domain: string; url: string; title: string }>;
  parsedPoints?: ParsedPoint[];
};

export default function ResearchPage() {
  const { bible, setBible, isLoaded, isSaving } = useBible();
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showResearchChat, setShowResearchChat] = useState(false);
  const [continueResearchNote, setContinueResearchNote] = useState<ResearchNote | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const handleCreateNote = () => {
    setContinueResearchNote(null);
    setShowResearchChat(true);
  };

  const handleContinueResearch = (note: ResearchNote) => {
    setContinueResearchNote(note);
    setShowResearchChat(true);
  };

  const handleSaveNoteFromChat = (note: ResearchNote) => {
    console.log('=== handleSaveNoteFromChat called ===');
    console.log('Note to save:', note);
    console.log('Current research count:', bible.research.length);
    console.log('Note linkedTo:', note.linkedTo);
    
    // Simply add the research note - characters will find it via linkedTo
    setBible(prev => ({
      ...prev,
      research: [...prev.research, note]
    }));

    console.log('Closing chat and setting selected note');
    setShowResearchChat(false);
    setSelectedNote(note);
  };

  const handleSaveNote = (note: ResearchNote) => {
    console.log('=== handleSaveNote called ===');
    console.log('Note ID:', note.id);
    console.log('Note question:', note.question);
    console.log('Note linkedTo:', note.linkedTo);
    console.log('Is creating:', isCreating);
    
    setBible(prev => {
      // Update or add the research note
      const updatedResearch = isCreating
        ? [...prev.research, note]
        : prev.research.map(n => n.id === note.id ? note : n);
      
      console.log('Updated research count:', updatedResearch.length);
      console.log('Research note saved with linkedTo:', note.linkedTo);
      
      return {
        ...prev,
        research: updatedResearch
      };
    });
    
    setIsCreating(false);
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
                href="/builder"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                🎭 Builder
              </Link>
              
              <Link
                href="/characters"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                👥 Characters
              </Link>
              
              <Link
                href="/critique"
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-lg text-sm font-medium transition-all hover:scale-105"
              >
                🔍 Critique
              </Link>
              
              <Link
                href="/projects"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all hover:scale-105 border border-zinc-700"
              >
                ← Projects
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
                      className={`group p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedNote?.id === note.id
                          ? "bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 border-emerald-600/50 shadow-lg shadow-emerald-900/20"
                          : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                      }`}
                    >
                      <div onClick={() => {
                        if (selectedNote?.id === note.id) {
                          setSelectedNote(null);
                        } else {
                          setSelectedNote(note);
                          setIsCreating(false);
                        }
                      }}>
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
                        {note.summary && (
                          <p className="text-xs text-zinc-400 mt-2 line-clamp-2 italic">
                            {note.summary}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContinueResearch(note);
                        }}
                        className="mt-3 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-all"
                      >
                        🔄 Continue Research
                      </button>
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
          onClose={() => {
            setShowResearchChat(false);
            setContinueResearchNote(null);
          }}
          onSave={handleSaveNoteFromChat}
          nextNoteId={`R${bible.research.length + 1}`}
          storyContext={bible}
          existingNote={continueResearchNote}
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
  storyContext,
  existingNote
}: {
  onClose: () => void;
  onSave: (note: ResearchNote) => void;
  nextNoteId: string;
  storyContext: any;
  existingNote?: ResearchNote | null;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (existingNote) {
      // Reconstruct conversation from existing note
      return [
        {
          role: "assistant",
          content: "I'm continuing our previous research session. Here's what we discussed:\n\n" + 
                   (existingNote.summary || existingNote.bullets.join('\n\n')) +
                   "\n\nWhat else would you like to investigate?"
        }
      ];
    }
    return [
      {
        role: "assistant",
        content: "I'm your research assistant. I have access to scholarly sources and can help you investigate topics for your story. What would you like to research?"
      }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreedNotes, setAgreedNotes] = useState<AgreedNote[]>(() => {
    if (existingNote) {
      // Pre-populate with existing notes
      return existingNote.bullets.map(bullet => ({
        content: bullet,
        sources: existingNote.sources
      }));
    }
    return [];
  });
  const [allSources, setAllSources] = useState<Array<{ id: string; domain: string; url: string; title: string }>>(() => {
    return existingNote?.sources || [];
  });
  const [sessionSummary, setSessionSummary] = useState<string>(existingNote?.summary || "");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [newTag, setNewTag] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parse AI response into individual selectable points
  const parseIntoPoints = (content: string): ParsedPoint[] => {
    const points: ParsedPoint[] = [];
    let idCounter = 0;
    
    // Extract bullet points (-, •, *)
    const bulletMatches = content.match(/^[\s]*[-•*]\s+(.+)$/gm);
    if (bulletMatches && bulletMatches.length > 0) {
      bulletMatches.forEach(match => {
        const cleaned = match.replace(/^[\s]*[-•*]\s+/, '').trim();
        if (cleaned.length > 10) {
          points.push({
            id: `point-${idCounter++}`,
            content: cleaned,
            isSelected: false
          });
        }
      });
    }
    
    // Extract numbered points (1., 2., etc.)
    const numberedMatches = content.match(/^[\s]*\d+\.\s+(.+)$/gm);
    if (numberedMatches && numberedMatches.length > 0) {
      numberedMatches.forEach(match => {
        const cleaned = match.replace(/^[\s]*\d+\.\s+/, '').trim();
        if (cleaned.length > 10) {
          points.push({
            id: `point-${idCounter++}`,
            content: cleaned,
            isSelected: false
          });
        }
      });
    }
    
    // If no structured points, split by paragraphs
    if (points.length === 0) {
      const paragraphs = content.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 30);
      paragraphs.forEach(para => {
        points.push({
          id: `point-${idCounter++}`,
          content: para,
          isSelected: false
        });
      });
    }
    
    return points;
  };

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
            agreedNotes: agreedNotes.map(n => n.content),
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

      // Parse the complete response into selectable points
      if (assistantMessage) {
        const parsedPoints = parseIntoPoints(assistantMessage);
        setMessages(prev => {
          const updated = [...prev];
          const lastMsg = updated[updated.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.parsedPoints = parsedPoints;
          }
          return updated;
        });
      }

      // Add sources to the collection
      if (foundSources.length > 0) {
        setAllSources(prev => {
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

  const handleAgreeToNote = (message: ChatMessage) => {
    const noteExists = agreedNotes.some(n => n.content === message.content);
    if (!noteExists) {
      setAgreedNotes(prev => [...prev, {
        content: message.content,
        sources: message.sources || []
      }]);
    }
  };

  const handleSaveResearch = async () => {
    if (agreedNotes.length === 0) {
      alert("Please agree to at least one research note before saving.");
      return;
    }

    console.log('Saving research with agreed notes:', agreedNotes);

    // Extract question from first user message or use default
    const firstUserMessage = messages.find(m => m.role === "user");
    const question = firstUserMessage?.content || "Research Session";

    // Collect all unique sources
    const allNoteSources = agreedNotes.flatMap(n => n.sources);
    const uniqueSources = allNoteSources.filter((s, idx, arr) => 
      arr.findIndex(x => x.url === s.url) === idx
    );

    const newNote: ResearchNote = {
      id: nextNoteId,
      question,
      bullets: agreedNotes.map(n => n.content),
      sources: uniqueSources.map((s, idx) => ({
        id: `S${idx + 1}`,
        domain: s.domain,
        url: s.url,
        title: s.title
      })),
      createdAt: new Date().toISOString(),
      summary: sessionSummary || undefined,
      tags: tags.length > 0 ? tags : undefined
    };

    console.log('=== Calling onSave with research note ===');
    console.log('Research note:', newNote);
    console.log('Note ID:', newNote.id);
    console.log('Bullets count:', newNote.bullets.length);
    
    // Call onSave and wait a moment for state to update
    onSave(newNote);
    
    // Give it a moment to save to localStorage/database
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const removeNote = (index: number) => {
    setAgreedNotes(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const generateSummary = async () => {
    if (messages.length <= 1) {
      alert("Have a conversation first before generating a summary.");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/research-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: "user",
              content: "Please provide a comprehensive but easy-to-read summary of everything we discussed in this research session. Include: 1) Main topics investigated, 2) Key findings and insights, 3) Important facts discovered, 4) Any recommendations for further research. Make it clear and concise."
            }
          ],
          researchContext: {
            agreedNotes: agreedNotes.map(n => n.content),
            sources: allSources
          },
          storyContext: {
            title: storyContext.title,
            premise: storyContext.premise,
            genre: storyContext.genre,
            themes: storyContext.themes
          }
        })
      });

      if (!response.ok) throw new Error("Failed to generate summary");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let summary = "";

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
                  summary += parsed.text;
                  setSessionSummary(summary);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Summary generation error:", error);
      alert("Failed to generate summary. Please try again.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Research Session</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-zinc-400">
                {agreedNotes.length} notes agreed • {allSources.length} sources
              </p>
            </div>
            
            {/* Tags Input */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag (e.g., 'Medieval Warfare', 'Psychology')"
                className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={addTag}
                className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs font-medium transition-all"
              >
                + Tag
              </button>
            </div>
            
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-600/20 border border-blue-600/50 rounded text-xs text-blue-400 flex items-center gap-1"
                  >
                    🏷️ {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:text-blue-300"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateSummary}
              disabled={isGeneratingSummary || messages.length <= 1}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {isGeneratingSummary ? "Generating..." : "📝 Generate Summary"}
            </button>
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
                    {/* Render content with inline checkboxes for parsed points */}
                    {msg.role === "assistant" && msg.parsedPoints && msg.parsedPoints.length > 0 ? (
                      <div className="space-y-2">
                        {msg.parsedPoints.map((point) => (
                          <div key={point.id} className="flex items-start gap-2 group">
                            <button
                              onClick={() => {
                                const isChecked = !point.isSelected;
                                setMessages(prev => {
                                  const updated = [...prev];
                                  const message = updated[idx];
                                  if (message.parsedPoints) {
                                    message.parsedPoints = message.parsedPoints.map(p =>
                                      p.id === point.id ? { ...p, isSelected: isChecked } : p
                                    );
                                  }
                                  return updated;
                                });
                                
                                // Add/remove from agreed notes
                                if (isChecked) {
                                  handleAgreeToNote({
                                    role: "assistant",
                                    content: point.content,
                                    sources: msg.sources
                                  });
                                } else {
                                  setAgreedNotes(prev => prev.filter(n => n.content !== point.content));
                                }
                              }}
                              className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                                point.isSelected 
                                  ? "bg-emerald-600 border-emerald-600" 
                                  : "border-zinc-600 hover:border-emerald-500 opacity-50 group-hover:opacity-100"
                              }`}
                            >
                              {point.isSelected && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                            <p className="text-white text-sm leading-relaxed flex-1">{point.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                    )}
                    
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
            {/* Session Summary */}
            {sessionSummary && (
              <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                  <span>📝</span>
                  <span>Session Summary</span>
                </h3>
                <div className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {sessionSummary}
                </div>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-white mb-4">Agreed Notes ({agreedNotes.length})</h3>
            {agreedNotes.length === 0 ? (
              <p className="text-sm text-zinc-500">Click "Agree & Save" on AI responses to add them here</p>
            ) : (
              <div className="space-y-3">
                {agreedNotes.map((note, idx) => (
                  <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-emerald-500 mt-1">✓</span>
                      <p className="text-sm text-zinc-300 flex-1">{note.content}</p>
                      <button
                        onClick={() => removeNote(idx)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {allSources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sources ({allSources.length})</h3>
                <div className="space-y-2">
                  {allSources.map((source, idx) => (
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
  const { bible, setBible } = useBible();
  const [editedNote, setEditedNote] = useState<ResearchNote>(note);
  const [newBullet, setNewBullet] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedBullet, setSelectedBullet] = useState<string>("");

  useEffect(() => {
    setEditedNote(note);
    setHasUnsavedChanges(false);
  }, [note]);

  // Track changes
  useEffect(() => {
    const hasChanges = JSON.stringify(editedNote) !== JSON.stringify(note);
    setHasUnsavedChanges(hasChanges);
  }, [editedNote, note]);

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

  const handleToggleCharacterLink = (characterId: string) => {
    setEditedNote(prev => {
      const currentLinks = prev.linkedTo || [];
      const isLinked = currentLinks.some(link => link.type === "character" && link.id === characterId);
      
      const newLinks = isLinked
        ? currentLinks.filter(link => !(link.type === "character" && link.id === characterId))
        : [...currentLinks, { type: "character" as const, id: characterId }];
      
      return {
        ...prev,
        linkedTo: newLinks
      };
    });
  };

  const linkedCharacterIds = (editedNote.linkedTo || [])
    .filter(link => link.type === "character")
    .map(link => link.id);

  const handleCanonCreated = (canonEntry: CanonEntry) => {
    // Add to bible.canon array
    setBible(prev => ({
      ...prev,
      canon: [...(prev.canon || []), canonEntry]
    }));

    // Add to note.canonEntries
    setEditedNote(prev => ({
      ...prev,
      canonEntries: [...(prev.canonEntries || []), canonEntry]
    }));

    setShowConvertModal(false);
    setHasUnsavedChanges(true);
  };

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {isCreating ? "New Research Note" : "Research Note"}
          </h2>
          {hasUnsavedChanges && (
            <p className="text-sm text-yellow-500 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
              Unsaved changes - Click Save to keep your changes
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              onSave(editedNote);
              setHasUnsavedChanges(false);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {hasUnsavedChanges ? "💾 Save Changes" : "Save"}
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
            onClick={() => {
              if (hasUnsavedChanges && !confirm("You have unsaved changes. Are you sure you want to cancel?")) {
                return;
              }
              onCancel();
            }}
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
              <div key={idx} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="flex items-start gap-2">
                  <span className="text-zinc-400 mt-1">•</span>
                  <p className="flex-1 text-zinc-200">{bullet}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBullet(bullet);
                        setShowConvertModal(true);
                      }}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded text-xs font-medium text-blue-400 transition-all"
                      title="Convert to Story Canon"
                    >
                      ⚡ Canon
                    </button>
                    <button
                      onClick={() => handleRemoveBullet(idx)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
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

        {/* Linked Characters */}
        <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
          <label className="block text-sm font-medium text-purple-300 mb-2">
            🔗 Linked Characters
            {linkedCharacterIds.length > 0 && (
              <span className="ml-2 text-emerald-400 text-xs">({linkedCharacterIds.length} linked)</span>
            )}
          </label>
          {bible.characters.length === 0 ? (
            <p className="text-sm text-zinc-500">No characters created yet</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {bible.characters.map((char) => {
                  const isLinked = linkedCharacterIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => handleToggleCharacterLink(char.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isLinked
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"
                      }`}
                    >
                      {isLinked && '✓ '}{char.name || char.id}
                    </button>
                  );
                })}
              </div>
              {linkedCharacterIds.length > 0 && (
                <div className="p-2 bg-emerald-900/20 rounded border border-emerald-700/30">
                  <p className="text-xs text-emerald-300">
                    💡 This research will appear in the linked characters' profiles after you click Save
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tags */}
        {editedNote.tags && editedNote.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {editedNote.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-600/20 border border-blue-600/50 rounded text-sm text-blue-400"
                >
                  🏷️ {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Session Summary */}
        {editedNote.summary && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Session Summary</label>
            <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {editedNote.summary}
              </p>
            </div>
          </div>
        )}

        {/* Canon Entries */}
        {editedNote.canonEntries && editedNote.canonEntries.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
              <span>⚡ Story Canon ({editedNote.canonEntries.length})</span>
              <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded border border-purple-600/30">
                🔒 Locked
              </span>
            </label>
            <div className="space-y-3">
              {editedNote.canonEntries.map((canon) => (
                <div key={canon.id} className="p-4 bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg border-2 border-purple-600/50 shadow-lg group relative">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        {canon.type === 'world-rule' && '🌍'}
                        {canon.type === 'character-habit' && '👤'}
                        {canon.type === 'plot-constraint' && '⚡'}
                        {canon.type === 'background-texture' && '✨'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-600/40 text-purple-200 capitalize font-semibold">
                        {canon.type.replace('-', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {canon.reasoning && (
                        <div className="relative group/tooltip">
                          <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <div className="absolute right-0 top-6 w-64 p-3 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-10">
                            <p className="text-xs text-zinc-300 font-semibold mb-1">Why this matters:</p>
                            <p className="text-xs text-zinc-400">{canon.reasoning}</p>
                          </div>
                        </div>
                      )}
                      <span className="text-xs text-zinc-500 font-mono">{canon.sourceCitation}</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-100 leading-relaxed font-medium">{canon.content}</p>
                  {canon.appliedTo && (
                    <div className="mt-2 text-xs text-purple-300 flex items-center gap-1">
                      <span>→</span>
                      <span>Applied to: {bible.characters.find(c => c.id === canon.appliedTo)?.name || canon.appliedTo}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Convert to Canon Modal */}
      <ConvertToCanonModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        researchBullet={selectedBullet}
        researchId={editedNote.id}
        storyContext={bible}
        onCanonCreated={handleCanonCreated}
      />
    </div>
  );
}
