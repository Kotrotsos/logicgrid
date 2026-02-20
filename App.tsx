import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { generatePuzzle, getHint } from './services/geminiService';
import { PuzzleData, GameState, GridState, View, CellValue, Difficulty, GridSize, PuzzleType, GRID_PRESETS } from './types';
import { LogicGrid } from './components/LogicGrid';
import { Clues } from './components/Clues';
import { TopicSelector } from './components/TopicSelector';
import { Button } from './components/Button';
import { ThinkingScreen } from './components/ThinkingScreen';

// Initial State
const initialState: GameState = {
  puzzle: null,
  grid: {},
  history: [{}],
  historyIndex: 0,
  loading: false,
  error: null,
  cluesCompleted: [],
  timer: 0,
  isSolved: false,
};

// Actions
type Action =
  | { type: 'START_LOADING' }
  | { type: 'SET_PUZZLE'; payload: PuzzleData }
  | { type: 'ERROR'; payload: string }
  | { type: 'UPDATE_CELL'; payload: { key: string; value: CellValue } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR' }
  | { type: 'SOLVE'; payload: GridState }
  | { type: 'TOGGLE_CLUE'; payload: number }
  | { type: 'TICK' };

// Reducer
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_LOADING':
      return { ...state, loading: true, error: null };
    case 'SET_PUZZLE':
      return {
        ...initialState,
        puzzle: action.payload,
        cluesCompleted: new Array(action.payload.clues.length).fill(false),
      };
    case 'ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'UPDATE_CELL': {
      const newGrid = { ...state.grid, [action.payload.key]: action.payload.value };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newGrid);
      return {
        ...state,
        grid: newGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case 'UNDO':
      if (state.historyIndex > 0) {
        return {
          ...state,
          historyIndex: state.historyIndex - 1,
          grid: state.history[state.historyIndex - 1],
        };
      }
      return state;
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return {
          ...state,
          historyIndex: state.historyIndex + 1,
          grid: state.history[state.historyIndex + 1],
        };
      }
      return state;
    case 'CLEAR': {
        const emptyGrid = {};
        const clearedHistory = [...state.history.slice(0, state.historyIndex + 1), emptyGrid];
        return {
            ...state,
            grid: emptyGrid,
            history: clearedHistory,
            historyIndex: clearedHistory.length - 1
        };
    }
    case 'SOLVE': {
        const solvedHistory = [...state.history.slice(0, state.historyIndex + 1), action.payload];
        return {
            ...state,
            grid: action.payload,
            history: solvedHistory,
            historyIndex: solvedHistory.length - 1,
            isSolved: true
        };
    }
    case 'TOGGLE_CLUE': {
      const newClues = [...state.cluesCompleted];
      newClues[action.payload] = !newClues[action.payload];
      return { ...state, cluesCompleted: newClues };
    }
    case 'TICK':
      return { ...state, timer: state.timer + 1 };
    default:
      return state;
  }
}

// --- Solution Helpers ---

// Safe string comparison: coerce to string, trim, lowercase
const eq = (a: unknown, b: unknown): boolean =>
  String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();

