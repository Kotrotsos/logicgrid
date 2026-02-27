import { GoogleGenAI, Type } from "@google/genai";
import { PuzzleData, Difficulty, GridSize, PuzzleType, GRID_PRESETS } from "../types";

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

    const prompt = `You are an expert logic puzzle creator. Create a logic grid puzzle.

Topic: "${topic}"
Difficulty: ${difficulty}
Grid size: Exactly ${categoryCount} categories, each with exactly ${itemCount} items.
${einsteinInstructions}
IMPORTANT: Keep all category names and item names SHORT (max 2-3 words each). Use first names only for people, abbreviate where possible. For example use "Eva" not "Commander Eva Rostova".

Difficulty rules:
- Easy: Most clues are direct ("A is B" or "A is not B").
- Medium: Mix of direct and inferential clues, requires chain reasoning.
- Hard: Mostly indirect clues requiring multi-step deduction.

PUZZLE STRUCTURE RULES:
1. Use ${itemCount} items per category and ensure a strict 1-to-1 mapping across all categories. No repeats, no overlaps.
2. State the goal clearly: "Determine X, Y, Z for each [entity]."
3. Every item belongs to exactly one group, no item appears in more than one combination.
4. The puzzle must have exactly ONE unique solution.

CLUE QUALITY RULES:
1. Every clue must be logically precise. Avoid vague words like "around," "near," or "between" unless clearly defined.
2. If using positional language, be explicit:
   - Adjacent: "directly left/right of"
   - Non-adjacent: "somewhere left/right of"
   - Between: "A is somewhere between B and C (not necessarily adjacent)"
3. Write each clue as a single statement. Avoid compound clues unless both facts joined by AND are necessary.
4. No clue should be redundant: every clue must contribute at least one new deduction.
5. All clues must be necessary: removing any single clue should make the puzzle unsolvable or yield multiple solutions.

DIFFICULTY BALANCE:
1. Avoid stacking too many "direct placement" clues (e.g., "X is position 1" + "Y is at an end").
2. Use a mix: exclusions ("not"), relative ordering ("left of"), and at most one or two absolute anchors.
3. Each category should be constrained by multiple clues. Don't pile all constraints on one person/category.

VERIFICATION (do this in your thinking before producing output):
1. Build the complete solution grid first, then write clues that lead to it.
2. Verify the clues are not underdetermined (multiple solutions) and not overconstrained (no solution).
3. Test by removing one clue at a time: uniqueness should break (confirms no padding).
4. Confirm every item from every category appears in exactly one solution row.

CRITICAL requirements for the solution output:
- The solution is an array of exactly ${itemCount} rows.
- Each row is an array of exactly ${categoryCount} strings, one item per category, in the SAME ORDER as the categories array.
- The first string in each row corresponds to the first category, the second to the second category, etc.
- Each item from each category must appear in exactly one solution row.

The "goal" field must start with "Determine" and describe what the solver needs to figure out.

FULL QUALITY EXAMPLE (4 categories, 4 items, 11 clues, unique solution, all clues necessary):
{
  "title": "Aegis Station Assignments",
  "story": "Four crew members have just arrived aboard the Aegis space station. Each is assigned to a different module, holds a unique role, and will serve a different mission duration. Station command needs every assignment locked in before the next supply run.",
  "goal": "Determine each crew member's module, role, and mission duration.",
  "categories": [
    {"name": "Crew", "items": ["Noah", "Maya", "Chloe", "Leo"]},
    {"name": "Module", "items": ["Farm", "Lab", "Medbay", "Control"]},
    {"name": "Role", "items": ["Scientist", "Medic", "Pilot", "Engineer"]},
    {"name": "Duration", "items": ["120 days", "90 days", "60 days", "30 days"]}
  ],
  "clues": [
    "The Scientist works in the Lab module.",
    "The Pilot is stationed in Control.",
    "Maya's mission is the longest of all four crew members.",
    "The crew member assigned to Medbay serves for exactly 60 days.",
    "Leo is not assigned to the Farm or the Lab.",
    "Chloe's mission is shorter than Noah's.",
    "The Engineer's mission lasts longer than the Medic's.",
    "Noah does not work in the Control module.",
    "Leo is not the Engineer.",
    "Leo is not the Pilot.",
    "Chloe is not the Pilot."
  ],
  "solution": [
    ["Noah", "Farm", "Engineer", "90 days"],
    ["Maya", "Control", "Pilot", "120 days"],
    ["Chloe", "Lab", "Scientist", "30 days"],
    ["Leo", "Medbay", "Medic", "60 days"]
  ]
}
Note the clue mix: 2 cross-category links (clues 1, 2), 1 superlative (3), 1 absolute assignment (4), 2 comparisons (6, 7), and 5 exclusions (5, 8, 9, 10, 11). Every clue is necessary: removing any single one yields multiple solutions.`;

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
