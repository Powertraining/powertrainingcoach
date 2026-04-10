// Note: In React Native/Expo, we cannot use the ?raw import syntax (Vite/webpack feature)
// Instead, we rely on Firebase liveInstructions or minimal local fallbacks

// Minimal local instruction fallbacks for use when Firebase is unavailable
const local_general = `# General Rules
You are a specialist performance coach that designs tailored strength, power, speed, and conditioning programs for combat-sport athletes.`;

const local_reps = `# Reps and Intensity
Follow progressive overload principles with appropriate rep ranges based on training goals.`;

const local_compound = `# Compound Lifts
Focus on fundamental movement patterns: squat, hinge, push, pull, and carry variations.`;

const local_plyo = `# Plyometrics and Loading
Progress from lower intensity to higher intensity movements following proper periodization.`;

const local_ballistic = `# Ballistic Training
Apply explosive training methods with adequate recovery between high-intensity efforts.`;

const local_substitutes = `# Substitutes
For somewhat complex, inconvenient, or hard-to-access exercises, always provide pragmatic substitutes that stay in the same movement category and training emphasis. Do not swap to unrelated patterns. For example: High Back Squat -> Front Squat / Low Bar Back Squat / Safety Bar Squat. Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips. Power Clean -> Power Snatch.`;

const local_session_spacing = `# Session Spacing
Once the athlete has spread out their training sessions, estimate session similarity and avoid placing highly overlapping sessions too close together when practical. Similarity should be based on shared region, shared training quality, and shared stress level rather than exercise names alone. Sessions with high overlap in force, power, or fatigue demands, especially for the same region, should generally be separated by about 48 hours when possible. This spacing rule is advisory, not absolute, because real-world schedules vary.`;

const local_missed_sessions = `# Missed Sessions
Preserve the weekly structure first. Preserve session order second. Preserve the main stimulus third. Rescue missed work inside the same training week only when there is still room. If there is only one viable slot left, trim the session from the bottom: power or plyo or med-ball first, then the main compound lift, then the main weighted row or primary pull, then high-stimulus core, with accessories sacrificed first. Do not cram two full missed sessions together. Near competition or taper periods, replace missed work with a short primer rather than catch-up volume.`;

const local_rm_attempts = `# RM Attempts
When liftIntensityMethod is "percentage", the athlete must choose one strength-reference method for future % prescriptions:
1. true_1rm: rare and only for experienced athletes in off-camp/general strength phases, never close to competition, max one true 1RM test in any week.
2. multi_rm: use a top set of 2-5 reps and estimate 1RM with Epley's formula (load * (1 + reps / 30)); schedule roughly every 4-6 weeks, usually one key lift at a time, and block it in the final 3-4 weeks before competition.
3. heavy_single: default/frequent method; use a heavy single @RPE 8-9 as the top set of a normal session, not in deload weeks, and remove or soften it near competition. Estimate 1RM by treating each RPE point as about 2.5% for singles, so RPE 9 is about 97.5% and RPE 8 is about 95%.
If a strength assessment is scheduled, make it part of a normal training day on a primary lift and never on accessories. Heavy singles should usually appear once per 3:1 block around week 3. 2-5RM tests are occasional. True 1RMs are rare and may be omitted entirely when the phase or plan length is unsuitable.
Use previously stored training-max history when available so future percentage work reflects the athlete's latest logged assessments.`;

const instructionPriority = [
    "general_rules",
    "reps_intensity",
    "compound_lifts",
    "rm_attempts",
    "plyometrics_loading_jumps",
    "ballistic_training",
    "substitutes",
    "session_spacing",
    "missed_session_logic"
];

function getFallbackInstructions() {
    return {
        general_rules: local_general,
        reps_intensity: local_reps,
        compound_lifts: local_compound,
        rm_attempts: local_rm_attempts,
        plyometrics_loading_jumps: local_plyo,
        ballistic_training: local_ballistic,
        substitutes: local_substitutes,
        session_spacing: local_session_spacing,
        missed_session_logic: local_missed_sessions,
    };
}

