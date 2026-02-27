import { GoogleGenAI, Type } from "@google/genai";
import { PuzzleData, Difficulty, GridSize, PuzzleType, GRID_PRESETS } from "../types";
import promptTemplate from "./prompt.md?raw";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const DEFAULT_GRID_SIZE = GRID_PRESETS[1]; // 4x4 Classic

// Fallback puzzle in case of API failure or rate limiting
const FALLBACK_PUZZLE: PuzzleData = {
  title: "Dog Ownership Challenge",
  story: "Four neighbors each bought a different breed of dog in a different year. Match the owner to their dog's name, breed, and the year they were adopted.",
  goal: "Determine which owner adopted which dog, of which breed, and in which year.",
  categories: [
    { name: "Owners", items: ["Anita", "Bob", "Charlie", "David"] },
    { name: "Years", items: ["2005", "2006", "2007", "2008"] },
    { name: "Dogs", items: ["Max", "Buddy", "Rocky", "Cooper"] },
    { name: "Breeds", items: ["Beagle", "Poodle", "Labrador", "Boxer"] }
  ],
  clues: [
    "Anita did not get a dog in 2006.",
    "The owner of the Beagle adopted their pet 2 years before Bob.",
    "Max is either the Poodle or the dog adopted in 2005.",
    "Charlie's dog is named Buddy.",
    "The 2008 adoption was not the Labrador."
  ],
  solution: [
    { Owners: "Anita", Years: "2005", Dogs: "Cooper", Breeds: "Beagle" },
    { Owners: "Bob", Years: "2007", Dogs: "Rocky", Breeds: "Labrador" },
    { Owners: "Charlie", Years: "2008", Dogs: "Buddy", Breeds: "Poodle" },
    { Owners: "David", Years: "2006", Dogs: "Max", Breeds: "Boxer" }
  ],
  puzzleType: 'standard',
  gridSize: DEFAULT_GRID_SIZE,
};

function getClueCountRange(gridSize: GridSize): { min: number; max: number } {
  const n = gridSize.categoryCount;
  const k = gridSize.itemCount;
  const base = n * k;
  return {
    min: Math.max(4, Math.floor(base * 0.6)),
    max: Math.ceil(base * 1.2),
  };
}

export const generatePuzzle = async (
  topic: string,
  difficulty: Difficulty,
  gridSize: GridSize = DEFAULT_GRID_SIZE,
  puzzleType: PuzzleType = 'standard'
): Promise<PuzzleData> => {
  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const { categoryCount, itemCount } = gridSize;
    const clueRange = getClueCountRange(gridSize);

    const einsteinInstructions = puzzleType === 'einstein' ? `
EINSTEIN PUZZLE MODE:
- One category MUST be "Position" with items ${JSON.stringify(Array.from({ length: itemCount }, (_, i) => String(i + 1)))}.
- The story should describe entities arranged in a line (houses on a street, seats at a table, offices in a hallway, etc.).
- Include positional clues using phrases like "next to", "directly left of", "directly right of", "between X and Y", "at one end", "in the middle".
- At least half the clues should be positional in nature.
` : '';

    const prompt = promptTemplate
      .replace(/\{\{topic\}\}/g, topic)
      .replace(/\{\{difficulty\}\}/g, difficulty)
      .replace(/\{\{categoryCount\}\}/g, String(categoryCount))
      .replace(/\{\{itemCount\}\}/g, String(itemCount))
      .replace(/\{\{einsteinInstructions\}\}/g, einsteinInstructions);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 8192 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "story", "goal", "categories", "clues", "solution"],
          properties: {
            title: { type: Type.STRING, description: "Creative puzzle title" },
            story: { type: Type.STRING, description: "2-3 sentence story premise" },
            goal: { type: Type.STRING, description: "Starts with 'Determine'. Describes what the solver needs to figure out." },
            categories: {
              type: Type.ARRAY,
              description: `Exactly ${categoryCount} categories`,
              items: {
                type: Type.OBJECT,
                required: ["name", "items"],
                properties: {
                  name: { type: Type.STRING, description: "Category name" },
                  items: {
                    type: Type.ARRAY,
                    description: `Exactly ${itemCount} items in this category`,
                    items: { type: Type.STRING }
                  }
                }
              }
            },
            clues: {
              type: Type.ARRAY,
              description: `${clueRange.min}-${clueRange.max} logic clues`,
              items: { type: Type.STRING }
            },
            solution: {
              type: Type.ARRAY,
              description: `Exactly ${itemCount} solution rows. Each row is an array of ${categoryCount} strings, one per category in order.`,
              items: {
                type: Type.ARRAY,
                description: `Array of ${categoryCount} item strings, in the same order as the categories array.`,
                items: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      let jsonString = response.text.trim();
      // Clean up markdown formatting if present (Gemini sometimes adds it despite MIME type)
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const raw = JSON.parse(jsonString);

      // Validation to ensure the grid logic won't break
      if (!raw || !raw.categories || !Array.isArray(raw.categories)) {
          throw new Error("Invalid response: Categories array is missing.");
      }

      if (raw.categories.length !== categoryCount) {
        throw new Error(`Invalid category count: ${raw.categories.length}. Must be ${categoryCount}.`);
      }

      if (raw.categories.some((c: any) => !c.items || !Array.isArray(c.items) || c.items.length !== itemCount)) {
         throw new Error(`Invalid item count. Must be ${itemCount} per category.`);
      }

      // Ensure clues exist
      if (!raw.clues) {
          raw.clues = [];
      }

      // Ensure solution exists
      if (!raw.solution || !Array.isArray(raw.solution) || raw.solution.length === 0) {
          throw new Error("Invalid response: Solution array is missing.");
      }

      // Convert solution from array-of-arrays to array-of-objects
      // Each inner array has items in category order: [cat0Item, cat1Item, ...]
      const solutionRows: string[][] = raw.solution;
      raw.solution = solutionRows.map((row: string[]) => {
          const obj: Record<string, string> = {};
          raw.categories.forEach((cat: any, i: number) => {
              obj[cat.name] = String(row[i] ?? '');
          });
          return obj;
      });

      const data = raw as PuzzleData;

      // Ensure goal exists
      if (!data.goal) {
          data.goal = "Determine the correct assignments for each category.";
      }

      // Shuffle item order within each category to break the diagonal
      // pattern that Gemini tends to produce. The solution references
      // items by name so reordering is safe.
      for (const cat of data.categories) {
          for (let i = cat.items.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [cat.items[i], cat.items[j]] = [cat.items[j], cat.items[i]];
          }
      }

      // Attach metadata
      data.puzzleType = puzzleType;
      data.gridSize = gridSize;

      return data;
    }

    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini generation failed:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const getHint = async (puzzle: PuzzleData, currentGridState: any): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = `
            I am solving a logic puzzle.
            Puzzle: ${JSON.stringify(puzzle)}
            My current grid state (partial): ${JSON.stringify(currentGridState)}

            Give me a single, small, specific logical deduction hint based on the clues that I might have missed. Do not give the answer directly. Just point me in the right direction.
        `;

         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
         });

         return response.text || "Check the clues again carefully.";
    } catch (e) {
        return "Review the clues relating to the first category.";
    }
}
