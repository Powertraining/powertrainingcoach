const PERFORMANCE_TRACKING_STRATEGIES = Object.freeze({
  E1RM: "e1rm",
  BEST_SET: "best_set",
  FIXED_RPE: "fixed_rpe",
});

const VALID_PERFORMANCE_TRACKING_STRATEGIES = new Set(
  Object.values(PERFORMANCE_TRACKING_STRATEGIES)
);
const LEGACY_PERFORMANCE_TRACKING_STRATEGIES = Object.freeze({
  percentage_top_set_check: PERFORMANCE_TRACKING_STRATEGIES.E1RM,
  percentage_with_top_set: PERFORMANCE_TRACKING_STRATEGIES.E1RM,
  percentage_with_top_set_check: PERFORMANCE_TRACKING_STRATEGIES.E1RM,
});

const RECENT_PERFORMANCE_LIMIT = 12;

const MISSED_REP_REASONS = Object.freeze({
  too_heavy: "too_heavy",
  pain: "pain",
  technical_error: "technical_error",
});

export const MISSED_REP_REASON_OPTIONS = Object.freeze([
  { label: "Too heavy", value: MISSED_REP_REASONS.too_heavy },
  { label: "Pain / irritation", value: MISSED_REP_REASONS.pain },
  { label: "Technical error", value: MISSED_REP_REASONS.technical_error },
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

function parseBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
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

  const exerciseOrder = (parseExerciseIndex(left.exerciseIndex) || 0) -
    (parseExerciseIndex(right.exerciseIndex) || 0);

  if (exerciseOrder !== 0) {
    return exerciseOrder;
  }

  return (parseExerciseIndex(left.setIndex) || 0) -
    (parseExerciseIndex(right.setIndex) || 0);
}

export function parseRpeFromText(value = "") {
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

function normalizeMissedRepReason(value, fallback = "") {
  const normalizedValue = normalizeString(value);
  return Object.values(MISSED_REP_REASONS).includes(normalizedValue)
    ? normalizedValue
    : fallback;
}

function formatMissedRepReason(value = "") {
  switch (normalizeMissedRepReason(value)) {
    case MISSED_REP_REASONS.pain:
      return "Pain / irritation";
    case MISSED_REP_REASONS.technical_error:
      return "Technical error";
    case MISSED_REP_REASONS.too_heavy:
    default:
      return "Too heavy";
  }
}

function normalizeLiftIntensityMethod(value = "") {
  return normalizeString(value, "percentage") === "rpe" ? "rpe" : "percentage";
}

function getExerciseCategory(exercise = {}, metadata = {}) {
  const combinedText = [
    exercise?.name,
    exercise?.notes,
    exercise?.reps,
    metadata?.liftName,
  ]
    .map((value) => normalizeString(value).toLowerCase())
    .filter(Boolean)
    .join(" ");

  if (/\b(clean|snatch|jerk|olympic|high pull|clean pull)\b/i.test(combinedText)) {
    return "olympic";
  }

  if (
    /\b(jump|bound|hop|plyo|throw|med(?:icine)? ball|sprint|velocity|speed)\b/i.test(
      combinedText
    )
  ) {
    return "ballistic";
  }

  if (
    exercise?.percentagePrescription ||
    exercise?.strengthAssessment ||
    exercise?.performanceTarget ||
    metadata?.strategy === PERFORMANCE_TRACKING_STRATEGIES.E1RM ||
    metadata?.strategy === PERFORMANCE_TRACKING_STRATEGIES.FIXED_RPE
  ) {
    return "primary_strength";
  }

  return "accessory";
}

function buildRecommendationOption(value, label, summary = "") {
  return {
    value,
    label,
    summary,
  };
}

export function buildMissedRepRecommendation({
  liftIntensityMethod = "percentage",
  exercise = {},
  metadata = {},
  missReason = "",
  sameLiftMissesInSession = 1,
  consecutiveMissExposureCount = 0,
} = {}) {
  const reason = normalizeMissedRepReason(missReason, MISSED_REP_REASONS.too_heavy);
  const loadingMode = normalizeLiftIntensityMethod(liftIntensityMethod);
  const category = getExerciseCategory(exercise, metadata);
  const sessionMissCount = parsePositiveInteger(sameLiftMissesInSession) || 1;
  const repeatedAcrossSessions =
    (parsePositiveInteger(consecutiveMissExposureCount) || 0) >= 2;

  if (reason === MISSED_REP_REASONS.pain) {
    return {
      category,
      reason,
      title: "Missed rep logged",
      recommendedAction: buildRecommendationOption(
        "swap_variation",
        "Swap variation",
        "Stop this lift today and use a pain-free variation next time."
      ),
      options: [
        buildRecommendationOption("end_lift", "End lift for today"),
        buildRecommendationOption("swap_variation", "Swap variation"),
        buildRecommendationOption("coach_review", "Coach review flag"),
      ],
      nextSessionAdjustment: "Swap to a pain-free variation and keep loading conservative.",
      planAdjustment: {
        type: "swap_variation",
        freezeProgression: true,
      },
    };
  }

  if (category === "ballistic") {
    return {
      category,
      reason,
      title: "Quality drop logged",
      recommendedAction: buildRecommendationOption(
        "end_quality_work",
        "End quality work",
        "Stop once speed, landing, or catch quality clearly drops."
      ),
      options: [
        buildRecommendationOption("reduce_reps", "Reduce reps"),
        buildRecommendationOption("extend_rest", "Extend rest"),
        buildRecommendationOption("end_quality_work", "End lift for today"),
      ],
      nextSessionAdjustment: "Repeat the drill with fewer reps per set or longer rest.",
      planAdjustment: {
        type: "reduce_volume",
        freezeProgression: true,
      },
    };
  }

  if (category === "olympic") {
    const stopLift = sessionMissCount >= 2;

    return {
      category,
      reason,
      title: "Missed rep logged",
      recommendedAction: stopLift ?
        buildRecommendationOption(
          "end_lift",
          "End lift for today",
          "After two misses, move to a simpler pull or throw instead of chasing reps."
        ) :
        buildRecommendationOption(
          "lower_load_5",
          "Lower load 2.5-5%",
          "Retry once only if the miss was clearly technical and you still look sharp."
        ),
      options: stopLift ?
        [
          buildRecommendationOption("end_lift", "End lift for today"),
          buildRecommendationOption("swap_variation", "Swap variation"),
          buildRecommendationOption("coach_review", "Coach review flag"),
        ] :
        [
          buildRecommendationOption("lower_load_2_5", "Lower load 2.5%"),
          buildRecommendationOption("lower_load_5", "Lower load 5%"),
          buildRecommendationOption("end_lift", "End lift for today"),
        ],
      nextSessionAdjustment: stopLift ?
        "Use a simpler substitute like a clean pull, high pull, jump shrug, or med-ball throw." :
        "Repeat the lift only if technique is sharp; otherwise simplify the variation.",
      planAdjustment: {
        type: stopLift ? "swap_variation" : "reduce_load",
        loadReductionPercent: 5,
        freezeProgression: true,
      },
    };
  }

  if (sessionMissCount >= 2) {
    return {
      category,
      reason,
      title: "Second miss logged",
      recommendedAction: buildRecommendationOption(
        "end_lift",
        "End lift for today",
        "Two misses is enough signal. Stop the main lift and avoid extra attempts."
      ),
      options: [
        buildRecommendationOption("end_lift", "End lift for today"),
        buildRecommendationOption("cut_set", "Cut 1 set"),
        buildRecommendationOption("coach_review", "Coach review flag"),
      ],
      nextSessionAdjustment: repeatedAcrossSessions ?
        "Freeze progression and lower the training max slightly if this happens again." :
        "Repeat the same load target next time before progressing.",
      planAdjustment: {
        type: repeatedAcrossSessions ? "lower_training_max" : "freeze_progression",
        loadReductionPercent: repeatedAcrossSessions ? 5 : 0,
        freezeProgression: true,
      },
    };
  }

  if (category === "accessory") {
    return {
      category,
      reason,
      title: "Missed rep logged",
      recommendedAction: buildRecommendationOption(
        "end_set",
        "End set",
        "End the set, then reduce load or reps slightly on the next set."
      ),
      options: [
        buildRecommendationOption("end_set", "End set"),
        buildRecommendationOption("lower_load_2_5", "Lower load 2.5%"),
        buildRecommendationOption("reduce_reps", "Reduce reps"),
      ],
      nextSessionAdjustment: "Repeat this accessory until all reps are completed cleanly.",
      planAdjustment: {
        type: "freeze_progression",
        freezeProgression: true,
      },
    };
  }

  if (loadingMode === "rpe") {
    const technical = reason === MISSED_REP_REASONS.technical_error;

    return {
      category,
      reason,
      title: "Missed rep logged",
      recommendedAction: buildRecommendationOption(
        technical ? "retry_once" : "lower_load_5",
        technical ? "Retry once or lower load 2.5-5%" : "Lower load 5%",
        technical ?
          "Retry only if technique is good; otherwise lower load and keep the same rep target." :
          "Treat this as an RPE overshoot and stay at the lower end of the target effort."
      ),
      options: [
        buildRecommendationOption("lower_load_2_5", "Lower load 2.5%"),
        buildRecommendationOption("lower_load_5", "Lower load 5%"),
        buildRecommendationOption("cut_set", "Cut 1 set"),
        buildRecommendationOption("end_lift", "End lift for today"),
      ],
      nextSessionAdjustment: repeatedAcrossSessions ?
        "Repeat the same load next exposure before progressing." :
        "Use today's last successful load as the ceiling and judge RPE more conservatively.",
      planAdjustment: {
        type: "freeze_progression",
        loadReductionPercent: technical ? 2.5 : 5,
        freezeProgression: true,
      },
    };
  }

  return {
    category,
    reason,
    title: "Missed rep logged",
    recommendedAction: buildRecommendationOption(
      reason === MISSED_REP_REASONS.technical_error ? "lower_load_2_5" : "lower_load_5",
      reason === MISSED_REP_REASONS.technical_error ? "Lower load 2.5%" : "Lower load 5%",
      reason === MISSED_REP_REASONS.technical_error ?
        "Keep the week intact if this was purely setup or technique." :
        "Drop one loading tier for the rest of the session and freeze progression next week."
    ),
    options: [
      buildRecommendationOption("lower_load_2_5", "Lower load 2.5%"),
      buildRecommendationOption("lower_load_5", "Lower load 5%"),
      buildRecommendationOption("lower_load_7_5", "Lower load 7.5%"),
      buildRecommendationOption("cut_set", "Cut 1 set"),
    ],
    nextSessionAdjustment: repeatedAcrossSessions ?
      "Do not advance percentages; repeat the week or lower the training max 2.5-5%." :
      reason === MISSED_REP_REASONS.technical_error ?
        "Repeat the planned load next time if setup was the clear cause." :
        "Freeze progression on this lift and check whether the training max is inflated.",
    planAdjustment: {
      type: repeatedAcrossSessions ? "lower_training_max" : "reduce_load",
      loadReductionPercent: repeatedAcrossSessions ? 5 :
        reason === MISSED_REP_REASONS.technical_error ? 2.5 : 5,
      freezeProgression: reason !== MISSED_REP_REASONS.technical_error,
    },
  };
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
  if (LEGACY_PERFORMANCE_TRACKING_STRATEGIES[value]) {
    return LEGACY_PERFORMANCE_TRACKING_STRATEGIES[value];
  }

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
  const missedRep = parseBoolean(safeSource.missedRep);
  const missedRepReason = normalizeMissedRepReason(safeSource.missedRepReason);
  const missedRepRecommendation =
    safeSource.missedRepRecommendation && typeof safeSource.missedRepRecommendation === "object"
      ? safeSource.missedRepRecommendation
      : null;

  if (!strategy || !liftName || (!missedRep && (!loadKg || !reps))) {
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
    strategy,
    repTarget: parsePositiveInteger(safeSource.repTarget),
    targetRpe,
    loadKg: loadKg ? roundToTenth(loadKg) : null,
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
    missedRep,
    missedRepReason,
    missedRepReasonLabel: missedRep ? formatMissedRepReason(missedRepReason) : "",
    missedRepRecommendation,
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
  exercise = {},
  liftIntensityMethod = "percentage",
  sessionKey = "",
  weekNumber = null,
  dayNumber = null,
  exerciseIndex = null,
  setIndex = null,
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
  const missedRep = parseBoolean(safeResult.missedRep);
  const missedRepReason = normalizeMissedRepReason(safeResult.missedRepReason);

  if (!missedRep && (!loadKg || !reps)) {
    return null;
  }

  const estimatedOneRepMaxKg = loadKg && reps ?
    calculateEstimatedOneRepMaxKg({
      loadKg,
      reps,
      rpe,
    }) :
    null;
  let metricValueKg = null;

  if (!missedRep) {
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
  }

  return normalizePerformanceEntry({
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
    strategy: normalizedMetadata.strategy,
    repTarget: normalizedMetadata.repTarget,
    targetRpe: normalizedMetadata.targetRpe,
    loadKg,
    reps,
    rpe,
    estimatedOneRepMaxKg,
    metricValueKg,
    missedRep,
    missedRepReason,
    missedRepRecommendation: missedRep ?
      buildMissedRepRecommendation({
        liftIntensityMethod,
        exercise,
        metadata: normalizedMetadata,
        missReason: missedRepReason,
      }) :
      null,
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
