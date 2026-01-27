"use client";

import { useState } from "react";
import type { CanonEntry, StoryBible } from "@/lib/types";

type ConvertToCanonModalProps = {
  isOpen: boolean;
  onClose: () => void;
  researchBullet: string;
  researchId: string;
  storyContext: StoryBible;
  onCanonCreated: (canonEntry: CanonEntry) => void;
};

export function ConvertToCanonModal({
  isOpen,
  onClose,
  researchBullet,
  researchId,
  storyContext,
  onCanonCreated,
}: ConvertToCanonModalProps) {
  const [canonType, setCanonType] = useState<CanonEntry['type']>("world-rule");
  const [appliedTo, setAppliedTo] = useState<string>("");
  const [isConverting, setIsConverting] = useState(false);
  const [reasoning, setReasoning] = useState<string>("");

  if (!isOpen) return null;

  const handleConvert = async () => {
    setIsConverting(true);
    setReasoning("");

    try {
      const response = await fetch("/api/convert-to-canon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          researchBullet,
          researchId,
          canonType,
          storyContext,
          appliedTo: appliedTo || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to convert");

      const data = await response.json();
      setReasoning(data.reasoning);
      
      // Wait a moment to show the reasoning, then create
      setTimeout(() => {
        onCanonCreated(data.canonEntry);
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Conversion error:", error);
      alert("Failed to convert to canon. Please try again.");
      setIsConverting(false);
    }
  };

  const handleClose = () => {
    setCanonType("world-rule");
    setAppliedTo("");
    setReasoning("");
    setIsConverting(false);
    onClose();
  };

  const canonTypes: Array<{ value: CanonEntry['type']; label: string; icon: string; description: string }> = [
    {
      value: "world-rule",
      label: "World Rule",
      icon: "🌍",
      description: "How the world works (physics, magic, society)",
    },
    {
      value: "character-habit",
      label: "Character Habit",
      icon: "👤",
      description: "Specific behavior or mannerism",
    },
    {
      value: "plot-constraint",
      label: "Plot Constraint",
      icon: "⚡",
      description: "Limitation that affects the story",
    },
    {
      value: "background-texture",
      label: "Background Texture",
      icon: "✨",
      description: "Authentic details (sounds, smells, procedures)",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-white">Convert to Story Canon</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-all"
            disabled={isConverting}
          >
            <span className="text-zinc-400 text-xl">×</span>
          </button>
        </div>

        {/* Research Bullet */}
        <div className="mb-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-400 mb-2">Research Finding:</h3>
          <p className="text-zinc-200">{researchBullet}</p>
        </div>

        {/* Canon Type Selection */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Convert to:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {canonTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setCanonType(type.value)}
                disabled={isConverting}
                className={`p-4 rounded-lg border text-left transition-all ${
                  canonType === type.value
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

        {/* Apply To (Optional) */}
        {canonType === "character-habit" && storyContext.characters.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white mb-2">Apply to Character (Optional):</h3>
            <select
              value={appliedTo}
              onChange={(e) => setAppliedTo(e.target.value)}
              disabled={isConverting}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (General habit)</option>
              {storyContext.characters.map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reasoning Display */}
        {reasoning && (
          <div className="mb-6 p-4 bg-green-900/20 border border-green-700/30 rounded-lg">
            <h3 className="text-sm font-semibold text-green-400 mb-2">✓ Why this matters:</h3>
            <p className="text-zinc-200">{reasoning}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isConverting}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConvert}
            disabled={isConverting}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 rounded-lg font-medium transition-all"
          >
            {isConverting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Converting...
              </span>
            ) : (
              "Convert to Canon"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
