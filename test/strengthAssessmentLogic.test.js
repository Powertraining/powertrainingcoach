import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAppLogicSettings } from "../src/constants/appLogicSettings.js";
import { parseGeneratedTrainingPlan } from "../src/services/utils/trainingPlan.js";
import { getPrescribedSetCount } from "../src/services/utils/exerciseSets.js";
import {
  createStrengthAssessmentEntry,
  getPendingProgramMaxAssessments,
  getStrengthAssessmentPrescription,
  getStrengthAssessmentReferenceOneRepMaxKg,
  getStrengthAssessmentSummary,
  resolveStrengthAssessmentReferenceOneRepMaxKg,
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

test("automatic Program Maxes round to the user's load increment without a 90% reduction", () => {
  const metricEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 140,
      reps: 5,
      rpe: 8,
    },
    unitSystem: "metric",
  });
  const imperialEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 79.3787,
      reps: 5,
      rpe: 8,
    },
    unitSystem: "imperial",
  });

  assert.equal(metricEntry.estimatedOneRepMaxKg, 172.7);
  assert.equal(metricEntry.trainingMaxKg, 172.5);
  assert.equal(imperialEntry.estimatedOneRepMaxKg, 97.9);
  assert.equal(imperialEntry.trainingMaxKg, 97.5);
  assert.equal(getStrengthAssessmentReferenceOneRepMaxKg({
    method: "rpe_based_1rm",
    estimatedOneRepMaxKg: 172.7,
  }), 172.7);
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
  assert.equal(summary.latestByLift[0].trainingMaxKg, 150);
  assert.equal(summary.recentAssessments.length, 2);
});

test("RPE-based missing-max estimates accept Week 1 bridge sets", () => {
  const bridgeEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "rpe_based_1rm",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 100,
      reps: 10,
      rpe: 7,
    },
  });

  assert.equal(bridgeEntry.estimatedOneRepMaxKg, 143.3);
  assert.equal(bridgeEntry.trainingMaxKg, 142.5);
  assert.equal(getStrengthAssessmentReferenceOneRepMaxKg(bridgeEntry), 142.5);
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
