const DEFAULT_SET_COUNT = 1;
const MAX_SET_COUNT = 12;

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(String(value ?? "").trim(), 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
}

function getPercentageWorkingSetCount(exercise = {}) {
  const workingSets = Array.isArray(exercise?.percentagePrescription?.workingSets)
    ? exercise.percentagePrescription.workingSets
    : [];

  return workingSets.reduce(
    (totalCount, workingSet) =>
      totalCount + (parsePositiveInteger(workingSet?.count ?? workingSet?.sets) || 1),
    0
  );
}

export function getPrescribedSetCount(exercise = {}, maxSetCount = MAX_SET_COUNT) {
  const explicitSetCount = parsePositiveInteger(exercise?.sets);
  const percentageSetCount = getPercentageWorkingSetCount(exercise);
  const sprintSetCount = parsePositiveInteger(exercise?.sprintPrescription?.sets);
  const resolvedSetCount =
    explicitSetCount || percentageSetCount || sprintSetCount || DEFAULT_SET_COUNT;

  return Math.min(resolvedSetCount, maxSetCount);
}

export function getExerciseSetDisplayValue(exercise = {}) {
  const explicitSets = String(exercise?.sets || "").trim();

  if (explicitSets && parsePositiveInteger(explicitSets)) {
    return explicitSets;
  }

  const percentageSetCount = getPercentageWorkingSetCount(exercise);

  if (percentageSetCount > 0) {
    return String(percentageSetCount);
  }

  const sprintSets = String(exercise?.sprintPrescription?.sets || "").trim();

  return parsePositiveInteger(sprintSets) ? sprintSets : "";
}
