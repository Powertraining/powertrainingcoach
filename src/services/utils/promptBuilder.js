import {
  getGuidelinesText,
} from "./instructionRules.js";

const DEFAULT_PARENT_CYCLE_WEEKS = 12;
const TRAINING_PLAN_BLOCK_WEEKS = 4;

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function clampPositiveInteger(value, min, max) {
  const parsedValue = parsePositiveInteger(value);

  if (!parsedValue) {
    return min;
  }

  return Math.min(Math.max(parsedValue, min), max);
}

function resolvePlanGenerationScope(userInput = {}) {
  const parentCycleWeeks =
    parsePositiveInteger(userInput?.parentCycleWeeks) ||
    parsePositiveInteger(userInput?.numWeeks) ||
    DEFAULT_PARENT_CYCLE_WEEKS;
  const blockStartWeek = clampPositiveInteger(
    userInput?.blockStartWeek,
    1,
    parentCycleWeeks
  );
  const remainingWeeks = Math.max(parentCycleWeeks - blockStartWeek + 1, 1);
  const generatedBlockWeeks = Math.min(
    parsePositiveInteger(userInput?.generatedBlockWeeks) ||
      TRAINING_PLAN_BLOCK_WEEKS,
    TRAINING_PLAN_BLOCK_WEEKS,
    remainingWeeks
  );

  return {
    parentCycleWeeks,
    blockStartWeek,
    generatedBlockWeeks,
    blockEndWeek: blockStartWeek + generatedBlockWeeks - 1,
  };
}

function buildPhaseRangeText(parentCycleWeeks = DEFAULT_PARENT_CYCLE_WEEKS) {
  const ranges = [];

  for (
    let startWeek = 1;
    startWeek <= parentCycleWeeks;
    startWeek += TRAINING_PLAN_BLOCK_WEEKS
  ) {
    const endWeek = Math.min(
      startWeek + TRAINING_PLAN_BLOCK_WEEKS - 1,
      parentCycleWeeks
    );
    ranges.push(`Weeks ${startWeek}-${endWeek}`);
  }

  return ranges.join(", ");
}

function buildPhaseOverviewScaffold(parentCycleWeeks = DEFAULT_PARENT_CYCLE_WEEKS) {
  const labels = ["Building", "Intensifying", "Expressing"];
  const phases = [];

  for (
    let startWeek = 1;
    startWeek <= parentCycleWeeks;
    startWeek += TRAINING_PLAN_BLOCK_WEEKS
  ) {
    const phaseIndex = phases.length;
    const endWeek = Math.min(
      startWeek + TRAINING_PLAN_BLOCK_WEEKS - 1,
      parentCycleWeeks
    );

    phases.push({
      label: labels[phaseIndex] || `Block ${phaseIndex + 1}`,
      weekStart: startWeek,
      weekEnd: endWeek,
      focus: "",
    });
  }

  return phases;
}

export function buildTrainingPlanScaffold(userInput = {}) {
  const {
    parentCycleWeeks,
    generatedBlockWeeks,
    blockStartWeek,
  } = resolvePlanGenerationScope(userInput);
  const daysPerWeek =
    parsePositiveInteger(userInput?.daysPerWeek) ||
    parsePositiveInteger(userInput?.sessionsPerWeek) ||
    3;
  const preferredWeekdays = Array.isArray(userInput?.preferredWeekdays)
    ? userInput.preferredWeekdays
    : [];

  return {
    phaseOverview: buildPhaseOverviewScaffold(parentCycleWeeks),
    weeks: Array.from({ length: generatedBlockWeeks }, (_, weekOffset) => {
      const weekNumber = blockStartWeek + weekOffset;

      return {
        week: weekNumber,
        days: Array.from({ length: daysPerWeek }, (_, dayIndex) => {
          const dayNumber = dayIndex + 1;

          return {
            day: dayNumber,
            originalDayNumber: dayNumber,
            sessionLabel: `Day ${dayNumber}`,
            preferredWeekday: preferredWeekdays[dayIndex] || "",
          };
        }),
      };
    }),
  };
}

function shouldIncludePercentageSchema(userInput = {}) {
  return (userInput?.liftIntensityMethod || "percentage") === "percentage";
}

function isExplicitFalse(value) {
  return value === false || value === "false" || value === "no";
}

function isExplicitTrue(value) {
  return value === true || value === "true" || value === "yes";
}

