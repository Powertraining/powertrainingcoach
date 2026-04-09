import test from "node:test";
import assert from "node:assert/strict";

import {
  applyMissedSessionAdjustment,
  getCurrentTrainingDay,
} from "../src/services/utils/trainingPlan.js";

function createExercise(name, notes = "") {
  return {
    name,
    sets: "3",
    reps: "5",
    notes,
    substitutionOptions: [],
  };
}

function createDay(dayNumber, exercises) {
  return {
    day: dayNumber,
    sessionLabel: `Day ${dayNumber}`,
    preferredWeekday: ["Monday", "Wednesday", "Friday", "Saturday"][dayNumber - 1] || "",
    sessionProfile: {
      regions: ["full_body"],
      qualities: ["force", "power"],
      stressLevel: "high",
    },
    exercises,
  };
}

function createPlan(daysPerWeek = 3, totalWeeks = 2) {
  const baseDays = [
    createDay(1, [createExercise("Box Jump", "Explosive"), createExercise("Back Squat"), createExercise("Chest Supported Row")]),
    createDay(2, [createExercise("Medicine Ball Throw", "Explosive"), createExercise("Trap Bar Deadlift"), createExercise("Weighted Pull-up"), createExercise("Pallof Press"), createExercise("Biceps Curl")]),
    createDay(3, [createExercise("Broad Jump", "Explosive"), createExercise("Front Squat"), createExercise("Single-Arm Row"), createExercise("Hanging Knee Raise")]),
    createDay(4, [createExercise("Pogo Jump", "Explosive"), createExercise("Bench Press"), createExercise("Pull-up"), createExercise("Dead Bug")]),
  ].slice(0, daysPerWeek);

  return {
    weeks: Array.from({ length: totalWeeks }, (_, index) => ({
      week: index + 1,
      days: baseDays,
    })),
  };
}

test("one missed session in a 3-day week creates a late-week rescue and skips the old slot", () => {
  const result = applyMissedSessionAdjustment(createPlan(3, 2), {
    completedDays: ["1-1"],
    weekNumber: 1,
    dayNumber: 2,
    reason: "schedule_travel",
  });

  const weekOne = result.plan.weeks[0];
  const skippedSlot = weekOne.days.find((day) => day.day === 2);
  const rescueSlot = weekOne.days.find((day) => day.day === 3);

  assert.equal(result.action, "late_week_rescue");
  assert.equal(skippedSlot.status, "skipped");
  assert.equal(skippedSlot.exercises.length, 0);
  assert.equal(rescueSlot.status, "rescheduled");
  assert.equal(rescueSlot.sessionLabel, "Day 2");
  assert.equal(getCurrentTrainingDay(result.plan, result.completedDays)?.day, 3);
});

test("missing half of a 2-day week expires the slot and repeats the week target next week", () => {
  const result = applyMissedSessionAdjustment(createPlan(2, 2), {
    completedDays: ["1-1"],
    weekNumber: 1,
    dayNumber: 2,
    reason: "schedule_travel",
  });

  const weekOne = result.plan.weeks[0];
  const weekTwo = result.plan.weeks[1];

  assert.equal(result.action, "repeat_next_week");
  assert.equal(weekOne.days.find((day) => day.day === 2)?.status, "skipped");
  assert.equal(weekTwo.days[0].status, "pending");
  assert.equal(weekTwo.days[0].sessionLabel, "Day 1");
  assert.equal(weekTwo.days[1].sessionLabel, "Day 2");
});

test("two missed sessions collapse the remainder of the week to one priority rescue and freeze progression", () => {
  const firstMiss = applyMissedSessionAdjustment(createPlan(4, 2), {
    completedDays: ["1-1"],
    weekNumber: 1,
    dayNumber: 2,
    reason: "schedule_travel",
  });

  const secondMiss = applyMissedSessionAdjustment(firstMiss.plan, {
    completedDays: firstMiss.completedDays,
    weekNumber: 1,
    dayNumber: 3,
    reason: "schedule_travel",
  });

  const weekOne = secondMiss.plan.weeks[0];
  const weekTwo = secondMiss.plan.weeks[1];
  const slotThree = weekOne.days.find((day) => day.day === 3);
  const slotFour = weekOne.days.find((day) => day.day === 4);

  assert.equal(secondMiss.action, "repeat_next_week");
  assert.equal(slotThree.status, "skipped");
  assert.equal(slotFour.status, "rescheduled");
  assert.equal(weekTwo.days[0].sessionLabel, "Day 1");
  assert.equal(weekTwo.days[1].sessionLabel, "Day 2");
});
