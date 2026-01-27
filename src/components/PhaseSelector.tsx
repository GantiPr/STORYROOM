"use client";

import { StoryPhase } from "@/lib/types";
import { PHASE_INFO } from "@/lib/storyPhases";

type PhaseSelectorProps = {
  currentPhase: StoryPhase;
  onPhaseChange: (phase: StoryPhase) => void;
  compact?: boolean;
};

export function PhaseSelector({ currentPhase, onPhaseChange, compact = false }: PhaseSelectorProps) {
  const phases: StoryPhase[] = ["discovery", "structure", "development", "revision"];
  const currentInfo = PHASE_INFO[currentPhase];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm text-zinc-400">Phase:</label>
        <select
          value={currentPhase}
          onChange={(e) => onPhaseChange(e.target.value as StoryPhase)}
          className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {phases.map((phase) => (
            <option key={phase} value={phase}>
              {PHASE_INFO[phase].icon} {PHASE_INFO[phase].name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-300">Story Phase</h3>
        <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${currentInfo.color} text-white text-sm font-medium`}>
          {currentInfo.icon} {currentInfo.name}
        </div>
      </div>
      
      <p className="text-sm text-zinc-400 mb-4">{currentInfo.description}</p>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {phases.map((phase) => {
          const info = PHASE_INFO[phase];
          const isActive = phase === currentPhase;
          
          return (
            <button
              key={phase}
              onClick={() => onPhaseChange(phase)}
              className={`p-3 rounded-lg border transition-all text-left ${
                isActive
                  ? `bg-gradient-to-r ${info.color} border-transparent text-white`
                  : "bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600 text-zinc-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{info.icon}</span>
                <span className="font-medium text-sm">{info.name}</span>
              </div>
              <p className="text-xs opacity-80 line-clamp-2">{info.description}</p>
            </button>
          );
        })}
      </div>
      
      <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
        <h4 className="text-xs font-semibold text-zinc-400 mb-2">Focus Areas:</h4>
        <ul className="space-y-1">
          {currentInfo.focus.map((item, idx) => (
            <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
