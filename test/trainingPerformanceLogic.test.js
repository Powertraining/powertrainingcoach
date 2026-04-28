import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMissedRepRecommendation,
  createTrainingPerformanceEntry,
  normalizePerformanceTarget,
} from "../src/services/utils/trainingPerformance.js";

test("fixed-RPE performance entries preserve negative drift and comparable load", () => {
  const entry = createTrainingPerformanceEntry({
    metadata: {
      strategy: "fixed_rpe",
      liftName: "Back Squat",
      repTarget: 5,
      targetRpe: 8,
      prompt: "",
    },
    result: {
      loadKg: 120,
      reps: 5,
      rpe: 7.5,
    },
    sessionKey: "1-1",
    weekNumber: 1,
    dayNumber: 1,
    exerciseIndex: 0,
    performedAt: "2026-04-01T10:00:00.000Z",
  });

  assert.equal(entry.metricValueKg, 120);
  assert.equal(entry.rpeDrift, -0.5);
  assert.ok(entry.estimatedOneRepMaxKg > 120);
});

test("percentage-based lifts infer an e1RM tracking target by default", () => {
  const target = normalizePerformanceTarget(null, "Back Squat", {
    name: "Back Squat",
    reps: "5",
    notes: "Top set before back-offs",
    percentagePrescription: {
      referenceLiftName: "Back Squat",
      loadingStrategy: "flat_loading",
      workingSets: [
        {
          count: 3,
          reps: 5,
          percent1RM: 75,
        },
      ],
    },
  });

  assert.equal(target.strategy, "e1rm");
  assert.equal(target.liftName, "Back Squat");
  assert.equal(target.repTarget, 5);
});

test("missed rep entries persist without a completed load result", () => {
  const entry = createTrainingPerformanceEntry({
    metadata: {
      strategy: "fixed_rpe",
      liftName: "Back Squat",
      repTarget: 5,
      targetRpe: 8,
      prompt: "",
    },
    result: {
      missedRep: true,
      missedRepReason: "too_heavy",
    },
    liftIntensityMethod: "rpe",
    sessionKey: "1-1",
    weekNumber: 1,
    dayNumber: 1,
    exerciseIndex: 0,
  });

  assert.equal(entry.missedRep, true);
  assert.equal(entry.loadKg, null);
  assert.equal(entry.metricValueKg, null);
  assert.equal(entry.missedRepRecommendation.recommendedAction.value, "lower_load_5");
});

test("pain-related missed reps recommend a variation swap", () => {
  const recommendation = buildMissedRepRecommendation({
    liftIntensityMethod: "percentage",
    exercise: {
      name: "Back Squat",
      percentagePrescription: {
        workingSets: [{ count: 3, reps: 5, percent1RM: 75 }],
      },
    },
    metadata: {
      strategy: "e1rm",
      liftName: "Back Squat",
    },
    missReason: "pain",
  });

  assert.equal(recommendation.recommendedAction.value, "swap_variation");
  assert.equal(recommendation.planAdjustment.type, "swap_variation");
});
