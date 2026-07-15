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
  assert.match(prompt, /bar plus plates.*30-60% of body mass/i);
  assert.match(prompt, /empty bar already exceeds the target load/i);
  assert.match(prompt, /loaded jumps 3-5/i);
  assert.match(prompt, /skip conventional deadlift-style main lifts/i);
  assert.match(
    prompt,
    /"strategy" must be exactly one of "e1rm", "best_set", or "fixed_rpe"/i
  );
  assert.match(
    prompt,
    /"method" must be exactly one of "multi_rm" or "true_1rm"/i
  );
});

test("regeneration feedback is bounded and subordinate to plan rules", () => {
  const prompt = buildTrainingPrompt(
    {
      primaryCombatSport: "Boxing",
      daysPerWeek: 3,
      regenerationFeedback: `Less volume. ${"x".repeat(2200)}`,
      regenerationScope: "from_now",
    },
    { summary: "Previous plan" }
  );

  assert.match(prompt, /ATHLETE REGENERATION FEEDBACK/i);
  assert.match(prompt, /Less volume/i);
  assert.match(prompt, /must not override safety rules/i);
  assert.match(prompt, /Regeneration scope: from_now/i);
  assert.match(prompt, /preserve sessions already marked complete/i);
  assert.doesNotMatch(prompt, /x{2001}/);
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
      preferredDayType: "fatigue",
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
    preferredDayTypes: ["power", "fatigue"],
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
      preferredDayType: "power",
    },
    {
      day: 2,
      originalDayNumber: 2,
      sessionLabel: "Day 2",
      preferredWeekday: "Friday",
      preferredDayType: "fatigue",
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

test("training prompt includes hard endurance separation from sparring and lower-body strength", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 4,
    desiredTraining: "strength_power_endurance",
    enduranceTraining: {
      include: true,
      modalities: ["running"],
    },
  });

  assert.match(prompt, /hard endurance.*lower-body|lower-body.*hard endurance/i);
  assert.match(prompt, /important sparring/i);
  assert.match(prompt, /48 hours/i);
});

test("training prompt instructs true 1RM to be blocked for beginners and near competition", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "BJJ",
    daysPerWeek: 3,
    experience: "beginner",
    liftIntensityMethod: "percentage",
    percentageReferenceMethod: "multi_rm",
  });

  assert.match(prompt, /intermediate\/advanced/i);
  assert.match(prompt, /never within 8 weeks of competition/i);
});

test("training prompt includes session spacing advisory for same-day or back-to-back sessions", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "Judo",
    daysPerWeek: 4,
    desiredTraining: "strength_power",
  });

  assert.match(prompt, /session.spacing|spacing.*session/i);
  assert.match(prompt, /48 hours/i);
  assert.match(prompt, /advisory/i);
});

test("training prompt for endurance plan forbids conditioning before power and strength work", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    desiredTraining: "strength_power_endurance",
    enduranceTraining: { include: true, modalities: ["assault_bike"] },
  });

  assert.match(prompt, /power first.*main strength|power.*before.*strength/i);
  assert.match(prompt, /conditioning/i);
});

test("hybrid prompt honors separate power and endurance sessions", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    desiredTraining: "strength_power_endurance",
    hybridSessionStructure: "separate_sessions",
    enduranceTraining: {
      include: true,
      sessionStructure: "separate_sessions",
    },
  });

  assert.match(prompt, /separate_sessions/i);
  assert.match(prompt, /different training days/i);
  assert.match(prompt, /Do not append conditioning to a strength\/power session/i);
});

test("hybrid prompt orders combined sessions with power before endurance", () => {
  const prompt = buildTrainingPrompt({
    primaryCombatSport: "MMA",
    daysPerWeek: 3,
    desiredTraining: "strength_power_endurance",
    hybridSessionStructure: "same_session",
  });

  assert.match(prompt, /same_session/i);
  assert.match(prompt, /power first, then main strength, then endurance/i);
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