function getOrderedMergedInstructions(liveInstructions = null) {
    const fallbackInstructions = getFallbackInstructions();
    const liveInstructionEntries = Object.entries(liveInstructions || {}).filter(
        ([, text]) => typeof text === "string" && text.trim().length > 0
    );

    const orderedLiveInstructions = liveInstructionEntries.sort(([leftKey], [rightKey]) => {
        const leftPriority = instructionPriority.indexOf(leftKey);
        const rightPriority = instructionPriority.indexOf(rightKey);

        if (leftPriority !== -1 || rightPriority !== -1) {
            if (leftPriority === -1) return 1;
            if (rightPriority === -1) return -1;
            return leftPriority - rightPriority;
        }

        return leftKey.localeCompare(rightKey);
    });

    const mergedInstructions = new Map(orderedLiveInstructions);

    Object.entries(fallbackInstructions).forEach(([key, value]) => {
        if (!mergedInstructions.has(key)) {
            mergedInstructions.set(key, value);
        }
    });

    return mergedInstructions;
}

function getGuidelinesText(liveInstructions = null) {
    return Array.from(getOrderedMergedInstructions(liveInstructions).values())
        .filter((text) => text && typeof text === "string")
        .join("\n\n");
}

function getInstructionImages(liveInstructions = null) {
    return Array.isArray(liveInstructions?.__images)
        ? liveInstructions.__images.filter((image) => image?.url && image?.name)
        : [];
}

function getImageInstructionsText(liveInstructions = null) {
    const instructionImages = getInstructionImages(liveInstructions);

    return instructionImages.length > 0
        ? `
Additional reference images are attached separately and are part of the instruction set. Use them when relevant:
${instructionImages.map((image) => `- ${image.name}`).join("\n")}
`
        : "";
}

/**
 * Builds the complete system prompt for generating training programs.
 * * @param {object} userInput - Clean structured input from frontend.
 * @param {object} oldPlan - Previous training plan for progression (if any).
 * @param {object} liveInstructions - Object containing instructions fetched from Firebase (optional).
 * @returns {string} - The complete prompt string.
 */
