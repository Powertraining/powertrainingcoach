import test from "node:test";
import assert from "node:assert/strict";

import {
  formatDistanceFromMeters,
  formatMeasurementText,
  formatWeightFromKilograms,
  getKilogramsFromDisplayWeight,
  normalizeUnitSystem,
  UNIT_SYSTEMS,
} from "../src/services/utils/measurementUnits.js";

test("measurement system defaults safely to metric", () => {
  assert.equal(normalizeUnitSystem(undefined), UNIT_SYSTEMS.METRIC);
  assert.equal(normalizeUnitSystem("unexpected"), UNIT_SYSTEMS.METRIC);
  assert.equal(normalizeUnitSystem("imperial"), UNIT_SYSTEMS.IMPERIAL);
});

test("weight display converts canonical kilograms without changing stored units", () => {
  assert.equal(formatWeightFromKilograms(100, "metric"), "100 kg");
  assert.equal(formatWeightFromKilograms(100, "imperial"), "220.5 lb");
  assert.equal(getKilogramsFromDisplayWeight(220.5, "imperial"), 100.017);
});

test("distance display uses metric or imperial scale appropriate to the distance", () => {
  assert.equal(formatDistanceFromMeters(100, "metric"), "100 m");
  assert.equal(formatDistanceFromMeters(100, "imperial"), "109.4 yd");
  assert.equal(formatDistanceFromMeters(5000, "metric"), "5 km");
  assert.equal(formatDistanceFromMeters(5000, "imperial"), "3.11 mi");
});

test("free-form training guidance follows the selected measurement system", () => {
  assert.equal(
    formatMeasurementText("Use a 4 kg ball at 16 km/h", "imperial"),
    "Use a 8.8 lb ball at 9.9 mph"
  );
  assert.equal(
    formatMeasurementText("Use 20 lb for 10 miles", "metric"),
    "Use 9.1 kg for 16.09 km"
  );
  assert.equal(
    formatMeasurementText("Choose a 2-8 kg medicine ball", "imperial"),
    "Choose a 4.4-17.6 lb medicine ball"
  );
  assert.equal(
    formatMeasurementText("Choose a 2-8 kg ball (4-18 lb)", "imperial"),
    "Choose a 4.4-17.6 lb ball (4-18 lb)"
  );
});
