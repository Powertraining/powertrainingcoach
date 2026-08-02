import test from "node:test";
import assert from "node:assert/strict";

import {
  formatBodyMassLoadRange,
  getLoadedJumpPrescription,
  isLoadedJumpExerciseName,
} from "../src/services/utils/loadedJumpPrescription.js";
import { buildTrainingPrompt } from "../src/services/utils/promptBuilder.js";
import { normalizeExercise } from "../src/services/utils/trainingPlan.js";

test("identifies loaded jumps without treating bodyweight jumps as loaded", () => {
  assert.equal(isLoadedJumpExerciseName("1a. Trap Bar Jump"), true);
  assert.equal(isLoadedJumpExerciseName("Back Squat Jumps"), true);
  assert.equal(isLoadedJumpExerciseName("Dumbbell Jump Squat"), true);
  assert.equal(isLoadedJumpExerciseName("Countermovement Jump with Dumbbells"), true);
  assert.equal(isLoadedJumpExerciseName("Bodyweight Squat Jump"), false);
  assert.equal(isLoadedJumpExerciseName("Split Squat Jump"), false);
});

test("loaded jumps default to an external load of 30-60 percent body mass", () => {
  const prescription = getLoadedJumpPrescription({ name: "Trap Bar Jump" });

  assert.deepEqual(prescription, {
    minPercent: 30,
    maxPercent: 60,
    loadIncludes: "bar + plates",
  });
  assert.equal(formatBodyMassLoadRange(prescription), "30\u201360% BM");
});

test("normalizing a loaded jump removes 1RM loading and preserves a custom BM range", () => {
  const exercise = normalizeExercise({
    name: "Barbell Squat Jump",
    sets: "4",
    reps: "3",
    notes: "Jump with maximal intent.",
    bodyMassLoadPrescription: { minPercent: 20, maxPercent: 30 },
    percentagePrescription: {
      referenceLiftName: "Back Squat",
      loadingStrategy: "flat_loading",
      workingSets: [{ count: 4, reps: 3, percent1RM: 40 }],
    },
    strengthAssessment: { method: "rpe_based_1rm" },
  });

  assert.deepEqual(exercise.bodyMassLoadPrescription, {
    minPercent: 20,
    maxPercent: 30,
    loadIncludes: "bar + plates",
  });
  assert.equal(exercise.percentagePrescription, null);
  assert.equal(exercise.strengthAssessment, null);
});

test("the generation contract requires BM loading for loaded jumps", () => {
  const prompt = buildTrainingPrompt({
    daysPerWeek: 3,
    numWeeks: 12,
    goal: "strength_power",
    experience: "intermediate",
    liftIntensityMethod: "percentage",
  });

  assert.match(prompt, /bodyMassLoadPrescription/);
  assert.match(prompt, /total external load \(bar \+ plates\)/i);
  assert.match(prompt, /not a percentage of the exercise 1RM/i);
  assert.match(prompt, /Never add "percentagePrescription" or "strengthAssessment" to a loaded jump/i);
});