export function buildTrainingPrompt(userInput, oldPlan = null, liveInstructions = null) {
    const guidelines = getGuidelinesText(liveInstructions);
    const imageInstructions = getImageInstructionsText(liveInstructions);

    const substitutionSchemaInstructions = `
### EXERCISE SUBSTITUTION RULES:
- Apply the substitutes.md logic, but encode substitute ideas directly in each exercise's "substitutionOptions" array so the app can render them as selectable replacements.
- Every exercise MUST include "substitutionOptions". Use an empty array when no pragmatic alternatives are needed.
- For exercises that are somewhat complex, inconvenient, or commonly inaccessible, include 2-5 pragmatic substitute options.
- Keep every substitute in the same movement category and training emphasis. Never swap to an unrelated pattern.
- Good examples:
  - High Back Squat -> Front Squat / Low Bar Back Squat / Safety Bar Squat
  - Bench Press -> DB Bench Press / Narrow Grip Bench Press / Weighted Dips
  - Power Clean -> Power Snatch
- Every substitution option must be a full exercise object with "name", "sets", "reps", and "notes".
`;

    const sessionStructureInstructions = `
### SESSION STRUCTURE RULES:
- Organize every week by sequential session labels: Day 1, Day 2, Day 3, Day 4, and so on.
- The program logic MUST stay session-based, not calendar-based.
- Use the numeric "day" field only for session order inside the week.
- Never use weekday names such as Monday, Wednesday, or Friday as the primary identifier for a training day.
- Set "sessionLabel" to match the session order exactly, for example "Day 1".
- If the user provides preferred weekdays, include them only as secondary guidance in "preferredWeekday".
- If the user does not provide preferred weekdays, set "preferredWeekday" to an empty string.
`;

    const sessionProfileInstructions = `
### SESSION PROFILE RULES:
- Every training day MUST include a "sessionProfile" object so the app can evaluate session spacing.
- "sessionProfile" must summarize the session's likely demands using:
  - "regions": array of one or more from "upper_body", "lower_body", "full_body", "core"
  - "qualities": array of one or more from "force", "power", "fatigue", "speed", "hypertrophy", "recovery"
  - "stressLevel": one of "low", "moderate", "high"
- When preferred weekdays are provided, use this profile to avoid placing highly overlapping sessions too close together when practical.
- If two sessions strongly overlap in region plus force/power/fatigue demands, try to leave about 48 hours between them when possible.
- This spacing rule is advisory, not absolute.
`;

    const strengthAssessmentInstructions = `
### PERCENTAGE-LOGIC STRENGTH ASSESSMENT RULES:
- If "liftIntensityMethod" is "percentage", you MUST respect "percentageReferenceMethod" when deciding how main lifts get their reference points for future % prescriptions.
- Method rules:
  - "heavy_single" = default/frequent. Use a heavy single @RPE 8-9 as the top set of a normal session, usually once per 3:1 loading block around week 3, never in a deload week, and remove or soften it in the final 1-2 weeks before competition.
  - "multi_rm" = occasional. Use a hard top set of 2-5 reps, usually every 4-6 weeks, only one key lift per week, allowed off-season and early/mid camp, blocked in the final 3-4 weeks before competition.
  - "true_1rm" = rare. Only in off-camp/general strength phases, only for intermediate/advanced athletes, never within 8 weeks of competition, and max one true 1RM test in any week. If the phase or plan length is unsuitable, omit the true 1RM and keep normal submax work instead.
- Only place these assessments on primary strength lifts. Never put them on accessories or isolation work.
- Use any provided "strengthAssessmentSummary.latestByLift" values as the athlete's current anchors for future percentage prescriptions. Prefer stored training maxes when available.
- When an assessment is scheduled, include an optional "strengthAssessment" object on that exercise so the app can prompt the athlete to log the result:
  {
    "method": "heavy_single" | "multi_rm" | "true_1rm",
    "liftName": "Trap Bar Deadlift",
    "prompt": "Short instruction telling the athlete what to log for future percentage updates."
  }
- Logging expectations:
  - "heavy_single": athlete logs load and RPE
  - "multi_rm": athlete logs load and exact reps
  - "true_1rm": athlete logs the heaviest successful single
`;

    const phaseOverviewInstructions = `
### PROGRAM RATIONALE RULES:
- Include a top-level "summary" that explains the overall purpose of the training program in 1-3 concise sentences.
- Include a top-level "phaseOverview" array that explains how the full program progresses across phases or blocks.
- Every phase entry MUST include:
  - "label": short phase name such as "Building", "Intensification", "Power / Speed", or "Taper"
  - "weekStart": positive integer for the first week in that phase
  - "weekEnd": positive integer for the last week in that phase
  - "focus": short rationale explaining what that phase is trying to build or express
- Make the phase ranges cover the generated program logically without overlapping.
- The phase overview should describe the whole training arc, while the weekly "days" arrays still contain the detailed sessions.
`;

    // Combine everything into the final prompt
    const prompt = `
You are **PowerTrainingCoach**, an expert AI specializing in creating safe, effective, and personalized strength & conditioning training programs for combat athletes.

Follow ALL of the domain rules and instructions below:
Given two equivalent exercises, prioritize the exercise that is easier to perform with proper form and technique, especially for athletes with limited training experience or mobility constraints. Always prioritize safety and proper movement patterns over complexity or intensity.

${guidelines}
${imageInstructions}
${substitutionSchemaInstructions}
${sessionStructureInstructions}
${sessionProfileInstructions}
${strengthAssessmentInstructions}
${phaseOverviewInstructions}

---

### USER INPUT (JSON):
${JSON.stringify(userInput, null, 2)}

---

### OUTPUT INSTRUCTIONS:
- Respond ONLY in valid JSON.
- Return EXACTLY one training plan object.
- Follow the structure below EXACTLY.
- Do not include commentary or explanation.
- Never return multiple plans, comparisons, or wrapper keys such as "plans", "options", or "planChoices".
- Include both a top-level "summary" and a top-level "phaseOverview" array.
- Every exercise MUST include a "substitutionOptions" array.
- Add "strengthAssessment" only when that exercise is a planned testing/top-set event for percentage-based loading.
- The number of sessions inside each week's "days" array should match the athlete's requested weekly training frequency.
- Every training day MUST include a "sessionProfile" object.

{
  "summary": "Brief explanation of the overall program direction and rationale.",
  "phaseOverview": [
    {
      "label": "Building",
      "weekStart": 1,
      "weekEnd": 4,
      "focus": "Build general strength, tissue tolerance, and technical consistency before intensifying."
    },
    {
      "label": "Intensification",
      "weekStart": 5,
      "weekEnd": 8,
      "focus": "Shift toward heavier loading and higher neural demand while trimming lower-value volume."
    }
  ],
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "sessionLabel": "Day 1",
          "preferredWeekday": "Monday",
          "sessionProfile": {
            "regions": ["lower_body"],
            "qualities": ["force", "power"],
            "stressLevel": "high"
          },
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": "3–5",
              "reps": "8–12",
              "notes": "Short instruction or coaching cue",
              "strengthAssessment": {
                "method": "heavy_single",
                "liftName": "Trap Bar Deadlift",
                "prompt": "Log the load and RPE of the top single so the app can update future % work."
              },
              "substitutionOptions": [
                {
                  "name": "Comparable Alternative",
                  "sets": "3–5",
                  "reps": "8–12",
                  "notes": "Short instruction or coaching cue"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

### Previous Plan (if any):
${oldPlan ? JSON.stringify(oldPlan, null, 2) : "No previous plan provided."}

---

###

Now generate exactly one training plan JSON object.
`;

    return prompt;
}

