import {
  applyExerciseSubstitution,
  getCurrentTrainingDay,
  normalizeTrainingPlan,
} from "./trainingPlan.js";
import {
  calculateRelativeIntensityFromPercentOneRepMax,
  normalizeLoadingStrategy,
} from "./percentagePrescription.js";
import { normalizeTrainingPerformanceState } from "./trainingPerformance.js";
import { normalizeStrengthAssessmentState } from "./strengthAssessment.js";

const CHECK_IN_TYPES = Object.freeze({
  weekly: "weekly",
  end_of_block: "end_of_block",
});

const SUBJECTIVE_PROGRESS_VALUES = new Set([
  "improving",
  "flat",
  "regressing",
  "not_sure",
]);

const SUBJECTIVE_FATIGUE_VALUES = new Set(["fresh", "normal", "beat_up"]);
const SUBJECTIVE_ENJOYMENT_VALUES = new Set(["high", "ok", "bored"]);
const SUBJECTIVE_PAIN_VALUES = new Set(["none", "mild", "affects_training"]);

const RECOMMENDATION_ACTION_TYPES = Object.freeze({
  keep: "keep",
  micro_adjust: "micro_adjust",
  freeze_progression: "freeze_progression",
  deload: "deload",
  change_scheme: "change_scheme",
  change_exercise: "change_exercise",
});

export const TRAINING_CHECK_IN_FIELD_OPTIONS = Object.freeze({
  progress: [
    { label: "Improving", value: "improving" },
    { label: "Flat", value: "flat" },
    { label: "Regressing", value: "regressing" },
    { label: "Not sure", value: "not_sure" },
  ],
  fatigue: [
    { label: "Fresh", value: "fresh" },
    { label: "Normal", value: "normal" },
    { label: "Beat up", value: "beat_up" },
  ],
  enjoyment: [
    { label: "High", value: "high" },
    { label: "OK", value: "ok" },
    { label: "Bored", value: "bored" },
  ],
  pain: [
    { label: "None", value: "none" },
    { label: "Mild", value: "mild" },
    { label: "Affects training", value: "affects_training" },
  ],
});

const LOADING_STRATEGY_ALTERNATIVES = Object.freeze({
  flat_loading: ["ascending_pyramid", "descending_pyramid"],
  ascending_pyramid: ["flat_loading", "descending_pyramid"],
  descending_pyramid: ["flat_loading", "ascending_pyramid"],
  double_pyramid: ["flat_loading", "ascending_pyramid"],
});

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseFiniteNumber(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseNonNegativeInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
}

function toLiftKey(value, fallback = "main_lift") {
  const normalizedValue = normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedValue || fallback;
}

function roundToTenth(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function averageNumbers(values = []) {
  const normalizedValues = values
    .map((value) => parseFiniteNumber(value))
    .filter((value) => value != null);

  if (normalizedValues.length === 0) {
    return null;
  }

  return roundToTenth(
    normalizedValues.reduce((sum, value) => sum + value, 0) /
      normalizedValues.length
  );
}

function formatSignedNumber(value) {
  const normalizedValue = parseFiniteNumber(value);

  if (normalizedValue == null) {
    return "";
  }

  return `${normalizedValue > 0 ? "+" : ""}${roundToTenth(normalizedValue)}`;
}

function getCompletedDayKey(weekNumber, dayNumber) {
  return `${weekNumber}-${dayNumber}`;
}

function getCompletedDaySet(completedDays = []) {
  return new Set(Array.isArray(completedDays) ? completedDays : []);
}

function normalizeCheckInType(value, fallback = "") {
  return Object.values(CHECK_IN_TYPES).includes(value) ? value : fallback;
}

function normalizeSubjectiveAnswers(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const progress = normalizeString(safeSource.progress);
  const fatigue = normalizeString(safeSource.fatigue);
  const enjoyment = normalizeString(safeSource.enjoyment);
  const pain = normalizeString(safeSource.pain);

  return {
    progress: SUBJECTIVE_PROGRESS_VALUES.has(progress) ? progress : "not_sure",
    fatigue: SUBJECTIVE_FATIGUE_VALUES.has(fatigue) ? fatigue : "normal",
    enjoyment: SUBJECTIVE_ENJOYMENT_VALUES.has(enjoyment) ? enjoyment : "ok",
    pain: SUBJECTIVE_PAIN_VALUES.has(pain) ? pain : "none",
  };
}

function normalizeActionOption(option = {}) {
  const safeOption = option && typeof option === "object" ? option : {};
  const type = normalizeString(safeOption.type);

  if (!Object.values(RECOMMENDATION_ACTION_TYPES).includes(type)) {
    return null;
  }

  return {
    type,
    label: normalizeString(safeOption.label),
    summary: normalizeString(safeOption.summary),
    targetLoadingStrategy: normalizeLoadingStrategy(
      safeOption.targetLoadingStrategy
    ),
  };
}

function normalizeTrainingCheckInEntry(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const type = normalizeCheckInType(safeSource.type);
  const weekNumber = parsePositiveInteger(safeSource.weekNumber);

  if (!type || !weekNumber) {
    return null;
  }

  const recommendation = normalizeActionOption(safeSource.recommendation);
  const appliedAction = normalizeActionOption(safeSource.appliedAction);

  return {
    id: normalizeString(
      safeSource.id,
      `${type}-${weekNumber}-${normalizeString(safeSource.createdAt, "unknown")}`
    ),
    type,
    weekNumber,
    title: normalizeString(safeSource.title),
    summary: normalizeString(safeSource.summary),
    answers: normalizeSubjectiveAnswers(safeSource.answers),
    objectiveSummary:
      safeSource.objectiveSummary && typeof safeSource.objectiveSummary === "object"
        ? safeSource.objectiveSummary
        : {},
    recommendation,
    appliedAction,
    resultSummary: normalizeString(safeSource.resultSummary),
    createdAt: normalizeString(safeSource.createdAt),
    appliedAt: normalizeString(safeSource.appliedAt),
  };
}

export function createDefaultTrainingCheckInState() {
  return {
    history: [],
  };
}

export function normalizeTrainingCheckInState(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};

  return {
    history: Array.isArray(safeSource.history)
      ? safeSource.history.map(normalizeTrainingCheckInEntry).filter(Boolean)
      : [],
  };
}

export function getTrainingCheckInBlockSize(experience = "") {
  return 4;
}

function getCompletedWeekNumbers(plan = {}, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const completedDaySet = getCompletedDaySet(completedDays);

  return normalizedPlan.weeks
    .filter((week) =>
      week.days
        .filter((day) => day.status !== "skipped")
        .every((day) => completedDaySet.has(getCompletedDayKey(week.week, day.day)))
    )
    .map((week) => week.week)
    .sort((left, right) => left - right);
}

function hasCheckInForWeek(state = {}, type, weekNumber) {
  const normalizedState = normalizeTrainingCheckInState(state);

  return normalizedState.history.some(
    (entry) => entry.type === type && entry.weekNumber === weekNumber
  );
}

function buildWeeksInScope(weekNumber, type, blockSize) {
  if (type === CHECK_IN_TYPES.end_of_block) {
    return Array.from({ length: blockSize }, (_, index) => weekNumber - blockSize + 1 + index)
      .filter((value) => value > 0);
  }

  return [weekNumber];
}

