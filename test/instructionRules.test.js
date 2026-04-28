import test from "node:test";
import assert from "node:assert/strict";

import {
  getGuidelinesText,
  getStrikingCampContext,
} from "../src/services/utils/instructionRules.js";

test("plan guidelines include cycle structure and training preference rules", () => {
  const guidelines = getGuidelinesText({
    userInput: {
      sessionDuration: "45_min",
      desiredTraining: "strength_power",
      eventPreparation: "boxing tournament in 8 weeks",
    },
    purpose: "plan",
  });

  assert.match(guidelines, /12-week parent cycle/i);
  assert.match(guidelines, /Weeks 4 and 8/i);
  assert.match(guidelines, /desiredTraining/i);
  assert.match(guidelines, /sessionDuration/i);
});

test("missed-session guidelines still include rescue logic", () => {
  const guidelines = getGuidelinesText({
    userInput: {},
    purpose: "missed_session",
  });

  assert.match(guidelines, /Rescue missed work/i);
});

test("striking sport without confirmed peak-window competition resolves as off-camp", () => {
  const context = getStrikingCampContext({
    primaryCombatSport: "Boxing",
    trainingPhase: "off_camp",
    eventPreparation: "",
    numWeeks: 12,
  });

  assert.equal(context.campType, "off_camp");

  const guidelines = getGuidelinesText({
    userInput: {
      primaryCombatSport: "Boxing",
      eventPreparation: "",
      numWeeks: 12,
    },
  });

  assert.match(guidelines, /Status: Off-camp/i);
  assert.match(guidelines, /Do not force a speed peak/i);
});

test("striking sport with confirmed peak-window competition resolves as in-camp", () => {
  const context = getStrikingCampContext({
    primaryCombatSport: "Muay Thai / Kickboxing",
    eventPreparation: "Fight in 8 weeks",
    numWeeks: 8,
  });

  assert.equal(context.campType, "in_camp");
  assert.equal(context.weeksUntilEvent, 8);
  assert.equal(context.shouldTaperInGeneratedPlan, true);

  const guidelines = getGuidelinesText({
    userInput: {
      primaryCombatSport: "Muay Thai / Kickboxing",
      eventPreparation: "Fight in 8 weeks",
      numWeeks: 8,
    },
  });

  assert.match(guidelines, /Status: In-camp/i);
  assert.match(guidelines, /speed-dominant/i);
  assert.match(guidelines, /30-60%/i);
});

test("striking sport with event outside peak window stays build-focused", () => {
  const context = getStrikingCampContext({
    primaryCombatSport: "Boxing",
    eventPreparation: "Tournament in 20 weeks",
    numWeeks: 12,
  });

  assert.equal(context.campType, "off_camp");
  assert.equal(context.weeksUntilEvent, 20);

  const guidelines = getGuidelinesText({
    userInput: {
      primaryCombatSport: "Boxing",
      eventPreparation: "Tournament in 20 weeks",
      numWeeks: 12,
    },
  });

  assert.match(guidelines, /outside the 12-week peak window/i);
  assert.match(guidelines, /build-focused/i);
});
