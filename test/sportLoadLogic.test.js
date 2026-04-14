import test from "node:test";
import assert from "node:assert/strict";

import {
  applySportLoadLevelToPlanWeek,
  deriveSportLoadLevelFromCompletedWeek,
  getCompletedWeekSetCount,
  isTrainingWeekCompleted,
} from "../src/services/utils/sportLoad.js";

function createExercise(name, sets = "4", overrides = {}) {
  return {
    name,
    sets,
    reps: "5",
    notes: "",
    substitutionOptions: [],
    ...overrides,
  };
}

function createDay(dayNumber, exercises = []) {
  return {
    day: dayNumber,
    sessionLabel: `Day ${dayNumber}`,
    preferredWeekday: "",
    sessionProfile: {
      regions: ["lower_body"],
      qualities: ["force"],
      stressLevel: "moderate",
    },
    exercises,
  };
}

function createPlan() {
  return {
    summary: "Sport load scaling test plan.",
    phaseOverview: [],
    weeks: [
      {
        week: 1,
        days: [
          createDay(1, [
            createExercise("Back Squat", "4", {
              percentagePrescription: {
                referenceLiftName: "Back Squat",
                loadingStrategy: "flat_loading",
                workingSets: [
                  {
                    count: 4,
                    reps: 5,
                    percent1RM: 75,
                    relativeIntensity: 85.7,
                  },
                ],
              },
            }),
            createExercise("Split Squat", "3"),
          ]),
          createDay(2, [createExercise("Bench Press", "5"), createExercise("Row", "4")]),
        ],
      },
      {
        week: 2,
        days: [createDay(1, [createExercise("Trap Bar Deadlift", "4")])],
      },
    ],
  };
}

test("sport load scaling updates the target week volume and preserves a base snapshot", () => {
  const scaledPlan = applySportLoadLevelToPlanWeek(createPlan(), 1, 4);
  const scaledWeek = scaledPlan.weeks[0];
  const firstExercise = scaledWeek.days[0].exercises[0];

  assert.equal(scaledWeek.sportLoadLevel, 4);
  assert.equal(scaledWeek.sportLoadMultiplier, 0.5);
  assert.equal(firstExercise.sets, "2");
  assert.equal(firstExercise.percentagePrescription.workingSets[0].count, 2);
  assert.equal(scaledWeek.sportLoadBaseSnapshot.days[0].exercises[0].sets, "4");
  assert.equal(
    scaledWeek.sportLoadBaseSnapshot.days[0].exercises[0].percentagePrescription.workingSets[0].count,
    4
  );
});

test("completed days are left untouched when a week is manually re-scaled mid-week", () => {
  const highPlan = applySportLoadLevelToPlanWeek(createPlan(), 1, 3);
  const rescaledPlan = applySportLoadLevelToPlanWeek(highPlan, 1, 1, {
    completedDays: ["1-1"],
    skipCompletedDays: true,
  });

  assert.equal(rescaledPlan.weeks[0].days[0].exercises[0].sets, "3");
  assert.equal(rescaledPlan.weeks[0].days[1].exercises[0].sets, "5");
});

test("completed-week set volume maps to the next sport load level", () => {
  const plan = createPlan();
  const completedDays = ["1-1", "1-2"];

  assert.equal(
    isTrainingWeekCompleted({
      plan,
      weekNumber: 1,
      completedDays,
    }),
    true
  );
  assert.equal(
    getCompletedWeekSetCount({
      plan,
      weekNumber: 1,
      completedDays,
    }),
    16
  );
  assert.equal(
    deriveSportLoadLevelFromCompletedWeek({
      plan,
      weekNumber: 1,
      completedDays,
      sessionsPerWeek: 2,
    }),
    2
  );
});

test("applying a new sport load to the following week leaves the current week untouched", () => {
  const adjustedPlan = applySportLoadLevelToPlanWeek(createPlan(), 2, 4);

  assert.equal(adjustedPlan.weeks[0].days[0].exercises[0].sets, "4");
  assert.equal(adjustedPlan.weeks[1].days[0].exercises[0].sets, "1");
});
