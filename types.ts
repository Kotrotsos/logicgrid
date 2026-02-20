
export type Category = {
  name: string;
  items: string[];
};

export type GridSize = {
  categoryCount: number;
  itemCount: number;
  label: string;
};

export const GRID_PRESETS: GridSize[] = [
  { categoryCount: 3, itemCount: 3, label: '3x3 Quick' },
  { categoryCount: 4, itemCount: 4, label: '4x4 Classic' },
  { categoryCount: 5, itemCount: 5, label: '5x5 Challenge' },
  { categoryCount: 6, itemCount: 6, label: '6x6 Expert' },
];

export type PuzzleType = 'standard' | 'einstein';

export const PUZZLE_TYPES: { value: PuzzleType; label: string; description: string }[] = [
  { value: 'standard', label: 'Logic Grid', description: 'Classic logic grid puzzle' },
  { value: 'einstein', label: 'Einstein', description: 'Positional reasoning puzzle' },
];

export type PuzzleData = {
  title: string;
  story: string;
  goal: string;
  categories: Category[];
  clues: string[];
  solution: Record<string, string>[];
  puzzleType: PuzzleType;
  gridSize: GridSize;
};

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type CellValue = 'empty' | 'true' | 'false';

export type GridState = Record<string, CellValue>; // Key: "Cat1:Item1|Cat2:Item2"

export type GameState = {
  puzzle: PuzzleData | null;
  grid: GridState;
  history: GridState[];
  historyIndex: number;
  loading: boolean;
  error: string | null;
  cluesCompleted: boolean[];
  timer: number;
  isSolved: boolean;
};

export enum View {
  LANDING = 'LANDING',
  PUZZLE = 'PUZZLE',
  PRINT = 'PRINT'
}