function getEnduranceSettings(userInput = {}) {
  const nestedSettings =
    userInput?.enduranceTraining && typeof userInput.enduranceTraining === "object"
      ? userInput.enduranceTraining
      : userInput?.endurancePreferences && typeof userInput.endurancePreferences === "object"
        ? userInput.endurancePreferences
        : {};

  return {
    include:
      userInput?.includeEnduranceTraining ??
      userInput?.enduranceTrainingIncluded ??
      nestedSettings.include ??
      nestedSettings.includeEnduranceTraining,
    modality:
      userInput?.enduranceModality ??
      userInput?.preferredEnduranceModality ??
      nestedSettings.modality ??
      nestedSettings.preferredModality,
    modalities:
      userInput?.enduranceModalities ??
      userInput?.preferredEnduranceModalities ??
      nestedSettings.modalities ??
      nestedSettings.preferredModalities,
  };
}

function shouldIncludeEnduranceSchema(userInput = {}) {
  const desiredTraining =
    typeof userInput?.desiredTraining === "string"
      ? userInput.desiredTraining.trim().toLowerCase()
      : "";
  const enduranceSettings = getEnduranceSettings(userInput);
  const hasModality =
    typeof enduranceSettings.modality === "string" &&
    enduranceSettings.modality.trim();
  const hasModalities =
    Array.isArray(enduranceSettings.modalities) &&
    enduranceSettings.modalities.some(
      (entry) => typeof entry === "string" && entry.trim()
    );

  if (isExplicitFalse(enduranceSettings.include)) {
    return false;
  }

  return (
    desiredTraining === "endurance" ||
    desiredTraining === "strength_power_endurance" ||
    isExplicitTrue(enduranceSettings.include) ||
    hasModality ||
    hasModalities
  );
}

function buildPlanSchemaInstructions(userInput = {}) {
  const includePercentageSchema = shouldIncludePercentageSchema(userInput);
  const includeEnduranceSchema = shouldIncludeEnduranceSchema(userInput);
  const {
    parentCycleWeeks,
    generatedBlockWeeks,
    blockStartWeek,
    blockEndWeek,
  } = resolvePlanGenerationScope(userInput);
  const phaseRangeText = buildPhaseRangeText(parentCycleWeeks);

  return `
### APP JSON CONTRACT
- Return exactly one direct training plan object. No wrapper keys, commentary, markdown, or alternatives.
- Include top-level "summary" and "phaseOverview".
- Treat "phaseOverview" as the compact parent-cycle overview: cover the full ${parentCycleWeeks}-week cycle as ${phaseRangeText}. Keep each phase focus to one concise sentence.
- Use the provided scaffold for week numbers, day numbers, session labels, and preferred weekdays. Do not invent or reorder week/day shells.
- Include exactly ${generatedBlockWeeks} week objects in "weeks", numbered ${blockStartWeek}-${blockEndWeek}. Do not generate week objects outside this block.
- Each generated week must contain exactly ${userInput?.daysPerWeek || "the requested"} sessions in "days".
- You may omit "sessionLabel" and "preferredWeekday" because the app fills them from the scaffold.
- Every training day must include "sessionProfile" with:
  - "regions": one or more of "upper_body", "lower_body", "full_body", "core"
  - "qualities": one or more of "force", "power", "fatigue", "speed", "hypertrophy", "recovery"
  - "stressLevel": "low", "moderate", or "high"
- Every exercise must include "name", "sets", "reps", and "notes", except exercises with an "endurancePrescription": those must include "name" and "notes" but must omit "sets" and "reps" — all prescription details belong in "endurancePrescription".
- Add "substitutionOptions" only when there are useful comparable replacements. Omit it when no substitute is needed; the app will create the default option array.
- Add "performanceTarget" only on main monitored lifts where the app should track repeated top-set performance over time.
- If "performanceTarget" is included, its "strategy" must be exactly one of "e1rm", "best_set", or "fixed_rpe".
- If "performanceTarget.strategy" is "fixed_rpe", include a numeric "performanceTarget.targetRpe" and repeat that exact target as explicit RPE guidance in the exercise "notes". Never return "fixed_rpe" without a numeric target.
${includeEnduranceSchema ? `- When an exercise is dedicated endurance work, include "endurancePrescription" with:
  - "modality": one of "running", "sprinting", "circuit_training", "heavy_bag", "swimming", "assault_bike", "rowing_ergometer", "skiing_ergometer", "arm_crank_machine", "bicycling", "versaclimber", "sport_specific"
  - "format": "steady_aerobic", "continuous_aerobic", "aerobic_intervals", "tempo_threshold", "long_hiit", "repeated_sprint_training", "sprint_interval_training", "repeated_sprint", "recovery", "circuit", or "sport_specific_conditioning"
  - "durationMinutes", "intensity", and optional "work", "rest", "rounds", "target", "sessionType", "workRestRatio", "totalWorkMinutes", "totalRestMinutes", and "notes"
- For circuit endurance exercises, also include "circuitPrescription" with "primaryTarget", "secondaryTargets", "stationCount", "workSeconds", "restSeconds", "workRestRatio", "rounds", "targetAreaEmphasis", "progression", and "analytics".
- For heavy bag endurance exercises, also include "heavyBagPrescription" with "target", "roundLength", "rest", "rounds" or "bouts", "sessionType", "technicalFocus", and "overloadConstraint" when fight-camp simulation is used.
- For sprinting exercises, also include "sprintPrescription" with "target", "distanceMeters", "repsPerSet", "sets", "restBetweenReps", "restBetweenSets", and "stopRule".` : ""}
${includePercentageSchema ? `- On percentage-based primary lifts, include "percentagePrescription" with "referenceLiftName", "loadingStrategy", and "workingSets".
- Add "strengthAssessment" only on primary lifts in a planned test session (multi_rm or true_1rm). Never use "rpe_based_1rm" — it is archived.
- If "strengthAssessment" is included, its "method" must be exactly one of "multi_rm" or "true_1rm".
${blockStartWeek === 1 ? `- Week 1 is the assessment week: use it to test each primary percentage lift. Spread tests across the week's sessions (one lift per session). Set each test session's sessionLabel to clearly name the lift being assessed (e.g. "Assessment – Back Squat"). The plan "summary" must state that Week 1 is for establishing training maxes and that the main program starts in Week 2.` : ""}` : `- Do not invent percentagePrescription objects when the athlete is not using the percentage system.`}
- When the athlete is using RPE instead of the percentage system, do not add "percentagePrescription" or "strengthAssessment".
- Pull-ups, chin-ups, assisted pull-ups, band-assisted pull-ups, eccentric pull-ups, weighted pull-ups, and lat pulldowns must stay RPE/RIR-based; never add "percentagePrescription" or "strengthAssessment" to those exercises.
- When a field is not needed, omit it instead of filling it with placeholders.
`;
}

