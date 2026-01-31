"use client";

import { useState, useEffect, useRef } from "react";
import { useBible } from "@/hooks/useBible";
import type { BuilderSession, StoryPhase, StoryBible } from "@/lib/types";
import { SaveArtifactModal } from "@/components/SaveArtifactModal";
import { PhaseSelector } from "@/components/PhaseSelector";
import { WorkspaceNavigationBar } from "@/components/WorkspaceNavigationBar";

export default function BuilderPage() {
  const { bible, setBible, isLoaded, isSaving } = useBible();
  const [selectedSession, setSelectedSession] = useState<BuilderSession | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Ensure builderSessions exists
  const builderSessions = bible.builderSessions || [];

  const handlePhaseChange = (phase: StoryPhase) => {
    setBible(prev => ({ ...prev, phase }));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  const handleCreateSession = () => {
    setSelectedSession(null);
    setShowChat(true);
  };

  const handleContinueSession = (session: BuilderSession) => {
    setSelectedSession(session);
    setShowChat(true);
  };

  const handleSaveSession = (session: BuilderSession) => {
    console.log('=== Saving Builder Session ===');
    console.log('Session:', session);
    
    setBible(prev => {
      const sessions = prev.builderSessions || [];
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      let updatedSessions;
      if (existingIndex >= 0) {
        // Update existing
        console.log('Updating existing session at index:', existingIndex);
        updatedSessions = sessions.map(s => s.id === session.id ? session : s);
      } else {
        // Add new
        console.log('Adding new session');
        updatedSessions = [...sessions, session];
      }
      
      const updated = {
        ...prev,
        builderSessions: updatedSessions
      };
      
      console.log('Updated bible - sessions count:', updated.builderSessions.length);
      return updated;
    });
    
    setShowChat(false);
    setSelectedSession(session);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Story Builder
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">AI-powered tool that helps you explore story possibilities and develop plot points</p>
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
                    <span className="font-semibold text-white">Why this matters:</span> Interactive AI conversations help you explore story possibilities, test ideas, and develop plot points before committing - like brainstorming with a knowledgeable writing partner.
                  </p>
                </div>
              </div>
              {/* Phase Selector */}
              <PhaseSelector 
                currentPhase={bible.phase || "discovery"}
                onPhaseChange={handlePhaseChange}
                compact
              />
              
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
          <WorkspaceNavigationBar currentPage="builder" bible={bible} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  Sessions
                  <span className="ml-2 text-sm text-zinc-500">({builderSessions.length})</span>
                </h2>
                
                <button
                  onClick={handleCreateSession}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                >
                  + New
                </button>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
                {builderSessions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                      <span className="text-3xl">🎭</span>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">No sessions yet</p>
                    <button
                      onClick={handleCreateSession}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
                    >
                      Start Building
                    </button>
                  </div>
                ) : (
                  builderSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`group p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedSession?.id === session.id
                          ? "bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-600/50 shadow-lg shadow-blue-900/20"
                          : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                      }`}
                      onClick={() => {
                        if (selectedSession?.id === session.id) {
                          setSelectedSession(null);
                        } else {
                          setSelectedSession(session);
                        }
                      }}
                    >
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                        {session.title || "Untitled Session"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-zinc-500">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">
                          {session.messages.length} messages
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContinueSession(session);
                        }}
                        className="mt-3 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-all"
                      >
                        🔄 Continue Session
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Session Content - Right Column */}
          <div className="lg:col-span-2">
            {selectedSession ? (
              <SessionDetail session={selectedSession} />
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8 flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                    <span className="text-5xl">🎭</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Start Building Your Story</h3>
                  <p className="text-zinc-400 mb-6 max-w-md">
                    Explore themes, conflicts, plot points, and emotional beats through an interactive conversation with AI
                  </p>
                  <button
                    onClick={handleCreateSession}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg font-medium transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                  >
                    Begin Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Builder Chat Modal */}
      {showChat && (
        <BuilderChatModal
          onClose={() => setShowChat(false)}
          onSave={handleSaveSession}
          existingSession={selectedSession}
          nextSessionId={`BS${builderSessions.length + 1}`}
          storyContext={bible}
        />
      )}
    </div>
  );
}

