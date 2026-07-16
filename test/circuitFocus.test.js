import test from "node:test";
import assert from "node:assert/strict";

import {
  CIRCUIT_REGION_VALUES,
  getCircuitRegionOptions,
} from "../src/constants/circuitFocus.js";

test("every sport exposes all eight canonical circuit regions", () => {
  ["Boxing", "Muay Thai / Kickboxing", "Wrestling", "Judo", "BJJ", "MMA"].forEach(
    (sport) => {
      const options = getCircuitRegionOptions(sport);

      assert.equal(options.length, 8);
      assert.deepEqual(
        [...options.map((option) => option.value)].sort(),
        [...CIRCUIT_REGION_VALUES].sort()
      );
      assert.ok(options.every((option) => option.description));
    }
  );
});

test("sport-specific region order starts with the documented common complaints", () => {
  assert.equal(getCircuitRegionOptions("Boxing")[0].value, "legs");
  assert.equal(getCircuitRegionOptions("Wrestling")[0].value, "grip_forearms");
  assert.equal(getCircuitRegionOptions("BJJ")[1].value, "trunk");
  assert.equal(getCircuitRegionOptions("MMA")[1].value, "grip_forearms");
});

test("unknown sports receive neutral rather than borrowed sport language", () => {
  const details = getCircuitRegionOptions("Karate")
    .map((option) => option.description)
    .join(" ");

  assert.doesNotMatch(details, /shots|tie-ups|bag|collars|kumi-kata/i);
});
