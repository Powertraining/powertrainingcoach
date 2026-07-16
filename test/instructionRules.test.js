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

test("endurance guidelines are selected for endurance-oriented plans", () => {
  const guidelines = getGuidelinesText({
    userInput: {
      desiredTraining: "strength_power_endurance",
      enduranceTraining: {
        include: true,
        modalities: ["assault_bike", "heavy_bag"],
      },
      trainingCapabilities: {
        heavyBag: "yes",
      },
    },
    purpose: "plan",
  });

  assert.match(guidelines, /Endurance training rules/i);
  assert.match(guidelines, /endurancePrescription/i);
  assert.match(guidelines, /assault_bike/i);
  assert.match(guidelines, /bicycling/i);
  assert.match(guidelines, /Sport-specific endurance is the match-prep alternative/i);
  assert.match(guidelines, /Circuit training must solve the athlete's stated fatigue problem/i);
  assert.match(guidelines, /50-70% of total circuit work/i);
  assert.match(guidelines, /30-50% as full-body work/i);
  assert.match(guidelines, /reduce density first/i);
  assert.match(guidelines, /Sprinting is anaerobic only/i);
  assert.match(guidelines, /Never stack hard endurance the day before important sparring/i);
  assert.match(guidelines, /Heavy bag endurance is for strikers/i);
});

test("explicit endurance opt-out suppresses endurance rules", () => {
  const guidelines = getGuidelinesText({
    userInput: {
      desiredTraining: "strength_power_endurance",
      includeEnduranceTraining: false,
    },
    purpose: "plan",
  });

  assert.doesNotMatch(guidelines, /Endurance training rules/i);
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

test("general rules include safety guidance for pain, acute injury, and weight cutting", () => {
  const guidelines = getGuidelinesText({ userInput: {}, purpose: "plan" });

  assert.match(guidelines, /pain/i);
  assert.match(guidelines, /acute injury/i);
  assert.match(guidelines, /weight cutting/i);
});

test("loaded-jump rules account for total load, implement weight, and output quality", () => {
  const guidelines = getGuidelinesText({ userInput: {}, purpose: "plan" });

  assert.match(guidelines, /bar plus plates.*30-60% of body mass/i);
  assert.match(guidelines, /hex bars commonly weigh 20-25 kg/i);
  assert.match(guidelines, /lighter bar or dumbbells/i);
  assert.match(guidelines, /contact mat\/app.*linear position transducer \(LPT\)/i);
  assert.match(guidelines, /loaded jumps 3-5/i);
});

test("heavy bag endurance rules appear only when endurance is requested for striking sports", () => {
  const strikingGuidelines = getGuidelinesText({
    userInput: {
      primaryCombatSport: "Boxing",
      desiredTraining: "strength_power_endurance",
      enduranceTraining: { include: true, modalities: ["heavy_bag"] },
      trainingCapabilities: { heavyBag: "yes" },
    },
    purpose: "plan",
  });
  const grapplingGuidelines = getGuidelinesText({
    userInput: {
      primaryCombatSport: "Wrestling",
      desiredTraining: "strength_power_endurance",
      enduranceTraining: { include: true, modalities: ["assault_bike"] },
    },
    purpose: "plan",
  });

  assert.match(strikingGuidelines, /Heavy bag endurance is for strikers/i);
  assert.match(grapplingGuidelines, /Heavy bag endurance is for strikers/i);
});

test("true 1RM instruction blocks beginners and fights within 8 weeks", () => {
  const guidelines = getGuidelinesText({
    userInput: { liftIntensityMethod: "percentage" },
    purpose: "plan",
  });

  assert.match(guidelines, /true_1rm.*rare|rare.*true_1rm/i);
  assert.match(guidelines, /never within 8 weeks of competition/i);
  assert.match(guidelines, /intermediate\/advanced/i);
});

test("session spacing rules include 48-hour recovery advisory", () => {
  const guidelines = getGuidelinesText({ userInput: {}, purpose: "plan" });

  assert.match(guidelines, /48 hours/i);
  assert.match(guidelines, /advisory/i);
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
