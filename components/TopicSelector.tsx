import React, { useState } from 'react';
import { Button } from './Button';
import { Difficulty, GridSize, PuzzleType, GRID_PRESETS, PUZZLE_TYPES } from '../types';

interface TopicSelectorProps {
  onGenerate: (topic: string, difficulty: Difficulty, gridSize: GridSize, puzzleType: PuzzleType) => void;
  isGenerating: boolean;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({ onGenerate, isGenerating }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('standard');
  const [gridSize, setGridSize] = useState<GridSize>(GRID_PRESETS[1]); // 4x4 Classic

  // Einstein only supports 4x4 and 5x5
  const availablePresets = puzzleType === 'einstein'
    ? GRID_PRESETS.filter(p => p.categoryCount === 4 || p.categoryCount === 5)
    : GRID_PRESETS;

  const handleTypeChange = (type: PuzzleType) => {
    setPuzzleType(type);
    if (type === 'einstein') {
      // Ensure grid size is valid for Einstein
      if (gridSize.categoryCount !== 4 && gridSize.categoryCount !== 5) {
        setGridSize(GRID_PRESETS[1]); // Default to 4x4
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onGenerate(topic, difficulty, gridSize, puzzleType);
  };

  const suggestions = [
    "Murder Mystery at a Mansion",
    "Space Station Assignments",
    "Medieval Kingdom Politics",
    "Cyberpunk Hacker Teams",
    "Summer Olympics Results"
  ];

  const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-2xl mx-auto px-6 text-center">
      <div className="mb-8 p-4 bg-primary/10 rounded-2xl mb-6">
        <span className="material-symbols-outlined text-6xl text-primary">extension</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">
        Logic<span className="text-primary">Grid</span> AI
      </h1>

      <p className="text-lg text-slate-600 mb-10 max-w-lg leading-relaxed">
        Generate unique, challenging logic grid puzzles on any topic instantly using Gemini.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-4 mb-12">

        {/* Puzzle Type Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
            {PUZZLE_TYPES.map((pt) => (
                <button
                    key={pt.value}
                    type="button"
                    onClick={() => handleTypeChange(pt.value)}
                    disabled={isGenerating}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        puzzleType === pt.value
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title={pt.description}
                >
                    {pt.label}
                </button>
            ))}
        </div>

        {/* Grid Size Selection */}
        <div className="grid grid-cols-2 gap-2 w-full">
            {availablePresets.map((preset) => (
                <button
                    key={preset.label}
                    type="button"
                    onClick={() => setGridSize(preset)}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all ${
                        gridSize.label === preset.label
                        ? 'border-primary bg-primary/5 text-slate-800'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                >
                    <span className="text-sm font-bold">{preset.label}</span>
                    <span className="text-xs text-slate-400">
                        {preset.categoryCount} cats, {preset.itemCount} items
                    </span>
                </button>
            ))}
        </div>

        {/* Difficulty Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
            {difficulties.map((d) => (
                <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    disabled={isGenerating}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                        difficulty === d
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {d}
                </button>
            ))}
        </div>

        <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic (e.g., 'Coffee Shop Orders')"
            className="relative w-full p-4 pr-14 rounded-xl border-2 border-transparent bg-white shadow-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary/50 text-lg font-medium"
            disabled={isGenerating}
            />
            <button
                type="submit"
                disabled={!topic.trim() || isGenerating}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-[#10221a] rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors disabled:opacity-0 disabled:scale-50 transform duration-200"
            >
                {isGenerating ? (
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                    <span className="material-symbols-outlined">arrow_forward</span>
                )}
            </button>
        </div>
      </form>

      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
            <button
                key={s}
                onClick={() => setTopic(s)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:border-primary hover:text-primary transition-colors"
            >
                {s}
            </button>
        ))}
      </div>
    </div>
  );
};
