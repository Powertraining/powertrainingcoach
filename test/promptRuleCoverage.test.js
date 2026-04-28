import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMissedSessionAdjustmentPrompt,
  buildTrainingPrompt,
} from "../src/services/utils/promptBuilder.js";

test("training prompt embeds the key striking and percentage instruction rules", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "Boxing",
    daysPerWeek: 3,
    goal: "power",
    experience: "intermediate",
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "heavy_single",
    loadingStrategy: "ascending_pyramid",
  });

  assert.match(prompt, /speed-dominant/i);
  assert.match(prompt, /95% of the normal bench press 1RM/i);
  assert.match(prompt, /weighted rows/i);
  assert.match(prompt, /medicine-ball throws and plyometrics/i);
  assert.match(prompt, /3 x 5\+5/i);
  assert.match(prompt, /skip conventional deadlift-style main lifts/i);
});

test("missed-session prompt embeds rescue priority rules", () => {
  const prompt = buildMissedSessionAdjustmentPrompt({
    questionnaire: {
      primaryCombatSport: "MMA",
      liftIntensityMethod: "percentage",
    },
    targetDay: {
      day: 3,
      preferredWeekday: "Friday",
    },
    mode: "priority_rescue",
    reason: "schedule_travel",
    missedSessionCount: 2,
  });

  assert.match(prompt, /power, plyo, and med-ball first/i);
  assert.match(prompt, /main weighted row or pull/i);
  assert.match(prompt, /conservative re-entry session/i);
  assert.match(prompt, /rescueMode/i);
});

test("RPE prompt explicitly blocks percentage prescriptions and strength assessments", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    goal: "strength",
    experience: "intermediate",
    liftIntensityMethod: "rpe",
    loadingStrategy: "flat_loading",
  });

  assert.match(
    prompt,
    /do not add "percentagePrescription" or "strengthAssessment"/i
  );
  assert.doesNotMatch(prompt, /heavy_single is the default/i);
});

test("RPE missed-session prompt blocks preserving strength assessments", () => {
  const prompt = buildMissedSessionAdjustmentPrompt({
    questionnaire: {
      primaryCombatSport: "Boxing",
      liftIntensityMethod: "rpe",
    },
    targetDay: {
      day: 2,
      preferredWeekday: "Wednesday",
    },
    mode: "re_entry",
    reason: "illness",
    missedSessionCount: 1,
  });

  assert.match(
    prompt,
    /do not add or preserve percentagePrescription or strengthAssessment/i
  );
});

test("striking prompt resolves off-camp and in-camp from competition timing", () => {
  const offCampPrompt = buildTrainingPrompt({
    primaryCombatSport: "Boxing",
    daysPerWeek: 3,
    eventPreparation: "",
    numWeeks: 12,
  });
  const inCampPrompt = buildTrainingPrompt({
    primaryCombatSport: "Boxing",
    daysPerWeek: 3,
    eventPreparation: "Fight in 8 weeks",
    numWeeks: 8,
  });

  assert.match(offCampPrompt, /Status: Off-camp/i);
  assert.match(offCampPrompt, /Do not force a speed peak/i);
  assert.match(inCampPrompt, /Status: In-camp/i);
  assert.match(inCampPrompt, /confirmed striking competition is about 8 week/i);
  assert.match(inCampPrompt, /30-60%/i);
});
