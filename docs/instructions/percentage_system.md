# The Percentage System
When a percentage based system is relevant, we will display both standard intensity and relative intensity. 
## Relative Intensity
Relative Intensity (RI) is basically:
“How hard is this set for this rep target, relative to my rep max for that rep target?”
Definitions (with 1RM context)
Standard “intensity” (common usage)
Usually means load as % of 1RM (or the absolute load on the bar).


Example: 100 kg on a 150 kg bench = 66.7% of 1RM.


Relative Intensity (RI) (as in your excerpt)
Means load as % of the RM for that rep range (your nRM).


It’s an effort/difficulty metric for a given rep count.


Formula:
RI = (load used / estimated nRM) * 100

And since nRM is estimated from 1RM via a table (e.g., 4RM ≈ 90% of 1RM):
nRM ≈ α_n * 1RM

So you can also write:
RI = ((% 1RM of the load) / α_n) * 100

Also see table relative_intensity_table.png (In left of the table, difficulty = relative intensity)

Example (bench press)
1RM = 150 kg
 Estimated 4RM = 90% × 150 = 135 kg
 If you do 100 kg × 4:
RI = 100 / 135 * 100 ≈ 74%

Notice the key point:
Standard intensity: 100 kg = 66.7% 1RM


Relative intensity: that same set is 74%


So RI says: “For a 4-rep set, I’m at ~74% of what I could maximally do for 4 reps.”
Why RI is different (and useful)
%1RM alone doesn’t tell you how “close to max” the set is for the chosen reps.
70% 1RM for 4 reps is usually pretty easy.


70% 1RM for 10 reps might be near-max for some people.


RI bakes the rep target into the “how hard is it” question by referencing nRM.
Intuition for RI values
RI = 100% → you’re at your true nRM (a max set for that rep count; basically 0 reps in reserve for that target).


Lower RI → more “margin” (further from your nRM for that rep count).


One can progress RI across weeks (e.g., 82.5 → 87.5 → 92.5) while adjusting sets/volume downward.


Or you can keep RI constant but vary reps (e.g., swap 8 reps at a lower %1RM for 6 reps at a higher %1RM) to keep the “difficulty relative to rep max” roughly stable (e.g., to give the body something new/keep enthusiasm while at the same time varying intensity legitimately). 
We must be aware, those nRM↔1RM tables vary a lot by lifters experience, the lift in question, etc… Perhaps we can include it as a disclaimer. RI is best treated as a useful approximation.

Below is an example script via ChatGPT to display it on the app. Manually assess it: 
RELATIVE INTENSITY (RI) — APP INSTRUCTIONS (DISPLAYED ALONGSIDE %1RM)

Purpose
- Display both (1) standard intensity and (2) relative intensity for each set.
- Standard intensity answers: “How heavy is this relative to my 1RM?”
- Relative intensity answers: “How hard is this set for this rep target relative to my nRM (rep max)?”

Definitions
1) Standard intensity (%1RM)
%1RM = (Load / 1RM) × 100

2) Relative intensity (RI)
- First estimate the rep max for the performed rep count (nRM) from the user’s 1RM:
nRM ≈ αn × 1RM
- Then compute RI:
RI% = (Load / nRM) × 100
- Equivalent shortcut:
RI% = (%1RM) / αn

Default rep table (αn coefficients; nRM as % of 1RM)
Reps:  1    2     3      4     5      6     7      8     9      10
αn:   1.00 0.95  0.925  0.90  0.875  0.85  0.825  0.80  0.775  0.75

Per-set calculation (for each set with Load and Reps)
Inputs required:
- 1RM for the lift (user-entered or app-estimated)
- Set load (kg/lb)
- Set reps (1–10 for the default table)

Steps:
1) Compute %1RM:
   %1RM = (Load / 1RM) × 100
2) Lookup αn using the set’s rep count (n).
3) Estimate nRM:
   nRM = αn × 1RM
4) Compute Relative Intensity:
   RI% = (Load / nRM) × 100
   (or RI% = %1RM / αn)

How to display in the app (per set)
- Show both metrics in the set row:
  Intensity: XX% 1RM
  Relative Intensity: YY% (of nRM)
Example formatting:
- “100 kg × 4 → 66.7% 1RM | RI 74% (of 4RM)”
- “100 kg × 8 → 66.7% 1RM | RI 83% (of 8RM)”

Example (bench press)
Given:
- 1RM = 150 kg
Set:
- 100 kg × 4
Calculations:
- %1RM = (100/150)×100 = 66.7%
- α4 = 0.90 → 4RM ≈ 0.90×150 = 135 kg
- RI% = (100/135)×100 = 74.1%
Display:
- “66.7% 1RM | RI 74% (of 4RM)”

Planning mode (convert target RI to target %1RM / load)
If a user selects:
- Reps = n
- Target Relative Intensity = RI_target (%)
Then:
- Target %1RM = αn × RI_target
- Target Load = 1RM × (αn × RI_target/100)
(Apply rounding rules to match plates/increments.)

Edge cases / guardrails
- If 1RM is missing: show %1RM and RI as “—” and prompt the user to add/estimate 1RM.
- If reps are outside the default table (e.g., >10): either hide RI or use an alternate estimator only if enabled in settings.
- If the 1RM is old: show a small warning (“RI depends on an up-to-date 1RM.”).
