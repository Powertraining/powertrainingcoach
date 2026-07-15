import test from "node:test";
import assert from "node:assert/strict";

import {
  getCurrentTrainingPhase,
  getCurrentTrainingWeek,
  normalizeTrainingPlan,
} from "../src/services/utils/trainingPlan.js";
import { getPlanWeekStartDate } from "../src/services/utils/programOverview.js";

test("plan week dates advance in exact seven-day windows", () => {
  const plan = { createdAt: "2026-07-15T14:30:00" };

  assert.equal(getPlanWeekStartDate(plan, 1)?.toDateString(), "Wed Jul 15 2026");
  assert.equal(getPlanWeekStartDate(plan, 2)?.toDateString(), "Wed Jul 22 2026");
});

function createDay(dayNumber) {
  return {
    day: dayNumber,
    sessionLabel: `Day ${dayNumber}`,
    preferredWeekday: "",
    sessionProfile: {
      regions: ["full_body"],
      qualities: ["force"],
      stressLevel: "moderate",
    },
    exercises: [],
  };
}

function createPlan(totalWeeks = 8, daysPerWeek = 2) {
  return {
    summary: "Build a base first, then intensify.",
    phaseOverview: [
      {
        label: " Building ",
        weekStart: "1",
        weekEnd: "4",
        focus: " Build general strength and tolerance. ",
      },
      {
        name: "Intensification",
        weeks: "5-8",
        rationale: "Shift toward heavier work and higher neural demand.",
      },
    ],
    weeks: Array.from({ length: totalWeeks }, (_, weekIndex) => ({
      week: weekIndex + 1,
      days: Array.from({ length: daysPerWeek }, (_, dayIndex) =>
        createDay(dayIndex + 1)
      ),
    })),
  };
}

test("normalizeTrainingPlan trims and parses phase overview metadata", () => {
  const normalizedPlan = normalizeTrainingPlan(createPlan());

  assert.equal(normalizedPlan.phaseOverview.length, 2);
  assert.equal(normalizedPlan.phaseOverview[0].label, "Building");
  assert.equal(normalizedPlan.phaseOverview[0].weekStart, 1);
  assert.equal(normalizedPlan.phaseOverview[0].weekEnd, 4);
  assert.equal(
    normalizedPlan.phaseOverview[0].focus,
    "Build general strength and tolerance."
  );
  assert.equal(normalizedPlan.phaseOverview[1].label, "Intensification");
  assert.equal(normalizedPlan.phaseOverview[1].weekStart, 5);
  assert.equal(normalizedPlan.phaseOverview[1].weekEnd, 8);
});

test("current overview helpers return the active week and matching phase", () => {
  const completedDays = [
    "1-1",
    "1-2",
    "2-1",
    "2-2",
    "3-1",
    "3-2",
    "4-1",
    "4-2",
  ];
  const plan = createPlan();

  assert.equal(getCurrentTrainingWeek(plan, completedDays)?.week, 5);
  assert.equal(getCurrentTrainingPhase(plan, completedDays)?.label, "Intensification");
});

test("phase overview falls back to the overall summary for legacy plans", () => {
  const normalizedPlan = normalizeTrainingPlan({
    summary: "General strength base before peaking later.",
    weeks: [
      { week: 1, days: [createDay(1)] },
      { week: 2, days: [createDay(1)] },
    ],
  });

  assert.equal(normalizedPlan.phaseOverview.length, 1);
  assert.equal(normalizedPlan.phaseOverview[0].label, "Overall Program");
  assert.equal(normalizedPlan.phaseOverview[0].weekStart, 1);
  assert.equal(normalizedPlan.phaseOverview[0].weekEnd, 2);
});
