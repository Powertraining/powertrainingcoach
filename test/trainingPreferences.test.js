import test from "node:test";
import assert from "node:assert/strict";

import {
  ENDURANCE_MODALITY_OPTIONS,
  normalizeTrainingPreferences,
} from "../src/constants/trainingPreferences.js";

test("endurance modality options include the configured methods and tools", () => {
  const modalityValues = ENDURANCE_MODALITY_OPTIONS.map((option) => option.value);

  assert.deepEqual(modalityValues, [
    "rowing_ergometer",
    "skiing_ergometer",
    "assault_bike",
    "running",
    "sprinting",
    "bicycling",
    "arm_crank_machine",
    "versaclimber",
    "swimming",
    "heavy_bag",
    "circuit_training",
    "sport_specific",
  ]);
});

test("normalizeTrainingPreferences preserves preferred endurance modalities", () => {
  const normalizedPreferences = normalizeTrainingPreferences({
    desiredTraining: "strength_power_endurance",
    preferredEnduranceModalities: [
      "Versa Climber",
      "Sport Specific",
      "heavy_bag_endurance",
      "Versa Climber",
    ],
  });

  assert.deepEqual(normalizedPreferences.preferredEnduranceModalities, [
    "versaclimber",
    "sport_specific",
    "heavy_bag",
  ]);
});

test("normalizeTrainingPreferences builds endurance ruleset settings", () => {
  const normalizedPreferences = normalizeTrainingPreferences({
    desiredTraining: "strength_power_endurance",
    preferredEnduranceModalities: ["circuit_training", "heavy_bag", "sprinting"],
    enduranceSessionsPerWeek: 5,
    preferredEnduranceFormat: "high_intensity_intervals",
    circuitTrainingGoalInput: "My arms and forearms blow up in hand-fighting.",
    heavyBagEnduranceTarget: "repeated_burst_bag_work",
    sprintingTarget: "repeat_bursts",
  });

  assert.equal(normalizedPreferences.enduranceTraining.include, true);
  assert.equal(normalizedPreferences.enduranceTraining.sessionsPerWeek, 5);
  assert.equal(
    normalizedPreferences.enduranceTraining.preferredFormat,
    "high_intensity_intervals"
  );
  assert.equal(
    normalizedPreferences.enduranceTraining.circuitTraining.primaryPriority,
    "grip_endurance"
  );
  assert.deepEqual(
    normalizedPreferences.enduranceTraining.circuitTraining.secondaryPriorities,
    ["sport_specific_fatigue_resistance"]
  );
  assert.equal(
    normalizedPreferences.enduranceTraining.heavyBag.target,
    "repeated_burst_bag_work"
  );
  assert.equal(normalizedPreferences.enduranceTraining.sprinting.target, "repeat_bursts");
});

test("normalizeTrainingPreferences caps endurance sessions at five per week", () => {
  const normalizedPreferences = normalizeTrainingPreferences({
    enduranceSessionsPerWeek: 7,
  });

  assert.equal(normalizedPreferences.enduranceSessionsPerWeek, 5);
  assert.equal(normalizedPreferences.enduranceTraining.sessionsPerWeek, 5);
});
