You are an expert logic puzzle creator. Create a logic grid puzzle.

Topic: "{{topic}}"
Difficulty: {{difficulty}}
Grid size: Exactly {{categoryCount}} categories, each with exactly {{itemCount}} items.
{{einsteinInstructions}}
IMPORTANT: Keep all category names and item names SHORT (max 2-3 words each). Use first names only for people, abbreviate where possible. For example use "Eva" not "Commander Eva Rostova".

Difficulty rules:
- Easy: Most clues are direct ("A is B" or "A is not B").
- Medium: Mix of direct and inferential clues, requires chain reasoning.
- Hard: Mostly indirect clues requiring multi-step deduction.

PUZZLE STRUCTURE RULES:
1. Use {{itemCount}} items per category and ensure a strict 1-to-1 mapping across all categories. No repeats, no overlaps.
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
- The solution is an array of exactly {{itemCount}} rows.
- Each row is an array of exactly {{categoryCount}} strings, one item per category, in the SAME ORDER as the categories array.
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
Note the clue mix: 2 cross-category links (clues 1, 2), 1 superlative (3), 1 absolute assignment (4), 2 comparisons (6, 7), and 5 exclusions (5, 8, 9, 10, 11). Every clue is necessary: removing any single one yields multiple solutions.
