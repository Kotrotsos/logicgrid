import React from 'react';

interface CluesProps {
  story: string;
  goal?: string;
  clues: string[];
  completedClues: boolean[];
  onToggleClue: (index: number) => void;
  onGetHint: () => void;
  loadingHint?: boolean;
}

export const Clues: React.FC<CluesProps> = ({ story, goal, clues, completedClues, onToggleClue, onGetHint, loadingHint }) => {
  return (
    <aside className="flex w-full lg:w-80 flex-col gap-4 h-full">
      <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">list_alt</span>
            Puzzle Clues
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="space-y-4">
            <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-2 mb-2">The Story</p>
                <p className="text-sm text-slate-600 leading-relaxed px-2 italic">
                {story}
                </p>
            </div>

            {goal && (
              <div className="mx-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Your Goal</p>
                <p className="text-sm text-slate-700 leading-relaxed">{goal}</p>
              </div>
            )}

            <div className="h-px bg-slate-100 mx-2"></div>

            <div className="space-y-2">
              {clues.map((clue, idx) => (
                <div
                  key={idx}
                  onClick={() => onToggleClue(idx)}
                  className={`group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${completedClues[idx] ? 'opacity-50 bg-slate-50' : 'hover:bg-primary/5 hover:border-primary/20 bg-white'}`}
                >
                  <div className={`mt-1 h-4 w-4 rounded border flex items-center justify-center transition-colors ${completedClues[idx] ? 'bg-slate-200 border-slate-300' : 'border-slate-300 group-hover:border-primary'}`}>
                      {completedClues[idx] && <span className="material-symbols-outlined text-[12px] text-slate-500">check</span>}
                  </div>
                  <span className={`text-sm leading-snug transition-colors ${completedClues[idx] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {clue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={onGetHint}
            disabled={loadingHint}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-[#10221a] bg-primary/20 hover:bg-primary/30 rounded-lg transition-colors disabled:opacity-50"
          >
            {loadingHint ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
                <>
                    <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                    Get Hint
                </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
