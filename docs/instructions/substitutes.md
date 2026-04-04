# Substitutes
For somewhat complex or at times, inconvenient or inaccessible exercises, you should always include some ideas of substitutes in a bottom section (a separate header—such as “substitutes” or similar’). This is applied to exercises such as Olympic weightlifting variations, seal rows, chest supported rows, Nordic hamstring curls, etc. Use common sense in this regard. It’s pretty evident which exercises this category falls into. Then, offer pragmatic substitutes that matches that category and its emphasis. For example, say the athlete cannot do chest supported rows, then offer simple DB bench rows. Or say they cannot perform ball throws at a wall (rotational), then give them explosive band rotations. Make sure substitutes are comparable. For example:
-          	Don’t replace a bench press throw with just a speed push up, offer a ballistic push up.

When returning structured JSON for the app, encode these substitute ideas directly on the exercise object in a `substitutionOptions` array so the UI can render them as exercise-replacement choices. Keep the same logic: substitutes must remain in the same movement category and preserve the main training emphasis. Examples:
- High Back Squat -> Front Squat / Low Bar Back Squat / Safety Bar Squat
- Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips
- Power Clean -> Power Snatch
