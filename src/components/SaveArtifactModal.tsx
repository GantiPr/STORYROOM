"use client";

import { useState } from "react";
import type { Artifact, ArtifactType, StoryBible } from "@/lib/types";
import { nanoid } from "nanoid";

type SaveArtifactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  sessionId: string;
  messageIndex?: number;
  storyContext: StoryBible;
  onArtifactSaved: (artifact: Artifact) => void;
};

export function SaveArtifactModal({
  isOpen,
  onClose,
  content,
  sessionId,
  messageIndex,
  storyContext,
  onArtifactSaved,
}: SaveArtifactModalProps) {
  const [artifactType, setArtifactType] = useState<ArtifactType>("scene-sketch");
  const [title, setTitle] = useState("");
  const [linkedCharacters, setLinkedCharacters] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title for this artifact");
      return;
    }

    const artifact: Artifact = {
      id: `ART_${nanoid(6)}`,
      type: artifactType,
      title: title.trim(),
      content,
      sourceSessionId: sessionId,
      sourceMessageIndex: messageIndex,
      linkedToCharacters: linkedCharacters.length > 0 ? linkedCharacters : undefined,
      createdAt: new Date().toISOString(),
      tags: tags.length > 0 ? tags : undefined,
    };

    onArtifactSaved(artifact);
    handleClose();
  };

  const handleClose = () => {
    setArtifactType("scene-sketch");
    setTitle("");
    setLinkedCharacters([]);
    setTags([]);
    setNewTag("");
    onClose();
  };

  const toggleCharacter = (characterId: string) => {
    setLinkedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
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

  const artifactTypes: Array<{ value: ArtifactType; label: string; icon: string; description: string }> = [
    {
      value: "scene-sketch",
      label: "Scene Sketch",
      icon: "🎬",
      description: "A rough draft or outline of a scene",
    },
    {
      value: "beat-proposal",
      label: "Beat Proposal",
      icon: "📍",
      description: "A plot beat or story milestone",
    },
    {
      value: "character-moment",
      label: "Character Moment",
      icon: "💫",
      description: "A defining moment or revelation",
    },
    {
      value: "dialogue-sample",
      label: "Dialogue Sample",
      icon: "💬",
      description: "Character dialogue or conversation",
    },
    {
      value: "world-detail",
      label: "World Detail",
      icon: "🌍",
      description: "Setting, location, or world-building",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-white">Save as Artifact</h2>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span>✏️</span>
              <span>Flexible ideas - can be edited or refined later</span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
          >
            <span className="text-zinc-400 text-xl">×</span>
          </button>
        </div>

        {/* Content Preview */}
        <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Content:</h3>
          <p className="text-zinc-200 text-sm line-clamp-6">{content}</p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-white mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this artifact a memorable name"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Artifact Type Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Artifact Type:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {artifactTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setArtifactType(type.value)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  artifactType === type.value
                    ? "bg-blue-900/30 border-blue-600"
                    : "bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{type.icon}</span>
                  <span className="font-semibold text-white">{type.label}</span>
                </div>
                <p className="text-xs text-zinc-400">{type.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Link to Characters */}
        {storyContext.characters.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">Link to Characters (Optional):</h3>
            <div className="flex flex-wrap gap-2">
              {storyContext.characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => toggleCharacter(char.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    linkedCharacters.includes(char.id)
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {linkedCharacters.includes(char.id) && '✓ '}{char.name || char.id}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2">Tags (Optional):</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="Add tag (e.g., 'Act 1', 'Climax')"
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={addTag}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm font-medium transition-all"
            >
              + Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
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

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-all"
          >
            💾 Save Artifact
          </button>
        </div>
      </div>
    </div>
  );
}
