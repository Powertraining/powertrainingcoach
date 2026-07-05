import test from "node:test";
import assert from "node:assert/strict";

import {
  TRAINING_DAY_TYPE_COLORS,
  TRAINING_DAY_TYPE_GRADIENTS,
  TRAINING_DAY_TYPE_OVERLAY_GRADIENTS,
  getTrainingDayTypeColor,
  getTrainingDayTypeGradient,
  getTrainingDayTypeLabel,
  getTrainingDayTypeOverlayGradient,
  normalizeTrainingDayType,
} from "../src/constants/trainingDayTypes.js";

test("training day type colors define canonical colors including rest", () => {
  assert.deepEqual(TRAINING_DAY_TYPE_COLORS, {
    force: "#184DC8",
    power: "#F82929",
    fatigue: "#00842A",
    speed: "#F5B700",
    hypertrophy: "#7C3AED",
    recovery: "#00A6A6",
    rest: "#585858",
  });
});

test("training day type helpers resolve athlete-facing aliases", () => {
  assert.equal(normalizeTrainingDayType("strength"), "force");
  assert.equal(normalizeTrainingDayType("conditioning"), "fatigue");
  assert.equal(normalizeTrainingDayType("rest day"), "rest");
  assert.equal(normalizeTrainingDayType("strength day"), "force");
  assert.equal(normalizeTrainingDayType("conditioning day"), "fatigue");
  assert.equal(getTrainingDayTypeLabel("force"), "Strength");
  assert.equal(getTrainingDayTypeLabel("conditioning"), "Conditioning");
  assert.equal(getTrainingDayTypeColor("rest day"), "#585858");
});

test("training day type gradients place muted day color at bottom-left", () => {
  assert.deepEqual(TRAINING_DAY_TYPE_GRADIENTS.force, {
    colors: ["rgba(24, 77, 200, 0.35)", "#282828"],
    locations: [0.2, 1],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  });
  assert.deepEqual(getTrainingDayTypeGradient("rest day"), {
    colors: ["rgba(88, 88, 88, 0.35)", "#282828"],
    locations: [0.2, 1],
    start: { x: 0, y: 1 },
    end: { x: 1, y: 0 },
  });
});

test("training day type overlay gradients darken the panel at 85 percent opacity", () => {
  assert.deepEqual(TRAINING_DAY_TYPE_OVERLAY_GRADIENTS.fatigue, {
    colors: ["#000000", "#002A0D"],
    locations: [0, 1],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
    opacity: 0.85,
  });
  assert.deepEqual(getTrainingDayTypeOverlayGradient("rest day"), {
    colors: ["#000000", "#1C1C1C"],
    locations: [0, 1],
    start: { x: 1, y: 0 },
    end: { x: 0, y: 1 },
    opacity: 0.85,
  });
});
