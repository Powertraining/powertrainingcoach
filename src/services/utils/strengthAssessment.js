import {
  kilogramsToPounds,
  poundsToKilograms,
} from "./measurementUnits.js";

const STRENGTH_ASSESSMENT_METHODS = Object.freeze({
  TRUE_1RM: "true_1rm",
  MULTI_RM: "multi_rm",
  RPE_BASED_1RM: "rpe_based_1rm",
  MANUAL_1RM: "manual_1rm",
});

const VALID_STRENGTH_ASSESSMENT_METHODS = new Set(
  Object.values(STRENGTH_ASSESSMENT_METHODS)
);
const LEGACY_STRENGTH_ASSESSMENT_METHODS = Object.freeze({
  heavy_single: STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM,
});

const DEFAULT_STRENGTH_ASSESSMENT_METHOD =
  STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM;
const DEFAULT_TRAINING_MAX_BUFFER = 0.9;
const METRIC_PROGRAM_MAX_INCREMENT_KG = 2.5;
const IMPERIAL_PROGRAM_MAX_INCREMENT_LB = 5;
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

function parseRpeLowerBound(value) {
  const match = normalizeString(value).match(
    /(?:@\s*)?RPE\s*(\d+(?:\.\d+)?)(?:\s*[–-]\s*\d+(?:\.\d+)?)?/i
  );

  return match ? parsePositiveNumber(match[1]) : null;
}

