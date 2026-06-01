import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTrainingPlanScaffold,
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
    percentageReferenceMethod: "rpe_based_1rm",
    loadingStrategy: "ascending_pyramid",
  });

  assert.match(prompt, /speed-dominant/i);
  assert.match(prompt, /95% of the normal bench press 1RM/i);
  assert.match(prompt, /weighted rows/i);
  assert.match(prompt, /medicine-ball throws and plyometrics/i);
  assert.match(prompt, /3 x 5\+5/i);
  assert.match(prompt, /skip conventional deadlift-style main lifts/i);
  assert.match(
    prompt,
    /"strategy" must be exactly one of "e1rm", "best_set", or "fixed_rpe"/i
  );
  assert.match(
    prompt,
    /"method" must be exactly one of "rpe_based_1rm", "multi_rm", or "true_1rm"/i
  );
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

test("training prompt embeds endurance rules and prescription schema", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    desiredTraining: "endurance",
    enduranceTraining: {
      include: true,
      modality: "assault_bike",
    },
    trainingCapabilities: {
      bikeRowerAssaultBike: "yes",
      runningSprinting: "somewhat",
    },
  });

  assert.match(prompt, /Endurance training rules/i);
  assert.match(prompt, /endurancePrescription/i);
  assert.match(prompt, /rowing_ergometer/i);
  assert.match(prompt, /versaclimber/i);
  assert.match(prompt, /sport_specific/i);
  assert.match(prompt, /circuitPrescription/i);
  assert.match(prompt, /heavyBagPrescription/i);
  assert.match(prompt, /sprintPrescription/i);
  assert.match(prompt, /Assault Bike Intervals/i);
});

test("training prompt requires experience-relevant natural user-visible text", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "Boxing",
    daysPerWeek: 3,
    experience: "beginner",
  });

  assert.match(prompt, /USER-VISIBLE TEXT RULES/i);
  assert.match(prompt, /strength-and-conditioning experience level/i);
  assert.match(prompt, /natural, human-like coaching language/i);
  assert.match(prompt, /no unexplained jargon or abbreviations/i);
});

test("missed-session prompt requires experience-relevant natural user-visible text", () => {
  const prompt = buildMissedSessionAdjustmentPrompt({
    questionnaire: {
      primaryCombatSport: "MMA",
      experience: "advanced",
    },
    targetDay: {
      day: 2,
      preferredWeekday: "Thursday",
    },
  });

  assert.match(prompt, /USER-VISIBLE TEXT RULES/i);
  assert.match(prompt, /adjustment summaries as text the athlete may read/i);
  assert.match(prompt, /advanced athletes can see precise loading/i);
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
  assert.doesNotMatch(prompt, /rpe_based_1rm is the default/i);
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

test("training prompt generates only the next block with a parent-cycle overview", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    numWeeks: 12,
    parentCycleWeeks: 12,
    generatedBlockWeeks: 4,
    blockStartWeek: 5,
    blockEndWeek: 8,
  });

  assert.match(prompt, /Parent cycle length: 12 weeks/i);
  assert.match(prompt, /Generate only the next 4-week block: Weeks 5-8/i);
  assert.match(
    prompt,
    /cover the full 12-week cycle as Weeks 1-4, Weeks 5-8, Weeks 9-12/i
  );
  assert.match(
    prompt,
    /Include exactly 4 week objects in "weeks", numbered 5-8/i
  );
  assert.match(prompt, /Do not generate future week objects yet/i);
  assert.match(prompt, /PLAN SCAFFOLD \(APP-CREATED\)/i);
  assert.match(prompt, /Use this scaffold exactly for week numbers/i);
});

test("training scaffold fixes week and preferred weekday shells", () => {
  const scaffold = buildTrainingPlanScaffold({
    daysPerWeek: 2,
    parentCycleWeeks: 12,
    generatedBlockWeeks: 4,
    blockStartWeek: 5,
    preferredWeekdays: ["Tuesday", "Friday"],
  });

  assert.deepEqual(
    scaffold.weeks.map((week) => week.week),
    [5, 6, 7, 8]
  );
  assert.deepEqual(scaffold.weeks[0].days, [
    {
      day: 1,
      originalDayNumber: 1,
      sessionLabel: "Day 1",
      preferredWeekday: "Tuesday",
    },
    {
      day: 2,
      originalDayNumber: 2,
      sessionLabel: "Day 2",
      preferredWeekday: "Friday",
    },
  ]);
  assert.deepEqual(
    scaffold.phaseOverview.map((phase) => [phase.weekStart, phase.weekEnd]),
    [[1, 4], [5, 8], [9, 12]]
  );
});

test("training prompt includes newly added striking periodization instructions", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "Muay Thai / Kickboxing",
    daysPerWeek: 3,
    eventPreparation: "Fight in 8 weeks",
    numWeeks: 8,
  });

  assert.match(prompt, /off-camp raises the force ceiling/i);
  assert.match(prompt, /late camp expresses speed/i);
  assert.match(prompt, /fight week prioritizes freshness and sharpness/i);
  assert.match(prompt, /Far from the fight, train what the athlete lacks/i);
  assert.match(prompt, /move violently fast with maximal concentric intent/i);
  assert.match(prompt, /scissor jumps, split-squat jumps, single-leg bounds/i);
});

test("training prompt includes pull-up and chin-up prescription rules", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    goal: "strength",
    experience: "intermediate",
    liftIntensityMethod: "percentage",
  });

  assert.match(prompt, /Pull-up and chin-up rules/i);
  assert.match(prompt, /always prescribed with RPE or RIR/i);
  assert.match(prompt, /weighted pull-ups become available/i);
  assert.match(prompt, /do not assume the athlete qualifies for weighted pull-ups/i);
  assert.match(
    prompt,
    /never add "percentagePrescription" or "strengthAssessment"/i
  );
});
