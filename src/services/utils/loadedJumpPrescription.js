const DEFAULT_MIN_PERCENT_BODY_MASS = 30;
const DEFAULT_MAX_PERCENT_BODY_MASS = 60;

function normalizeExerciseName(name = "") {
  return String(name || "")
    .toLowerCase()
    .replace(/^\s*\d+[a-z]?[.)]?\s*/i, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isLoadedJumpExerciseName(name = "") {
  const normalizedName = normalizeExerciseName(name);

  if (!normalizedName || /\bbody\s*weight\b/.test(normalizedName)) {
    return false;
  }

  const isExplicitSquatJump = /\bback squat jumps?\b/.test(normalizedName);
  const hasJump = /\bjumps?\b/.test(normalizedName);
  const hasExternalLoad =
    /\b(?:trap bar|hex bar|barbell|dumbbells?|kettlebells?|smith machine|weight vest|weighted|loaded)\b/.test(
      normalizedName
    );

  return isExplicitSquatJump || (hasJump && hasExternalLoad);
}

function normalizePercent(value, fallback) {
  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export function normalizeBodyMassLoadPrescription(prescription = {}) {
  const safePrescription =
    prescription && typeof prescription === "object" && !Array.isArray(prescription)
      ? prescription
      : {};
  const minPercent = normalizePercent(
    safePrescription.minPercent ?? safePrescription.minimumPercent,
    DEFAULT_MIN_PERCENT_BODY_MASS
  );
  const maxPercent = Math.max(
    minPercent,
    normalizePercent(
      safePrescription.maxPercent ?? safePrescription.maximumPercent,
      DEFAULT_MAX_PERCENT_BODY_MASS
    )
  );

  return {
    minPercent,
    maxPercent,
    loadIncludes: "bar + plates",
  };
}

export function getLoadedJumpPrescription(exercise = {}) {
  if (!isLoadedJumpExerciseName(exercise?.name)) {
    return null;
  }

  return normalizeBodyMassLoadPrescription(exercise?.bodyMassLoadPrescription);
}

export function formatBodyMassLoadRange(prescription = {}) {
  const normalizedPrescription = normalizeBodyMassLoadPrescription(prescription);
  const { minPercent, maxPercent } = normalizedPrescription;

  return minPercent === maxPercent
    ? `${minPercent}% BM`
    : `${minPercent}\u2013${maxPercent}% BM`;
}