export function getPendingTrainingCheckIn({
  plan = {},
  completedDays = [],
  questionnaire = {},
  trainingCheckInState = {},
} = {}) {
  const completedWeekNumbers = getCompletedWeekNumbers(plan, completedDays);

  if (completedWeekNumbers.length === 0) {
    return null;
  }

  const latestCompletedWeek = completedWeekNumbers[completedWeekNumbers.length - 1];
  const blockSize = getTrainingCheckInBlockSize(questionnaire?.experience);
  const blockBoundaryReached = latestCompletedWeek % blockSize === 0;

  if (
    blockBoundaryReached &&
    !hasCheckInForWeek(
      trainingCheckInState,
      CHECK_IN_TYPES.end_of_block,
      latestCompletedWeek
    )
  ) {
    return {
      type: CHECK_IN_TYPES.end_of_block,
      weekNumber: latestCompletedWeek,
      title: "End-of-block check-in",
      summary: `Wrap up the last ${blockSize} weeks before the app recommends whether to keep pushing, deload, or change the structure.`,
      weeksInScope: buildWeeksInScope(
        latestCompletedWeek,
        CHECK_IN_TYPES.end_of_block,
        blockSize
      ),
      blockSize,
    };
  }

  if (
    !hasCheckInForWeek(
      trainingCheckInState,
      CHECK_IN_TYPES.weekly,
      latestCompletedWeek
    )
  ) {
    return {
      type: CHECK_IN_TYPES.weekly,
      weekNumber: latestCompletedWeek,
      title: "Weekly check-in",
      summary: "Quickly confirm how the last week felt so the app can guide the next step.",
      weeksInScope: [latestCompletedWeek],
      blockSize,
    };
  }

  return null;
}

function classifyStrengthTrend(entries = []) {
  if (entries.length < 2) {
    return {
      trend: "not_enough_data",
      exposureCount: entries.length,
    };
  }

  const latestEntry = entries[entries.length - 1];
  const previousEntry = entries[entries.length - 2];
  const latestValue = latestEntry?.trainingMaxKg || latestEntry?.estimatedOneRepMaxKg || null;
  const previousValue =
    previousEntry?.trainingMaxKg || previousEntry?.estimatedOneRepMaxKg || null;

  if (!latestValue || !previousValue) {
    return {
      trend: "not_enough_data",
      exposureCount: entries.length,
    };
  }

  const changePercent = ((latestValue - previousValue) / previousValue) * 100;

  return {
    trend: changePercent >= 1 ? "up" : changePercent <= -1 ? "down" : "flat",
    exposureCount: entries.length,
    changePercent: roundToTenth(changePercent),
  };
}

function getMostRelevantLiftTrend(strengthAssessmentState = {}, upToWeekNumber = null) {
  const normalizedState = normalizeStrengthAssessmentState(strengthAssessmentState);
  const groupedEntries = normalizedState.history.reduce((accumulator, entry) => {
    if (
      upToWeekNumber &&
      parsePositiveInteger(entry?.weekNumber) &&
      entry.weekNumber > upToWeekNumber
    ) {
      return accumulator;
    }

    const liftKey = normalizeString(entry?.liftKey);

    if (!liftKey) {
      return accumulator;
    }

    accumulator[liftKey] = [...(accumulator[liftKey] || []), entry];
    return accumulator;
  }, {});

  const bestLiftEntry = Object.values(groupedEntries)
    .filter((entries) => entries.length > 0)
    .sort((leftEntries, rightEntries) => {
      const leftLatestTime =
        Date.parse(leftEntries[leftEntries.length - 1]?.performedAt || "") || 0;
      const rightLatestTime =
        Date.parse(rightEntries[rightEntries.length - 1]?.performedAt || "") || 0;

      if (leftLatestTime !== rightLatestTime) {
        return rightLatestTime - leftLatestTime;
      }

      return rightEntries.length - leftEntries.length;
    })[0];

  if (!bestLiftEntry) {
    return {
      trend: "not_enough_data",
      liftName: "",
      exposureCount: 0,
      changePercent: null,
    };
  }

  const trendSummary = classifyStrengthTrend(bestLiftEntry);

  return {
    ...trendSummary,
    liftName: normalizeString(bestLiftEntry[bestLiftEntry.length - 1]?.liftName),
  };
}

function getPerformanceTrackingKey(entry = {}) {
  const liftKey = normalizeString(entry?.liftKey);
  const strategy = normalizeString(entry?.strategy);

  if (!liftKey || !strategy) {
    return "";
  }

  const repTarget = parsePositiveInteger(entry?.repTarget);
  const targetRpe = parseFiniteNumber(entry?.targetRpe);

  return [
    liftKey,
    strategy,
    repTarget || "na",
    targetRpe != null ? roundToTenth(targetRpe) : "na",
  ].join(":");
}

function sortPerformanceEntriesByDate(left = {}, right = {}) {
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

  return (parseNonNegativeInteger(left.exerciseIndex) || 0) -
    (parseNonNegativeInteger(right.exerciseIndex) || 0);
}

function buildPerformanceMetricLabel(entry = {}) {
  const strategy = normalizeString(entry?.strategy);
  const repTarget = parsePositiveInteger(entry?.repTarget);
  const targetRpe = parseFiniteNumber(entry?.targetRpe);

  if (strategy === "fixed_rpe") {
    if (repTarget && targetRpe != null) {
      return `${repTarget}-rep load at RPE ${roundToTenth(targetRpe)}`;
    }

    if (repTarget) {
      return `${repTarget}-rep load at fixed RPE`;
    }

    return "load at a fixed RPE";
  }

  if (strategy === "best_set") {
    return repTarget ? `best ${repTarget}-rep set` : "best top set";
  }

  return "e1RM";
}

function classifyPerformanceTrend(entries = []) {
  const validEntries = entries.filter(
    (entry) => parseFiniteNumber(entry?.metricValueKg) != null
  );
  const recentEntries = validEntries.slice(-4);

  if (recentEntries.length < 2) {
    return {
      trend: "not_enough_data",
      exposureCount: recentEntries.length,
      changePercent: null,
      metricLabel: recentEntries[recentEntries.length - 1] ?
        buildPerformanceMetricLabel(recentEntries[recentEntries.length - 1]) :
        "",
    };
  }

  const latestWindow =
    recentEntries.length >= 3 ? recentEntries.slice(-2) : recentEntries.slice(-1);
  const baselineWindow =
    recentEntries.length >= 4 ?
      recentEntries.slice(-4, -2) :
      recentEntries.slice(0, recentEntries.length - latestWindow.length);
  const latestAverage = averageNumbers(
    latestWindow.map((entry) => entry.metricValueKg)
  );
  const baselineAverage = averageNumbers(
    baselineWindow.map((entry) => entry.metricValueKg)
  );

  if (latestAverage == null || baselineAverage == null || baselineAverage <= 0) {
    return {
      trend: "not_enough_data",
      exposureCount: recentEntries.length,
      changePercent: null,
      metricLabel: buildPerformanceMetricLabel(
        recentEntries[recentEntries.length - 1]
      ),
    };
  }

  const changePercent =
    ((latestAverage - baselineAverage) / baselineAverage) * 100;

  return {
    trend: changePercent >= 1 ? "up" : changePercent <= -1 ? "down" : "flat",
    exposureCount: recentEntries.length,
    changePercent: roundToTenth(changePercent),
    metricLabel: buildPerformanceMetricLabel(
      recentEntries[recentEntries.length - 1]
    ),
  };
}

