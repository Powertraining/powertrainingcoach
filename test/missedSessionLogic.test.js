import test from "node:test";
import assert from "node:assert/strict";

import {
  applyMissedSessionAdjustment,
  applyTrainingSessionMove,
  getClosestActiveTrainingDay,
  getCurrentTrainingDay,
  normalizeTrainingPlan,
} from "../src/services/utils/trainingPlan.js";

test("a session can be moved to an exact free day earlier or later in its week", () => {
  const laterMove = applyTrainingSessionMove(createPlan(2, 1), {
    weekNumber: 1,
    dayNumber: 1,
    targetWeekday: "Tuesday",
  });
  const movedLaterDay = laterMove.plan.weeks[0].days[0];

  assert.equal(laterMove.action, "move_session");
  assert.equal(movedLaterDay.preferredWeekday, "Tuesday");
  assert.equal(movedLaterDay.status, "rescheduled");
  assert.equal(movedLaterDay.rescueMode, "manual_move");

  const earlierMove = applyTrainingSessionMove(laterMove.plan, {
    weekNumber: 1,
    dayNumber: 2,
    targetWeekday: "Monday",
  });

  assert.equal(earlierMove.action, "move_session");
  assert.equal(earlierMove.plan.weeks[0].days[1].preferredWeekday, "Monday");
});

test("an exact session move cannot overwrite another scheduled session", () => {
  const result = applyTrainingSessionMove(createPlan(3, 1), {
    weekNumber: 1,
    dayNumber: 1,
    targetWeekday: "Wednesday",
  });

  assert.equal(result.action, "target_occupied");
  assert.equal(result.plan.weeks[0].days[0].preferredWeekday, "Monday");
});

test("an exact session move stays in its training week and cannot move into the past", () => {
  const plan = {
    ...createPlan(2, 2),
    createdAt: "2026-07-15T10:00:00",
  };
  const pastResult = applyTrainingSessionMove(plan, {
    weekNumber: 1,
    dayNumber: 1,
    targetDate: new Date("2026-07-16T10:00:00"),
    today: new Date("2026-07-17T10:00:00"),
  });
  const outsideWeekResult = applyTrainingSessionMove(plan, {
    weekNumber: 1,
    dayNumber: 1,
    targetDate: new Date("2026-07-22T10:00:00"),
    today: new Date("2026-07-15T10:00:00"),
  });

  assert.equal(pastResult.action, "target_in_past");
  assert.equal(outsideWeekResult.action, "target_outside_week");
});

test("plans saved during the removed merge experiment restore the pre-merge week", () => {
  const originalWeek = createPlan(2, 1).weeks[0];
  const persistedMergedPlan = {
    weeks: [
      {
        week: 1,
        adjustmentState: {
          lastAction: "manual_merge",
          originalWeekSnapshot: originalWeek,
        },
        days: [
          { ...originalWeek.days[0], status: "skipped", exercises: [] },
          {
            ...originalWeek.days[1],
            rescueMode: "manual_merge",
            exercises: [
              ...originalWeek.days[1].exercises,
              ...originalWeek.days[0].exercises,
            ],
          },
        ],
      },
    ],
  };

  const restoredPlan = normalizeTrainingPlan(persistedMergedPlan);

  assert.equal(restoredPlan.weeks[0].days[0].status, "pending");
  assert.equal(
    restoredPlan.weeks[0].days[0].exercises.length,
    originalWeek.days[0].exercises.length
  );
  assert.equal(restoredPlan.weeks[0].days[1].rescueMode, "");
});

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

test("closest active training day includes today before later upcoming days", () => {
  const plan = {
    weeks: [
      {
        week: 1,
        days: [
          createDay(1, [createExercise("Back Squat")]),
          createDay(2, [createExercise("Bench Press")]),
          createDay(3, [createExercise("Trap Bar Deadlift")]),
        ],
      },
    ],
  };
  const wednesday = new Date("2026-05-27T12:00:00");

  assert.equal(getCurrentTrainingDay(plan, [])?.day, 1);
  assert.equal(getClosestActiveTrainingDay(plan, [], wednesday)?.day, 2);
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

test("illness miss creates a conservative re-entry session and repeats the week", () => {
  const result = applyMissedSessionAdjustment(createPlan(3, 2), {
    completedDays: ["1-1"],
    weekNumber: 1,
    dayNumber: 2,
    reason: "illness_injury",
  });

  const weekOne = result.plan.weeks[0];
  const reentrySlot = weekOne.days.find((day) => day.day === 3);

  assert.equal(result.action, "repeat_next_week");
  assert.equal(weekOne.days.find((day) => day.day === 2)?.status, "skipped");
  assert.equal(reentrySlot?.status, "rescheduled");
  assert.equal(reentrySlot?.rescueMode, "re_entry");
});

test("three missed sessions out of four marks the week failed and repeats the week", () => {
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

  const rescueSlotDayNumber = secondMiss.plan.weeks[0].days
    .find((day) => day.status === "rescheduled")?.day;

  const thirdMiss = applyMissedSessionAdjustment(secondMiss.plan, {
    completedDays: secondMiss.completedDays,
    weekNumber: 1,
    dayNumber: rescueSlotDayNumber || 4,
    reason: "schedule_travel",
  });

  assert.equal(thirdMiss.action, "repeat_next_week");
  assert.equal(thirdMiss.plan.weeks[1].days[0].sessionLabel, "Day 1");
  assert.equal(thirdMiss.plan.weeks[1].days[1].sessionLabel, "Day 2");
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
