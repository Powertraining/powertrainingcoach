import test from "node:test";
import assert from "node:assert/strict";

import {
  getSportLoadLevelFromCombatTrainingIntensity,
  normalizeAppLogicSettings,
} from "../src/constants/appLogicSettings.js";
import {
  parseGeneratedTrainingPlan,
  parsePersistedTrainingPlan,
} from "../src/services/utils/trainingPlan.js";
import { getPrescribedSetCount } from "../src/services/utils/exerciseSets.js";
import {
  calculateManualProgramMaxKg,
  createManualProgramMaxEntry,
  createStrengthAssessmentEntry,
  getRequiredProgramMaxLifts,
  getPendingProgramMaxAssessments,
  getProgramMaxLiftStatus,
  getStrengthAssessmentPrescription,
  getStrengthAssessmentReferenceOneRepMaxKg,
  getStrengthAssessmentSummary,
  resolveStrengthAssessmentReferenceOneRepMaxKg,
  shouldRequireProgramMaxSetup,
  upsertStrengthAssessmentSessionResults,
} from "../src/services/utils/strengthAssessment.js";

test("percentage app logic defaults to RPE-based 1RM estimates and preserves explicit choices", () => {
  const defaults = normalizeAppLogicSettings({});
  const legacyChoice = normalizeAppLogicSettings({
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "heavy_single",
  });
  const explicitChoice = normalizeAppLogicSettings({
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "multi_rm",
  });

  assert.equal(defaults.percentageReferenceMethod, "rpe_based_1rm");
  assert.equal(legacyChoice.percentageReferenceMethod, "rpe_based_1rm");
  assert.equal(explicitChoice.percentageReferenceMethod, "multi_rm");
});

test("strength assessment entries compute estimated 1RM for RPE-based and multi-RM sets", () => {
  const rpeBasedEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Trap Bar Deadlift",
    },
    result: {
      loadKg: 150,
      reps: 3,
      rpe: 8,
    },
  });
  const multiRmEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "multi_rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 120,
      reps: 5,
    },
  });

  assert.equal(rpeBasedEntry.estimatedOneRepMaxKg, 175);
  assert.equal(rpeBasedEntry.trainingMaxKg, 175);
  assert.equal(multiRmEntry.estimatedOneRepMaxKg, 140);
  assert.equal(multiRmEntry.trainingMaxKg, 140);
});

test("sport-training intensity supports four levels and migrates the old intense value", () => {
  assert.equal(
    normalizeAppLogicSettings({ combatTrainingIntensity: "very_high" })
      .combatTrainingIntensity,
    "very_high"
  );
  assert.equal(
    normalizeAppLogicSettings({ combatTrainingIntensity: "intense" })
      .combatTrainingIntensity,
    "high"
  );
  assert.equal(getSportLoadLevelFromCombatTrainingIntensity("light"), 1);
  assert.equal(getSportLoadLevelFromCombatTrainingIntensity("moderate"), 2);
  assert.equal(getSportLoadLevelFromCombatTrainingIntensity("high"), 3);
  assert.equal(getSportLoadLevelFromCombatTrainingIntensity("very_high"), 4);
});

test("automatic Program Maxes keep the raw estimate and round the active max", () => {
  const metricEntry = createStrengthAssessmentEntry({
    metadata: { method: "rpe_based_1rm", liftName: "Back Squat" },
    result: { loadKg: 140, reps: 5, rpe: 8 },
    unitSystem: "metric",
  });
  const imperialEntry = createStrengthAssessmentEntry({
    metadata: { method: "rpe_based_1rm", liftName: "Back Squat" },
    result: { loadKg: 79.3787, reps: 5, rpe: 8 },
    unitSystem: "imperial",
  });

  assert.equal(metricEntry.estimatedOneRepMaxKg, 172.7);
  assert.ok(Math.abs(metricEntry.rawEstimatedOneRepMaxKg - 172.6666666667) < 0.000001);
  assert.equal(metricEntry.trainingMaxKg, 172.5);
  assert.equal(imperialEntry.estimatedOneRepMaxKg, 97.9);
  assert.equal(imperialEntry.trainingMaxKg, 97.5);
});

test("manual Program Max setup applies the selected confidence adjustment", () => {
  assert.equal(calculateManualProgramMaxKg({
    enteredOneRepMaxKg: 150,
    confidence: "very_confident",
  }), 150);
  assert.equal(calculateManualProgramMaxKg({
    enteredOneRepMaxKg: 150,
    confidence: "somewhat_confident",
  }), 135);
  assert.equal(calculateManualProgramMaxKg({
    enteredOneRepMaxKg: 150,
    confidence: "not_confident",
  }), 120);

  const entry = createManualProgramMaxEntry({
    liftName: "Back Squat",
    enteredOneRepMaxKg: 150,
    confidence: "somewhat_confident",
  });

  assert.equal(entry.source, "manual_entry");
  assert.equal(entry.method, "manual_1rm");
  assert.equal(entry.enteredOneRepMaxKg, 150);
  assert.equal(entry.confidence, "somewhat_confident");
  assert.equal(entry.trainingMaxKg, 135);

  const state = upsertStrengthAssessmentSessionResults(
    {},
    "program-max-setup-1",
    [entry]
  );
  const savedEntry = getStrengthAssessmentSummary(state).latestByLift[0];
  assert.equal(savedEntry.source, "manual_entry");
  assert.equal(savedEntry.confidence, "somewhat_confident");
  assert.equal(savedEntry.trainingMaxKg, 135);
});