function getMostRelevantPerformanceTrend(
  trainingPerformanceState = {},
  upToWeekNumber = null
) {
  const normalizedState =
    normalizeTrainingPerformanceState(trainingPerformanceState);
  const groupedEntries = normalizedState.history.reduce((accumulator, entry) => {
    if (
      upToWeekNumber &&
      parsePositiveInteger(entry?.weekNumber) &&
      entry.weekNumber > upToWeekNumber
    ) {
      return accumulator;
    }

    const trackingKey = getPerformanceTrackingKey(entry);

    if (!trackingKey || parseFiniteNumber(entry?.metricValueKg) == null) {
      return accumulator;
    }

    accumulator[trackingKey] = [...(accumulator[trackingKey] || []), entry];
    return accumulator;
  }, {});

  const bestTrackedEntries = Object.values(groupedEntries)
    .filter((entries) => entries.length > 0)
    .sort((leftEntries, rightEntries) => {
      const leftLatestTime =
        Date.parse(leftEntries[leftEntries.length - 1]?.performedAt || "") || 0;
      const rightLatestTime =
        Date.parse(rightEntries[rightEntries.length - 1]?.performedAt || "") || 0;

      if (leftLatestTime !== rightLatestTime) {
        return rightLatestTime - leftLatestTime;
      }

      return rightEntries.length - leftEntries.length;
    })[0];

  if (!bestTrackedEntries) {
    return {
      trend: "not_enough_data",
      liftName: "",
      exposureCount: 0,
      changePercent: null,
      metricLabel: "",
      entries: [],
    };
  }

  const trendSummary = classifyPerformanceTrend(bestTrackedEntries);
  const latestEntry = bestTrackedEntries[bestTrackedEntries.length - 1] || {};

  return {
    ...trendSummary,
    liftName: normalizeString(latestEntry?.liftName),
    strategy: normalizeString(latestEntry?.strategy),
    repTarget: parsePositiveInteger(latestEntry?.repTarget),
    targetRpe: parseFiniteNumber(latestEntry?.targetRpe),
    trackingKey: getPerformanceTrackingKey(latestEntry),
    entries: bestTrackedEntries,
  };
}

function getPerformanceEntriesForCheckInWindow(
  entries = [],
  weeksInScope = [],
  upToWeekNumber = null
) {
  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const scopedEntries = normalizedEntries.filter((entry) => {
    const entryWeekNumber = parsePositiveInteger(entry?.weekNumber);

    if (upToWeekNumber && entryWeekNumber && entryWeekNumber > upToWeekNumber) {
      return false;
    }

    if (weeksInScope.length > 0 && entryWeekNumber) {
      return weeksInScope.includes(entryWeekNumber);
    }

    return true;
  });

  if (scopedEntries.length > 0) {
    return scopedEntries;
  }

  return normalizedEntries.filter((entry) => {
    const entryWeekNumber = parsePositiveInteger(entry?.weekNumber);
    return !(upToWeekNumber && entryWeekNumber && entryWeekNumber > upToWeekNumber);
  });
}

function buildMissedRepSummary(
  trainingPerformanceState = {},
  weeksInScope = [],
  upToWeekNumber = null
) {
  const normalizedState =
    normalizeTrainingPerformanceState(trainingPerformanceState);
  const scopedEntries = normalizedState.history.filter((entry) => {
    const entryWeekNumber = parsePositiveInteger(entry?.weekNumber);

    if (upToWeekNumber && entryWeekNumber && entryWeekNumber > upToWeekNumber) {
      return false;
    }

    if (weeksInScope.length > 0 && entryWeekNumber) {
      return weeksInScope.includes(entryWeekNumber);
    }

    return true;
  });
  const missedEntries = scopedEntries.filter((entry) => entry?.missedRep);
  const missedByLift = scopedEntries.reduce((accumulator, entry) => {
    const liftKey = normalizeString(entry?.liftKey);

    if (!liftKey) {
      return accumulator;
    }

    accumulator[liftKey] = [...(accumulator[liftKey] || []), entry];
    return accumulator;
  }, {});
  const maxConsecutiveMisses = Object.values(missedByLift).reduce(
    (maxCount, entries) => {
      const trailingMissCount = [...entries]
        .sort(sortPerformanceEntriesByDate)
        .reverse()
        .reduce(
          (state, entry) => {
            if (state.stopped) {
              return state;
            }

            if (entry?.missedRep) {
              return {
                ...state,
                count: state.count + 1,
              };
            }

            return {
              ...state,
              stopped: true,
            };
          },
          { count: 0, stopped: false }
        ).count;

      return Math.max(maxCount, trailingMissCount);
    },
    0
  );

  return {
    missedRepCount: missedEntries.length,
    missedRepPainCount: missedEntries.filter(
      (entry) => entry.missedRepReason === "pain"
    ).length,
    missedRepTechnicalCount: missedEntries.filter(
      (entry) => entry.missedRepReason === "technical_error"
    ).length,
    missedRepFatigueCount: missedEntries.filter(
      (entry) => entry.missedRepReason === "too_heavy"
    ).length,
    repeatedMissedRepCount: maxConsecutiveMisses,
    missedRepLiftNames: [
      ...new Set(missedEntries.map((entry) => normalizeString(entry?.liftName)).filter(Boolean)),
    ],
  };
}

function classifyRpeDrift(entries = []) {
  const driftEntries = entries.filter(
    (entry) => parseFiniteNumber(entry?.rpeDrift) != null
  );
  const recentDriftEntries = driftEntries.slice(-2);

  if (recentDriftEntries.length === 0) {
    return {
      trend: "not_enough_data",
      averageDrift: null,
      exposureCount: 0,
    };
  }

  const averageDrift = averageNumbers(
    recentDriftEntries.map((entry) => entry.rpeDrift)
  );
  const highDriftCount = recentDriftEntries.filter(
    (entry) => parseFiniteNumber(entry?.rpeDrift) >= 1
  ).length;

  return {
    trend:
      highDriftCount >= 2 ? "high" :
      averageDrift != null && averageDrift >= 0.5 ? "elevated" :
      averageDrift != null && averageDrift <= -0.5 ? "lower_than_planned" :
      "on_target",
    averageDrift,
    exposureCount: recentDriftEntries.length,
  };
}