/**
 * Builds a focused prompt for rewriting a single rescue or re-entry session.
 * @param {object} adjustmentInput
 * @param {object} liveInstructions
 * @returns {string}
 */
export function buildMissedSessionAdjustmentPrompt(adjustmentInput = {}, liveInstructions = null) {
    const guidelines = getGuidelinesText(liveInstructions);
    const imageInstructions = getImageInstructionsText(liveInstructions);
    const {
        questionnaire = {},
        currentPlan = {},
        currentWeek = {},
        sourceDay = {},
        targetDay = {},
        mode = "",
        reason = "",
        missedSessionCount = 1,
    } = adjustmentInput;

    const modeInstructions =
        mode === "taper_primer"
            ? "Build a short primer only. Keep volume low, intensity reasonably sharp, and fatigue minimal."
            : mode === "re_entry"
                ? "Build a conservative re-entry session. Use reduced volume, lower-end RPE, and no heroics."
                : mode === "priority_rescue"
                    ? "Build one meaningful rescue session around the week's highest-priority stimulus. Cut lower-value work aggressively."
                    : "Build a late-week rescue session by trimming from the bottom while preserving the main stimulus.";

    return `
You are **PowerTrainingCoach**, updating a single training day inside an existing weekly plan after missed sessions.

Follow ALL of the domain rules and instructions below:
${guidelines}
${imageInstructions}

### MISSED-SESSION ADJUSTMENT GOAL:
- Rewrite ONLY one training-day JSON object.
- Keep the session in the same movement category and training emphasis as the source day.
- Preserve the highest-value work first: power/plyo/med-ball, then the main compound lift, then the main weighted row or primary pull, then high-stimulus core, then accessories last.
- Keep substitutions comparable. Do not add random filler.
- ${modeInstructions}
- If the miss reason was fatigue or illness, keep the notes conservative and recovery-aware.
- If the source day included a percentage-based strength assessment, preserve that logic on the rewritten day when it is still appropriate and include the same optional "strengthAssessment" object on the relevant top-set exercise.

### CONTEXT:
Questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Current plan:
${JSON.stringify(currentPlan, null, 2)}

Current week:
${JSON.stringify(currentWeek, null, 2)}

Source day to preserve/adapt:
${JSON.stringify(sourceDay, null, 2)}

Target slot to fill:
${JSON.stringify(targetDay, null, 2)}

Miss reason: ${reason || "schedule_travel"}
Missed session count this week: ${missedSessionCount}
Adjustment mode: ${mode || "late_week_rescue"}

### OUTPUT INSTRUCTIONS:
- Respond ONLY in valid JSON.
- Return a single training-day object, not a full plan.
- Keep the target slot's "day" number and preferredWeekday.
- Keep "sessionLabel" aligned with the rescued session identity if it was moved.
- Include "sessionProfile".
- Every exercise MUST include "substitutionOptions".
- Include "strengthAssessment" only when the rewritten day still contains the testing/top-set event.

{
  "day": ${targetDay?.day || 1},
  "sessionLabel": "Day 2",
  "preferredWeekday": "${targetDay?.preferredWeekday || ""}",
  "sessionProfile": {
    "regions": ["lower_body"],
    "qualities": ["force", "power"],
    "stressLevel": "moderate"
  },
  "status": "rescheduled",
  "rescueMode": "${mode || "late_week_rescue"}",
  "adjustmentReason": "${reason || "schedule_travel"}",
  "adjustmentSummary": "Short explanation of the rescue or re-entry choice.",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": "2-3",
      "reps": "3-5",
      "notes": "Coaching cue or adjustment note",
      "strengthAssessment": {
        "method": "multi_rm",
        "liftName": "Back Squat",
        "prompt": "Log the load and exact reps of the top set so the app can estimate your 1RM."
      },
      "substitutionOptions": []
    }
  ]
}
`;
}