// Session Detail Component
function SessionDetail({ session }: { session: BuilderSession }) {
  const [showFullChat, setShowFullChat] = useState(false);

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">{session.title}</h2>
        <button
          onClick={() => setShowFullChat(!showFullChat)}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
        >
          {showFullChat ? "Hide Chat" : "View Chat"}
        </button>
      </div>

      {/* Session Summary */}
      {session.summary ? (
        <div className="mb-6 p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-700/30">
          <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>✨</span>
            <span>Key Learnings & Insights</span>
          </h3>
          <div className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
            {session.summary}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl">�</span>
            </div>
            <p className="text-zinc-400 text-sm mb-2">No summary generated yet</p>
            <p className="text-zinc-500 text-xs">Continue this session and generate a summary to capture key insights</p>
          </div>
        </div>
      )}

      {/* Chat Conversation */}
      {showFullChat && (
        <div className="mb-8 p-6 bg-zinc-800/30 rounded-xl border border-zinc-700/50">
          <h3 className="text-lg font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <span>💬</span>
            <span>Conversation</span>
            <span className="text-sm text-zinc-500">({session.messages.length} messages)</span>
          </h3>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {session.messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] ${msg.role === "user" ? "bg-blue-600/20 border-blue-600/30" : "bg-zinc-700/50 border-zinc-600/30"} rounded-xl p-4 border`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-zinc-400 uppercase">
                      {msg.role === "user" ? "You" : "AI"}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Builder Chat Modal Component
function BuilderChatModal({
  onClose,
  onSave,
  existingSession,
  nextSessionId,
  storyContext
}: {
  onClose: () => void;
  onSave: (session: BuilderSession) => void;
  existingSession: BuilderSession | null;
  nextSessionId: string;
  storyContext: StoryBible;
}) {
  const { setBible } = useBible();
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    existingSession?.messages || []
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(existingSession?.title || "");
  const [sessionSummary, setSessionSummary] = useState(existingSession?.summary || "");
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [linkedCharacters, setLinkedCharacters] = useState<string[]>(
    existingSession?.linkedTo?.map(l => l.id) || []
  );
  const [showSaveArtifact, setShowSaveArtifact] = useState(false);
  const [selectedMessageContent, setSelectedMessageContent] = useState("");
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    if (messages.length === 0) {
      // Check for seeded prompt from health dashboard
      const seededPrompt = localStorage.getItem('storyroom-seeded-prompt');
      
      if (seededPrompt) {
        // Clear the seeded prompt
        localStorage.removeItem('storyroom-seeded-prompt');
        
        // Set it as the initial input
        setInput(seededPrompt);
        
        // Show welcome message
        setMessages([{
          role: "assistant",
          content: "Welcome to Story Builder! 🎭\n\nI see you have a specific question. Let's dive right in!"
        }]);
      } else {
        setMessages([{
          role: "assistant",
          content: "Welcome to Story Builder! 🎭\n\nI'm here to help you explore your story through an interactive conversation. We can discuss:\n\n• **Themes** - Core ideas and messages\n• **Conflicts** - Internal and external struggles\n• **Plot Points** - Key story events\n• **Emotional Beats** - Character feelings and growth\n• **Comedy** - Humor and lighthearted moments\n• **Events** - Specific scenes or situations\n\nJust share what's on your mind, and I'll help you develop it into something concrete. When we land on something you like, I'll help you save it as a scenario.\n\nWhat would you like to explore?"
        }]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/builder-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          storyContext: {
            title: storyContext.title,
            premise: storyContext.premise,
            genre: storyContext.genre,
            themes: storyContext.themes,
            phase: storyContext.phase,
            characters: storyContext.characters.map((c) => ({ id: c.id, name: c.name, role: c.role })),
            canon: storyContext.canon || []
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error:", response.status, errorData);
        throw new Error(`Failed to get response: ${response.status} ${errorData.error || ''}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

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
                  setMessages(prev => {
                    const newMessages = [...prev];
                    if (newMessages[newMessages.length - 1]?.role === "assistant") {
                      newMessages[newMessages.length - 1].content = assistantMessage;
                    } else {
                      newMessages.push({ role: "assistant", content: assistantMessage });
                    }
                    return newMessages;
                  });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Builder chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSession = () => {
    const session: BuilderSession = {
      id: existingSession?.id || nextSessionId,
      title: sessionTitle || `Session ${nextSessionId}`,
      messages,
      summary: sessionSummary || undefined,
      linkedTo: linkedCharacters.length > 0 
        ? linkedCharacters.map(charId => ({ type: "character" as const, id: charId }))
        : undefined,
      createdAt: existingSession?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(session);
  };

  const generateSummary = async () => {
    if (messages.length <= 1) {
      alert("Have a conversation first before generating a summary.");
      return;
    }

    setIsGeneratingSummary(true);
    try {
      const response = await fetch("/api/builder-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages,
            {
              role: "user",
              content: "Please provide a comprehensive summary of our conversation. Include:\n\n1. **Key Themes & Ideas** - Main topics we explored\n2. **Story Elements** - Conflicts, plot points, emotional beats, or comedy we discussed\n3. **Decisions Made** - Any concrete choices or directions we settled on\n4. **Next Steps** - Suggestions for what to explore next\n\nMake it clear, organized, and actionable."
            }
          ],
          storyContext
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
              } catch {
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
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <div className="flex-1">
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session Title"
              className="text-2xl font-bold text-white bg-transparent border-none focus:outline-none placeholder-zinc-600"
            />
            <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>{messages.length} messages</span>
              {sessionSummary && <><span>•</span><span>Summary generated</span></>}
              {linkedCharacters.length > 0 && <><span>•</span><span>{linkedCharacters.length} characters linked</span></>}
              {storyContext.canon && storyContext.canon.length > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded text-xs border border-purple-600/30">
                    <span>🔒</span>
                    <span>{storyContext.canon.length} canon rules active</span>
                  </span>
                </>
              )}
            </p>
            
            {/* Character Linking */}
            {storyContext.characters.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-zinc-500 self-center">Link to:</span>
                {storyContext.characters.map((char: { id: string; name: string }) => {
                  const isLinked = linkedCharacters.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => {
                        setLinkedCharacters(prev =>
                          isLinked
                            ? prev.filter(id => id !== char.id)
                            : [...prev, char.id]
                        );
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        isLinked
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600"
                      }`}
                    >
                      {isLinked && '✓ '}{char.name || char.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateSummary}
              disabled={isGeneratingSummary || messages.length <= 1}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {isGeneratingSummary ? "Generating..." : sessionSummary ? "✨ Update Summary" : "✨ Generate Summary"}
            </button>
            <button
              onClick={handleSaveSession}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all"
            >
              💾 Save Session
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Summary Display */}
        {sessionSummary && (
          <div className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-b border-zinc-800">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-semibold text-purple-300 flex items-center gap-2">
                <span>✨</span>
                <span>Session Summary</span>
              </h3>
              <button
                onClick={() => setSessionSummary("")}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
            <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
              {sessionSummary}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${msg.role === "user" ? "bg-blue-600" : "bg-zinc-800"} rounded-2xl p-4`}>
                <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && msg.content.length > 100 && (
                  <button
                    onClick={() => {
                      setSelectedMessageContent(msg.content);
                      setSelectedMessageIndex(idx);
                      setShowSaveArtifact(true);
                    }}
                    className="mt-3 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded text-xs font-medium text-purple-300 transition-all"
                  >
                    💾 Save as Artifact
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
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
              placeholder="Share your ideas..."
              className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
            >
              Send
            </button>
          </div>
        </div>

        {/* Save Artifact Modal */}
        <SaveArtifactModal
          isOpen={showSaveArtifact}
          onClose={() => setShowSaveArtifact(false)}
          content={selectedMessageContent}
          sessionId={existingSession?.id || nextSessionId}
          messageIndex={selectedMessageIndex}
          storyContext={storyContext}
          onArtifactSaved={(artifact) => {
            // Add to global artifacts
            setBible(prev => ({
              ...prev,
              artifacts: [...(prev.artifacts || []), artifact]
            }));
            setShowSaveArtifact(false);
          }}
        />
      </div>
    </div>
  );
}
