import { getPrescribedSetCount } from "./exerciseSets.js";

const ORDER_LABEL_PATTERN = /^(\d+)([a-z])?$/i;
const NAME_ORDER_PREFIX_PATTERN = /^\s*(\d+)([a-z])?\s*[.):-]\s*/i;

export function normalizeExerciseOrderLabel(value = "") {
  const match = String(value || "").trim().match(ORDER_LABEL_PATTERN);

  return match ? `${Number.parseInt(match[1], 10)}${(match[2] || "").toLowerCase()}` : "";
}

export function getExerciseOrderLabel(exercise = {}, exerciseIndex = 0) {
  const explicitLabel = normalizeExerciseOrderLabel(
    exercise?.orderLabel || exercise?.exerciseLabel
  );

  if (explicitLabel) {
    return explicitLabel;
  }

  const nameMatch = String(exercise?.name || "").match(NAME_ORDER_PREFIX_PATTERN);

  if (nameMatch) {
    return `${Number.parseInt(nameMatch[1], 10)}${(nameMatch[2] || "").toLowerCase()}`;
  }

  return String(exerciseIndex + 1);
}

export function getExerciseDisplayName(exercise = {}) {
  return String(exercise?.name || "").replace(NAME_ORDER_PREFIX_PATTERN, "").trim();
}

export function getExerciseSupersetKey(exercise = {}, exerciseIndex = 0) {
  const orderLabel = getExerciseOrderLabel(exercise, exerciseIndex);
  const match = orderLabel.match(/^(\d+)[a-z]$/i);

  return match ? match[1] : "";
}

export function buildExerciseSessionSteps(exercises = []) {
  const safeExercises = Array.isArray(exercises) ? exercises : [];
  const groups = [];

  safeExercises.forEach((exercise, exerciseIndex) => {
    const supersetKey = getExerciseSupersetKey(exercise, exerciseIndex);
    const previousGroup = groups[groups.length - 1];
    const item = { exercise, exerciseIndex, supersetKey };

    if (supersetKey && previousGroup?.supersetKey === supersetKey) {
      previousGroup.items.push(item);
      return;
    }

    groups.push({
      supersetKey,
      items: [item],
    });
  });

  return groups.flatMap((group) => {
    const isSuperset = Boolean(group.supersetKey && group.items.length > 1);

    if (!isSuperset) {
      const item = group.items[0];
      return Array.from({ length: getPrescribedSetCount(item.exercise) }).map(
        (_, setIndex) => ({ ...item, setIndex })
      );
    }

    const maxSetCount = Math.max(
      ...group.items.map(({ exercise }) => getPrescribedSetCount(exercise))
    );

    return Array.from({ length: maxSetCount }).flatMap((_, setIndex) =>
      group.items
        .filter(({ exercise }) => setIndex < getPrescribedSetCount(exercise))
        .map((item) => ({ ...item, setIndex }))
    );
  });
}