test("Program Max setup derives required lifts from the generated plan", () => {
  const plan = {
    weeks: [{
      week: 1,
      days: [{
        day: 1,
        exercises: [
          {
            name: "Back Squat",
            strengthAssessment: {
              method: "rpe_based_1rm",
              liftName: "Back Squat",
            },
          },
          {
            name: "Bench Press",
            percentagePrescription: { referenceLiftName: "Bench Press" },
          },
          { name: "Biceps Curl", notes: "RPE 8" },
        ],
      }],
    }],
  };
  const summary = {
    latestByLift: [{ liftName: "Bench Press", trainingMaxKg: 115 }],
  };
  const requiredLifts = getRequiredProgramMaxLifts(plan, summary);

  assert.deepEqual(requiredLifts.map((lift) => lift.liftName), [
    "Back Squat",
    "Bench Press",
  ]);
  assert.equal(requiredLifts[0].programMaxKg, null);
  assert.equal(requiredLifts[1].programMaxKg, 115);
  assert.equal(shouldRequireProgramMaxSetup({
    plan,
    liftIntensityMethod: "percentage",
    strengthAssessmentSummary: summary,
  }), true);
  assert.equal(shouldRequireProgramMaxSetup({
    plan: { ...plan, programMaxSetupCompletedAt: "2026-08-03T00:00:00.000Z" },
    liftIntensityMethod: "percentage",
    strengthAssessmentSummary: summary,
  }), false);
  const persistedPlan = parsePersistedTrainingPlan({
    ...plan,
    programMaxSetupCompletedAt: "2026-08-03T00:00:00.000Z",
  });
  assert.equal(
    persistedPlan.programMaxSetupCompletedAt,
    "2026-08-03T00:00:00.000Z"
  );
  assert.equal(shouldRequireProgramMaxSetup({
    plan: persistedPlan,
    liftIntensityMethod: "percentage",
    strengthAssessmentSummary: summary,
  }), false);
  assert.equal(shouldRequireProgramMaxSetup({
    plan,
    liftIntensityMethod: "percentage",
    strengthAssessmentSummary: summary,
    completedDays: ["1-1"],
  }), false);
});

test("strength assessment state summarizes the latest result per lift", () => {
  const firstEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "multi_rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 120,
      reps: 5,
    },
    sessionKey: "1-1",
    weekNumber: 1,
    dayNumber: 1,
    exerciseIndex: 0,
    performedAt: "2026-04-01T10:00:00.000Z",
  });
  const secondEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 138,
      reps: 3,
      rpe: 8,
    },
    previousTrainingMaxKg: firstEntry.trainingMaxKg,
    sessionKey: "2-1",
    weekNumber: 2,
    dayNumber: 1,
    exerciseIndex: 0,
    performedAt: "2026-04-08T10:00:00.000Z",
  });

  const stateAfterFirstEntry = upsertStrengthAssessmentSessionResults(
    {},
    "1-1",
    [firstEntry]
  );
  const finalState = upsertStrengthAssessmentSessionResults(
    stateAfterFirstEntry,
    "2-1",
    [secondEntry]
  );
  const summary = getStrengthAssessmentSummary(finalState);

  assert.equal(summary.latestByLift.length, 1);
  assert.equal(summary.latestByLift[0].method, "rpe_based_1rm");
  assert.equal(summary.latestByLift[0].trainingMaxKg, 160);
  assert.equal(summary.recentAssessments.length, 2);
});

test("RPE-based missing-max estimates accept suitable Week 1 top sets", () => {
  const bridgeEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 100,
      reps: 5,
      rpe: 8,
    },
  });

  assert.equal(bridgeEntry.estimatedOneRepMaxKg, 123.3);
  assert.equal(bridgeEntry.trainingMaxKg, 122.5);
  assert.equal(getStrengthAssessmentReferenceOneRepMaxKg(bridgeEntry), 122.5);
});

test("an automatic Program Max is provisional in its capture week and active afterward", () => {
  const entry = createStrengthAssessmentEntry({
    metadata: { method: "rpe_based_1rm", liftName: "Back Squat" },
    result: { loadKg: 100, reps: 5, rpe: 8 },
    weekNumber: 1,
  });

  assert.equal(getProgramMaxLiftStatus(entry, 1), "provisional_ready");
  assert.equal(getProgramMaxLiftStatus(entry, 2), "active");
  assert.equal(getProgramMaxLiftStatus({}, 2), "missing");
});

