import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePercentOneRepMaxFromRelativeIntensity,
  normalizePercentagePrescription,
} from "../src/services/utils/percentagePrescription.js";
import { buildTrainingPrompt } from "../src/services/utils/promptBuilder.js";
import { parseGeneratedTrainingPlan } from "../src/services/utils/trainingPlan.js";

test("normalizePercentagePrescription computes relative intensity from percent and reps", () => {
  const prescription = normalizePercentagePrescription({
    referenceLiftName: "Back Squat",
    loadingStrategy: "flat_loading",
    workingSets: [
      {
        count: 5,
        reps: 5,
        percent1RM: 70,
      },
    ],
  });

  assert.deepEqual(prescription, {
    referenceLiftName: "Back Squat",
    loadingStrategy: "flat_loading",
    workingSets: [
      {
        count: 5,
        reps: 5,
        percent1RM: 70,
        relativeIntensity: 80,
      },
    ],
  });
});

test("relative intensity targets can be converted back to percent-based prescriptions", () => {
  assert.equal(calculatePercentOneRepMaxFromRelativeIntensity(87.5, 4), 78.8);
});

test("generated training plans preserve percentage prescription metadata on exercises", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Use percentage-based flat loading on the primary squat.",
    phaseOverview: [
      {
        label: "Building",
        weekStart: 1,
        weekEnd: 1,
        focus: "Establish repeatable percentage work with clear RI targets.",
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
                name: "Back Squat",
                sets: "5",
                reps: "5",
                notes: "Controlled work sets with clean technique.",
                percentagePrescription: {
                  referenceLiftName: "Back Squat",
                  loadingStrategy: "flat_loading",
                  workingSets: [
                    {
                      count: 5,
                      reps: 5,
                      percent1RM: 70,
                    },
                  ],
                },
                substitutionOptions: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const prescription =
    normalizedPlan.weeks[0].days[0].exercises[0].percentagePrescription;

  assert.equal(prescription.referenceLiftName, "Back Squat");
  assert.equal(prescription.loadingStrategy, "flat_loading");
  assert.deepEqual(prescription.workingSets, [
    {
      count: 5,
      reps: 5,
      percent1RM: 70,
      relativeIntensity: 80,
    },
  ]);
});

test("training prompt instructs percentage users to emit structured percentage prescriptions", () => {
  const prompt = buildTrainingPrompt({
    daysPerWeek: 3,
    goal: "strength",
    experience: "intermediate",
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "heavy_single",
    loadingStrategy: "ascending_pyramid",
  });

  assert.match(prompt, /percentagePrescription/);
  assert.match(prompt, /relativeIntensity/);
  assert.match(prompt, /loadingStrategy/);
});
