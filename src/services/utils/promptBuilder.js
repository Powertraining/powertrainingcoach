import {
  getGuidelinesText,
} from "./instructionRules.js";

function shouldIncludePercentageSchema(userInput = {}) {
  return (userInput?.liftIntensityMethod || "percentage") === "percentage";
}

function buildPlanSchemaInstructions(userInput = {}) {
  const includePercentageSchema = shouldIncludePercentageSchema(userInput);

  return `
### APP JSON CONTRACT
- Return exactly one direct training plan object. No wrapper keys, commentary, markdown, or alternatives.
- Include top-level "summary" and "phaseOverview".
- Each generated week must contain exactly ${userInput?.daysPerWeek || "the requested"} sessions in "days".
- Keep the plan session-based: use "day" and "sessionLabel" for order, and use "preferredWeekday" only as secondary scheduling guidance.
- Every training day must include "sessionProfile" with:
  - "regions": one or more of "upper_body", "lower_body", "full_body", "core"
  - "qualities": one or more of "force", "power", "fatigue", "speed", "hypertrophy", "recovery"
  - "stressLevel": "low", "moderate", or "high"
- Every exercise must include "name", "sets", "reps", "notes", and "substitutionOptions".
- Use "substitutionOptions" for comparable replacements the UI can swap in directly. Use an empty array when no substitute is needed.
- Add "performanceTarget" only on main monitored lifts where the app should track repeated top-set performance over time.
${includePercentageSchema ? `- On percentage-based primary lifts, include "percentagePrescription" with "referenceLiftName", "loadingStrategy", and "workingSets".
- Add "strengthAssessment" only when the lift includes a planned heavy single, 2-5RM test, or true 1RM event the app should log for future percentage updates.` : `- Do not invent percentagePrescription objects when the athlete is not using the percentage system.`}
- When the athlete is using RPE instead of the percentage system, do not add "percentagePrescription" or "strengthAssessment".
- When a field is not needed, omit it instead of filling it with placeholders.
`;
}