function buildCompletionSummary(
  plan = {},
  completedDays = [],
  weeksInScope = [],
  trainingPerformanceState = {}
) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const normalizedPerformanceState =
    normalizeTrainingPerformanceState(trainingPerformanceState);
  const completedDaySet = getCompletedDaySet(completedDays);
  const relevantWeeks = normalizedPlan.weeks.filter((week) =>
    weeksInScope.includes(week.week)
  );
  const trackableDays = relevantWeeks.flatMap((week) =>
    week.days
      .filter((day) => day.status !== "skipped")
      .map((day) => ({
        weekNumber: week.week,
        dayNumber: day.day,
        sessionKey: getCompletedDayKey(week.week, day.day),
        day,
      }))
  );
  const trackableSlots = trackableDays.map((entry) => entry.sessionKey);
  const completedCount = trackableSlots.filter((key) => completedDaySet.has(key)).length;
  const completionRate =
    trackableSlots.length > 0 ? completedCount / trackableSlots.length : 1;
  const completedTrackedDays = trackableDays.filter(({ sessionKey }) =>
    completedDaySet.has(sessionKey)
  );

  const topSetSummary = completedTrackedDays.reduce(
    (accumulator, { sessionKey, day }) => {
      const trackedExerciseIndexes = (Array.isArray(day?.exercises) ? day.exercises : [])
        .map((exercise, exerciseIndex) =>
          exercise?.performanceTarget ? exerciseIndex : null
        )
        .filter((exerciseIndex) => exerciseIndex != null);

      if (trackedExerciseIndexes.length === 0) {
        return accumulator;
      }

      const loggedExerciseIndexes = new Set(
        (Array.isArray(normalizedPerformanceState.sessionResults?.[sessionKey]) ?
          normalizedPerformanceState.sessionResults[sessionKey] :
          []
        )
          .map((entry) => parseNonNegativeInteger(entry?.exerciseIndex))
          .filter((exerciseIndex) => exerciseIndex != null)
      );
      const loggedCount = trackedExerciseIndexes.filter((exerciseIndex) =>
        loggedExerciseIndexes.has(exerciseIndex)
      ).length;

      return {
        totalTrackedTopSetCount:
          accumulator.totalTrackedTopSetCount + trackedExerciseIndexes.length,
        loggedTopSetCount: accumulator.loggedTopSetCount + loggedCount,
      };
    },
    {
      totalTrackedTopSetCount: 0,
      loggedTopSetCount: 0,
    }
  );
  const skippedTopSetCount = Math.max(
    0,
    topSetSummary.totalTrackedTopSetCount - topSetSummary.loggedTopSetCount
  );
  const topSetCompletionRate =
    topSetSummary.totalTrackedTopSetCount > 0 ?
      roundToTenth(
        (topSetSummary.loggedTopSetCount / topSetSummary.totalTrackedTopSetCount) * 100
      ) :
      null;
  const complianceRates = [
    roundToTenth(completionRate * 100),
    ...(topSetCompletionRate != null ? [topSetCompletionRate] : []),
  ];
  const lowestComplianceRate =
    complianceRates.length > 0 ? Math.min(...complianceRates) : 100;

  return {
    completedCount,
    totalCount: trackableSlots.length,
    completionRate: roundToTenth(completionRate * 100),
    missedSessions: Math.max(0, trackableSlots.length - completedCount),
    loggedTopSetCount: topSetSummary.loggedTopSetCount,
    totalTrackedTopSetCount: topSetSummary.totalTrackedTopSetCount,
    skippedTopSetCount,
    topSetCompletionRate,
    complianceTrend:
      lowestComplianceRate < 75 ? "dropping" :
      lowestComplianceRate < 95 ? "mixed" :
      "strong",
  };
}

function buildObjectiveSummarySentence({
  performanceTrend,
  performanceLiftName,
  performanceExposureCount,
  performanceMetricLabel,
  strengthTrend,
  strengthLiftName,
  strengthExposureCount,
  completionRate,
  completedCount,
  totalCount,
  topSetCompletionRate,
  loggedTopSetCount,
  totalTrackedTopSetCount,
  skippedTopSetCount,
  averageRpeDrift,
  rpeDriftTrend,
  rpeDriftExposureCount,
  missedRepCount,
  missedRepPainCount,
  repeatedMissedRepCount,
  missedRepLiftNames,
}) {
  const performanceText =
    performanceTrend && performanceTrend !== "not_enough_data" ?
      performanceLiftName ?
        `${performanceLiftName} ${performanceMetricLabel || "performance"} looks ${performanceTrend} over the last ${performanceExposureCount} tracked exposures.` :
        `Tracked top-set performance looks ${performanceTrend}.` :
    strengthTrend === "not_enough_data" ?
      "Not enough tracked strength data has been logged yet." :
    strengthLiftName ?
      `${strengthLiftName} looks ${strengthTrend} over the last ${strengthExposureCount} tracked assessments.` :
      `Tracked strength looks ${strengthTrend}.`;

  const completionText =
    totalCount > 0 ?
      `Completion sat at ${completionRate}% (${completedCount}/${totalCount} scheduled sessions).` :
      "No scheduled sessions were available in this check-in window.";

  const topSetText =
    totalTrackedTopSetCount > 0 ?
      `Top-set logging sat at ${topSetCompletionRate}% (${loggedTopSetCount}/${totalTrackedTopSetCount} monitored exposures, ${skippedTopSetCount} skipped).` :
      "";

  const rpeDriftText =
    rpeDriftTrend === "not_enough_data" || averageRpeDrift == null ?
      "" :
    rpeDriftTrend === "lower_than_planned" ?
      `Reported effort is trending easier than planned at ${formatSignedNumber(averageRpeDrift)} RPE over the last ${rpeDriftExposureCount} tracked exposures.` :
      `Reported effort is running ${formatSignedNumber(averageRpeDrift)} RPE versus plan over the last ${rpeDriftExposureCount} tracked exposures.`;

  const missedRepText =
    missedRepCount > 0 ?
      `${missedRepCount} missed rep${missedRepCount === 1 ? "" : "s"} logged${
        missedRepLiftNames.length > 0 ? ` on ${missedRepLiftNames.join(", ")}` : ""
      }${
        missedRepPainCount > 0 ? `, including ${missedRepPainCount} pain-related miss${missedRepPainCount === 1 ? "" : "es"}` : ""
      }${
        repeatedMissedRepCount >= 2 ? ", with repeated misses on the same lift" : ""
      }.` :
      "";

  return [performanceText, completionText, topSetText, rpeDriftText, missedRepText]
    .filter(Boolean)
    .join(" ");
}

export function buildTrainingCheckInObjectiveSummary({
  plan = {},
  completedDays = [],
  prompt = null,
  trainingPerformanceState = {},
  strengthAssessmentState = {},
} = {}) {
  if (!prompt?.weekNumber) {
    return null;
  }

  const weeksInScope =
    Array.isArray(prompt.weeksInScope) && prompt.weeksInScope.length > 0 ?
      prompt.weeksInScope :
      [prompt.weekNumber];
  const performanceSummary = getMostRelevantPerformanceTrend(
    trainingPerformanceState,
    prompt.weekNumber
  );
  const performanceEntriesForWindow = getPerformanceEntriesForCheckInWindow(
    performanceSummary.entries,
    weeksInScope,
    prompt.weekNumber
  );
  const rpeDriftSummary = classifyRpeDrift(performanceEntriesForWindow);
  const missedRepSummary = buildMissedRepSummary(
    trainingPerformanceState,
    weeksInScope,
    prompt.weekNumber
  );
  const strengthSummary = getMostRelevantLiftTrend(
    strengthAssessmentState,
    prompt.weekNumber
  );
  const completionSummary = buildCompletionSummary(
    plan,
    completedDays,
    weeksInScope,
    trainingPerformanceState
  );
  const resolvedTrend =
    performanceSummary.trend !== "not_enough_data" ?
      performanceSummary.trend :
      strengthSummary.trend;
  const resolvedLiftName =
    performanceSummary.trend !== "not_enough_data" ?
      performanceSummary.liftName :
      strengthSummary.liftName;
  const resolvedExposureCount =
    performanceSummary.trend !== "not_enough_data" ?
      performanceSummary.exposureCount :
      strengthSummary.exposureCount;
  const resolvedChangePercent =
    performanceSummary.trend !== "not_enough_data" ?
      performanceSummary.changePercent ?? null :
      strengthSummary.changePercent ?? null;
  const trendSource =
    performanceSummary.trend !== "not_enough_data" ? "performance" :
    strengthSummary.trend !== "not_enough_data" ? "strength_assessment" :
    "none";

  return {
    performanceTrend: performanceSummary.trend,
    performanceLiftName: performanceSummary.liftName,
    performanceExposureCount: performanceSummary.exposureCount,
    performanceChangePercent: performanceSummary.changePercent ?? null,
    performanceMetricLabel: performanceSummary.metricLabel,
    performanceTrackingStrategy: performanceSummary.strategy || "",
    strengthAssessmentTrend: strengthSummary.trend,
    strengthAssessmentLiftName: strengthSummary.liftName,
    strengthAssessmentExposureCount: strengthSummary.exposureCount,
    strengthAssessmentChangePercent: strengthSummary.changePercent ?? null,
    strengthTrendSource: trendSource,
    strengthTrend: resolvedTrend,
    strengthLiftName: resolvedLiftName,
    strengthExposureCount: resolvedExposureCount,
    strengthChangePercent: resolvedChangePercent,
    completionRate: completionSummary.completionRate,
    completedCount: completionSummary.completedCount,
    totalCount: completionSummary.totalCount,
    missedSessions: completionSummary.missedSessions,
    topSetCompletionRate: completionSummary.topSetCompletionRate,
    loggedTopSetCount: completionSummary.loggedTopSetCount,
    totalTrackedTopSetCount: completionSummary.totalTrackedTopSetCount,
    skippedTopSetCount: completionSummary.skippedTopSetCount,
    averageRpeDrift: rpeDriftSummary.averageDrift,
    rpeDriftTrend: rpeDriftSummary.trend,
    rpeDriftExposureCount: rpeDriftSummary.exposureCount,
    missedRepCount: missedRepSummary.missedRepCount,
    missedRepPainCount: missedRepSummary.missedRepPainCount,
    missedRepTechnicalCount: missedRepSummary.missedRepTechnicalCount,
    missedRepFatigueCount: missedRepSummary.missedRepFatigueCount,
    repeatedMissedRepCount: missedRepSummary.repeatedMissedRepCount,
    missedRepLiftNames: missedRepSummary.missedRepLiftNames,
    complianceTrend: completionSummary.complianceTrend,
    summary: buildObjectiveSummarySentence({
      performanceTrend: performanceSummary.trend,
      performanceLiftName: performanceSummary.liftName,
      performanceExposureCount: performanceSummary.exposureCount,
      performanceMetricLabel: performanceSummary.metricLabel,
      strengthTrend: strengthSummary.trend,
      strengthLiftName: strengthSummary.liftName,
      strengthExposureCount: strengthSummary.exposureCount,
      completionRate: completionSummary.completionRate,
      completedCount: completionSummary.completedCount,
      totalCount: completionSummary.totalCount,
      topSetCompletionRate: completionSummary.topSetCompletionRate,
      loggedTopSetCount: completionSummary.loggedTopSetCount,
      totalTrackedTopSetCount: completionSummary.totalTrackedTopSetCount,
      skippedTopSetCount: completionSummary.skippedTopSetCount,
      averageRpeDrift: rpeDriftSummary.averageDrift,
      rpeDriftTrend: rpeDriftSummary.trend,
      rpeDriftExposureCount: rpeDriftSummary.exposureCount,
      missedRepCount: missedRepSummary.missedRepCount,
      missedRepPainCount: missedRepSummary.missedRepPainCount,
      repeatedMissedRepCount: missedRepSummary.repeatedMissedRepCount,
      missedRepLiftNames: missedRepSummary.missedRepLiftNames,
    }),
  };
}