function buildUserVisibleTextInstructions() {
  return `
### USER-VISIBLE TEXT RULES
- Treat "summary", "phaseOverview.focus", exercise "notes", substitution "notes", "performanceTarget.prompt", "strengthAssessment.prompt", and adjustment summaries as text the athlete may read in the app.
- Only include information that is useful for the athlete's strength-and-conditioning experience level and stated capabilities. Beginners should see simple cues and safe priorities; intermediates can see practical training intent; advanced athletes can see precise loading or progression details when they are relevant.
- Use natural, human-like coaching language in user-visible text: concise sentences, no robotic labels, no internal reasoning, no template fragments, and no unexplained jargon or abbreviations.
- Exercise "notes" must contain only information directly relevant to that specific exercise: technique cues, intent, safety notes, or loading guidance that applies to that lift or drill. Do not include plan-level context, session summaries, or information about other exercises.
- Only describe RPE or include RPE guidance in exercise "notes" when RPE is the actual loading method for that exercise. Do not mention RPE in notes for percentage-based sets, assessment sets (strengthAssessment), or endurance exercises that use their own prescription format.
`;
}

function buildPlanJsonExample(userInput = {}) {
  const includePercentageSchema = shouldIncludePercentageSchema(userInput);
  const includeEnduranceSchema = shouldIncludeEnduranceSchema(userInput);
  const {
    parentCycleWeeks,
    blockStartWeek,
    blockEndWeek,
  } = resolvePlanGenerationScope(userInput);
  const secondPhaseStart = Math.min(
    TRAINING_PLAN_BLOCK_WEEKS + 1,
    parentCycleWeeks
  );
  const secondPhaseEnd = Math.min(
    TRAINING_PLAN_BLOCK_WEEKS * 2,
    parentCycleWeeks
  );

  return `{
  "summary": "Brief explanation of the current ${blockStartWeek}-${blockEndWeek} training block and how it fits the parent cycle.",
  "phaseOverview": [
    {
      "label": "Building",
      "weekStart": 1,
      "weekEnd": ${Math.min(TRAINING_PLAN_BLOCK_WEEKS, parentCycleWeeks)},
      "focus": "Build the main strength and power qualities before the next phase shifts emphasis."
    }${
      parentCycleWeeks > TRAINING_PLAN_BLOCK_WEEKS
        ? `,
    {
      "label": "Intensifying",
      "weekStart": ${secondPhaseStart},
      "weekEnd": ${secondPhaseEnd},
      "focus": "Progress the most important qualities while keeping fatigue recoverable."
    }`
        : ""
    }${
      parentCycleWeeks > TRAINING_PLAN_BLOCK_WEEKS * 2
        ? `,
    {
      "label": "Expressing",
      "weekStart": ${TRAINING_PLAN_BLOCK_WEEKS * 2 + 1},
      "weekEnd": ${parentCycleWeeks},
      "focus": "Convert the earlier work into sharper sport-relevant output."
    }`
        : ""
    }
  ],
  "weeks": [
    {
      "week": ${blockStartWeek},
      "days": [
        {
          "day": 1,
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
              "notes": "Short coaching cue."${
                includePercentageSchema
                  ? `,
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
                "method": "multi_rm",
                "liftName": "Back Squat",
                "prompt": "Warm up progressively, then work up to your heaviest set of 3–5 reps. Log the load and reps so the app can estimate your 1RM."
              }`
                  // ARCHIVED: rpe_based_1rm example removed
                  : ""
              }
            }${
              includeEnduranceSchema
                ? `,
            {
              "name": "Assault Bike Intervals",
              "notes": "Dedicated endurance work with low impact.",
              "endurancePrescription": {
                "modality": "assault_bike",
                "format": "intervals",
                "durationMinutes": 20,
                "intensity": "RPE 7-8",
                "work": "5 x 2 min",
                "rest": "2 min easy spin",
                "rounds": 5,
                "target": "Repeatable hard aerobic intervals without leg impact",
                "notes": "Use this object only for dedicated endurance work."
              }
            }`
                : ""
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
  const {
    parentCycleWeeks,
    generatedBlockWeeks,
    blockStartWeek,
    blockEndWeek,
  } = resolvePlanGenerationScope(userInput);
  const scaffold = buildTrainingPlanScaffold(userInput);

  return `
