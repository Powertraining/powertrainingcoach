const PERFORMANCE_TRACKING_STRATEGIES = Object.freeze({
  E1RM: "e1rm",
  BEST_SET: "best_set",
  FIXED_RPE: "fixed_rpe",
});

const VALID_PERFORMANCE_TRACKING_STRATEGIES = new Set(
  Object.values(PERFORMANCE_TRACKING_STRATEGIES)
);

const RECENT_PERFORMANCE_LIMIT = 12;

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

function parseSignedNumber(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
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

function toLiftKey(value, fallback = "main_lift") {
  const normalizedValue = normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedValue || fallback;
}

function sortPerformanceEntries(left = {}, right = {}) {
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

function parseRpeFromText(value = "") {
  const normalizedValue = normalizeString(value);
  const match = normalizedValue.match(/RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*(\d+(?:\.\d+)?))?/i);

  if (!match) {
    return null;
  }

  const low = parsePositiveNumber(match[1]);
  const high = parsePositiveNumber(match[2]);

  if (!low) {
    return null;
  }

  return roundToTenth(high ? (low + high) / 2 : low);
}

function parseRepTargetFromText(value = "") {
  const normalizedValue = normalizeString(value);
  const match = normalizedValue.match(/\d+/);

  return match ? parsePositiveInteger(match[0]) : null;
}

function getPrimaryWorkingSet(percentagePrescription = {}) {
  const workingSets = Array.isArray(percentagePrescription?.workingSets)
    ? percentagePrescription.workingSets
    : [];

  return workingSets.reduce((bestSet, currentSet) => {
    if (!bestSet) {
      return currentSet;
    }

    return (currentSet?.percent1RM || 0) >= (bestSet?.percent1RM || 0) ?
      currentSet :
      bestSet;
  }, null);
}

function inferPerformanceTargetFromExercise(exercise = {}, fallbackLiftName = "") {
  const percentagePrescription =
    exercise?.percentagePrescription && typeof exercise.percentagePrescription === "object" ?
      exercise.percentagePrescription :
      null;
  const strengthAssessment =
    exercise?.strengthAssessment && typeof exercise.strengthAssessment === "object" ?
      exercise.strengthAssessment :
      null;
  const primaryWorkingSet = getPrimaryWorkingSet(percentagePrescription);
  const repTarget =
    primaryWorkingSet?.reps ||
    parseRepTargetFromText(exercise?.reps) ||
    null;
  const targetRpe = parseRpeFromText(exercise?.notes);
  const liftName =
    normalizeString(percentagePrescription?.referenceLiftName) ||
    normalizeString(strengthAssessment?.liftName) ||
    fallbackLiftName;

  if (targetRpe && repTarget) {
    return {
      strategy: PERFORMANCE_TRACKING_STRATEGIES.FIXED_RPE,
      liftName,
      repTarget,
      targetRpe,
    };
  }

  if (strengthAssessment || percentagePrescription) {
    return {
      strategy: PERFORMANCE_TRACKING_STRATEGIES.E1RM,
      liftName,
      repTarget,
      targetRpe,
    };
  }

  return null;
}

function buildDefaultPrompt({
  strategy,
  liftName,
  repTarget,
  targetRpe,
}) {
  const resolvedLiftName = normalizeString(liftName, "this lift");

  switch (strategy) {
    case PERFORMANCE_TRACKING_STRATEGIES.FIXED_RPE:
      return `Log the top set load, reps, and RPE for ${resolvedLiftName} so the app can track load at roughly RPE ${targetRpe || "target"} for ${repTarget || "the planned"} reps.`;
    case PERFORMANCE_TRACKING_STRATEGIES.BEST_SET:
      return `Log the best top set on ${resolvedLiftName} so the app can track your best load at ${repTarget || "the planned"} reps.`;
    case PERFORMANCE_TRACKING_STRATEGIES.E1RM:
    default:
      return `Log the top set load, reps, and RPE for ${resolvedLiftName} so the app can estimate e1RM trend and compare effort week to week.`;
  }
}

export function normalizePerformanceTrackingStrategy(value, fallback = "") {
  return VALID_PERFORMANCE_TRACKING_STRATEGIES.has(value) ? value : fallback;
}

export function normalizePerformanceTarget(
  source = {},
  fallbackLiftName = "",
  fallbackExercise = {}
) {
  const explicitSource = isPlainObject(source) ? source : {};
  const inferredTarget = inferPerformanceTargetFromExercise(
    fallbackExercise,
    fallbackLiftName
  );
  const explicitStrategy = normalizePerformanceTrackingStrategy(explicitSource.strategy);
  const repTarget =
    parsePositiveInteger(explicitSource.repTarget) ||
    parsePositiveInteger(explicitSource.reps) ||
    inferredTarget?.repTarget ||
    null;
  const targetRpe =
    parsePositiveNumber(explicitSource.targetRpe) ||
    parsePositiveNumber(explicitSource.rpe) ||
    inferredTarget?.targetRpe ||
    null;
  const strategy =
    explicitStrategy ||
    (targetRpe && repTarget ? PERFORMANCE_TRACKING_STRATEGIES.FIXED_RPE : "") ||
    inferredTarget?.strategy ||
    (repTarget ? PERFORMANCE_TRACKING_STRATEGIES.BEST_SET : "");
  const liftName =
    normalizeString(
      explicitSource.liftName,
      normalizeString(explicitSource.referenceLift, inferredTarget?.liftName || fallbackLiftName)
    );

  if (!strategy || !liftName) {
    return null;
  }

  return {
    strategy,
    liftName,
    repTarget,
    targetRpe: targetRpe ? roundToTenth(targetRpe) : null,
    prompt: normalizeString(
      explicitSource.prompt,
      buildDefaultPrompt({
        strategy,
        liftName,
        repTarget,
        targetRpe,
      })
    ),
  };
}

function getRirFromRpe(rpe) {
  const normalizedRpe = parsePositiveNumber(rpe);

  if (!normalizedRpe) {
    return 0;
  }

  return Math.max(0, Math.min(4, 10 - normalizedRpe));
}

function calculateEstimatedOneRepMaxKg({ loadKg, reps, rpe }) {
  const normalizedLoadKg = parsePositiveNumber(loadKg);
  const normalizedReps = parsePositiveInteger(reps);

  if (!normalizedLoadKg || !normalizedReps) {
    return null;
  }

  const effectiveReps = normalizedReps + getRirFromRpe(rpe);
  return roundToTenth(normalizedLoadKg * (1 + effectiveReps / 30));
}

function normalizePerformanceEntry(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const strategy = normalizePerformanceTrackingStrategy(safeSource.strategy);
  const liftName = normalizeString(safeSource.liftName);
  const loadKg = parsePositiveNumber(safeSource.loadKg);
  const reps = parsePositiveInteger(safeSource.reps);
  const targetRpe = parsePositiveNumber(safeSource.targetRpe);
  const rpe = parsePositiveNumber(safeSource.rpe);

  if (!strategy || !liftName || !loadKg || !reps) {
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
    strategy,
    repTarget: parsePositiveInteger(safeSource.repTarget),
    targetRpe,
    loadKg: roundToTenth(loadKg),
    reps,
    rpe,
    estimatedOneRepMaxKg: calculateEstimatedOneRepMaxKg({
      loadKg,
      reps,
      rpe: safeSource.rpe,
    }),
    metricValueKg: parsePositiveNumber(safeSource.metricValueKg),
    rpeDrift: roundToTenth(
      rpe != null && targetRpe != null ? rpe - targetRpe : parseSignedNumber(safeSource.rpeDrift)
    ),
    prompt: normalizeString(safeSource.prompt),
    performedAt: normalizeString(safeSource.performedAt),
  };
}

function buildStateFromSessionResults(sessionResults = {}) {
  const nextSessionResults = {};

  Object.entries(sessionResults).forEach(([sessionKey, entries]) => {
    const normalizedEntries = Array.isArray(entries) ?
      entries
        .map((entry) =>
          normalizePerformanceEntry({
            ...entry,
            sessionKey: normalizeString(entry?.sessionKey, sessionKey),
          })
        )
        .filter(Boolean)
        .sort(sortPerformanceEntries) :
      [];

    if (normalizedEntries.length > 0) {
      nextSessionResults[sessionKey] = normalizedEntries;
    }
  });

  const history = Object.values(nextSessionResults).flat().sort(sortPerformanceEntries);
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

export function getTrainingPerformanceLiftKey(liftName = "", fallback = "main_lift") {
  return toLiftKey(liftName, fallback);
}

export function createDefaultTrainingPerformanceState() {
  return {
    sessionResults: {},
    history: [],
    latestByLift: {},
  };
}

export function createTrainingPerformanceEntry({
  metadata,
  result,
  sessionKey = "",
  weekNumber = null,
  dayNumber = null,
  exerciseIndex = null,
  sourceExerciseName = "",
  performedAt = new Date().toISOString(),
} = {}) {
  const normalizedMetadata = normalizePerformanceTarget(metadata);
  const safeResult = result && typeof result === "object" ? result : {};

  if (!normalizedMetadata) {
    return null;
  }

  const loadKg = parsePositiveNumber(
    safeResult.loadKg ?? safeResult.load ?? safeResult.weightKg ?? safeResult.weight
  );
  const reps = parsePositiveInteger(safeResult.reps);
  const rpe = parsePositiveNumber(safeResult.rpe);

  if (!loadKg || !reps) {
    return null;
  }

  const estimatedOneRepMaxKg = calculateEstimatedOneRepMaxKg({
    loadKg,
    reps,
    rpe,
  });
  let metricValueKg = null;

  switch (normalizedMetadata.strategy) {
    case PERFORMANCE_TRACKING_STRATEGIES.BEST_SET:
      metricValueKg =
        !normalizedMetadata.repTarget || normalizedMetadata.repTarget === reps ?
          roundToTenth(loadKg) :
          null;
      break;
    case PERFORMANCE_TRACKING_STRATEGIES.FIXED_RPE:
      metricValueKg =
        (!normalizedMetadata.repTarget || normalizedMetadata.repTarget === reps) &&
        rpe ?
          roundToTenth(loadKg) :
          null;
      break;
    case PERFORMANCE_TRACKING_STRATEGIES.E1RM:
    default:
      metricValueKg = estimatedOneRepMaxKg;
      break;
  }

  return normalizePerformanceEntry({
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
    strategy: normalizedMetadata.strategy,
    repTarget: normalizedMetadata.repTarget,
    targetRpe: normalizedMetadata.targetRpe,
    loadKg,
    reps,
    rpe,
    estimatedOneRepMaxKg,
    metricValueKg,
    prompt: normalizedMetadata.prompt,
    performedAt: normalizeString(performedAt, new Date().toISOString()),
  });
}

export function normalizeTrainingPerformanceState(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const hasSessionResults = isPlainObject(safeSource.sessionResults);

  if (hasSessionResults) {
    return buildStateFromSessionResults(safeSource.sessionResults);
  }

  const fallbackHistory = Array.isArray(safeSource.history) ?
    safeSource.history.map(normalizePerformanceEntry).filter(Boolean) :
    [];

  if (fallbackHistory.length === 0) {
    return createDefaultTrainingPerformanceState();
  }

  const fallbackSessionResults = fallbackHistory.reduce((accumulator, entry) => {
    const normalizedSessionKey = normalizeString(
      entry.sessionKey,
      `${entry.weekNumber || 0}-${entry.dayNumber || 0}`
    );

    accumulator[normalizedSessionKey] = [
      ...(accumulator[normalizedSessionKey] || []),
      entry,
    ];
    return accumulator;
  }, {});

  return buildStateFromSessionResults(fallbackSessionResults);
}

export function getTrainingPerformanceSessionResults(state = {}, sessionKey = "") {
  const normalizedState = normalizeTrainingPerformanceState(state);
  return Array.isArray(normalizedState.sessionResults[sessionKey]) ?
    normalizedState.sessionResults[sessionKey] :
    [];
}

export function upsertTrainingPerformanceSessionResults(
  state = {},
  sessionKey = "",
  entries = []
) {
  const normalizedSessionKey = normalizeString(sessionKey);
  const normalizedState = normalizeTrainingPerformanceState(state);
  const nextSessionResults = {
    ...normalizedState.sessionResults,
  };
  const normalizedEntries = Array.isArray(entries) ?
    entries.map(normalizePerformanceEntry).filter(Boolean) :
    [];

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

export function getTrainingPerformanceSummary(state = {}) {
  const normalizedState = normalizeTrainingPerformanceState(state);
  const latestByLift = Object.values(normalizedState.latestByLift).sort(
    (left, right) => left.liftName.localeCompare(right.liftName)
  );

  return {
    latestByLift,
    recentPerformances: normalizedState.history.slice(-RECENT_PERFORMANCE_LIMIT),
  };
}