// Find the value for a category in a solution row (case-insensitive key match)
function findInRow(row: Record<string, unknown>, categoryName: string): unknown | undefined {
  // Exact key match first
  if (categoryName in row) return row[categoryName];
  // Case-insensitive key match
  const key = Object.keys(row).find(k => eq(k, categoryName));
  return key !== undefined ? row[key] : undefined;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [view, setView] = useState<View>(View.LANDING);
  const [hintLoading, setHintLoading] = useState(false);

  useEffect(() => {
    let interval: number;
    if (view === View.PUZZLE && !state.isSolved) {
      interval = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    }
    return () => clearInterval(interval);
  }, [view, state.isSolved]);

  const handleGenerate = async (topic: string, difficulty: Difficulty, gridSize?: GridSize, puzzleType?: PuzzleType) => {
    dispatch({ type: 'START_LOADING' });
    try {
      const gs = gridSize || GRID_PRESETS[1];
      const pt = puzzleType || 'standard';
      const puzzle = await generatePuzzle(topic, difficulty, gs, pt);
      dispatch({ type: 'SET_PUZZLE', payload: puzzle });
      setView(View.PUZZLE);
    } catch (e) {
      dispatch({ type: 'ERROR', payload: e instanceof Error ? e.message : "Failed to generate puzzle." });
    }
  };

  const handleCellClick = (cat1: string, item1: string, cat2: string, item2: string, type: 'left' | 'right') => {
    const key = [`${cat1}:${item1}`, `${cat2}:${item2}`].sort().join('|');
    const currentVal = state.grid[key] || 'empty';

    let nextVal: CellValue = 'empty';
    if (type === 'left') {
        nextVal = currentVal === 'true' ? 'empty' : 'true';
    } else {
        nextVal = currentVal === 'false' ? 'empty' : 'false';
    }

    dispatch({ type: 'UPDATE_CELL', payload: { key, value: nextVal } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Robust relationship check: case-insensitive, type-coercing, no substring matching
  const checkRelationship = (catA: string, itemA: string, catB: string, itemB: string): boolean => {
      if (!state.puzzle) return false;

      const solutionRow = state.puzzle.solution.find(row => {
          const val = findInRow(row, catA);
          return val !== undefined && eq(val, itemA);
      });

      if (!solutionRow) return false;

      const valB = findInRow(solutionRow, catB);
      return valB !== undefined && eq(valB, itemB);
  };

  const handleCheckSolution = () => {
    if (!state.puzzle) return;

    let errors = 0;
    let filledCount = 0;

    Object.entries(state.grid).forEach(([key, value]) => {
        if (value === 'empty') return;
        filledCount++;

        const [partA, partB] = key.split('|');
        const [catA, itemA] = partA.split(':');
        const [catB, itemB] = partB.split(':');

        const isActuallyTrue = checkRelationship(catA, itemA, catB, itemB);

        if (value === 'true' && !isActuallyTrue) errors++;
        if (value === 'false' && isActuallyTrue) errors++;
    });

    if (filledCount === 0) {
        alert("The grid is empty!");
        return;
    }

    if (errors === 0) {
        alert("So far so good! No errors found.");
    } else {
        alert(`Found ${errors} error${errors === 1 ? '' : 's'} in your markings.`);
    }
  };

  const handleRevealSolution = () => {
      if (!state.puzzle) return;
      if (!window.confirm("Are you sure you want to reveal the solution? This will finish the game.")) return;

      const newGrid: GridState = {};
      const { categories } = state.puzzle;

      try {
          for (let i = 0; i < categories.length; i++) {
              for (let j = i + 1; j < categories.length; j++) {
                  const cat1 = categories[i];
                  const cat2 = categories[j];

                  for (const item1 of cat1.items) {
                      for (const item2 of cat2.items) {
                          const isMatch = checkRelationship(cat1.name, item1, cat2.name, item2);
                          const key = [`${cat1.name}:${item1}`, `${cat2.name}:${item2}`].sort().join('|');
                          newGrid[key] = isMatch ? 'true' : 'false';
                      }
                  }
              }
          }
          dispatch({ type: 'SOLVE', payload: newGrid });
      } catch (e) {
          console.error("Reveal failed", e);
          alert("Could not reveal solution due to a data format issue.");
      }
  };

  const handleGetHint = async () => {
      if(!state.puzzle) return;
      setHintLoading(true);
      const hint = await getHint(state.puzzle, state.grid);
      alert(hint);
      setHintLoading(false);
  }

  // Loading State
  if (state.loading) {
     return (
        <div className="min-h-screen bg-background-light flex items-center justify-center font-display">
            <ThinkingScreen />
        </div>
     );
  }

  if (view === View.LANDING) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col font-display">
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <TopicSelector onGenerate={handleGenerate} isGenerating={state.loading} />
             {state.error && (
               <div className="max-w-md w-full px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                 {state.error}
               </div>
             )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light font-display text-slate-900 selection:bg-primary/30">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-primary/10 bg-white/80 backdrop-blur-md px-4 md:px-8 py-3 z-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView(View.LANDING)}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-[#10221a]">
            <span className="material-symbols-outlined font-bold">extension</span>
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-bold leading-tight tracking-tight">LogicGrid</h2>
            <p className="text-xs text-slate-500 font-medium">{state.puzzle?.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-lg">
            <span className="material-symbols-outlined text-slate-500 text-sm">timer</span>
            <span className="text-sm font-mono font-bold tabular-nums">{formatTime(state.timer)}</span>
          </div>
          <div className="hidden md:block h-6 w-px bg-slate-200"></div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => dispatch({ type: 'CLEAR' })} title="Clear Grid">
               <span className="hidden md:inline">Clear</span>
               <span className="md:hidden material-symbols-outlined">restart_alt</span>
            </Button>
            <Button variant="secondary" onClick={() => window.print()} title="Print">
               <span className="material-symbols-outlined">print</span>
            </Button>
            <Button variant="ghost" className="text-amber-600 hover:bg-amber-50" onClick={handleRevealSolution} title="Reveal Solution">
               <span className="material-symbols-outlined">lightbulb_circle</span>
            </Button>
            <Button onClick={handleCheckSolution}>
              <span className="hidden md:inline">Check Solution</span>
              <span className="md:hidden material-symbols-outlined">verified</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden p-4 md:p-6 gap-6">

        {/* Sidebar (Clues) */}
        <Clues
            story={state.puzzle?.story || ''}
            goal={state.puzzle?.goal}
            clues={state.puzzle?.clues || []}
            completedClues={state.cluesCompleted}
            onToggleClue={(idx) => dispatch({type: 'TOGGLE_CLUE', payload: idx})}
            onGetHint={handleGetHint}
            loadingHint={hintLoading}
        />

        {/* Game Area */}
        <section className="flex-1 flex flex-col items-center bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">

            <div className="flex-1 w-full overflow-auto flex justify-center p-8">
                {state.puzzle && (
                    <LogicGrid
                        categories={state.puzzle.categories}
                        gridState={state.grid}
                        onCellClick={handleCellClick}
                    />
                )}
            </div>

            {/* Floating Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/90 backdrop-blur rounded-xl border border-slate-200 shadow-lg print:hidden">
                <button
                    onClick={() => dispatch({ type: 'UNDO' })}
                    disabled={state.historyIndex <= 0}
                    className="p-3 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Undo"
                >
                    <span className="material-symbols-outlined">undo</span>
                </button>
                <button
                    onClick={() => dispatch({ type: 'REDO' })}
                    disabled={state.historyIndex >= state.history.length - 1}
                    className="p-3 hover:bg-slate-100 rounded-lg text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Redo"
                >
                    <span className="material-symbols-outlined">redo</span>
                </button>
                <div className="w-px bg-slate-200 my-1"></div>
                <button
                    onClick={() => setView(View.LANDING)}
                    className="flex items-center gap-2 px-4 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold text-sm transition-colors"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    New
                </button>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-2 flex items-center justify-between z-10 text-xs hidden md:flex print:hidden">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-medium text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-primary">radio_button_checked</span>
            Left click: True
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-500">
            <span className="material-symbols-outlined text-[16px] text-red-500">close</span>
            Right click: False
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-bold">
            <span>Powered by Gemini</span>
        </div>
      </footer>

      {/* Print Styles */}
      <style>{`
        @media print {
            header, footer, aside, .print\\:hidden { display: none !important; }
            main { padding: 0; margin: 0; flex-direction: column; overflow: visible; height: auto; }
            section { border: none; shadow: none; overflow: visible; }
            .flex-1 { flex: none; overflow: visible; }
        }
      `}</style>
    </div>
  );
}
