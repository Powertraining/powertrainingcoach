const VALID_LOADING_STRATEGIES = new Set([
  "flat_loading",
  "ascending_pyramid",
  "descending_pyramid",
  "double_pyramid",
]);

export const RELATIVE_INTENSITY_ALPHA_BY_REPS = Object.freeze({
  1: 1,
  2: 0.95,
  3: 0.925,
  4: 0.9,
  5: 0.875,
  6: 0.85,
  7: 0.825,
  8: 0.8,
  9: 0.775,
  10: 0.75,
});

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parsePositiveNumber(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function roundToTenth(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

export function getRelativeIntensityAlpha(reps) {
  const parsedReps = parsePositiveInteger(reps);
  return parsedReps ? RELATIVE_INTENSITY_ALPHA_BY_REPS[parsedReps] || null : null;
}

export function calculateRelativeIntensityFromPercentOneRepMax(
  percent1RM,
  reps
) {
  const alpha = getRelativeIntensityAlpha(reps);
  const normalizedPercent = parsePositiveNumber(percent1RM);

  if (!alpha || !normalizedPercent) {
    return null;
  }

  return roundToTenth(normalizedPercent / alpha);
}

export function calculatePercentOneRepMaxFromRelativeIntensity(
  relativeIntensity,
  reps
) {
  const alpha = getRelativeIntensityAlpha(reps);
  const normalizedRelativeIntensity = parsePositiveNumber(relativeIntensity);

  if (!alpha || !normalizedRelativeIntensity) {
    return null;
  }

  return roundToTenth(normalizedRelativeIntensity * alpha);
}

export function calculateTargetLoadFromPercentOneRepMax(
  oneRepMaxKg,
  percent1RM
) {
  const normalizedOneRepMaxKg = parsePositiveNumber(oneRepMaxKg);
  const normalizedPercent = parsePositiveNumber(percent1RM);

  if (!normalizedOneRepMaxKg || !normalizedPercent) {
    return null;
  }

  return roundToTenth(normalizedOneRepMaxKg * (normalizedPercent / 100));
}

function normalizePercentageWorkingSet(source = {}) {
  if (!isPlainObject(source)) {
    return null;
  }

  const reps = parsePositiveInteger(source.reps);
  const explicitPercent = parsePositiveNumber(
    source.percent1RM ?? source.percent ?? source.intensity
  );
  const explicitRelativeIntensity = parsePositiveNumber(
    source.relativeIntensity ?? source.ri ?? source.RI
  );
  const percent1RM =
    explicitPercent ||
    calculatePercentOneRepMaxFromRelativeIntensity(explicitRelativeIntensity, reps);

  if (!reps || !percent1RM) {
    return null;
  }

  return {
    count: parsePositiveInteger(source.count ?? source.sets) || 1,
    reps,
    percent1RM: roundToTenth(percent1RM),
    relativeIntensity:
      calculateRelativeIntensityFromPercentOneRepMax(percent1RM, reps) ||
      roundToTenth(explicitRelativeIntensity),
  };
}

export function normalizeLoadingStrategy(value, fallback = "") {
  return VALID_LOADING_STRATEGIES.has(value) ? value : fallback;
}

export function normalizePercentagePrescription(
  source = {},
  fallbackLiftName = ""
) {
  if (!isPlainObject(source)) {
    return null;
  }

  const workingSetsSource = Array.isArray(source.workingSets) ?
    source.workingSets :
    Array.isArray(source.workSets) ?
      source.workSets :
      Array.isArray(source.sets) ?
        source.sets :
        [];
  const workingSets = workingSetsSource
    .map((workingSet) => normalizePercentageWorkingSet(workingSet))
    .filter(Boolean);

  if (workingSets.length === 0) {
    return null;
  }

  return {
    referenceLiftName: normalizeString(
      source.referenceLiftName,
      normalizeString(
        source.liftName,
        normalizeString(source.referenceLift, fallbackLiftName)
      )
    ),
    loadingStrategy: normalizeLoadingStrategy(
      source.loadingStrategy,
      normalizeLoadingStrategy(source.strategy, normalizeLoadingStrategy(source.scheme))
    ),
    workingSets,
  };
}
