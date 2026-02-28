You are an expert logic puzzle creator AND verifier. Create a logic grid puzzle.

Topic: "{{topic}}"
Difficulty: {{difficulty}}
Grid size: Exactly {{categoryCount}} categories, each with exactly {{itemCount}} items.
{{einsteinInstructions}}
IMPORTANT NAMING:
- Keep ALL category names and item names SHORT (max 2–3 words each).
- Use first names only for people.
- Abbreviate where reasonable (e.g., "Con." "Kit." "Eng." "Data An.").
- Avoid any duplicate words across categories that could confuse parsing (e.g., don't have a person named "Lab").

────────────────────────────────────────────────────────────────────
STRICT OUTPUT FORMAT (NO DEVIATIONS)
Return a single JSON object with EXACTLY these keys (no extras, no commentary):
- "title": string
- "story": string (2–4 sentences)
- "goal": string (MUST start with "Determine")
- "categories": array of {"name": string, "items": string[itemCount]}
- "clues": string[] (see clue count guidance below)
- "solution": string[][] (exactly itemCount rows; each row has categoryCount strings)

Absolutely no markdown code fences. No additional text outside JSON.

────────────────────────────────────────────────────────────────────
PUZZLE STRUCTURE RULES (HARD)
1) Use exactly {{itemCount}} items per category.
2) Enforce strict 1-to-1 mapping across ALL categories (no repeats, no overlaps).
3) Every item must appear exactly once in the final solution grid.
4) The puzzle must have exactly ONE unique solution.

SOLUTION FORMAT RULES (HARD)
- "solution" is an array of exactly {{itemCount}} rows.
- Each row is an array of exactly {{categoryCount}} strings, one item per category, in the SAME ORDER as "categories".
- The first string in each row corresponds to the FIRST category, second string to SECOND category, etc.
- Every item from every category must appear in exactly one solution row.

GOAL RULE (HARD)
- "goal" MUST start with "Determine" and describe what the solver must deduce.

────────────────────────────────────────────────────────────────────
DIFFICULTY TARGETING
Easy:
- Mostly direct clues: "A is B" or "A is not B".
- 1–2 inference steps max for most placements.

Medium:
- Mix of direct and inferential clues.
- Requires chain reasoning; 2–4 multi-step deductions total.

Hard:
- Mostly indirect clues (comparisons, ordering, conditional constraints).
- Fewer absolute anchors; relies on cross-category links + multi-step inference.

Aim for {{clueMin}}–{{clueMax}} clues (adjust slightly by difficulty).

────────────────────────────────────────────────────────────────────
CLUE QUALITY RULES (HARD)
A) Precision (no ambiguity)
- Avoid vague words ("near", "around", "between") unless defined.
- If positional language exists (only if there is an order/position/time category), use exactly:
  Adjacent: "directly left/right of" (or "exactly one position before/after")
  Non-adjacent: "somewhere left/right of"
  Between: "A is somewhere between B and C (not necessarily adjacent)"
- For time comparisons, specify earlier/later and ensure the values are totally ordered.

B) Atomic clues
- Each clue should be a single statement.
- Avoid compound clues unless BOTH parts joined by "and" are necessary AND neither part is redundant alone.

C) No redundancy, all necessary
- No clue may be redundant: every clue must contribute at least one new deduction.
- Necessity test: removing ANY single clue must make the puzzle unsolvable OR produce multiple solutions.

D) Category coverage
- Each category must be constrained by multiple clues.
- Don’t concentrate all constraints on one person or one category.

────────────────────────────────────────────────────────────────────
ANTI-FAILURE DESIGN GUARDRAILS (VERY IMPORTANT)
1) Negation-only sets are forbidden.
   - You MUST include multiple "bridge" constraints that FORCE pairings across categories.
2) Include at least this minimum number of CROSS-CATEGORY LINKS:
   - For itemCount=3: at least 2 bridge clues
   - For itemCount=4: at least 3 bridge clues
   - For itemCount=5: at least 4 bridge clues
   Bridge clues are ones that connect two categories positively or structurally, e.g.:
   - "The Scientist works in the Lab."
   - "The Control module starts at 1200."
   - "The Wrench was found in the Study."
3) Limit absolute anchors:
   - Easy: up to 2 absolute anchors
   - Medium: up to 1–2 absolute anchors
   - Hard: at most 1 absolute anchor (or none)
4) If you use comparisons (longer/shorter, earlier/later), include at least one additional clue that ties one of those compared items to a concrete category value, otherwise comparisons float and create multiple solutions.
5) If there is a Position/Time/Order category, include at least one clue that connects a non-order category to a specific order value (directly or via another linked clue).

────────────────────────────────────────────────────────────────────
VERIFICATION (MUST DO IN YOUR HEAD BEFORE OUTPUT)
Step 1: Create the full final solution grid first.
Step 2: Write clues that logically imply that exact grid.
Step 3: Check existence: the clues allow at least one solution (the intended one).
Step 4: Check uniqueness: there is exactly ONE solution.
Step 5: Necessity test: remove each clue one at a time; uniqueness must break.
Step 6: Sanity check: no clue references items not in categories; no hidden assumptions.