function getAlternativeLoadingStrategies(currentLoadingStrategy = "") {
  const normalizedLoadingStrategy = normalizeLoadingStrategy(currentLoadingStrategy);
  return normalizedLoadingStrategy ?
    LOADING_STRATEGY_ALTERNATIVES[normalizedLoadingStrategy] || ["flat_loading"] :
    ["flat_loading", "ascending_pyramid"];
}

function hasWeekCapability(plan = {}, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const targetWeekNumber = getCurrentTrainingDay(normalizedPlan, completedDays)?.week || null;

  if (!targetWeekNumber) {
    return {
      targetWeekNumber: null,
      canMicroAdjust: false,
      canDeload: false,
      canChangeScheme: false,
      canChangeExercise: false,
    };
  }

  const targetWeek = normalizedPlan.weeks.find((week) => week.week === targetWeekNumber);
  const exercises = targetWeek?.days.flatMap((day) => day.exercises || []) || [];

  return {
    targetWeekNumber,
    canMicroAdjust: exercises.length > 0,
    canDeload: exercises.length > 0,
    canChangeScheme: exercises.some((exercise) => exercise?.percentagePrescription),
    canChangeExercise: exercises.some(
      (exercise) => Array.isArray(exercise?.substitutionOptions) && exercise.substitutionOptions.length > 1
    ),
  };
}

function resolveMergedTrend(subjectiveProgress, objectiveStrengthTrend) {
  const subjectiveTrend =
    subjectiveProgress === "improving" ? "up" :
    subjectiveProgress === "regressing" ? "down" :
    subjectiveProgress === "flat" ? "flat" :
    "";

  if (
    objectiveStrengthTrend === "up" ||
    objectiveStrengthTrend === "down"
  ) {
    return objectiveStrengthTrend;
  }

  if (objectiveStrengthTrend === "flat" && subjectiveTrend) {
    return subjectiveTrend;
  }

  return subjectiveTrend || objectiveStrengthTrend || "flat";
}

function buildActionOption({
  type,
  label,
  summary,
  targetLoadingStrategy = "",
}) {
  return {
    type,
    label,
    summary,
    targetLoadingStrategy: normalizeLoadingStrategy(targetLoadingStrategy),
  };
}

