import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeFirestoreData } from "../src/services/utils/firestoreData.js";
import { parseGeneratedTrainingPlan } from "../src/services/utils/trainingPlan.js";

function collectUndefinedPaths(value, currentPath = "root", paths = []) {
  if (value === undefined) {
    paths.push(currentPath);
    return paths;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectUndefinedPaths(entry, `${currentPath}[${index}]`, paths);
    });
    return paths;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nestedValue]) => {
      collectUndefinedPaths(nestedValue, `${currentPath}.${key}`, paths);
    });
  }

  return paths;
}

test("sanitizeFirestoreData removes undefined object fields recursively", () => {
  const sanitized = sanitizeFirestoreData({
    topLevel: undefined,
    nested: {
      keep: "value",
      omit: undefined,
    },
    items: ["ready", undefined, { keep: true, omit: undefined }],
  });

  assert.deepEqual(sanitized, {
    nested: {
      keep: "value",
    },
    items: ["ready", null, { keep: true }],
  });
});

test("parseGeneratedTrainingPlan returns a Firestore-safe plan shape", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Simple base phase.",
    phaseOverview: [
      {
        label: "Base",
        weekStart: 1,
        weekEnd: 1,
        focus: "Build consistency first.",
      },
    ],
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            sessionLabel: "Day 1",
            preferredWeekday: "Monday",
            exercises: [
              {
                name: "Back Squat",
                sets: "3",
                reps: "5",
                notes: "Smooth reps.",
                substitutionOptions: [
                  {
                    name: "Front Squat",
                    sets: "3",
                    reps: "5",
                    notes: "Stay upright.",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.deepEqual(collectUndefinedPaths(normalizedPlan), []);
  assert.equal(
    Object.hasOwn(
      normalizedPlan.weeks[0].days[0].exercises[0],
      "selectedSubstitutionName"
    ),
    false
  );
});
