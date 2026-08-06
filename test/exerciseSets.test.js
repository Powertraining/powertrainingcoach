import test from "node:test";
import assert from "node:assert/strict";

import {
  getExerciseRepsDisplayValue,
  getExerciseSetDisplayValue,
} from "../src/services/utils/exerciseSets.js";

test("sets and reps stay separate in exercise target displays", () => {
  const exercise = { sets: "4", reps: "4 x 4" };

  assert.equal(getExerciseSetDisplayValue(exercise), "4");
  assert.equal(getExerciseRepsDisplayValue(exercise), "4");
});

test("unilateral rep shorthand is spelled out by side", () => {
  assert.equal(
    getExerciseRepsDisplayValue({ sets: "3", reps: "5+5" }),
    "5 left / 5 right"
  );
  assert.equal(
    getExerciseRepsDisplayValue({ sets: "3", reps: "4-6 + 4-6" }),
    "4-6 left / 4-6 right"
  );
});

test("different rep phases remain visible without stacked values", () => {
  assert.equal(
    getExerciseRepsDisplayValue({ sets: "3", reps: "4 + 6" }),
    "4 + 6"
  );
  assert.equal(
    getExerciseRepsDisplayValue({ sets: "3", reps: "4 x 4" }),
    "4 × 4"
  );
});