test("missing-max estimates require the prescribed RPE lower bound", () => {
  const metadata = {
    method: "rpe_based_1rm",
    liftName: "Back Squat",
    minimumRpe: 8,
  };

  assert.equal(createStrengthAssessmentEntry({
    metadata,
    result: { loadKg: 100, reps: 5, rpe: 7.5 },
  }), null);
  assert.equal(createStrengthAssessmentEntry({
    metadata,
    result: { loadKg: 100, reps: 5, rpe: 8 },
  })?.trainingMaxKg, 122.5);
});

test("pending Program Max assessments exclude lifts with a saved max", () => {
  const exercises = [
    {
      name: "Back Squat",
      notes: "Work at RPE 8-9.",
      strengthAssessment: { method: "rpe_based_1rm", liftName: "Back Squat" },
    },
    {
      name: "Trap Bar Deadlift",
      strengthAssessment: { method: "rpe_based_1rm", liftName: "Trap Bar Deadlift" },
    },
  ];
  const pending = getPendingProgramMaxAssessments(exercises, {
    latestByLift: [{ liftName: "Back Squat", trainingMaxKg: 120 }],
  });

  assert.deepEqual(pending.map((entry) => entry.liftName), ["Trap Bar Deadlift"]);

  const squatOnlyPending = getPendingProgramMaxAssessments([exercises[0]], {});
  assert.equal(squatOnlyPending[0].minimumRpe, 8);
});

test("strength assessment prescriptions describe working up to one top set", () => {
  assert.equal(
    getStrengthAssessmentPrescription({
      name: "Back Squat",
      reps: "3-5",
      notes: "Use RPE 8-9.",
      strengthAssessment: { method: "rpe_based_1rm" },
    }),
    "Work up to a top set of 3–5 reps at RPE 8–9."
  );
  assert.equal(
    getStrengthAssessmentPrescription({
      name: "Back Squat",
      reps: "2-5",
      strengthAssessment: { method: "multi_rm" },
    }),
    "Work up to a top set of 2–5 reps at RPE 9–10."
  );
  assert.equal(
    getStrengthAssessmentPrescription({
      name: "Back Squat",
      reps: "1",
      strengthAssessment: { method: "true_1rm" },
    }),
    "Work up to a top set of 1 rep."
  );
});

test("generated training plans preserve strength assessment metadata on exercises", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Use an RPE-based 1RM estimate before back-off work.",
    phaseOverview: [
      {
        label: "Building",
        weekStart: 1,
        weekEnd: 1,
        focus: "Introduce the first RPE-based estimate.",
      },
    ],
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            sessionLabel: "Day 1",
            preferredWeekday: "",
            sessionProfile: {
              regions: ["lower_body"],
              qualities: ["force"],
              stressLevel: "high",
            },
            exercises: [
              {
                name: "Trap Bar Deadlift",
                sets: "1 top set + 3 back-off sets",
                reps: "3 + 3 x 3",
                notes: "Work up to 3 reps @RPE 8 before the back-off work.",
                percentagePrescription: {
                  referenceLiftName: "Trap Bar Deadlift",
                  loadingStrategy: "flat_loading",
                  workingSets: [{ count: 3, reps: 3, percent1RM: 75 }],
                },
                strengthAssessment: {
                  method: "rpe_based_1rm",
                  liftName: "Trap Bar Deadlift",
                  prompt: "Log the load, reps, and RPE of the top set.",
                },
                substitutionOptions: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const exercise = normalizedPlan.weeks[0].days[0].exercises[0];
  const assessment = exercise.strengthAssessment;

  assert.equal(assessment.method, "rpe_based_1rm");
  assert.equal(assessment.liftName, "Trap Bar Deadlift");
  assert.equal(assessment.prompt, "Log the load, reps, and RPE of the top set.");
  assert.equal(exercise.sets, "1 top set");
  assert.equal(exercise.reps, "3");
  assert.equal(exercise.percentagePrescription, null);
  assert.equal(getPrescribedSetCount(exercise), 1);
  assert.doesNotMatch(exercise.notes, /before the back-off work/i);
  assert.match(exercise.notes, /top set only/i);
  assert.equal(exercise.substitutionOptions[0].sets, "1 top set");
});

test("close-grip bench press can estimate its reference max from bench press", () => {
  const resolvedReference = resolveStrengthAssessmentReferenceOneRepMaxKg(
    "Close-Grip Bench Press",
    {
      bench_press: 120,
    }
  );

  assert.equal(resolvedReference.oneRepMaxKg, 114);
  assert.equal(resolvedReference.source, "estimated_from_bench_press");
  assert.equal(resolvedReference.sourceLiftName, "Bench Press");
});
