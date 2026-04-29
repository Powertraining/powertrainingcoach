const STRENGTH_ASSESSMENT_METHODS = Object.freeze({
  TRUE_1RM: "true_1rm",
  MULTI_RM: "multi_rm",
  HEAVY_SINGLE: "heavy_single",
});

const VALID_STRENGTH_ASSESSMENT_METHODS = new Set(
  Object.values(STRENGTH_ASSESSMENT_METHODS)
);

const DEFAULT_STRENGTH_ASSESSMENT_METHOD =
  STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE;
const DEFAULT_TRAINING_MAX_BUFFER = 0.975;
const RECENT_ASSESSMENT_LIMIT = 8;
const CLOSE_GRIP_BENCH_PRESS_REFERENCE_FACTOR = 0.95;
const BENCH_PRESS_LIFT_KEYS = Object.freeze([
  "bench_press",
  "barbell_bench_press",
]);
const CLOSE_GRIP_BENCH_PRESS_LIFT_KEYS = Object.freeze([
  "close_grip_bench_press",
  "close_grip_bench",
  "narrow_grip_bench_press",
  "narrow_grip_bench",
]);

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

function parsePositiveNumber(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseExerciseIndex(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function roundToTenth(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function sortAssessmentEntries(left = {}, right = {}) {
  const leftTimestamp = Date.parse(left.performedAt || "") || 0;
  const rightTimestamp = Date.parse(right.performedAt || "") || 0;

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  const leftWeek = parsePositiveInteger(left.weekNumber) || 0;
  const rightWeek = parsePositiveInteger(right.weekNumber) || 0;
  if (leftWeek !== rightWeek) {
    return leftWeek - rightWeek;
  }

  const leftDay = parsePositiveInteger(left.dayNumber) || 0;
  const rightDay = parsePositiveInteger(right.dayNumber) || 0;
  if (leftDay !== rightDay) {
    return leftDay - rightDay;
  }

  return (parseExerciseIndex(left.exerciseIndex) || 0) -
    (parseExerciseIndex(right.exerciseIndex) || 0);
}

function toLiftKey(value, fallback = "main_lift") {
  const normalizedValue = normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedValue || fallback;
}

function buildDefaultPrompt(method, liftName) {
  const resolvedLiftName = normalizeString(liftName, "this lift");

  switch (method) {
    case STRENGTH_ASSESSMENT_METHODS.TRUE_1RM:
      return `Log the heaviest successful single for ${resolvedLiftName} so future % work can use the updated max.`;
    case STRENGTH_ASSESSMENT_METHODS.MULTI_RM:
      return `Log the load and exact reps for the top 2-5RM set on ${resolvedLiftName} so the app can estimate your 1RM with Epley.`;
    case STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE:
    default:
      return `Log the load and RPE for the heavy single on ${resolvedLiftName} so the app can update your future % work.`;
  }
}

function clampRelativeChange(candidateTrainingMaxKg, previousTrainingMaxKg, maxDeltaPercent) {
  if (!Number.isFinite(candidateTrainingMaxKg) || !Number.isFinite(previousTrainingMaxKg)) {
    return candidateTrainingMaxKg;
  }

  if (previousTrainingMaxKg <= 0 || maxDeltaPercent <= 0) {
    return candidateTrainingMaxKg;
  }

  const maxDelta = previousTrainingMaxKg * (maxDeltaPercent / 100);
  const minimum = previousTrainingMaxKg - maxDelta;
  const maximum = previousTrainingMaxKg + maxDelta;

  return Math.min(Math.max(candidateTrainingMaxKg, minimum), maximum);
}

function getHeavySingleMultiplier(rpe) {
  const normalizedRpe = Math.min(Math.max(rpe, 7), 10);
  return 1 - (10 - normalizedRpe) * 0.025;
}

function calculateEstimatedOneRepMax(method, { loadKg, reps, rpe }) {
  switch (method) {
    case STRENGTH_ASSESSMENT_METHODS.TRUE_1RM:
      return loadKg;
    case STRENGTH_ASSESSMENT_METHODS.MULTI_RM:
      return loadKg * (1 + reps / 30);
    case STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE:
    default:
      return loadKg / getHeavySingleMultiplier(rpe);
  }
}

function calculateTrainingMax(method, estimatedOneRepMaxKg, previousTrainingMaxKg = null) {
  const baseTrainingMax = estimatedOneRepMaxKg * DEFAULT_TRAINING_MAX_BUFFER;

  if (!Number.isFinite(previousTrainingMaxKg) || previousTrainingMaxKg <= 0) {
    return roundToTenth(baseTrainingMax);
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM) {
    return roundToTenth(baseTrainingMax);
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM) {
    return roundToTenth(
      clampRelativeChange(baseTrainingMax, previousTrainingMaxKg, 7.5)
    );
  }

  const differencePercent =
    ((baseTrainingMax - previousTrainingMaxKg) / previousTrainingMaxKg) * 100;
  const absoluteDifferencePercent = Math.abs(differencePercent);

  if (absoluteDifferencePercent <= 2.5) {
    return roundToTenth(baseTrainingMax);
  }

  if (absoluteDifferencePercent <= 7.5) {
    return roundToTenth(
      clampRelativeChange(baseTrainingMax, previousTrainingMaxKg, 5)
    );
  }

  return roundToTenth(
    clampRelativeChange(baseTrainingMax, previousTrainingMaxKg, 7.5)
  );
}

function normalizeStrengthAssessmentEntry(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const method = normalizeStrengthAssessmentMethod(safeSource.method);

  if (!method) {
    return null;
  }

  const liftName = normalizeString(safeSource.liftName);
  const loadKg = parsePositiveNumber(safeSource.loadKg);
  const estimatedOneRepMaxKg = parsePositiveNumber(
    safeSource.estimatedOneRepMaxKg
  );
  const trainingMaxKg = parsePositiveNumber(safeSource.trainingMaxKg);

  if (!liftName || !loadKg || !estimatedOneRepMaxKg || !trainingMaxKg) {
    return null;
  }

  return {
    sessionKey: normalizeString(safeSource.sessionKey),
    weekNumber: parsePositiveInteger(safeSource.weekNumber),
    dayNumber: parsePositiveInteger(safeSource.dayNumber),
    exerciseIndex: parseExerciseIndex(safeSource.exerciseIndex),
    liftKey: normalizeString(safeSource.liftKey, toLiftKey(liftName)),
    liftName,
    sourceExerciseName: normalizeString(safeSource.sourceExerciseName, liftName),
    method,
    loadKg: roundToTenth(loadKg),
    reps: parsePositiveInteger(safeSource.reps),
    rpe: parsePositiveNumber(safeSource.rpe),
    estimatedOneRepMaxKg: roundToTenth(estimatedOneRepMaxKg),
    trainingMaxKg: roundToTenth(trainingMaxKg),
    performedAt: normalizeString(safeSource.performedAt),
    prompt: normalizeString(safeSource.prompt),
  };
}

function buildStateFromSessionResults(sessionResults = {}) {
  const nextSessionResults = {};

  Object.entries(sessionResults).forEach(([sessionKey, entries]) => {
    const normalizedEntries = Array.isArray(entries)
      ? entries
          .map((entry) =>
            normalizeStrengthAssessmentEntry({
              ...entry,
              sessionKey: normalizeString(entry?.sessionKey, sessionKey),
            })
          )
          .filter(Boolean)
          .sort(sortAssessmentEntries)
      : [];

    if (normalizedEntries.length > 0) {
      nextSessionResults[sessionKey] = normalizedEntries;
    }
  });

  const history = Object.values(nextSessionResults)
    .flat()
    .sort(sortAssessmentEntries);
  const latestByLift = {};

  history.forEach((entry) => {
    latestByLift[entry.liftKey] = entry;
  });

  return {
    sessionResults: nextSessionResults,
    history,
    latestByLift,
  };
}

export function normalizeStrengthAssessmentMethod(
  value,
  fallback = ""
) {
  return VALID_STRENGTH_ASSESSMENT_METHODS.has(value) ? value : fallback;
}

export function getStrengthAssessmentMethodLabel(method) {
  switch (normalizeStrengthAssessmentMethod(method)) {
    case STRENGTH_ASSESSMENT_METHODS.TRUE_1RM:
      return "True 1RM test";
    case STRENGTH_ASSESSMENT_METHODS.MULTI_RM:
      return "2-5RM + Epley";
    case STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE:
      return "Heavy single @RPE 8-9";
    default:
      return "";
  }
}

export function getStrengthAssessmentRequirements(method) {
  const normalizedMethod = normalizeStrengthAssessmentMethod(
    method,
    DEFAULT_STRENGTH_ASSESSMENT_METHOD
  );

  return {
    requiresLoad: true,
    requiresReps: normalizedMethod === STRENGTH_ASSESSMENT_METHODS.MULTI_RM,
    requiresRpe: normalizedMethod === STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE,
    loadLabel:
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM ?
        "Heaviest successful single (kg)" :
        "Load used (kg)",
    repsLabel: "Reps completed",
    rpeLabel: "RPE",
  };
}

export function normalizeStrengthAssessmentConfig(
  source = {},
  fallbackLiftName = ""
) {
  if (!isPlainObject(source)) {
    return null;
  }

  const method = normalizeStrengthAssessmentMethod(source.method);
  if (!method) {
    return null;
  }

  const liftName = normalizeString(
    source.liftName,
    normalizeString(source.lift, fallbackLiftName)
  );

  return {
    method,
    liftName,
    prompt: normalizeString(source.prompt, buildDefaultPrompt(method, liftName)),
  };
}

export function getStrengthAssessmentLiftKey(liftName = "", fallback = "main_lift") {
  return toLiftKey(liftName, fallback);
}

export function getStrengthAssessmentReferenceOneRepMaxKg(entry = {}) {
  const estimatedOneRepMaxKg = parsePositiveNumber(entry?.estimatedOneRepMaxKg);

  if (estimatedOneRepMaxKg) {
    return roundToTenth(estimatedOneRepMaxKg);
  }

  const trainingMaxKg = parsePositiveNumber(entry?.trainingMaxKg);

  return trainingMaxKg ?
    roundToTenth(trainingMaxKg / DEFAULT_TRAINING_MAX_BUFFER) :
    null;
}

export function resolveStrengthAssessmentReferenceOneRepMaxKg(
  liftName = "",
  referenceOneRepMaxByLift = {}
) {
  const liftKey = getStrengthAssessmentLiftKey(liftName, "");
  const directReference = parsePositiveNumber(referenceOneRepMaxByLift?.[liftKey]);

  if (directReference) {
    return {
      oneRepMaxKg: roundToTenth(directReference),
      source: "direct",
      sourceLiftName: liftName,
      estimateFactor: null,
    };
  }

  if (CLOSE_GRIP_BENCH_PRESS_LIFT_KEYS.includes(liftKey)) {
    for (const benchLiftKey of BENCH_PRESS_LIFT_KEYS) {
      const benchReference = parsePositiveNumber(
        referenceOneRepMaxByLift?.[benchLiftKey]
      );

      if (benchReference) {
        return {
          oneRepMaxKg: roundToTenth(
            benchReference * CLOSE_GRIP_BENCH_PRESS_REFERENCE_FACTOR
          ),
          source: "estimated_from_bench_press",
          sourceLiftName: "Bench Press",
          estimateFactor: CLOSE_GRIP_BENCH_PRESS_REFERENCE_FACTOR,
        };
      }
    }
  }

  return {
    oneRepMaxKg: null,
    source: "",
    sourceLiftName: "",
    estimateFactor: null,
  };
}

export function createDefaultStrengthAssessmentState() {
  return {
    sessionResults: {},
    history: [],
    latestByLift: {},
  };
}

export function createStrengthAssessmentEntry({
  metadata,
  result,
  previousTrainingMaxKg = null,
  sessionKey = "",
  weekNumber = null,
  dayNumber = null,
  exerciseIndex = null,
  sourceExerciseName = "",
  performedAt = new Date().toISOString(),
} = {}) {
  const normalizedMetadata = normalizeStrengthAssessmentConfig(metadata);
  const safeResult = result && typeof result === "object" ? result : {};

  if (!normalizedMetadata) {
    return null;
  }

  const loadKg = parsePositiveNumber(
    safeResult.loadKg ?? safeResult.load ?? safeResult.weightKg ?? safeResult.weight
  );

  if (!loadKg) {
    return null;
  }

  const reps =
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM ?
      parsePositiveInteger(safeResult.reps) :
      1;
  const rpe =
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE ?
      parsePositiveNumber(safeResult.rpe) :
      null;

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM &&
    !reps
  ) {
    return null;
  }

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.HEAVY_SINGLE &&
    !rpe
  ) {
    return null;
  }

  const estimatedOneRepMaxKg = roundToTenth(
    calculateEstimatedOneRepMax(normalizedMetadata.method, {
      loadKg,
      reps,
      rpe,
    })
  );

  if (!estimatedOneRepMaxKg) {
    return null;
  }

  return {
    sessionKey: normalizeString(sessionKey),
    weekNumber: parsePositiveInteger(weekNumber),
    dayNumber: parsePositiveInteger(dayNumber),
    exerciseIndex: parseExerciseIndex(exerciseIndex),
    liftKey: toLiftKey(normalizedMetadata.liftName),
    liftName: normalizedMetadata.liftName,
    sourceExerciseName: normalizeString(
      sourceExerciseName,
      normalizedMetadata.liftName
    ),
    method: normalizedMetadata.method,
    loadKg: roundToTenth(loadKg),
    reps,
    rpe: rpe ? roundToTenth(rpe) : null,
    estimatedOneRepMaxKg,
    trainingMaxKg: calculateTrainingMax(
      normalizedMetadata.method,
      estimatedOneRepMaxKg,
      parsePositiveNumber(previousTrainingMaxKg)
    ),
    performedAt: normalizeString(performedAt, new Date().toISOString()),
    prompt: normalizedMetadata.prompt,
  };
}

export function normalizeStrengthAssessmentState(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const hasSessionResults = isPlainObject(safeSource.sessionResults);

  if (hasSessionResults) {
    return buildStateFromSessionResults(safeSource.sessionResults);
  }

  const fallbackHistory = Array.isArray(safeSource.history) ?
    safeSource.history.map(normalizeStrengthAssessmentEntry).filter(Boolean) :
    [];

  if (fallbackHistory.length === 0) {
    return createDefaultStrengthAssessmentState();
  }

  const fallbackSessionResults = fallbackHistory.reduce((accumulator, entry) => {
    const sessionKey = normalizeString(
      entry.sessionKey,
      `${entry.weekNumber || 0}-${entry.dayNumber || 0}`
    );

    accumulator[sessionKey] = [...(accumulator[sessionKey] || []), entry];
    return accumulator;
  }, {});

  return buildStateFromSessionResults(fallbackSessionResults);
}

export function getStrengthAssessmentSessionResults(state = {}, sessionKey = "") {
  const normalizedState = normalizeStrengthAssessmentState(state);
  return Array.isArray(normalizedState.sessionResults[sessionKey]) ?
    normalizedState.sessionResults[sessionKey] :
    [];
}

export function upsertStrengthAssessmentSessionResults(
  state = {},
  sessionKey = "",
  entries = []
) {
  const normalizedSessionKey = normalizeString(sessionKey);
  const normalizedState = normalizeStrengthAssessmentState(state);
  const nextSessionResults = {
    ...normalizedState.sessionResults,
  };
  const normalizedEntries = Array.isArray(entries)
    ? entries.map(normalizeStrengthAssessmentEntry).filter(Boolean)
    : [];

  if (!normalizedSessionKey) {
    return normalizedState;
  }

  if (normalizedEntries.length > 0) {
    nextSessionResults[normalizedSessionKey] = normalizedEntries;
  } else {
    delete nextSessionResults[normalizedSessionKey];
  }

  return buildStateFromSessionResults(nextSessionResults);
}

export function getStrengthAssessmentSummary(state = {}) {
  const normalizedState = normalizeStrengthAssessmentState(state);
  const latestByLift = Object.values(normalizedState.latestByLift).sort(
    (left, right) => left.liftName.localeCompare(right.liftName)
  );

  return {
    latestByLift,
    recentAssessments: normalizedState.history.slice(-RECENT_ASSESSMENT_LIMIT),
  };
}