function dedupeActionOptions(options = []) {
  const seen = new Set();

  return options.filter((option) => {
    const normalizedOption = normalizeActionOption(option);

    if (!normalizedOption) {
      return false;
    }

    const key = `${normalizedOption.type}:${normalizedOption.targetLoadingStrategy || ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function buildTrainingCheckInRecommendation({
  prompt = null,
  questionnaire = {},
  plan = {},
  completedDays = [],
  answers = {},
  objectiveSummary = {},
} = {}) {
  if (!prompt?.weekNumber) {
    return null;
  }

  const normalizedAnswers = normalizeSubjectiveAnswers(answers);
  const capabilitySummary = hasWeekCapability(plan, completedDays);
  const objectiveTrend = normalizeString(
    objectiveSummary?.performanceTrend,
    normalizeString(objectiveSummary?.strengthTrend)
  );
  const complianceTrend = normalizeString(objectiveSummary?.complianceTrend);
  const rpeDriftTrend = normalizeString(objectiveSummary?.rpeDriftTrend);
  const missedRepCount = parseNonNegativeInteger(objectiveSummary?.missedRepCount) || 0;
  const missedRepPainCount =
    parseNonNegativeInteger(objectiveSummary?.missedRepPainCount) || 0;
  const repeatedMissedRepCount =
    parseNonNegativeInteger(objectiveSummary?.repeatedMissedRepCount) || 0;
  const mergedTrend = resolveMergedTrend(
    normalizedAnswers.progress,
    objectiveTrend
  );
  const hasStallSignal = mergedTrend === "flat" || mergedTrend === "down";
  const objectiveFatigueHigh = rpeDriftTrend === "high";
  const objectiveFatigueRaised =
    objectiveFatigueHigh || rpeDriftTrend === "elevated";
  const schemeSupportFlags = [
    normalizedAnswers.enjoyment === "bored",
    complianceTrend === "dropping",
    objectiveFatigueRaised,
  ].filter(Boolean).length;
  const allowSchemeChange =
    missedRepCount === 0 &&
    (
      prompt.type === CHECK_IN_TYPES.end_of_block ||
      (hasStallSignal && schemeSupportFlags >= 1)
    );
  const preferSchemeChange =
    capabilitySummary.canChangeScheme &&
    allowSchemeChange &&
    (
      prompt.type === CHECK_IN_TYPES.end_of_block ?
        hasStallSignal :
        schemeSupportFlags >= 2 ||
        (mergedTrend === "down" &&
          (complianceTrend === "dropping" || objectiveFatigueHigh))
    );
  const alternativeLoadingStrategies = capabilitySummary.canChangeScheme ?
    getAlternativeLoadingStrategies(questionnaire?.loadingStrategy).slice(0, 2) :
    [];

  let recommendedAction = buildActionOption({
    type: RECOMMENDATION_ACTION_TYPES.keep,
    label: "Keep plan",
    summary: "Stay with the current structure and keep collecting clean data.",
  });
  let explanation =
    "Progress and fatigue do not suggest a meaningful change right now.";

  if (
    normalizedAnswers.pain === "affects_training" &&
    capabilitySummary.canChangeExercise
  ) {
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.change_exercise,
      label: "Swap variation",
      summary: "Change the irritated lift variation and stay in a pain-free range.",
    });
    explanation =
      "Pain is affecting training, so changing the exercise variation matters more than changing the loading scheme.";
  } else if (
    missedRepPainCount > 0 &&
    capabilitySummary.canChangeExercise
  ) {
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.change_exercise,
      label: "Swap variation",
      summary: "Pain-related missed reps should move to a pain-free variation.",
    });
    explanation =
      "A missed rep was pain-related, so the next adjustment should protect the athlete before changing load structure.";
  } else if (
    missedRepCount > 0 &&
    capabilitySummary.canMicroAdjust
  ) {
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.freeze_progression,
      label: repeatedMissedRepCount >= 2 ? "Freeze progression" : "Repeat load",
      summary:
        repeatedMissedRepCount >= 2 ?
          "Do not advance this lift yet; repeat the week or lower the training max slightly." :
          "Repeat the current loading target before adding more.",
    });
    explanation =
      repeatedMissedRepCount >= 2 ?
        "Repeated misses on the same lift are a progression signal, so freezing or slightly lowering the next exposure beats changing the whole scheme." :
        "A missed rep should first be handled as a dose adjustment, not a scheme change.";
  } else if (
    (normalizedAnswers.fatigue === "beat_up" || objectiveFatigueHigh) &&
    capabilitySummary.canDeload
  ) {
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.deload,
      label: "Deload 1 week",
      summary: "Reduce volume next week while keeping the overall structure.",
    });
    explanation =
      objectiveFatigueHigh && normalizedAnswers.fatigue !== "beat_up" ?
        "Tracked top sets are coming in much harder than planned, so a deload makes more sense than changing the structure yet." :
        "Fatigue is high, so the app should pull volume down for a week before changing the structure.";
  } else if (
    hasStallSignal &&
    preferSchemeChange
  ) {
    const targetLoadingStrategy = alternativeLoadingStrategies[0] || "flat_loading";
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.change_scheme,
      label: `Switch to ${targetLoadingStrategy.replace(/_/g, " ")}`,
      summary: "Keep the main stimulus but change the loading structure.",
      targetLoadingStrategy,
    });
    explanation =
      prompt.type === CHECK_IN_TYPES.end_of_block ?
        "The block is ending with stall signals in place, so changing the loading structure is reasonable now." :
        "The app has enough stall flags to justify a loading change instead of only a small dose tweak.";
  } else if (
    hasStallSignal &&
    capabilitySummary.canMicroAdjust
  ) {
    recommendedAction = buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.micro_adjust,
      label: "Small progression",
      summary: "Add a conservative dose bump before changing the whole structure.",
    });
    explanation =
      "Performance looks flat enough to justify a small dose tweak first while keeping the scheme stable.";
  } else if (
    normalizedAnswers.enjoyment === "bored" &&
    mergedTrend === "up" &&
    capabilitySummary.canChangeScheme
  ) {
    explanation =
      "Progress still looks good, so keeping the plan is safest, but a novelty loading swap is reasonable if you want variety.";
  }

  const allOptions = dedupeActionOptions([
    recommendedAction,
    capabilitySummary.canDeload ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.deload,
        label: "Deload 1 week",
        summary: "Cut next week's volume and reassess after the rebound.",
      }) :
      null,
    capabilitySummary.canMicroAdjust ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.micro_adjust,
        label: "Small progression",
        summary: "Keep the structure and make one conservative load or set bump.",
      }) :
      null,
    missedRepCount > 0 && capabilitySummary.canMicroAdjust ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.freeze_progression,
        label: "Freeze progression",
        summary: "Repeat current loading before progressing after a missed rep.",
      }) :
      null,
    allowSchemeChange && capabilitySummary.canChangeScheme ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.change_scheme,
        label: `Switch to ${(alternativeLoadingStrategies[0] || "flat_loading").replace(/_/g, " ")}`,
        summary: "Try a different loading pattern without changing the main lifts.",
        targetLoadingStrategy: alternativeLoadingStrategies[0] || "flat_loading",
      }) :
      null,
    allowSchemeChange && capabilitySummary.canChangeScheme && alternativeLoadingStrategies[1] ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.change_scheme,
        label: `Switch to ${alternativeLoadingStrategies[1].replace(/_/g, " ")}`,
        summary: "Use a second scheme option if the first one does not fit.",
        targetLoadingStrategy: alternativeLoadingStrategies[1],
      }) :
      null,
    capabilitySummary.canChangeExercise ?
      buildActionOption({
        type: RECOMMENDATION_ACTION_TYPES.change_exercise,
        label: "Swap variation",
        summary: "Rotate to a comparable lift variation for the next week.",
      }) :
      null,
    buildActionOption({
      type: RECOMMENDATION_ACTION_TYPES.keep,
      label: "Keep plan",
      summary: "Stay with the current plan and gather another clean exposure.",
    }),
  ]);
  const keepOption = allOptions.find((option) => option.type === RECOMMENDATION_ACTION_TYPES.keep);
  const options = allOptions
    .filter((option) => option.type !== RECOMMENDATION_ACTION_TYPES.keep)
    .slice(0, 3);

  if (keepOption) {
    options.push(keepOption);
  }

  return {
    answers: normalizedAnswers,
    mergedTrend,
    allowSchemeChange,
    recommendedAction,
    explanation,
    options,
    targetWeekNumber: capabilitySummary.targetWeekNumber,
  };
}

function scaleSetString(value, multiplier) {
  const source = normalizeString(value);

  if (!source) {
    return source;
  }

  return source.replace(/\d+(\.\d+)?/g, (match) => {
    const parsedValue = Number.parseFloat(match);

    if (!Number.isFinite(parsedValue)) {
      return match;
    }

    const scaledValue = Math.max(1, Math.round(parsedValue * multiplier));
    return String(scaledValue);
  });
}

function appendExerciseNote(exercise = {}, note = "") {
  const normalizedNote = normalizeString(note);
  if (!normalizedNote) {
    return exercise;
  }

  const baseNotes = normalizeString(exercise.notes);
  return {
    ...exercise,
    notes: baseNotes ? `${baseNotes} ${normalizedNote}` : normalizedNote,
  };
}

function updateWorkingSetsWithStrategy(workingSets = [], targetLoadingStrategy = "") {
  const normalizedTargetStrategy = normalizeLoadingStrategy(targetLoadingStrategy);

  if (!normalizedTargetStrategy || workingSets.length === 0) {
    return workingSets;
  }

  const expandedSets = workingSets.flatMap((workingSet) =>
    Array.from({ length: workingSet.count || 1 }, () => ({
      count: 1,
      reps: workingSet.reps,
      percent1RM: workingSet.percent1RM,
    }))
  );
  const averagePercent =
    expandedSets.reduce((total, set) => total + (set.percent1RM || 0), 0) /
    expandedSets.length;
  const startPercent = averagePercent - ((expandedSets.length - 1) * 1.25);
  const endPercent = averagePercent + ((expandedSets.length - 1) * 1.25);
  let remappedPercents = expandedSets.map((set) => set.percent1RM || averagePercent);

  if (normalizedTargetStrategy === "flat_loading") {
    remappedPercents = expandedSets.map(() => roundToTenth(averagePercent));
  } else if (normalizedTargetStrategy === "ascending_pyramid") {
    remappedPercents = expandedSets.map((_, index) =>
      roundToTenth(startPercent + index * 2.5)
    );
  } else if (normalizedTargetStrategy === "descending_pyramid") {
    remappedPercents = expandedSets.map((_, index) =>
      roundToTenth(endPercent - index * 2.5)
    );
  } else if (normalizedTargetStrategy === "double_pyramid") {
    const midpoint = Math.floor(expandedSets.length / 2);
    remappedPercents = expandedSets.map((_, index) => {
      const step = index <= midpoint ? index : expandedSets.length - 1 - index;
      return roundToTenth(startPercent + step * 2.5);
    });
  }

  return expandedSets.map((set, index) => ({
    count: 1,
    reps: set.reps,
    percent1RM: remappedPercents[index],
    relativeIntensity:
      calculateRelativeIntensityFromPercentOneRepMax(remappedPercents[index], set.reps),
  }));
}

function updateWeek(plan = {}, targetWeekNumber, updateDay) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return {
    ...normalizedPlan,
    weeks: normalizedPlan.weeks.map((week) => {
      if (week.week !== targetWeekNumber) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day) => updateDay(day)),
      };
    }),
  };
}

function applyDeload(plan = {}, completedDays = []) {
  const targetWeekNumber = getCurrentTrainingDay(plan, completedDays)?.week || null;

  if (!targetWeekNumber) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No future training week was available to deload.",
    };
  }

  return {
    plan: updateWeek(plan, targetWeekNumber, (day) => ({
      ...day,
      adjustmentSummary: "Check-in adjustment: deload week applied to protect recovery.",
      sessionProfile: {
        ...day.sessionProfile,
        stressLevel:
          day.sessionProfile?.stressLevel === "high" ? "moderate" : day.sessionProfile?.stressLevel,
      },
      exercises: (day.exercises || []).map((exercise) =>
        appendExerciseNote(
          {
            ...exercise,
            sets: scaleSetString(exercise.sets, 0.7),
            percentagePrescription: exercise.percentagePrescription ?
              {
                ...exercise.percentagePrescription,
                workingSets: exercise.percentagePrescription.workingSets.map((workingSet) => ({
                  ...workingSet,
                  count: Math.max(1, Math.round((workingSet.count || 1) * 0.7)),
                })),
              } :
              exercise.percentagePrescription,
          },
          "Deload week: keep the load crisp, cut volume about 20-40%, and stay well clear of grinding."
        )
      ),
    })),
    resultSummary: `Deload applied to week ${targetWeekNumber}.`,
  };
}

function applyMicroAdjust(plan = {}, completedDays = []) {
  const targetWeekNumber = getCurrentTrainingDay(plan, completedDays)?.week || null;
  let adjustmentApplied = false;

  if (!targetWeekNumber) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No future training week was available for a small progression.",
    };
  }

  const nextPlan = updateWeek(plan, targetWeekNumber, (day) => ({
    ...day,
    exercises: (day.exercises || []).map((exercise) => {
      if (adjustmentApplied) {
        return exercise;
      }

      if (exercise?.percentagePrescription?.workingSets?.length) {
        adjustmentApplied = true;
        return appendExerciseNote(
          {
            ...exercise,
            percentagePrescription: {
              ...exercise.percentagePrescription,
              workingSets: exercise.percentagePrescription.workingSets.map((workingSet) => ({
                ...workingSet,
                percent1RM: roundToTenth(Math.min((workingSet.percent1RM || 0) + 2.5, 95)),
                relativeIntensity:
                  calculateRelativeIntensityFromPercentOneRepMax(
                    Math.min((workingSet.percent1RM || 0) + 2.5, 95),
                    workingSet.reps
                  ),
              })),
            },
          },
          "Small dose bump: add a conservative load increase if technique stays clean."
        );
      }

      if (normalizeString(exercise?.sets)) {
        adjustmentApplied = true;
        return appendExerciseNote(
          {
            ...exercise,
            sets: scaleSetString(exercise.sets, 1.15),
          },
          "Small dose bump: add one modest progression step and stop before quality drops."
        );
      }

      return exercise;
    }),
  }));

  return {
    plan: nextPlan,
    resultSummary:
      adjustmentApplied ?
        `A small progression was applied to week ${targetWeekNumber}.` :
        "No adjustable exercise was found for a small progression.",
  };
}

function applyFreezeProgression(plan = {}, completedDays = []) {
  const targetWeekNumber = getCurrentTrainingDay(plan, completedDays)?.week || null;
  let adjustmentApplied = false;

  if (!targetWeekNumber) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No future training week was available to freeze progression.",
    };
  }

  const nextPlan = updateWeek(plan, targetWeekNumber, (day) => ({
    ...day,
    adjustmentSummary:
      "Check-in adjustment: progression frozen after a missed rep signal.",
    exercises: (day.exercises || []).map((exercise) => {
      if (adjustmentApplied) {
        return exercise;
      }

      if (exercise?.percentagePrescription || exercise?.performanceTarget) {
        adjustmentApplied = true;
        return appendExerciseNote(
          exercise,
          "Missed-rep adjustment: repeat the current loading target before progressing."
        );
      }

      return exercise;
    }),
  }));

  return {
    plan: nextPlan,
    resultSummary:
      adjustmentApplied ?
        `Progression was frozen for week ${targetWeekNumber}.` :
        "No monitored lift was found to freeze progression.",
  };
}

function applyLoadingSchemeChange(
  plan = {},
  completedDays = [],
  targetLoadingStrategy = ""
) {
  const targetWeekNumber = getCurrentTrainingDay(plan, completedDays)?.week || null;
  const normalizedTargetLoadingStrategy = normalizeLoadingStrategy(targetLoadingStrategy);

  if (!targetWeekNumber || !normalizedTargetLoadingStrategy) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No future percentage-based week was available for a loading-scheme change.",
    };
  }

  let changeApplied = false;
  const nextPlan = updateWeek(plan, targetWeekNumber, (day) => ({
    ...day,
    exercises: (day.exercises || []).map((exercise) => {
      if (!exercise?.percentagePrescription?.workingSets?.length) {
        return exercise;
      }

      changeApplied = true;
      return appendExerciseNote(
        {
          ...exercise,
          percentagePrescription: {
            ...exercise.percentagePrescription,
            loadingStrategy: normalizedTargetLoadingStrategy,
            workingSets: updateWorkingSetsWithStrategy(
              exercise.percentagePrescription.workingSets,
              normalizedTargetLoadingStrategy
            ),
          },
        },
        `Loading structure updated to ${normalizedTargetLoadingStrategy.replace(/_/g, " ")} for the next week.`
      );
    }),
  }));

  return {
    plan: nextPlan,
    resultSummary:
      changeApplied ?
        `Week ${targetWeekNumber} now uses ${normalizedTargetLoadingStrategy.replace(/_/g, " ")}.` :
        "No percentage-based main lift was available for a loading-scheme change.",
  };
}

function applyExerciseVariationChange(plan = {}, completedDays = []) {
  const targetWeekNumber = getCurrentTrainingDay(plan, completedDays)?.week || null;

  if (!targetWeekNumber) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No future training week was available for an exercise swap.",
    };
  }

  let swapApplied = false;
  const nextPlan = updateWeek(plan, targetWeekNumber, (day) => ({
    ...day,
    exercises: (day.exercises || []).map((exercise) => {
      if (swapApplied) {
        return exercise;
      }

      const options = Array.isArray(exercise?.substitutionOptions) ?
        exercise.substitutionOptions :
        [];
      const currentId = normalizeString(exercise?.selectedSubstitutionId);
      const nextOption = options.find((option) => option?.id !== currentId);

      if (!nextOption) {
        return exercise;
      }

      swapApplied = true;
      return appendExerciseNote(
        applyExerciseSubstitution(exercise, nextOption.id),
        "Temporary variation swap: stay in a pain-free range and use the lower end of the loading target."
      );
    }),
  }));

  return {
    plan: nextPlan,
    resultSummary:
      swapApplied ?
        `A variation swap was applied to week ${targetWeekNumber}.` :
        "No alternative exercise variation was available in the next week.",
  };
}

function parseSessionKey(sessionKey = "") {
  const [weekPart, dayPart] = normalizeString(sessionKey).split("-");
  const weekNumber = parsePositiveInteger(weekPart);
  const dayNumber = parsePositiveInteger(dayPart);

  return {
    weekNumber,
    dayNumber,
  };
}

function isFutureTrainingSlot(weekNumber, dayNumber, reference = {}) {
  if (!reference.weekNumber || !reference.dayNumber) {
    return true;
  }

  if (weekNumber !== reference.weekNumber) {
    return weekNumber > reference.weekNumber;
  }

  return dayNumber > reference.dayNumber;
}

function getExerciseLiftKey(exercise = {}) {
  return toLiftKey(
    exercise?.percentagePrescription?.referenceLiftName ||
      exercise?.performanceTarget?.liftName ||
      exercise?.strengthAssessment?.liftName ||
      exercise?.name
  );
}

function reducePercentagePrescription(percentagePrescription = {}, reductionPercent = 0) {
  const normalizedReduction = Math.max(0, parseFiniteNumber(reductionPercent) || 0);

  if (!percentagePrescription?.workingSets?.length || normalizedReduction <= 0) {
    return percentagePrescription;
  }

  return {
    ...percentagePrescription,
    workingSets: percentagePrescription.workingSets.map((workingSet) => {
      const nextPercent = roundToTenth(
        Math.max(0, (workingSet.percent1RM || 0) - normalizedReduction)
      );

      return {
        ...workingSet,
        percent1RM: nextPercent,
        relativeIntensity:
          calculateRelativeIntensityFromPercentOneRepMax(
            nextPercent,
            workingSet.reps
          ),
      };
    }),
  };
}

export function applyMissedRepPlanAdjustment({
  plan = {},
  completedDays = [],
  sessionKey = "",
  entries = [],
  questionnaire = {},
} = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const missedEntries = (Array.isArray(entries) ? entries : []).filter(
    (entry) => entry?.missedRep
  );

  if (missedEntries.length === 0) {
    return {
      plan: normalizedPlan,
      resultSummary: "No missed-rep adjustment was needed.",
    };
  }

  const referenceSlot = parseSessionKey(sessionKey);
  let adjustmentCount = 0;
  let nextPlan = normalizedPlan;

  missedEntries.forEach((entry) => {
    const targetLiftKey = toLiftKey(entry?.liftName || entry?.sourceExerciseName);
    const recommendation = entry?.missedRepRecommendation || {};
    const planAdjustment =
      recommendation.planAdjustment && typeof recommendation.planAdjustment === "object"
        ? recommendation.planAdjustment
        : {};
    const adjustmentType = normalizeString(planAdjustment.type, "freeze_progression");
    const reductionPercent =
      parseFiniteNumber(planAdjustment.loadReductionPercent) ||
      (questionnaire?.liftIntensityMethod === "rpe" ? 0 : 5);
    let appliedForEntry = false;

    nextPlan = {
      ...nextPlan,
      weeks: nextPlan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => {
          if (
            appliedForEntry ||
            !isFutureTrainingSlot(week.week, day.day, referenceSlot)
          ) {
            return day;
          }

          return {
            ...day,
            exercises: (day.exercises || []).map((exercise) => {
              if (appliedForEntry || getExerciseLiftKey(exercise) !== targetLiftKey) {
                return exercise;
              }

              appliedForEntry = true;
              adjustmentCount += 1;

              if (adjustmentType === "swap_variation") {
                const options = Array.isArray(exercise?.substitutionOptions)
                  ? exercise.substitutionOptions
                  : [];
                const currentId = normalizeString(exercise?.selectedSubstitutionId);
                const nextOption = options.find((option) => option?.id !== currentId);

                if (nextOption) {
                  return appendExerciseNote(
                    applyExerciseSubstitution(exercise, nextOption.id),
                    "Missed-rep adjustment: pain was logged, so use a pain-free variation and keep the load conservative."
                  );
                }
              }

              const nextExercise = {
                ...exercise,
                percentagePrescription:
                  exercise.percentagePrescription && reductionPercent > 0
                    ? reducePercentagePrescription(
                        exercise.percentagePrescription,
                        reductionPercent
                      )
                    : exercise.percentagePrescription,
              };

              return appendExerciseNote(
                nextExercise,
                reductionPercent > 0
                  ? `Missed-rep adjustment: reduce the next exposure by about ${reductionPercent}% and repeat before progressing.`
                  : "Missed-rep adjustment: repeat the current loading target before progressing."
              );
            }),
          };
        }),
      })),
    };
  });

  return {
    plan: normalizeTrainingPlan(nextPlan),
    resultSummary:
      adjustmentCount > 0
        ? `${adjustmentCount} missed-rep adjustment${adjustmentCount === 1 ? "" : "s"} applied to future exposures.`
        : "No future exposure matched the missed lift.",
  };
}

export function applyTrainingCheckInAction({
  plan = {},
  completedDays = [],
  action = {},
} = {}) {
  const normalizedAction = normalizeActionOption(action);

  if (!normalizedAction) {
    return {
      plan: normalizeTrainingPlan(plan),
      resultSummary: "No action was applied.",
    };
  }

  switch (normalizedAction.type) {
    case RECOMMENDATION_ACTION_TYPES.micro_adjust:
      return applyMicroAdjust(plan, completedDays);
    case RECOMMENDATION_ACTION_TYPES.freeze_progression:
      return applyFreezeProgression(plan, completedDays);
    case RECOMMENDATION_ACTION_TYPES.deload:
      return applyDeload(plan, completedDays);
    case RECOMMENDATION_ACTION_TYPES.change_scheme:
      return applyLoadingSchemeChange(
        plan,
        completedDays,
        normalizedAction.targetLoadingStrategy
      );
    case RECOMMENDATION_ACTION_TYPES.change_exercise:
      return applyExerciseVariationChange(plan, completedDays);
    case RECOMMENDATION_ACTION_TYPES.keep:
    default:
      return {
        plan: normalizeTrainingPlan(plan),
        resultSummary: "The current plan was kept as-is.",
      };
  }
}

export function createTrainingCheckInHistoryEntry({
  prompt = null,
  answers = {},
  objectiveSummary = {},
  recommendation = {},
  appliedAction = {},
  resultSummary = "",
  createdAt = new Date().toISOString(),
} = {}) {
  if (!prompt?.type || !prompt?.weekNumber) {
    return null;
  }

  return normalizeTrainingCheckInEntry({
    id: `${prompt.type}-${prompt.weekNumber}-${createdAt}`,
    type: prompt.type,
    weekNumber: prompt.weekNumber,
    title: prompt.title,
    summary: prompt.summary,
    answers,
    objectiveSummary,
    recommendation,
    appliedAction,
    resultSummary,
    createdAt,
    appliedAt: createdAt,
  });
}
