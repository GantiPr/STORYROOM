"use client";

import { useState, useEffect, useRef } from "react";
import type { Character } from "@/lib/types";
import { useBible } from "@/hooks/useBible";
import CharacterCreationModal from "@/components/CharacterCreationModal";
import CharacterEditModal from "@/components/CharacterEditModal";
import Link from "next/link";

export default function CharactersPage() {
  const { bible, setBible, isLoaded, isSaving, manualSave } = useBible();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showAICreation, setShowAICreation] = useState(false);
  const [showAIEdit, setShowAIEdit] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setShowCreateMenu(false);
      }
    };

    if (showCreateMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCreateMenu]);

  // Clean up duplicate characters on load - MUST be before early return
  useEffect(() => {
    if (isLoaded && bible.characters.length > 0) {
      const uniqueCharacters = bible.characters.filter((character, index, self) => 
        index === self.findIndex(c => c.id === character.id)
      );
      
      if (uniqueCharacters.length !== bible.characters.length) {
        console.log('🔧 Removing duplicate characters');
        setBible(prev => ({
          ...prev,
          characters: uniqueCharacters
        }));
      }
    }
  }, [isLoaded, bible.characters.length, setBible]);

  // Don't render until bible is loaded
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  // Sort characters by role priority
  const rolePriority: Record<string, number> = {
    protagonist: 0,
    antagonist: 1,
    supporting: 2,
    other: 3,
  };

  const sortedCharacters = [...bible.characters].sort((a, b) => {
    const pa = rolePriority[a.role] ?? 999;
    const pb = rolePriority[b.role] ?? 999;

    const priorityDiff = pa - pb;
    if (priorityDiff === 0) return a.name.localeCompare(b.name);
    return priorityDiff;
  });

  const getNextCharacterId = (): string => {
    const existingIds = bible.characters.map(c => c.id);
    let nextNum = 1;
    let nextId = `C${nextNum}`;
    
    // Keep incrementing until we find an unused ID
    while (existingIds.includes(nextId)) {
      nextNum++;
      nextId = `C${nextNum}`;
    }
    
    return nextId;
  };

  const createNewCharacter = (): Character => {
    const nextId = getNextCharacterId();
    return {
      id: nextId,
      name: "",
      role: "other",
      logline: "",
      desire: "",
      fear: "",
      wound: "",
      contradiction: "",
      voice: {
        cadence: "",
        tells: [],
        tabooWords: []
      },
      relationships: [],
      arc: {
        start: "",
        midpoint: "",
        end: ""
      }
    };
  };

  const handleCreateCharacter = () => {
    const newCharacter = createNewCharacter();
    setSelectedCharacter(newCharacter);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleCreateWithAI = () => {
    setShowAICreation(true);
  };

  const handleAICharacterSave = (character: Character) => {
    setBible(prev => ({
      ...prev,
      characters: [...prev.characters, character]
    }));
    setSelectedCharacter(character);
    setShowAICreation(false);
  };

  const handleAIEditSave = (character: Character) => {
    setBible(prev => ({
      ...prev,
      characters: prev.characters.map(c => c.id === character.id ? character : c)
    }));
    setSelectedCharacter(character);
    setShowAIEdit(false);
  };

  const handleSaveCharacter = (character: Character) => {
    if (isCreating) {
      setBible(prev => ({
        ...prev,
        characters: [...prev.characters, character]
      }));
      setIsCreating(false);
    } else {
      setBible(prev => ({
        ...prev,
        characters: prev.characters.map(c => c.id === character.id ? character : c)
      }));
    }
    setIsEditing(false);
    setSelectedCharacter(character);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (confirm("Are you sure you want to delete this character?")) {
      setBible(prev => ({
        ...prev,
        characters: prev.characters.filter(c => c.id !== characterId)
      }));
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (isCreating) {
      setSelectedCharacter(null);
      setIsCreating(false);
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
                Characters
              </h1>
              <p className="text-zinc-400 mt-2 text-lg">Build and develop your story's cast</p>
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
          {/* Character List */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  All Characters
                  <span className="ml-2 text-sm text-zinc-500">({bible.characters.length})</span>
                </h2>
                
                {/* Create Character Dropdown */}
                <div className="relative" ref={createMenuRef}>
                  <button
                    onClick={() => setShowCreateMenu(!showCreateMenu)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-blue-900/50 flex items-center gap-2"
                  >
                    <span>+ New</span>
                    <svg className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {showCreateMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-zinc-800 rounded-xl shadow-2xl border border-zinc-700 z-10 overflow-hidden">
                      <button
                        onClick={() => {
                          handleCreateWithAI();
                          setShowCreateMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-700/50 transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xl">✨</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Create with AI</div>
                          <div className="text-xs text-zinc-400">Guided creation</div>
                        </div>
                      </button>
                      <div className="h-px bg-zinc-700"></div>
                      <button
                        onClick={() => {
                          handleCreateCharacter();
                          setShowCreateMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-700/50 transition-colors flex items-center gap-3 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <span className="text-xl">📝</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Create Manually</div>
                          <div className="text-xs text-zinc-400">Fill in form</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
              {sortedCharacters.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-3xl">👤</span>
                  </div>
                  <p className="text-zinc-400 text-sm mb-6">No characters yet</p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleCreateWithAI}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg text-sm font-medium transition-all"
                    >
                      ✨ Create with AI
                    </button>
                    <button
                      onClick={handleCreateCharacter}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
                    >
                      📝 Create Manually
                    </button>
                  </div>
                </div>
              ) : (
                sortedCharacters.map((character) => (
                  <div
                    key={character.id}
                    onClick={() => {
                      // Toggle selection - if clicking the same character, deselect it
                      if (selectedCharacter?.id === character.id) {
                        setSelectedCharacter(null);
                        setIsEditing(false);
                        setIsCreating(false);
                      } else {
                        setSelectedCharacter(character);
                        setIsEditing(false);
                        setIsCreating(false);
                      }
                    }}
                    className={`group p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedCharacter?.id === character.id
                        ? "bg-gradient-to-br from-blue-900/40 to-blue-800/40 border-blue-600/50 shadow-lg shadow-blue-900/20"
                        : "bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 hover:border-zinc-600/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {character.name || "Unnamed Character"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-300 capitalize">
                            {character.role}
                          </span>
                          <span className="text-xs text-zinc-500">{character.id}</span>
                        </div>
                      </div>
                    </div>
                    {character.logline && (
                      <p className="text-sm text-zinc-400 line-clamp-2 mt-2">
                        {character.logline}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

          {/* Character Detail/Edit Panel */}
          <div className="lg:col-span-2">
            {selectedCharacter ? (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl">
                <CharacterDetailPanel
                  character={selectedCharacter}
                  isEditing={isEditing}
                  onEdit={() => setIsEditing(true)}
                  onEditWithAI={() => setShowAIEdit(true)}
                  onSave={handleSaveCharacter}
                  onCancel={handleCancelEdit}
                  onDelete={() => handleDeleteCharacter(selectedCharacter.id)}
                  allCharacters={bible.characters}
                  researchNotes={bible.research}
                />
              </div>
            ) : (
              <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 shadow-xl p-8 h-[calc(100vh-200px)]">
                <div className="h-full flex flex-col">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-semibold text-white mb-2">Your Cast</h3>
                    <p className="text-zinc-400">Click on a character to view their details</p>
                  </div>
                  
                  {bible.characters.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center border-4 border-zinc-700/50 border-dashed">
                          <span className="text-6xl opacity-50">👤</span>
                        </div>
                        <p className="text-zinc-500 text-lg mb-2">No characters yet</p>
                        <p className="text-zinc-600 text-sm">Create your first character to get started</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
                        {sortedCharacters.map((character) => (
                          <button
                            key={character.id}
                            onClick={() => {
                              // Toggle selection - if clicking the same character, deselect it
                              if (selectedCharacter?.id === character.id) {
                                setSelectedCharacter(null);
                                setIsEditing(false);
                                setIsCreating(false);
                              } else {
                                setSelectedCharacter(character);
                                setIsEditing(false);
                                setIsCreating(false);
                              }
                            }}
                            className="group flex flex-col items-center gap-3 p-4 rounded-xl bg-zinc-800/30 hover:bg-zinc-800/60 border border-zinc-700/50 hover:border-zinc-600 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-900/20"
                          >
                            {/* Avatar Circle */}
                            <div className="relative">
                              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg group-hover:shadow-blue-500/50 transition-shadow">
                                {character.name ? character.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              {/* Role Badge */}
                              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center text-xs">
                                {character.role === 'protagonist' && '⭐'}
                                {character.role === 'antagonist' && '⚡'}
                                {character.role === 'supporting' && '🎭'}
                                {character.role === 'other' && '👤'}
                              </div>
                            </div>
                            
                            {/* Character Name */}
                            <div className="text-center w-full">
                              <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                                {character.name || 'Unnamed'}
                              </p>
                              <p className="text-xs text-zinc-500 capitalize">{character.role}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Character Creation Modal */}
      <CharacterCreationModal
        isOpen={showAICreation}
        onClose={() => setShowAICreation(false)}
        onSave={handleAICharacterSave}
        nextCharacterId={getNextCharacterId()}
      />

      {/* AI Character Edit Modal */}
      {selectedCharacter && (
        <CharacterEditModal
          isOpen={showAIEdit}
          onClose={() => setShowAIEdit(false)}
          onSave={handleAIEditSave}
          character={selectedCharacter}
        />
      )}
    </div>
  );
}

// Character Detail/Edit Component
function CharacterDetailPanel({
  character,
  isEditing,
  onEdit,
  onEditWithAI,
  onSave,
  onCancel,
  onDelete,
  allCharacters,
  researchNotes
}: {
  character: Character;
  isEditing: boolean;
  onEdit: () => void;
  onEditWithAI: () => void;
  onSave: (character: Character) => void;
  onCancel: () => void;
  onDelete: () => void;
  allCharacters: Character[];
  researchNotes: any[];
}) {
  const [editedCharacter, setEditedCharacter] = useState<Character>(character);
  // Store raw strings for comma-separated fields
  const [tellsString, setTellsString] = useState<string>('');
  const [tabooWordsString, setTabooWordsString] = useState<string>('');
  
  // Refs for uncontrolled inputs as backup
  const tellsRef = useRef<HTMLInputElement>(null);
  const tabooWordsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedCharacter(character);
    const tellsStr = character.voice.tells.join(', ');
    const tabooStr = character.voice.tabooWords.join(', ');
    setTellsString(tellsStr);
    setTabooWordsString(tabooStr);
    
    // Also set the ref values
    if (tellsRef.current) tellsRef.current.value = tellsStr;
    if (tabooWordsRef.current) tabooWordsRef.current.value = tabooStr;
  }, [character]);

  const handleSave = () => {
    // Get values from refs as backup
    const finalTells = tellsRef.current?.value || tellsString;
    const finalTabooWords = tabooWordsRef.current?.value || tabooWordsString;
    
    // Process comma-separated strings before saving
    const finalCharacter = {
      ...editedCharacter,
      voice: {
        ...editedCharacter.voice,
        tells: finalTells ? finalTells.split(',').map(s => s.trim()).filter(s => s !== '') : [],
        tabooWords: finalTabooWords ? finalTabooWords.split(',').map(s => s.trim()).filter(s => s !== '') : []
      }
    };
    onSave(finalCharacter);
  };

  const updateField = (field: keyof Character, value: any) => {
    setEditedCharacter(prev => ({ ...prev, [field]: value }));
  };

  const updateVoiceField = (field: keyof Character['voice'], value: any) => {
    setEditedCharacter(prev => ({
      ...prev,
      voice: { ...prev.voice, [field]: value }
    }));
  };

  const updateArcField = (field: keyof Character['arc'], value: string) => {
    setEditedCharacter(prev => ({
      ...prev,
      arc: { ...prev.arc, [field]: value }
    }));
  };

  if (isEditing) {
    return (
      <div className="bg-zinc-950 rounded-lg border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {character.name ? `Editing ${character.name}` : "Creating New Character"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Name</label>
              <input
                type="text"
                value={editedCharacter.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Character name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Role</label>
              <select
                value={editedCharacter.role}
                onChange={(e) => updateField('role', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-zinc-300 mb-2">Logline</label>
            <textarea
              value={editedCharacter.logline}
              onChange={(e) => updateField('logline', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Brief description of the character"
            />
          </div>

          {/* Core Motivations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Desire</label>
              <input
                type="text"
                value={editedCharacter.desire}
                onChange={(e) => updateField('desire', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What they want most"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Fear</label>
              <input
                type="text"
                value={editedCharacter.fear}
                onChange={(e) => updateField('fear', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What they're most afraid of"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Wound</label>
              <input
                type="text"
                value={editedCharacter.wound}
                onChange={(e) => updateField('wound', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Past trauma or hurt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Contradiction</label>
              <input
                type="text"
                value={editedCharacter.contradiction}
                onChange={(e) => updateField('contradiction', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Internal conflict or paradox"
              />
            </div>
          </div>

          {/* Voice */}
          <div>
            <h3 className="text-lg font-medium text-zinc-200 mb-3">Voice & Speech</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Cadence</label>
                <input
                  type="text"
                  value={editedCharacter.voice.cadence}
                  onChange={(e) => updateVoiceField('cadence', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How they speak (fast, slow, rhythmic, etc.)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Speech Tells (comma-separated)</label>
                <input
                  ref={tellsRef}
                  type="text"
                  defaultValue={tellsString}
                  onChange={(e) => {
                    console.log('Tells input value:', e.target.value);
                    setTellsString(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    console.log('Tells key pressed:', e.key, e.keyCode);
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Unique phrases, habits, or mannerisms"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Taboo Words (comma-separated)</label>
                <input
                  ref={tabooWordsRef}
                  type="text"
                  defaultValue={tabooWordsString}
                  onChange={(e) => {
                    console.log('Taboo input value:', e.target.value);
                    setTabooWordsString(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    console.log('Taboo key pressed:', e.key, e.keyCode);
                  }}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Words they never use"
                />
              </div>
            </div>
          </div>

          {/* Character Arc */}
          <div>
            <h3 className="text-lg font-medium text-zinc-200 mb-3">Character Arc</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Start</label>
                <textarea
                  value={editedCharacter.arc.start}
                  onChange={(e) => updateArcField('start', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Where they begin emotionally/psychologically"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Midpoint</label>
                <textarea
                  value={editedCharacter.arc.midpoint}
                  onChange={(e) => updateArcField('midpoint', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Key transformation or realization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">End</label>
                <textarea
                  value={editedCharacter.arc.end}
                  onChange={(e) => updateArcField('end', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Where they end up"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-zinc-800">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            {character.name || "Unnamed Character"}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-sm capitalize">
              {character.role}
            </span>
            <span className="text-sm text-zinc-500">{character.id}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEditWithAI}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-purple-900/50"
          >
            ✨ Edit with AI
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-all hover:scale-105"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium transition-all hover:scale-105"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-8 max-h-[calc(100vh-300px)] overflow-y-auto pr-4 custom-scrollbar">
        {character.logline && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Logline</h3>
            <p className="text-zinc-200 text-lg leading-relaxed">{character.logline}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Desire</h3>
            <p className="text-zinc-200">{character.desire || "Not defined"}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Fear</h3>
            <p className="text-zinc-200">{character.fear || "Not defined"}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Wound</h3>
            <p className="text-zinc-200">{character.wound || "Not defined"}</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Contradiction</h3>
            <p className="text-zinc-200">{character.contradiction || "Not defined"}</p>
          </div>
        </div>

        {(character.voice.cadence || character.voice.tells.length > 0 || character.voice.tabooWords.length > 0) && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Voice & Speech</h3>
            <div className="space-y-4">
              {character.voice.cadence && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cadence</h4>
                  <p className="text-zinc-200">{character.voice.cadence}</p>
                </div>
              )}
              {character.voice.tells.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Speech Tells</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.voice.tells.map((tell, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-zinc-700/50 text-zinc-300 text-sm">
                        {tell}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.voice.tabooWords.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Taboo Words</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.voice.tabooWords.map((word, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-red-900/30 text-red-300 text-sm">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(character.arc.start || character.arc.midpoint || character.arc.end) && (
          <div className="p-6 rounded-xl bg-gradient-to-br from-zinc-800/40 to-zinc-900/40 border border-zinc-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Character Arc</h3>
            <div className="space-y-4">
              {character.arc.start && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Start</h4>
                  <p className="text-zinc-200 leading-relaxed">{character.arc.start}</p>
                </div>
              )}
              {character.arc.midpoint && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Midpoint</h4>
                  <p className="text-zinc-200 leading-relaxed">{character.arc.midpoint}</p>
                </div>
              )}
              {character.arc.end && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">End</h4>
                  <p className="text-zinc-200 leading-relaxed">{character.arc.end}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Linked Research Notes */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-900/20 to-emerald-800/20 border border-emerald-700/30">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📚</span>
            <span>Research Insights</span>
            {character.researchNotes && character.researchNotes.length > 0 && (
              <span className="text-sm text-emerald-400">({character.researchNotes.length})</span>
            )}
          </h3>
          
          {!character.researchNotes || character.researchNotes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-zinc-400 mb-2">No research linked to this character yet</p>
              <p className="text-xs text-zinc-500">
                Link research from the Research Library to see insights here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {character.researchNotes.map((noteId) => {
                const note = researchNotes.find(n => n.id === noteId);
                if (!note) {
                  console.log('Research note not found:', noteId, 'Available:', researchNotes.map(n => n.id));
                  return null;
                }
                
                return (
                  <div key={noteId} className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-emerald-400">{note.question}</h4>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {note.tags.map((tag: string, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-blue-600/20 border border-blue-600/50 rounded text-blue-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <a
                        href="/research"
                        className="text-xs text-emerald-400 hover:text-emerald-300 whitespace-nowrap ml-2"
                      >
                        View Full →
                      </a>
                    </div>
                    
                    {/* Show summary if available, otherwise show first 2 bullets */}
                    {note.summary ? (
                      <p className="text-sm text-zinc-300 leading-relaxed mt-2 line-clamp-3">
                        {note.summary}
                      </p>
                    ) : (
                      <div className="mt-2 space-y-1">
                        {note.bullets.slice(0, 2).map((bullet: string, idx: number) => (
                          <p key={idx} className="text-sm text-zinc-300 line-clamp-2">
                            • {bullet}
                          </p>
                        ))}
                        {note.bullets.length > 2 && (
                          <p className="text-xs text-zinc-500 italic">
                            +{note.bullets.length - 2} more insights
                          </p>
                        )}
                      </div>
                    )}
                    
                    {note.sources && note.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-zinc-700/50">
                        <p className="text-xs text-zinc-500">
                          {note.sources.length} source{note.sources.length !== 1 ? 's' : ''} cited
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}