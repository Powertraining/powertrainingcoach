import test from "node:test";
import assert from "node:assert/strict";

import {
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