If any step fails, rewrite clues until all steps pass.

────────────────────────────────────────────────────────────────────
CLUE TOOLBOX (TEMPLATES + MICRO-EXAMPLES)

1) Bridge link (strong; use several)
- "The [Role] works in the [Module]."
- "The [Module] assignment is the [Task]."
- "The [Weapon] was found in the [Room]."

2) Exclusion (good seasoning; don’t overuse)
- "[Name] is not assigned to [Item]."
- "The [Role] did not use the [Tool]."

3) Comparison (only for ordered sets)
- "[Name]'s [Duration] is longer than [Name2]'s."
- "The [Task] shift starts earlier than the [Module] shift."

4) Positional / ordering (only if you have a lineup/positions/times)
- "[A] is directly left of [B]."
- "[A] is somewhere right of [B]."
- "[A] is somewhere between [B] and [C] (not necessarily adjacent)."

5) Either/or (use sparingly; must resolve)
- "[Name] is assigned to either [X] or [Y]."
- "The [Role] used either [Tool1] or [Tool2]."

6) Exactly-one-of-two (hard; use rarely)
- "Exactly one of these is true: (A) ..., (B) ..."

────────────────────────────────────────────────────────────────────
BAD vs GOOD CLUE EXAMPLES (TO AVOID COMMON FAILURES)

BAD (ambiguous):
- "Alex was near the Lab."
GOOD:
- "Alex is assigned to the Lab."

BAD (undefined between):
- "The Script user is between the Code specialist and the Encrypt user."
GOOD:
- "The Script user is somewhere between the Code specialist and the Encrypt user in the lineup (not necessarily adjacent)."

BAD (pure negations → multiple solutions):
- "Noah is not in Lab." "Maya is not in Control." "Leo is not 120 days."
GOOD (add bridges):
- "The Scientist works in Lab."
- "Control starts at 1200."
- "The 120-day mission belongs to the Scientist."

BAD (comparison floats):
- "Cara starts earlier than David."
GOOD (anchor one side):
- "Cara starts at 0800."
- "Cara starts earlier than David."

────────────────────────────────────────────────────────────────────
FULL QUALITY EXAMPLE A (4 categories, 4 items, 11 clues, unique, necessary)
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

FULL QUALITY EXAMPLE B (3 categories, 3 items, minimal but unique)
{
  "title": "Orbital Tasks",
  "story": "Three crew members have arrived at an orbital outpost. Each is assigned to a different module and a distinct primary task. Mission Control needs the assignments confirmed before operations begin.",
  "goal": "Determine each crew member's module and primary task.",
  "categories": [
    {"name": "Crew", "items": ["Alex", "Beth", "Cam"]},
    {"name": "Module", "items": ["Lab", "Comm.", "Hab"]},
    {"name": "Task", "items": ["Observe", "Plan", "Repair"]}
  ],
  "clues": [
    "Alex is assigned to the Lab module.",
    "The crew member in the Hab module has the Observe task.",
    "Beth is not assigned to the Comm. module.",
    "The Comm. module's assignment is the Plan task."
  ],
  "solution": [
    ["Alex", "Lab", "Repair"],
    ["Beth", "Hab", "Observe"],
    ["Cam", "Comm.", "Plan"]
  ]
}

FULL QUALITY EXAMPLE C (4 categories, includes ordered time; shows bridges + comparisons)
{
  "title": "Station Shift Starts",
  "story": "Four crew members begin their new rotations aboard the orbital station. Each works a different module, has a unique task, and starts at a distinct shift time. A clean roster is required to avoid overlap.",
  "goal": "Determine each crew member's module, task, and shift start time.",
  "categories": [
    {"name": "Crew", "items": ["Cara", "David", "Alice", "Ben"]},
    {"name": "Module", "items": ["Comms", "Hydro", "Eng.", "Hab"]},
    {"name": "Task", "items": ["Nav.", "Maint.", "Plant", "Data An."]},
    {"name": "Start", "items": ["0400", "0800", "1200", "1600"]}
  ],
  "clues": [
    "The Hydro module handles the Plant task.",
    "The Data An. task starts at 1600.",
    "Alice is not assigned to the Hydro module.",
    "Ben performs the Plant task.",
    "The Comms module is not responsible for the Plant task.",
    "David's shift starts later than the Maint. task.",
    "The Hab module does not start at 0400.",
    "Cara is not assigned to Eng.",
    "The Nav. task is not performed in Hab.",
    "Alice's shift starts earlier than the Maint. task."
  ],
  "solution": [
    ["Cara", "Comms", "Nav.", "0800"],
    ["David", "Hab", "Data An.", "1600"],
    ["Alice", "Eng.", "Maint.", "1200"],
    ["Ben", "Hydro", "Plant", "0400"]
  ]
}