You are PowerTrainingCoach, an expert combat-sport S&C coach.

Given two equally valid exercise choices, prefer the option that is safer, easier to coach, and easier to perform well.

Follow all of the rules below:
${guidelines}
${schemaInstructions}
${buildUserVisibleTextInstructions()}

### GENERATION SCOPE
- Parent cycle length: ${parentCycleWeeks} weeks.
- Generate only the next ${generatedBlockWeeks}-week block: Weeks ${blockStartWeek}-${blockEndWeek}.
- Do not generate future week objects yet. Capture future direction only in the compact phaseOverview.

### OUTPUT
- Respond with valid JSON only.
- Return exactly one training plan object that follows the schema below.

${buildPlanJsonExample(userInput)}

### PLAN SCAFFOLD (APP-CREATED)
Use this scaffold exactly for week numbers, day numbers, session labels, and preferred weekdays. Fill the coaching choices inside each session.
${JSON.stringify(scaffold, null, 2)}

### USER INPUT (JSON)
${JSON.stringify(userInput, null, 2)}

### PREVIOUS PLAN
${oldPlan ? JSON.stringify(oldPlan, null, 2) : "No previous plan provided."}

Now generate exactly one training plan JSON object for Weeks ${blockStartWeek}-${blockEndWeek} only.
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
- Preserve "endurancePrescription" when the rescued exposure is dedicated endurance work, adjusting duration, work/rest, rounds, or intensity if the rescue mode trims fatigue.
${includePercentageSchema ? `- Preserve percentage-based main-lift logic with an updated "percentagePrescription" when the main lift stays in the session.
- Preserve "strengthAssessment" (multi_rm or true_1rm only) when the rescued session should still include the planned assessment. Never use "rpe_based_1rm".` : `- Do not add or preserve percentagePrescription or strengthAssessment on RPE-based plans.`}
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
${buildUserVisibleTextInstructions()}

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
