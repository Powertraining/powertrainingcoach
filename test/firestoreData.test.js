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

test("parseGeneratedTrainingPlan repairs string substitution options", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Simple base phase.",
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            sessionLabel: "Day 1",
            exercises: [
              {
                name: "Back Squat",
                sets: "3",
                reps: "5",
                notes: "Smooth reps.",
                substitutionOptions: ["Front Squat"],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.deepEqual(
    normalizedPlan.weeks[0].days[0].exercises[0].substitutionOptions,
    [
      {
        name: "Back Squat",
        sets: "3",
        reps: "5",
        notes: "Smooth reps.",
        id: "back_squat",
      },
      {
        name: "Front Squat",
        sets: "3",
        reps: "5",
        notes: "Smooth reps.",
        id: "front_squat",
      },
    ]
  );
});

test("parseGeneratedTrainingPlan preserves the expanded endurance modalities", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Expanded conditioning phase.",
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            sessionLabel: "Endurance Tools",
            exercises: [
              {
                name: "VersaClimber Intervals",
                sets: "6",
                reps: "45 sec hard / 75 sec easy",
                notes: "Full-body conditioning with low impact.",
                endurancePrescription: {
                  modality: "Versa Climber",
                  format: "Intervals",
                  durationMinutes: 18,
                  intensity: "RPE 8",
                },
                substitutionOptions: [],
              },
              {
                name: "Heavy Bag Endurance",
                sets: "3",
                reps: "5 min rounds",
                notes: "Striker-specific conditioning.",
                endurancePrescription: {
                  modality: "Heavy Bag Endurance",
                  format: "Circuit",
                  durationMinutes: 20,
                  intensity: "RPE 7",
                  sessionType: "tempo bag work",
                  workRestRatio: "3:1",
                  totalWorkMinutes: "15",
                  totalRestMinutes: "5",
                },
                heavyBagPrescription: {
                  target: "Tempo / sustained conditioning",
                  sessionType: "tempo bag work",
                  roundLength: "3 min",
                  rest: "60 sec",
                  rounds: "5",
                  technicalFocus: "Simple combinations with breathing control.",
                },
                substitutionOptions: [],
              },
              {
                name: "Sport-Specific Rounds",
                sets: "3",
                reps: "5 min rounds",
                notes: "Match-prep conditioning.",
                endurancePrescription: {
                  modality: "Sport Specific Match Prep Alternative",
                  format: "Circuit",
                  durationMinutes: 20,
                  intensity: "RPE 7",
                },
                circuitPrescription: {
                  primaryTarget: "whole-body work capacity",
                  secondaryTargets: ["trunk endurance"],
                  stationCount: "6",
                  workSeconds: "40",
                  restSeconds: "20",
                  workRestRatio: "1:0.5",
                  rounds: "3",
                  targetAreaEmphasis: "60% primary / 40% secondary",
                  progression: "Add a round before reducing rest.",
                  analytics: {
                    totalWorkDuration: "12 min",
                    workRestStructure: "40s / 20s",
                    roundsCompleted: "Log completed rounds.",
                    rpePrompt: "Log session RPE.",
                    performanceDropPrompt: "Note sharp drop-offs.",
                  },
                },
                substitutionOptions: [],
              },
              {
                name: "Sprint Repeats",
                sets: "3",
                reps: "4 x 30 m",
                notes: "Repeat-burst sprint work.",
                endurancePrescription: {
                  modality: "Sprinting",
                  format: "Repeated Sprint Training",
                  intensity: "High quality",
                },
                sprintPrescription: {
                  target: "repeat bursts",
                  distanceMeters: "30",
                  repsPerSet: "4",
                  sets: "3",
                  restBetweenReps: "45 sec",
                  restBetweenSets: "3 min",
                  stopRule: "Stop if speed clearly drops.",
                },
                substitutionOptions: [],
              },
            ],
          },
        ],
      },
    ],
  });

  const exercises = normalizedPlan.weeks[0].days[0].exercises;

  assert.equal(exercises[0].endurancePrescription.modality, "versaclimber");
  assert.equal(exercises[1].endurancePrescription.modality, "heavy_bag");
  assert.equal(exercises[1].endurancePrescription.totalWorkMinutes, 15);
  assert.equal(exercises[1].heavyBagPrescription.rounds, 5);
  assert.equal(exercises[2].endurancePrescription.modality, "sport_specific");
  assert.equal(exercises[2].circuitPrescription.workSeconds, 40);
  assert.deepEqual(exercises[2].circuitPrescription.secondaryTargets, [
    "trunk endurance",
  ]);
  assert.equal(
    exercises[3].endurancePrescription.format,
    "repeated_sprint_training"
  );
  assert.equal(exercises[3].sprintPrescription.distanceMeters, "30");
});

test("parseGeneratedTrainingPlan preserves endurance prescriptions", () => {
  const normalizedPlan = parseGeneratedTrainingPlan({
    summary: "Conditioning phase.",
    weeks: [
      {
        week: 1,
        days: [
          {
            day: 1,
            sessionLabel: "Endurance Day",
            sessionProfile: {
              regions: ["full_body"],
              qualities: ["fatigue"],
              stressLevel: "moderate",
            },
            exercises: [
              {
                name: "Assault Bike Intervals",
                sets: "5",
                reps: "2 min hard / 2 min easy",
                notes: "Low-impact endurance work.",
                endurancePrescription: {
                  modality: "Assault Bike",
                  format: "Intervals",
                  durationMinutes: "20",
                  intensity: "RPE 7-8",
                  work: "5 x 2 min",
                  rest: "2 min easy",
                  rounds: "5",
                  target: "Repeatable hard efforts",
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
    normalizedPlan.weeks[0].days[0].exercises[0].endurancePrescription;

  assert.deepEqual(prescription, {
    modality: "assault_bike",
    format: "intervals",
    durationMinutes: 20,
    intensity: "RPE 7-8",
    work: "5 x 2 min",
    rest: "2 min easy",
    rounds: 5,
    target: "Repeatable hard efforts",
    notes: "",
  });
  assert.deepEqual(collectUndefinedPaths(normalizedPlan), []);
});