function buildPlanJsonExample(userInput = {}) {
  const includePercentageSchema = shouldIncludePercentageSchema(userInput);

  return `{
  "summary": "Brief explanation of the overall program direction and rationale.",
  "phaseOverview": [
    {
      "label": "Building",
      "weekStart": 1,
      "weekEnd": 4,
      "focus": "Build the main strength and power qualities before the next phase shifts emphasis."
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
              "sets": "3-5",
              "reps": "3-6",
              "notes": "Short coaching cue.",
              "performanceTarget": {
                "strategy": "fixed_rpe",
                "liftName": "Back Squat",
                "repTarget": 5,
                "targetRpe": 8,
                "prompt": "Log the top set load, reps, and RPE so the app can track your squat trend."
              },${
                includePercentageSchema
                  ? `
              "percentagePrescription": {
                "referenceLiftName": "Back Squat",
                "loadingStrategy": "flat_loading",
                "workingSets": [
                  {
                    "count": 5,
                    "reps": 5,
                    "percent1RM": 70,
                    "relativeIntensity": 80
                  }
                ]
              },
              "strengthAssessment": {
                "method": "heavy_single",
                "liftName": "Back Squat",
                "prompt": "Log the load and RPE of the top single so the app can update future % work."
              },`
                  : ""
              }
              "substitutionOptions": [
                {
                  "name": "Comparable Alternative",
                  "sets": "3-5",
                  "reps": "3-6",
                  "notes": "Same category and emphasis."
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;
}

export function buildTrainingPrompt(userInput, oldPlan = null) {
  const guidelines = getGuidelinesText({
    userInput,
    purpose: "plan",
  });
  const schemaInstructions = buildPlanSchemaInstructions(userInput);

  return `
You are PowerTrainingCoach, an expert combat-sport S&C coach.

Given two equally valid exercise choices, prefer the option that is safer, easier to coach, and easier to perform well.

Follow all of the rules below:
${guidelines}
${schemaInstructions}

### USER INPUT (JSON)
${JSON.stringify(userInput, null, 2)}

### PREVIOUS PLAN
${oldPlan ? JSON.stringify(oldPlan, null, 2) : "No previous plan provided."}

### OUTPUT
- Respond with valid JSON only.
- Return exactly one training plan object that follows the schema below.

${buildPlanJsonExample(userInput)}

Now generate exactly one training plan JSON object.
`;
}

function buildMissedSessionSchemaInstructions(adjustmentInput = {}) {
  const includePercentageSchema =
    shouldIncludePercentageSchema(adjustmentInput?.questionnaire);

  return `
### MISSED-SESSION JSON CONTRACT
- Rewrite exactly one training-day object, not a full plan.
- Keep the target slot's "day" number and preferredWeekday.
- Keep the rescued session in the same movement family and training emphasis as the source day.
- Every returned exercise must include "substitutionOptions".
- Keep "sessionLabel" tied to the rescued session identity rather than the slot it moved into.
- Include "sessionProfile", "status", "rescueMode", "adjustmentReason", and "adjustmentSummary".
- Preserve "performanceTarget" when the main tracked exposure is still present.
${includePercentageSchema ? `- Preserve percentage-based main-lift logic with an updated "percentagePrescription" when the main lift stays in the session.
- Preserve "strengthAssessment" only when the rescued or re-entry session should still include the planned assessment exposure.` : `- Do not add or preserve percentagePrescription or strengthAssessment on RPE-based plans.`}
`;
}

function buildMissedSessionJsonExample(targetDay = {}, mode = "late_week_rescue") {
  return `{
  "day": ${targetDay?.day || 1},
  "sessionLabel": "Day 2",
  "preferredWeekday": "${targetDay?.preferredWeekday || ""}",
  "sessionProfile": {
    "regions": ["lower_body"],
    "qualities": ["force", "power"],
    "stressLevel": "moderate"
  },
  "status": "rescheduled",
  "rescueMode": "${mode}",
  "adjustmentReason": "schedule_travel",
  "adjustmentSummary": "Short explanation of the rescue or re-entry choice.",
  "exercises": [
    {
      "name": "Exercise Name",
      "sets": "2-3",
      "reps": "3-5",
      "notes": "Coaching cue or trimmed-session note.",
      "substitutionOptions": []
    }
  ]
}`;
}

export function buildMissedSessionAdjustmentPrompt(
  adjustmentInput = {}
) {
  const guidelines = getGuidelinesText({
    userInput: adjustmentInput?.questionnaire,
    purpose: "missed_session",
  });
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
  const schemaInstructions = buildMissedSessionSchemaInstructions(adjustmentInput);

  const modeInstructions =
    mode === "taper_primer"
      ? "Build a short primer only. Keep fatigue minimal while preserving intent."
      : mode === "re_entry"
        ? "Build a conservative re-entry session with reduced volume and no heroics."
        : mode === "priority_rescue"
          ? "Keep only the week's most valuable stimulus and cut lower-value work aggressively."
          : "Trim the session into a practical late-week rescue version.";

  return `
You are PowerTrainingCoach, updating one training day after missed sessions.

Follow all of the rules below:
${guidelines}
${schemaInstructions}

### ADJUSTMENT GOAL
- Rewrite only the target training-day object.
- Preserve the highest-value work first and remove filler.
- ${modeInstructions}
- If fatigue, illness, or injury triggered the miss, keep the coaching notes conservative and recovery-aware.

### CONTEXT
Questionnaire:
${JSON.stringify(questionnaire, null, 2)}

Current plan:
${JSON.stringify(currentPlan, null, 2)}

Current week:
${JSON.stringify(currentWeek, null, 2)}

Source day:
${JSON.stringify(sourceDay, null, 2)}

Target slot:
${JSON.stringify(targetDay, null, 2)}

Miss reason: ${reason || "schedule_travel"}
Missed session count this week: ${missedSessionCount}
Adjustment mode: ${mode || "late_week_rescue"}

### OUTPUT
- Respond with valid JSON only.
- Return exactly one rewritten training-day object that follows the schema below.

${buildMissedSessionJsonExample(targetDay, mode || "late_week_rescue")}

Now generate exactly one rewritten training-day JSON object.
`;
}
