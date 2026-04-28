import test from "node:test";
import assert from "node:assert/strict";

import { getGuidelinesText } from "../src/services/utils/instructionRules.js";

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
