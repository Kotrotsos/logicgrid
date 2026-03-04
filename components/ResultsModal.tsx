import React from 'react';
import { Category, GridState } from '../types';

interface ResultsModalProps {
  open: boolean;
  title: string;
  categories: Category[];
  solution: Record<string, string>[];
  grid: GridState;
  timer: number;
  wasRevealed: boolean;
  onClose: () => void;
}

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Check if the user correctly marked all pairs for a given solution row */
function checkRowMatch(
  row: Record<string, string>,
  categories: Category[],
  grid: GridState,
): boolean {
  // For every pair of categories, the user must have a 'true' mark for the correct pair
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const cat1 = categories[i];
      const cat2 = categories[j];

      // Find the correct items for these categories in this row
      const val1 = findRowValue(row, cat1.name);
      const val2 = findRowValue(row, cat2.name);
      if (val1 === undefined || val2 === undefined) return false;

      const key = [`${cat1.name}:${val1}`, `${cat2.name}:${val2}`].sort().join('|');
      if (grid[key] !== 'true') return false;
    }
  }
  return true;
}

function findRowValue(row: Record<string, string>, catName: string): string | undefined {
  if (catName in row) return row[catName];
  const k = Object.keys(row).find(k => norm(k) === norm(catName));
  return k ? row[k] : undefined;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  open, title, categories, solution, grid, timer, wasRevealed, onClose,
}) => {
  if (!open) return null;

  const categoryNames = categories.map(c => c.name);

  const rows = solution.map((row) => {
    const cells = categoryNames.map(name => findRowValue(row, name) ?? '?');
    const matched = !wasRevealed && checkRowMatch(row, categories, grid);
    return { cells, matched };
  });

  const allMatched = !wasRevealed && rows.every(r => r.matched);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className={`material-symbols-outlined text-2xl ${wasRevealed ? 'text-amber-500' : 'text-emerald-500'}`}>
              {wasRevealed ? 'lightbulb_circle' : 'emoji_events'}
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">
                {wasRevealed ? 'Solution revealed' : allMatched ? 'Solved correctly' : 'Solution checked'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 px-6 py-3 border-b border-slate-100 bg-slate-50 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span className="font-mono font-bold">{formatTime(timer)}</span>
          </div>
          <div className={`flex items-center gap-2 font-medium ${wasRevealed ? 'text-amber-600' : 'text-emerald-600'}`}>
            <span className="material-symbols-outlined text-[16px]">
              {wasRevealed ? 'visibility' : 'check_circle'}
            </span>
            {wasRevealed ? 'Revealed' : 'Self-solved'}
          </div>
        </div>

        {/* Roster Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {!wasRevealed && <th className="w-8"></th>}
                {categoryNames.map(name => (
                  <th key={name} className="text-left px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  {!wasRevealed && (
                    <td className="px-2 py-2 text-center">
                      <span className={`material-symbols-outlined text-[16px] ${row.matched ? 'text-emerald-500' : 'text-red-400'}`}>
                        {row.matched ? 'check_circle' : 'cancel'}
                      </span>
                    </td>
                  )}
                  {row.cells.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-800 font-medium border-b border-slate-100">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
