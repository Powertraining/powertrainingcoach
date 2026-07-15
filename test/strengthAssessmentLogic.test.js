import test from "node:test";
import assert from "node:assert/strict";

import { normalizeAppLogicSettings } from "../src/constants/appLogicSettings.js";
import { parseGeneratedTrainingPlan } from "../src/services/utils/trainingPlan.js";
import {
  createStrengthAssessmentEntry,
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
  assert.equal(rpeBasedEntry.trainingMaxKg, 157.5);
  assert.equal(multiRmEntry.estimatedOneRepMaxKg, 140);
  assert.equal(multiRmEntry.trainingMaxKg, 126);
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
  assert.equal(summary.latestByLift[0].trainingMaxKg, 135.5);
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
  assert.equal(bridgeEntry.trainingMaxKg, 129);
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

  const assessment =
    normalizedPlan.weeks[0].days[0].exercises[0].strengthAssessment;

  assert.equal(assessment.method, "rpe_based_1rm");
  assert.equal(assessment.liftName, "Trap Bar Deadlift");
  assert.equal(assessment.prompt, "Log the load, reps, and RPE of the top set.");
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