function parseExerciseIndex(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function roundToTenth(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

export const MANUAL_MAX_CONFIDENCE_OPTIONS = Object.freeze([
  Object.freeze({
    value: "very_confident",
    label: "Very",
    description: "Tested recently, usually within the last 4–8 weeks.",
    multiplier: 1,
  }),
  Object.freeze({
    value: "somewhat_confident",
    label: "Somewhat",
    description: "Tested around 8–16 weeks ago.",
    multiplier: 0.9,
  }),
  Object.freeze({
    value: "not_confident",
    label: "Not",
    description: "Older than roughly 16 weeks or clearly uncertain.",
    multiplier: 0.8,
  }),
]);

function normalizeManualMaxConfidence(value) {
  return MANUAL_MAX_CONFIDENCE_OPTIONS.some((option) => option.value === value)
    ? value
    : "";
}

export function roundProgramMaxKg(valueKg, unitSystem = "metric") {
  if (!Number.isFinite(valueKg) || valueKg <= 0) {
    return null;
  }

  if (unitSystem === "imperial") {
    const valueLb = kilogramsToPounds(valueKg);
    const roundedValueLb =
      Math.round(valueLb / IMPERIAL_PROGRAM_MAX_INCREMENT_LB) *
      IMPERIAL_PROGRAM_MAX_INCREMENT_LB;

    return roundToTenth(poundsToKilograms(roundedValueLb));
  }

  return (
    Math.round(valueKg / METRIC_PROGRAM_MAX_INCREMENT_KG) *
    METRIC_PROGRAM_MAX_INCREMENT_KG
  );
}

export function calculateManualProgramMaxKg({
  enteredOneRepMaxKg,
  confidence,
  unitSystem = "metric",
} = {}) {
  const enteredMaxKg = parsePositiveNumber(enteredOneRepMaxKg);
  const confidenceOption = MANUAL_MAX_CONFIDENCE_OPTIONS.find(
    (option) => option.value === normalizeManualMaxConfidence(confidence)
  );

  if (!enteredMaxKg || !confidenceOption) {
    return null;
  }

  return roundProgramMaxKg(enteredMaxKg * confidenceOption.multiplier, unitSystem);
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

  const exerciseOrder = (parseExerciseIndex(left.exerciseIndex) || 0) -
    (parseExerciseIndex(right.exerciseIndex) || 0);

  if (exerciseOrder !== 0) {
    return exerciseOrder;
  }

  return (parseExerciseIndex(left.setIndex) || 0) -
    (parseExerciseIndex(right.setIndex) || 0);
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
    case STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM:
    default:
      return `Log the load, reps, and RPE for the top 3-10 rep set on ${resolvedLiftName} so the app can estimate your 1RM from reps in reserve.`;
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

function getRepsInReserveFromRpe(rpe) {
  const normalizedRpe = parsePositiveNumber(rpe);

  if (!normalizedRpe) {
    return null;
  }

  return Math.max(0, Math.min(4, 10 - normalizedRpe));
}

function calculateEstimatedOneRepMax(method, { loadKg, reps, rpe }) {
  switch (method) {
    case STRENGTH_ASSESSMENT_METHODS.TRUE_1RM:
      return loadKg;
    case STRENGTH_ASSESSMENT_METHODS.MULTI_RM:
      return loadKg * (1 + reps / 30);
    case STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM:
    default:
      return loadKg * (1 + (reps + getRepsInReserveFromRpe(rpe)) / 30);
  }
}

function calculateTrainingMax(
  method,
  estimatedOneRepMaxKg,
  previousTrainingMaxKg = null,
  unitSystem = "metric"
) {
  const baseTrainingMax =
    method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM
      ? estimatedOneRepMaxKg * DEFAULT_TRAINING_MAX_BUFFER
      : estimatedOneRepMaxKg;

  const finalizeTrainingMax = (valueKg) =>
    method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM
      ? roundToTenth(valueKg)
      : roundProgramMaxKg(valueKg, unitSystem);

  if (!Number.isFinite(previousTrainingMaxKg) || previousTrainingMaxKg <= 0) {
    return finalizeTrainingMax(baseTrainingMax);
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM) {
    return finalizeTrainingMax(baseTrainingMax);
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM) {
    return finalizeTrainingMax(baseTrainingMax);
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM) {
    return finalizeTrainingMax(
      clampRelativeChange(baseTrainingMax, previousTrainingMaxKg, 7.5)
    );
  }

  const differencePercent =
    ((baseTrainingMax - previousTrainingMaxKg) / previousTrainingMaxKg) * 100;
  const absoluteDifferencePercent = Math.abs(differencePercent);

  if (absoluteDifferencePercent <= 2.5) {
    return finalizeTrainingMax(baseTrainingMax);
  }

  if (absoluteDifferencePercent <= 7.5) {
    return finalizeTrainingMax(
      clampRelativeChange(baseTrainingMax, previousTrainingMaxKg, 5)
    );
  }

  return finalizeTrainingMax(
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
    setIndex: parseExerciseIndex(safeSource.setIndex),
    liftKey: normalizeString(safeSource.liftKey, toLiftKey(liftName)),
    liftName,
    sourceExerciseName: normalizeString(safeSource.sourceExerciseName, liftName),
    method,
    loadKg: roundToTenth(loadKg),
    reps: parsePositiveInteger(safeSource.reps),
    rpe: parsePositiveNumber(safeSource.rpe),
    estimatedOneRepMaxKg: roundToTenth(estimatedOneRepMaxKg),
    ...(parsePositiveNumber(safeSource.rawEstimatedOneRepMaxKg)
      ? { rawEstimatedOneRepMaxKg: parsePositiveNumber(safeSource.rawEstimatedOneRepMaxKg) }
      : {}),
    trainingMaxKg: roundToTenth(trainingMaxKg),
    ...(normalizeString(safeSource.source)
      ? { source: normalizeString(safeSource.source) }
      : {}),
    ...(normalizeManualMaxConfidence(safeSource.confidence)
      ? { confidence: normalizeManualMaxConfidence(safeSource.confidence) }
      : {}),
    ...(parsePositiveNumber(safeSource.enteredOneRepMaxKg)
      ? {
          enteredOneRepMaxKg: roundToTenth(
            parsePositiveNumber(safeSource.enteredOneRepMaxKg)
          ),
        }
      : {}),
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
  if (LEGACY_STRENGTH_ASSESSMENT_METHODS[value]) {
    return LEGACY_STRENGTH_ASSESSMENT_METHODS[value];
  }

  return VALID_STRENGTH_ASSESSMENT_METHODS.has(value) ? value : fallback;
}

export function getStrengthAssessmentMethodLabel(method) {
  switch (normalizeStrengthAssessmentMethod(method)) {
    case STRENGTH_ASSESSMENT_METHODS.TRUE_1RM:
      return "True 1RM test";
    case STRENGTH_ASSESSMENT_METHODS.MANUAL_1RM:
      return "Manually entered 1RM";
    case STRENGTH_ASSESSMENT_METHODS.MULTI_RM:
      return "2-5RM + Epley";
    case STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM:
      return "RPE-based 1RM estimation";
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
    requiresReps:
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.MULTI_RM ||
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM,
    requiresRpe: normalizedMethod === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM,
    loadLabel:
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM ?
        "Heaviest successful single (kg)" :
        "Load used (kg)",
    repsLabel:
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM ?
        "Top-set reps (3-10)" :
        "Reps completed",
    repsPlaceholder:
      normalizedMethod === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM ?
        "3-10" :
        "2-5",
    rpePlaceholder: "7-9",
    rpeLabel: "RPE",
  };
}

export function getStrengthAssessmentMinimumRpe(exercise = {}) {
  const assessment = isPlainObject(exercise?.strengthAssessment)
    ? exercise.strengthAssessment
    : isPlainObject(exercise)
      ? exercise
      : {};
  const explicitMinimum = parsePositiveNumber(
    assessment.minimumRpe ?? assessment.targetRpe
  );

  return explicitMinimum ||
    parseRpeLowerBound(exercise?.notes) ||
    parseRpeLowerBound(assessment.prompt) ||
    7;
}

export function getStrengthAssessmentPrescription(exercise = {}) {
  const assessment = normalizeStrengthAssessmentConfig(
    exercise?.strengthAssessment,
    exercise?.name
  );

  if (!assessment) {
    return "";
  }

  const method = assessment.method;
  const rawReps = normalizeString(exercise?.reps);
  const leadingRepTarget = rawReps.match(/^\s*(\d+(?:\s*[–-]\s*\d+)?)/)?.[1];
  const repTarget = leadingRepTarget
    ? leadingRepTarget.replace(/\s*[–-]\s*/g, "–")
    : method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM
      ? "1"
      : method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM
        ? "2–5"
        : "3–5";
  const repLabel = repTarget === "1" ? "rep" : "reps";

  if (method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM) {
    const minimumRpe = getStrengthAssessmentMinimumRpe(exercise);
    return `Work up to a top set of ${repTarget} ${repLabel} at RPE ${minimumRpe}–9.`;
  }

  if (method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM) {
    return `Work up to a top set of ${repTarget} ${repLabel} at RPE 9–10.`;
  }

  return `Work up to a top set of ${repTarget} ${repLabel}.`;
}

export function getPendingProgramMaxAssessments(
  exercises = [],
  strengthAssessmentSummary = {}
) {
  const knownLiftKeys = new Set(
    (Array.isArray(strengthAssessmentSummary?.latestByLift)
      ? strengthAssessmentSummary.latestByLift
      : []
    )
      .filter((entry) => parsePositiveNumber(entry?.trainingMaxKg))
      .map((entry) => getStrengthAssessmentLiftKey(entry?.liftName, ""))
      .filter(Boolean)
  );
  const pendingByLift = new Map();

  (Array.isArray(exercises) ? exercises : []).forEach((exercise, exerciseIndex) => {
    const assessment = normalizeStrengthAssessmentConfig(
      exercise?.strengthAssessment,
      exercise?.name
    );

    if (!assessment) {
      return;
    }

    const liftKey = getStrengthAssessmentLiftKey(assessment.liftName, "");
    if (!liftKey || knownLiftKeys.has(liftKey) || pendingByLift.has(liftKey)) {
      return;
    }

    pendingByLift.set(liftKey, {
      exerciseIndex,
      liftKey,
      liftName: assessment.liftName,
      method: assessment.method,
      minimumRpe:
        assessment.method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM
          ? getStrengthAssessmentMinimumRpe(exercise)
          : null,
    });
  });

  return Array.from(pendingByLift.values());
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
  const trainingMaxKg = parsePositiveNumber(entry?.trainingMaxKg);

  if (trainingMaxKg) {
    return roundToTenth(trainingMaxKg);
  }

  const estimatedOneRepMaxKg = parsePositiveNumber(entry?.estimatedOneRepMaxKg);
  const method = normalizeStrengthAssessmentMethod(entry?.method);

  return estimatedOneRepMaxKg
    ? roundToTenth(
        estimatedOneRepMaxKg *
          (method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM
            ? DEFAULT_TRAINING_MAX_BUFFER
            : 1)
      )
    : null;
}

export function getStrengthAssessmentCurrentOneRepMaxKg(entry = {}) {
  const estimatedOneRepMaxKg = parsePositiveNumber(entry?.estimatedOneRepMaxKg);

  if (estimatedOneRepMaxKg) {
    return roundToTenth(estimatedOneRepMaxKg);
  }

  const enteredOneRepMaxKg = parsePositiveNumber(entry?.enteredOneRepMaxKg);

  if (enteredOneRepMaxKg) {
    return roundToTenth(enteredOneRepMaxKg);
  }

  const trainingMaxKg = parsePositiveNumber(entry?.trainingMaxKg);
  return trainingMaxKg ? roundToTenth(trainingMaxKg) : null;
}

export function getProgramMaxLiftStatus(entry = {}, currentWeekNumber = 1) {
  if (!parsePositiveNumber(entry?.trainingMaxKg)) {
    return "missing";
  }

  if (entry?.method !== STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM) {
    return "active";
  }

  const capturedWeek = parsePositiveInteger(entry?.weekNumber);
  const currentWeek = parsePositiveInteger(currentWeekNumber) || 1;
  return capturedWeek && currentWeek <= capturedWeek
    ? "provisional_ready"
    : "active";
}

export function createManualProgramMaxEntry({
  liftName,
  enteredOneRepMaxKg,
  confidence,
  unitSystem = "metric",
  sessionKey = "program-max-setup",
  performedAt = new Date().toISOString(),
} = {}) {
  const normalizedLiftName = normalizeString(liftName);
  const enteredMaxKg = parsePositiveNumber(enteredOneRepMaxKg);
  const normalizedConfidence = normalizeManualMaxConfidence(confidence);
  const trainingMaxKg = calculateManualProgramMaxKg({
    enteredOneRepMaxKg: enteredMaxKg,
    confidence: normalizedConfidence,
    unitSystem,
  });

  if (!normalizedLiftName || !enteredMaxKg || !normalizedConfidence || !trainingMaxKg) {
    return null;
  }

  return {
    sessionKey: normalizeString(sessionKey, "program-max-setup"),
    weekNumber: null,
    dayNumber: null,
    exerciseIndex: null,
    setIndex: null,
    liftKey: toLiftKey(normalizedLiftName),
    liftName: normalizedLiftName,
    sourceExerciseName: normalizedLiftName,
    method: STRENGTH_ASSESSMENT_METHODS.MANUAL_1RM,
    source: "manual_entry",
    confidence: normalizedConfidence,
    enteredOneRepMaxKg: roundToTenth(enteredMaxKg),
    loadKg: roundToTenth(enteredMaxKg),
    reps: 1,
    rpe: null,
    estimatedOneRepMaxKg: roundToTenth(enteredMaxKg),
    trainingMaxKg,
    performedAt: normalizeString(performedAt, new Date().toISOString()),
    prompt: "Entered during Program Max setup.",
  };
}

export function getRequiredProgramMaxLifts(plan = {}, strengthAssessmentSummary = {}) {
  const knownByLiftKey = new Map(
    (Array.isArray(strengthAssessmentSummary?.latestByLift)
      ? strengthAssessmentSummary.latestByLift
      : []
    )
      .filter((entry) => parsePositiveNumber(entry?.trainingMaxKg))
      .map((entry) => [getStrengthAssessmentLiftKey(entry?.liftName, ""), entry])
      .filter(([liftKey]) => Boolean(liftKey))
  );
  const requiredByLiftKey = new Map();

  (Array.isArray(plan?.weeks) ? plan.weeks : []).forEach((week) => {
    (Array.isArray(week?.days) ? week.days : []).forEach((day) => {
      (Array.isArray(day?.exercises) ? day.exercises : []).forEach((exercise) => {
        const assessment = normalizeStrengthAssessmentConfig(
          exercise?.strengthAssessment,
          exercise?.name
        );
        const liftName = normalizeString(
          assessment?.liftName || exercise?.percentagePrescription?.referenceLiftName
        );
        const liftKey = getStrengthAssessmentLiftKey(liftName, "");

        if (!liftKey || requiredByLiftKey.has(liftKey)) {
          return;
        }

        const knownEntry = knownByLiftKey.get(liftKey) || null;
        requiredByLiftKey.set(liftKey, {
          liftKey,
          liftName,
          programMaxKg: parsePositiveNumber(knownEntry?.trainingMaxKg),
          knownEntry,
        });
      });
    });
  });

  return Array.from(requiredByLiftKey.values());
}

export function shouldRequireProgramMaxSetup({
  plan = {},
  liftIntensityMethod = "",
  strengthAssessmentSummary = {},
  completedDays = [],
} = {}) {
  const completedDayCount = Array.isArray(completedDays)
    ? completedDays.length
    : completedDays instanceof Set
      ? completedDays.size
      : 0;

  if (
    liftIntensityMethod !== "percentage" ||
    plan?.programMaxSetupCompletedAt ||
    completedDayCount > 0
  ) {
    return false;
  }

  return getRequiredProgramMaxLifts(plan, strengthAssessmentSummary).some(
    (lift) => !lift.programMaxKg
  );
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
  unitSystem = "metric",
  previousTrainingMaxKg = null,
  sessionKey = "",
  weekNumber = null,
  dayNumber = null,
  exerciseIndex = null,
  setIndex = null,
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
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.TRUE_1RM ?
      1 :
      parsePositiveInteger(safeResult.reps);
  const rpe =
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM ?
      parsePositiveNumber(safeResult.rpe) :
      null;
  const minimumRpe = getStrengthAssessmentMinimumRpe(metadata);

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.MULTI_RM &&
    !reps
  ) {
    return null;
  }

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM &&
    (!reps || reps < 3 || reps > 5)
  ) {
    return null;
  }

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM &&
    !rpe
  ) {
    return null;
  }

  if (
    normalizedMetadata.method === STRENGTH_ASSESSMENT_METHODS.RPE_BASED_1RM &&
    (rpe < minimumRpe || rpe > 10)
  ) {
    return null;
  }

  const rawEstimatedOneRepMaxKg = calculateEstimatedOneRepMax(
    normalizedMetadata.method,
    { loadKg, reps, rpe }
  );
  const estimatedOneRepMaxKg = roundToTenth(rawEstimatedOneRepMaxKg);

  if (!estimatedOneRepMaxKg) {
    return null;
  }

  return {
    sessionKey: normalizeString(sessionKey),
    weekNumber: parsePositiveInteger(weekNumber),
    dayNumber: parsePositiveInteger(dayNumber),
    exerciseIndex: parseExerciseIndex(exerciseIndex),
    setIndex: parseExerciseIndex(setIndex ?? safeResult.setIndex),
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
    rawEstimatedOneRepMaxKg,
    trainingMaxKg: calculateTrainingMax(
      normalizedMetadata.method,
      estimatedOneRepMaxKg,
      parsePositiveNumber(previousTrainingMaxKg),
      unitSystem
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
