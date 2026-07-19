"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {sanitizeExerciseOption} = require("./trainingPlanValidation");

const fallbackExercise = {
  name: "Back Squat",
  sets: "3",
  reps: "5",
  notes: "Smooth reps.",
};

test("text-only substitutions inherit the parent exercise prescription", () => {
  assert.deepEqual(
      sanitizeExerciseOption("Front Squat", 0, fallbackExercise),
      {
        name: "Front Squat",
        sets: "3",
        reps: "5",
        notes: "Smooth reps.",
      },
  );
});

test("structured substitutions preserve their explicit prescription", () => {
  assert.deepEqual(
      sanitizeExerciseOption({
        name: "Goblet Squat",
        sets: "4",
        reps: "8",
        notes: "Stay upright.",
      }, 1, fallbackExercise),
      {
        name: "Goblet Squat",
        sets: "4",
        reps: "8",
        notes: "Stay upright.",
      },
  );
});

test("empty substitutions remain invalid", () => {
  assert.throws(
      () => sanitizeExerciseOption("   ", 1, fallbackExercise),
      /substitution option 2 must include a name/,
  );
});
