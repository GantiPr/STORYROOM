"use client";

import { analyzeCharacterIntegrity, generateIntegrityPrompts, type CharacterIntegrity } from "@/lib/characterIntegrity";
import type { Character, StoryBible } from "@/lib/types";
import { useState } from "react";

type CharacterIntegrityPanelProps = {
  character: Character;
  bible: StoryBible;
  onPromptClick?: (prompt: string) => void;
};

export function CharacterIntegrityPanel({ character, bible, onPromptClick }: CharacterIntegrityPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const integrity = analyzeCharacterIntegrity(character, bible);
  
  const getStatusColor = (status: CharacterIntegrity['status']) => {
    switch (status) {
      case 'strong': return 'from-green-600 to-emerald-600';
      case 'needs-work': return 'from-yellow-600 to-orange-600';
      case 'incomplete': return 'from-red-600 to-pink-600';
    }
  };

  const getStatusIcon = (status: CharacterIntegrity['status']) => {
    switch (status) {
      case 'strong': return '✓';
      case 'needs-work': return '⚠';
      case 'incomplete': return '!';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 border-red-600/50';
      case 'warning': return 'text-yellow-400 border-yellow-600/50';
      case 'suggestion': return 'text-blue-400 border-blue-600/50';
      default: return 'text-zinc-400 border-zinc-600/50';
    }
  };

  const prompts = generateIntegrityPrompts(integrity);

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getStatusColor(integrity.status)} flex items-center justify-center text-white font-bold`}>
            {getStatusIcon(integrity.status)}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Character Integrity</h3>
            <p className="text-sm text-zinc-400">
              {integrity.status === 'strong' ? 'Strong & Consistent' :
               integrity.status === 'needs-work' ? 'Needs Development' :
               'Incomplete Core Elements'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{integrity.score}</div>
            <div className="text-xs text-zinc-500">Integrity Score</div>
          </div>
          <span className="text-zinc-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-4">
          {/* Core Elements Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${character.desire && character.desire.length > 10 ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
              <div className="text-xs text-zinc-400 mb-1">Core Want</div>
              <div className={`text-sm font-medium ${character.desire && character.desire.length > 10 ? 'text-green-400' : 'text-red-400'}`}>
                {character.desire && character.desire.length > 10 ? '✓ Defined' : '✗ Missing'}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border ${character.fear && character.fear.length > 10 ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
              <div className="text-xs text-zinc-400 mb-1">Core Fear</div>
              <div className={`text-sm font-medium ${character.fear && character.fear.length > 10 ? 'text-green-400' : 'text-red-400'}`}>
                {character.fear && character.fear.length > 10 ? '✓ Defined' : '✗ Missing'}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border ${character.contradiction && character.contradiction.length > 10 ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
              <div className="text-xs text-zinc-400 mb-1">Contradiction</div>
              <div className={`text-sm font-medium ${character.contradiction && character.contradiction.length > 10 ? 'text-green-400' : 'text-red-400'}`}>
                {character.contradiction && character.contradiction.length > 10 ? '✓ Defined' : '✗ Missing'}
              </div>
            </div>
            
            <div className={`p-3 rounded-lg border ${character.arc?.start && character.arc?.end ? 'bg-green-900/20 border-green-700/30' : 'bg-red-900/20 border-red-700/30'}`}>
              <div className="text-xs text-zinc-400 mb-1">Arc Position</div>
              <div className={`text-sm font-medium ${character.arc?.start && character.arc?.end ? 'text-green-400' : 'text-red-400'}`}>
                {character.arc?.start && character.arc?.end ? '✓ Mapped' : '✗ Incomplete'}
              </div>
            </div>
          </div>

          {/* Strengths */}
          {integrity.strengths.length > 0 && (
            <div className="bg-green-900/10 border border-green-700/30 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-green-400 mb-2">✓ Strengths</h4>
              <ul className="space-y-1">
                {integrity.strengths.map((strength, idx) => (
                  <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {integrity.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Issues to Address</h4>
              {integrity.issues.map((issue, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)} bg-zinc-800/30`}>
                  <div className="flex items-start gap-2 mb-2">
                    <span className={`text-xs font-semibold uppercase ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className="text-sm text-white flex-1">{issue.message}</span>
                  </div>
                  <p className="text-xs text-zinc-400 italic">{issue.suggestion}</p>
                </div>
              ))}
            </div>
          )}

          {/* Quick Fix Prompts */}
          {prompts.length > 0 && onPromptClick && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Quick Fixes</h4>
              {prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onPromptClick(prompt)}
                  className="w-full text-left p-3 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30 rounded-lg transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-300 group-hover:text-blue-200">{prompt}</span>
                    <span className="text-blue-400">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
