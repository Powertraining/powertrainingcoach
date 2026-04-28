import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TRAINING_CYCLE_WEEKS,
  getWeeksUntilEvent,
  resolveTrainingCycleWeeks,
} from "../src/services/utils/trainingCycle.js";

const TODAY = new Date("2026-04-24T12:00:00");

test("training cycles default to 12 weeks without a sooner event", () => {
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "off_camp",
      today: TODAY,
    }),
    DEFAULT_TRAINING_CYCLE_WEEKS
  );
});

test("in-camp cycles shorten when a competition is sooner than 12 weeks", () => {
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "in_camp",
      competitionTimeline: "Fight on 2026-06-05",
      today: TODAY,
    }),
    6
  );
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "in_camp",
      eventPreparation: "important tournament in 8 weeks",
      today: TODAY,
    }),
    8
  );
});

test("event dates do not shorten off-camp parent cycles", () => {
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "off_camp",
      eventPreparation: "grappling open in 8 weeks",
      today: TODAY,
    }),
    DEFAULT_TRAINING_CYCLE_WEEKS
  );
});

test("subscription and explicit request caps are respected inside the cycle length", () => {
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "off_camp",
      subscriptionWeeks: 10,
      today: TODAY,
    }),
    10
  );
  assert.equal(
    resolveTrainingCycleWeeks({
      trainingPhase: "off_camp",
      requestedWeeks: 6,
      today: TODAY,
    }),
    6
  );
});

test("weeks-until-event accepts common date and relative-week phrasing", () => {
  assert.equal(getWeeksUntilEvent("2026-05-22", TODAY), 4);
  assert.equal(getWeeksUntilEvent("10 weeks out", TODAY), 10);
});
