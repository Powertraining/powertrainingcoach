# Accessory Exercises
## Rule: Prioritize High-ROI Horizontal Pulling (Weighted Rows > Band Rows)
Goal:
Ensure the program generator gives combat athletes productive, high-stimulus pulling work (weighted rows) and uses band rows/face pulls only as low-load accessories, not as primary strength work.

1. Classification
High-ROI horizontal pulls (primary)
Barbell row (all variants)
Chest-supported row
1-arm dumbbell row
Cable row / seal row / T-bar row
Low-load accessory pulls (secondary)
Band rows
Band face pulls
Light cable face pulls / external rotation combos
Tag these in your exercise database accordingly:
horizontal_pull_primary = True/False
horizontal_pull_accessory = True/False

2. Selection Rule
For any main upper-body pull slot (primary pulling exercise of the session/block):
Default behavior
The app must always select a primary weighted row (horizontal_pull_primary = True)
Never select band rows or face pulls as the main horizontal pull when:
Weights/dumbbells/cables are available
The goal is strength / hypertrophy / robustness
Fallback behavior
Only use band rows as the main pull if:
equipment = minimal (no external load available), or
athlete_status = rehab / very low tolerance for loaded pulling
Even then, label it internally as “reduced-stimulus substitution” so the system knows it’s a compromise.

3. Volume & Placement Rule for Band Rows / Face Pulls
Band rows / face pulls are:
Allowed only in accessory slots, not as the top/main pull.
Limited to low–moderate volume, e.g.:
2–4 sets of 12–20 reps
Placed near the end of the session or in warm-up/prehab blocks.
They do not replace:
Heavy rows in the 4–8 rep ranges
Key pulling volume targets for the week
Internal logic example:
If session already contains 1 primary horizontal row, then:
Band work may be added as optional accessory / shoulder health.
If session does not contain a primary row yet:
The generator must insert a primary weighted row before considering band work.

4. Short rationale for app/coach text (optional)
Why you see more heavy rows than band work
The app prioritizes weighted rowing exercises (barbell, dumbbell, cable rows) because they give combat athletes a much stronger strength and hypertrophy stimulus.
Band rows and face pulls are kept as light accessory / shoulder-health work, not as your main back strength exercises, unless you have very limited equipment or special rehab needs.

## Rule: Prioritize High-Stimulus Core Work (Minimize Low-Load “Fancy” Drills)
Goal:
For combat athletes, core training should be mostly high-tension, high-stimulus work (trunk flexion, anti-extension, loaded bracing) – not low-load, physio-style motor-control drills.

1. Classification in the Exercise Database
Tag core/ab exercises into two broad groups:
A. High-stimulus / primary core exercises
(Heavy enough to actually build strength/hypertrophy)
Examples (not exhaustive):
Barbell rollouts / ab-wheel rollouts
Strict hanging leg raises / strict lying leg raises
Weighted sit-ups / cable crunches
Heavy plank variations (RKC plank, long-lever plank) with added load/time
Landmine anti-rotation / landmine twists
Heavy carries (farmer’s, suitcase, front-rack) – if you classify them under core
Tag as:
core_primary_high_stimulus = True

B. Low-load / accessory / motor-control / rehab-style core exercises
Examples:
Dead bugs, bird-dogs
Fancy towel core slides, unstable surface stuff
Most yoga-style “core flows”
Low-load Copenhagen variations (classically adductor/motor-control focused)
Very light physio-style isometrics
Tag as:
core_low_stimulus_accessory = True

2. Selection Rule for Core Work in Programs
Core Rule #1 – Primary core work must be high-stimulus
For any core slot intended as actual trunk training (not rehab or warm-up):
The app must always select from core_primary_high_stimulus by default.
It should not select core_low_stimulus_accessory as the main core work for elite/advanced athletes.
Core Rule #2 – Weekly minimum of high-stimulus core
For “normal” elite combat athletes (no injury flag):
Ensure at least 2 core sessions per week use only high-stimulus exercises.
Each such session should have:
2–4 sets
6–15 reps (or appropriate time under tension)
Sufficient load/tension to be clearly challenging.

3. When Low-Load “Fancy” Core Exercises Are Allowed
They should only appear in these scenarios:
Equipment-limited / beginner / rehab
If equipment = minimal, training_age = low, or status = rehab, the app can:
Use low-stimulus exercises as progressions/regressions or placeholders.
Warm-up/prehab blocks
Dead bugs, bird-dogs, etc., can be used in the warm-up, not as the main core stimulus.
Tag those slots internally as warmup/prehab, not primary_core.
Deload weeks
In the deload week of a 3:1 block, the app may:
Reduce or replace heavy core work with lighter motor-control drills to spare fatigue.
Even then, they’re there as “maintenance/activation”, not as the main adaptation driver.
Hard limit:
For elite/normal blocks, low-load/core-accessory drills should be:
0 primary slots per week
At most 1–2 optional accessory slots (warm-up, finisher, or deload), and never the only core work in the whole week unless rehab-flagged.

4. Progression Logic (Simple)
For main core patterns, the app should:
Default to high-stimulus exercise (e.g., rollout, strict leg raise, weighted sit-up).
If user flags “too hard” / fails, then:
Step down to an easier version of the same pattern (e.g., kneeling rollout, bent-knee raise, unweighted sit-up)
Not to a dead bug or yoga flow by default.

5. Short Rationale Text You Can Show in the App
Why you see more “old-school” abs and fewer fancy drills
For combat athletes, we prioritize high-tension, high-stimulus core work like rollouts, strict leg raises, and weighted sit-ups. These give a much stronger strength and robustness stimulus than low-load physio-style core drills.
Lighter “activation” exercises (like dead bugs or yoga-style variations) are only used in warm-ups, deloads, or rehab contexts – not as your main core training.
