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

test("percentage app logic defaults to heavy singles and preserves explicit choices", () => {
  const defaults = normalizeAppLogicSettings({});
  const explicitChoice = normalizeAppLogicSettings({
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "multi_rm",
  });

  assert.equal(defaults.percentageReferenceMethod, "heavy_single");
  assert.equal(explicitChoice.percentageReferenceMethod, "multi_rm");
});

test("strength assessment entries compute estimated 1RM for heavy singles and multi-RM sets", () => {
  const heavySingleEntry = createStrengthAssessmentEntry({
    metadata: {
      method: "heavy_single",
      liftName: "Trap Bar Deadlift",
    },
    result: {
      loadKg: 150,
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

  assert.equal(heavySingleEntry.estimatedOneRepMaxKg, 157.9);
  assert.equal(heavySingleEntry.trainingMaxKg, 154);
  assert.equal(multiRmEntry.estimatedOneRepMaxKg, 140);
  assert.equal(multiRmEntry.trainingMaxKg, 136.5);
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
      method: "heavy_single",
      liftName: "Back Squat",
    },
    result: {
      loadKg: 138,
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
  assert.equal(summary.latestByLift[0].method, "heavy_single");
  assert.equal(summary.latestByLift[0].trainingMaxKg, 141.7);
  assert.equal(summary.recentAssessments.length, 2);
});

test("generated training plans preserve strength assessment metadata on exercises", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Use a heavy single before back-off work.",
    phaseOverview: [
      {
        label: "Building",
        weekStart: 1,
        weekEnd: 1,
        focus: "Introduce the first heavy-single check-in.",
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
                reps: "1 + 3 x 3",
                notes: "Work up to a heavy single @RPE 8 before the back-off work.",
                strengthAssessment: {
                  method: "heavy_single",
                  liftName: "Trap Bar Deadlift",
                  prompt: "Log the load and RPE of the top single.",
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

  assert.equal(assessment.method, "heavy_single");
  assert.equal(assessment.liftName, "Trap Bar Deadlift");
  assert.equal(assessment.prompt, "Log the load and RPE of the top single.");
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
