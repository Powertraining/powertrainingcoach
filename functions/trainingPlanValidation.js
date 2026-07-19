"use strict";

function normalizeStringValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function sanitizeExerciseOption(option, optionIndex, fallbackExercise = {}) {
  const isStructuredOption = isPlainObject(option);
  const normalizedOption = isStructuredOption ? option : {
    name: normalizeStringValue(option),
  };
  const name = normalizeStringValue(normalizedOption.name) ||
    (isStructuredOption ? fallbackExercise.name : "");

  if (!name) {
    throw new Error(
        `Training plan substitution option ${optionIndex + 1} must include a name.`,
    );
  }

  return {
    name,
    sets: normalizeStringValue(normalizedOption.sets) || fallbackExercise.sets,
    reps: normalizeStringValue(normalizedOption.reps) || fallbackExercise.reps,
    notes: normalizeStringValue(normalizedOption.notes) || fallbackExercise.notes,
  };
}

module.exports = {
  sanitizeExerciseOption,
};
