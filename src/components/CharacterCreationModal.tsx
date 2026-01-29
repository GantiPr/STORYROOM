"use client";

import { useState, useRef, useEffect } from "react";
import type { Character, ChatMessage } from "@/lib/types";

type PartialCharacterWithPurpose = Partial<Character> & { 
  mainPurpose?: string;
  voice?: {
    cadence?: string;
    tells?: string[];
    tabooWords?: string[];
  };
  arc?: {
    start?: string;
    midpoint?: string;
    end?: string;
  };
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character) => void;
  nextCharacterId: string;
}

export default function CharacterCreationModal({ isOpen, onClose, onSave, nextCharacterId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm here to help you create a compelling character. Let's start with the basics - what kind of character are you thinking about? Are they a protagonist, antagonist, or supporting character?"
    }
  ]);
  
  const [currentCharacter, setCurrentCharacter] = useState<PartialCharacterWithPurpose>({
    id: nextCharacterId,
    name: "",
    role: "other",
    logline: "",
    desire: "",
    fear: "",
    wound: "",
    contradiction: "",
    mainPurpose: "",
    voice: {
      cadence: "",
      tells: [],
      tabooWords: []
    },
    arc: {
      start: "",
      midpoint: "",
      end: ""
    }
  });
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          content: "Hi! I'm here to help you create a compelling character. Let's start with the basics - what kind of character are you thinking about? Are they a protagonist, antagonist, or supporting character?"
        }
      ]);
      setCurrentCharacter({
        id: nextCharacterId,
        name: "",
        role: "other",
        logline: "",
        desire: "",
        fear: "",
        wound: "",
        contradiction: "",
        mainPurpose: "",
        voice: {
          cadence: "",
          tells: [],
          tabooWords: []
        },
        arc: {
          start: "",
          midpoint: "",
          end: ""
        }
      });
      setInputValue("");
    }
  }, [isOpen, nextCharacterId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputValue.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/character-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          currentCharacter,
        }),
      });

      const data = await response.json();

      console.log('🔧 AI Response:', data);

      // Add assistant response
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.assistant,
      }]);

      // Update character if provided
      if (data.character) {
        console.log('🔧 Updating character with:', data.character);
        setCurrentCharacter(prev => {
          const updated = {
            ...prev,
            ...data.character,
            // Handle nested objects properly
            voice: data.character.voice ? { ...prev.voice, ...data.character.voice } : prev.voice,
            arc: data.character.arc ? { ...prev.arc, ...data.character.arc } : prev.arc,
          };
          console.log('🔧 Updated character state:', updated);
          return updated;
        });
      } else {
        console.log('🔧 No character data in response');
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveCharacter = () => {
    // Convert to full Character object with required fields
    const fullCharacter: Character = {
      id: currentCharacter.id || nextCharacterId,
      name: currentCharacter.name || "Unnamed Character",
      role: currentCharacter.role || "other",
      logline: currentCharacter.logline || currentCharacter.mainPurpose || "",
      desire: currentCharacter.desire || "",
      fear: currentCharacter.fear || "",
      wound: currentCharacter.wound || "",
      contradiction: currentCharacter.contradiction || "",
      voice: {
        cadence: currentCharacter.voice?.cadence || "",
        tells: currentCharacter.voice?.tells || [],
        tabooWords: currentCharacter.voice?.tabooWords || []
      },
      relationships: [],
      arc: {
        start: currentCharacter.arc?.start || "",
        midpoint: currentCharacter.arc?.midpoint || "",
        end: currentCharacter.arc?.end || ""
      }
    };

    onSave(fullCharacter);
    onClose();
  };

  const canSave = currentCharacter.name && currentCharacter.name.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">Create Character with AI</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <div className="flex-1 flex flex-col border-r border-zinc-700">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 text-zinc-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-zinc-700">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={async () => {
                    const extractPrompt = `Based on our conversation, extract all character information mentioned and return it as JSON. Include any names, roles, desires, fears, wounds, contradictions, voice details, or character arc information discussed.`;
                    
                    const userMessage: ChatMessage = {
                      role: "user",
                      content: extractPrompt,
                    };

                    const newMessages = [...messages, userMessage];
                    setMessages(newMessages);
                    setIsLoading(true);

                    try {
                      const response = await fetch("/api/character-chat", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          messages: newMessages,
                          currentCharacter,
                        }),
                      });

                      const data = await response.json();
                      console.log('🔧 Extract response:', data);

                      setMessages(prev => [...prev, {
                        role: "assistant",
                        content: data.assistant,
                      }]);

                      if (data.character) {
                        console.log('🔧 Extracted character data:', data.character);
                        setCurrentCharacter(prev => {
                          const updated = {
                            ...prev,
                            ...data.character,
                            voice: data.character.voice ? { ...prev.voice, ...data.character.voice } : prev.voice,
                            arc: data.character.arc ? { ...prev.arc, ...data.character.arc } : prev.arc,
                          };
                          console.log('🔧 Updated character after extract:', updated);
                          return updated;
                        });
                      }
                    } catch (error) {
                      console.error("Extract error:", error);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded text-sm text-white transition-colors"
                >
                  📋 Fill Preview
                </button>
              </div>
              
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your character ideas..."
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Character Preview Panel */}
          <div className="w-96 p-6 bg-zinc-950 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Character Preview</h3>
            
            <div className="space-y-4">
              {/* Character ID */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">ID</label>
                <div className="px-3 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-sm">
                  {currentCharacter.id}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={currentCharacter.name || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Character name"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Role</label>
                  <select
                    value={currentCharacter.role || "other"}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, role: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="protagonist">Protagonist</option>
                    <option value="antagonist">Antagonist</option>
                    <option value="supporting">Supporting</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Logline */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Logline</label>
                <textarea
                  value={currentCharacter.logline || ""}
                  onChange={(e) => setCurrentCharacter(prev => ({ ...prev, logline: e.target.value }))}
                  placeholder="Brief character description"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              </div>

              {/* Core Motivations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-300">Core Motivations</h4>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Desire</label>
                  <input
                    type="text"
                    value={currentCharacter.desire || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, desire: e.target.value }))}
                    placeholder="What they want most"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Fear</label>
                  <input
                    type="text"
                    value={currentCharacter.fear || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, fear: e.target.value }))}
                    placeholder="What they're afraid of"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Wound</label>
                  <input
                    type="text"
                    value={currentCharacter.wound || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, wound: e.target.value }))}
                    placeholder="Past trauma or hurt"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Contradiction</label>
                  <input
                    type="text"
                    value={currentCharacter.contradiction || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ ...prev, contradiction: e.target.value }))}
                    placeholder="Internal conflict"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Voice & Speech */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-300">Voice & Speech</h4>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Cadence</label>
                  <input
                    type="text"
                    value={currentCharacter.voice?.cadence || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      voice: { 
                        cadence: e.target.value,
                        tells: prev.voice?.tells || [],
                        tabooWords: prev.voice?.tabooWords || []
                      }
                    }))}
                    placeholder="How they speak"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Speech Tells</label>
                  <input
                    type="text"
                    value={currentCharacter.voice?.tells?.join(', ') || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      voice: { 
                        cadence: prev.voice?.cadence || "",
                        tells: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') : [],
                        tabooWords: prev.voice?.tabooWords || []
                      }
                    }))}
                    placeholder="Unique phrases, habits"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Taboo Words</label>
                  <input
                    type="text"
                    value={currentCharacter.voice?.tabooWords?.join(', ') || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      voice: { 
                        cadence: prev.voice?.cadence || "",
                        tells: prev.voice?.tells || [],
                        tabooWords: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(s => s !== '') : []
                      }
                    }))}
                    placeholder="Words they never use"
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Character Arc */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-zinc-300">Character Arc</h4>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Start</label>
                  <textarea
                    value={currentCharacter.arc?.start || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      arc: { 
                        start: e.target.value,
                        midpoint: prev.arc?.midpoint || "",
                        end: prev.arc?.end || ""
                      }
                    }))}
                    placeholder="Where they begin"
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Midpoint</label>
                  <textarea
                    value={currentCharacter.arc?.midpoint || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      arc: { 
                        start: prev.arc?.start || "",
                        midpoint: e.target.value,
                        end: prev.arc?.end || ""
                      }
                    }))}
                    placeholder="Key transformation"
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">End</label>
                  <textarea
                    value={currentCharacter.arc?.end || ""}
                    onChange={(e) => setCurrentCharacter(prev => ({ 
                      ...prev, 
                      arc: { 
                        start: prev.arc?.start || "",
                        midpoint: prev.arc?.midpoint || "",
                        end: e.target.value
                      }
                    }))}
                    placeholder="Where they end up"
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  />
                </div>
              </div>

              {/* Preview Status */}
              <div className="pt-4 border-t border-zinc-700">
                <div className="text-xs text-zinc-400 mb-3">
                  {canSave ? "✓ Ready to save" : "⚠ Name required"}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCharacter}
                    disabled={!canSave}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    Save Character
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}