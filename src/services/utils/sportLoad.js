import {
  APP_LOGIC_SETTINGS_DEFAULTS,
  getSportLoadMultiplier,
  normalizeSportLoadLevel,
} from "../../constants/appLogicSettings.js";
import { normalizeTrainingPlan } from "./trainingPlan.js";

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function parseFiniteNumber(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getCompletedDayKey(weekNumber, dayNumber) {
  return `${weekNumber}-${dayNumber}`;
}

function getCompletedDaySet(completedDays = []) {
  return new Set(Array.isArray(completedDays) ? completedDays : []);
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function stripSportLoadMetadata(week = {}) {
  const {
    sportLoadLevel: _sportLoadLevel,
    sportLoadMultiplier: _sportLoadMultiplier,
    sportLoadBaseSnapshot: _sportLoadBaseSnapshot,
    ...rest
  } = week && typeof week === "object" ? week : {};

  return rest;
}

function parseSetCountFromText(value = "") {
  const normalizedValue = normalizeString(value).replace(/[–—]/g, "-");

  if (!normalizedValue) {
    return 0;
  }

  const rangeMatch = normalizedValue.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);

  if (rangeMatch) {
    const low = Number.parseFloat(rangeMatch[1]);
    const high = Number.parseFloat(rangeMatch[2]);

    if (Number.isFinite(low) && Number.isFinite(high)) {
      return Math.max(1, Math.round((low + high) / 2));
    }
  }

  const explicitSetMatch = normalizedValue.match(
    /(\d+(?:\.\d+)?)\s*(?:sets?|set|x)\b/i
  );

  if (explicitSetMatch) {
    const parsedValue = Number.parseFloat(explicitSetMatch[1]);
    return Number.isFinite(parsedValue) ? Math.max(1, Math.round(parsedValue)) : 0;
  }

  const numericMatches = normalizedValue.match(/\d+(?:\.\d+)?/g);

  if (!numericMatches || numericMatches.length === 0) {
    return 0;
  }

  const firstValue = Number.parseFloat(numericMatches[0]);
  return Number.isFinite(firstValue) ? Math.max(1, Math.round(firstValue)) : 0;
}

function getExercisePlannedSetCount(exercise = {}) {
  const workingSets = Array.isArray(exercise?.percentagePrescription?.workingSets)
    ? exercise.percentagePrescription.workingSets
    : [];

  if (workingSets.length > 0) {
    return workingSets.reduce((total, workingSet) => {
      const count = parseFiniteNumber(workingSet?.count);
      return total + (count && count > 0 ? Math.round(count) : 0);
    }, 0);
  }

  return parseSetCountFromText(exercise?.sets);
}

function getDayPlannedSetCount(day = {}) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];

  return exercises.reduce(
    (total, exercise) => total + getExercisePlannedSetCount(exercise),
    0
  );
}

function getSportLoadAdjustmentProfile(level) {
  switch (normalizeSportLoadLevel(level)) {
    case 4:
      return {
        overallMultiplier: 0.5,
        mainLiftMultiplier: 0.5,
        accessoryMultiplier: 0.35,
        minimumMainLiftSets: 1,
      };
    case 3:
      return {
        overallMultiplier: 0.7,
        mainLiftMultiplier: 0.7,
        accessoryMultiplier: 0.55,
        minimumMainLiftSets: 2,
      };
    case 2:
      return {
        overallMultiplier: 0.9,
        mainLiftMultiplier: 0.9,
        accessoryMultiplier: 0.85,
        minimumMainLiftSets: 2,
      };
    case 1:
    default:
      return {
        overallMultiplier: 1,
        mainLiftMultiplier: 1,
        accessoryMultiplier: 1,
        minimumMainLiftSets: 2,
      };
  }
}

function isPrimaryStrengthExercise(exercise = {}) {
  return Boolean(
    exercise?.percentagePrescription ||
      exercise?.performanceTarget ||
      exercise?.strengthAssessment
  );
}

function getReducedSetCount(targetCount, multiplier, minimumSetCount = 1) {
  const normalizedTargetCount = Number.isFinite(targetCount) ? targetCount : 0;

  if (normalizedTargetCount <= 0) {
    return 0;
  }

  return Math.min(
    normalizedTargetCount,
    Math.max(minimumSetCount, Math.round(normalizedTargetCount * multiplier))
  );
}

function scaleSetString(value, multiplier) {
  const source = normalizeString(value);

  if (!source) {
    return source;
  }

  let replacementIndex = 0;
  const numericMatches = source.match(/\d+(\.\d+)?/g) || [];
  const replacementValues = numericMatches.map((match) => {
    const parsedValue = Number.parseFloat(match);

    if (!Number.isFinite(parsedValue)) {
      return match;
    }

    return String(Math.max(1, Math.round(parsedValue * multiplier)));
  });

  return source.replace(/\d+(\.\d+)?/g, () => {
    const nextValue = replacementValues[replacementIndex];
    replacementIndex += 1;
    return nextValue;
  });
}

function reduceWorkingSets(workingSets = [], multiplier, minimumSetCount = 1) {
  const expandedSets = workingSets.flatMap((workingSet, originalIndex) => {
    const count = parseFiniteNumber(workingSet?.count) || 1;

    return Array.from({ length: Math.max(1, Math.round(count)) }, () => ({
      originalIndex,
      reps: workingSet?.reps,
      percent1RM: parseFiniteNumber(workingSet?.percent1RM) || 0,
      relativeIntensity: workingSet?.relativeIntensity,
    }));
  });

  if (expandedSets.length === 0) {
    return [];
  }

  const targetSetCount = getReducedSetCount(
    expandedSets.length,
    multiplier,
    Math.min(minimumSetCount, expandedSets.length)
  );
  const preservedIndices = new Set(
    expandedSets
      .map((set, index) => ({
        index,
        percent1RM: set.percent1RM,
      }))
      .sort((left, right) => right.percent1RM - left.percent1RM || left.index - right.index)
      .slice(0, targetSetCount)
      .map((set) => set.index)
  );

  return workingSets
    .map((workingSet, originalIndex) => {
      const nextCount = expandedSets.filter(
        (set, expandedIndex) =>
          set.originalIndex === originalIndex && preservedIndices.has(expandedIndex)
      ).length;

      if (nextCount <= 0) {
        return null;
      }

      return {
        ...workingSet,
        count: nextCount,
      };
    })
    .filter(Boolean);
}

function scaleExerciseVolume(exercise = {}, level) {
  const safeExercise = exercise && typeof exercise === "object" ? exercise : {};
  const adjustmentProfile = getSportLoadAdjustmentProfile(level);
  const isPrimaryStrength = isPrimaryStrengthExercise(safeExercise);
  const percentagePrescription =
    safeExercise?.percentagePrescription &&
    typeof safeExercise.percentagePrescription === "object"
      ? safeExercise.percentagePrescription
      : null;
  const plannedSetCount = getExercisePlannedSetCount(safeExercise);
  const setMultiplier = isPrimaryStrength
    ? adjustmentProfile.mainLiftMultiplier
    : adjustmentProfile.accessoryMultiplier;
  const minimumSetCount = isPrimaryStrength && plannedSetCount >= 2
    ? Math.min(adjustmentProfile.minimumMainLiftSets, plannedSetCount)
    : 1;
  const scaledSetCount = getReducedSetCount(
    plannedSetCount,
    setMultiplier,
    minimumSetCount
  );
  const baseNotes = normalizeString(safeExercise.notes);
  const adjustmentNote =
    level >= 4 ?
      "Peak sport-load week: keep the main intensity exposure, cut fatigue hard, and skip extra accessory volume." :
    level === 3 ?
      "High sport-load week: trim accessories first, then back-off volume, while keeping quality on the main work." :
    level === 2 ?
      "Normal sport-load week: keep quality high and trim only a small amount of lower-priority volume." :
      "";

  return {
    ...safeExercise,
    sets: plannedSetCount > 0 ? scaleSetString(safeExercise.sets, scaledSetCount / plannedSetCount) : safeExercise.sets,
    percentagePrescription: percentagePrescription
      ? {
          ...percentagePrescription,
          workingSets: reduceWorkingSets(
            Array.isArray(percentagePrescription.workingSets)
              ? percentagePrescription.workingSets
              : [],
            setMultiplier,
            minimumSetCount
          ),
        }
      : percentagePrescription,
    notes: adjustmentNote ?
      (baseNotes ? `${baseNotes} ${adjustmentNote}` : adjustmentNote) :
      safeExercise.notes,
  };
}

function scaleDayVolume(day = {}, level) {
  return {
    ...day,
    exercises: Array.isArray(day?.exercises)
      ? day.exercises.map((exercise) => scaleExerciseVolume(exercise, level))
      : [],
  };
}

export function isTrainingWeekCompleted({
  plan = {},
  weekNumber,
  completedDays = [],
} = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const completedDaySet = getCompletedDaySet(completedDays);
  const targetWeek = normalizedPlan.weeks.find((week) => week.week === weekNumber);

  if (!targetWeek) {
    return false;
  }

  return targetWeek.days
    .filter((day) => day.status !== "skipped")
    .every((day) => completedDaySet.has(getCompletedDayKey(weekNumber, day.day)));
}

export function getCompletedWeekSetCount({
  plan = {},
  weekNumber,
  completedDays = [],
} = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const completedDaySet = getCompletedDaySet(completedDays);
  const targetWeek = normalizedPlan.weeks.find((week) => week.week === weekNumber);

  if (!targetWeek) {
    return 0;
  }

  return targetWeek.days.reduce((total, day) => {
    if (!completedDaySet.has(getCompletedDayKey(weekNumber, day.day))) {
      return total;
    }

    return total + getDayPlannedSetCount(day);
  }, 0);
}

export function deriveSportLoadLevelFromCompletedWeek({
  plan = {},
  weekNumber,
  completedDays = [],
  sessionsPerWeek = 0,
} = {}) {
  if (
    !isTrainingWeekCompleted({
      plan,
      weekNumber,
      completedDays,
    })
  ) {
    return null;
  }

  const normalizedPlan = normalizeTrainingPlan(plan);
  const targetWeek = normalizedPlan.weeks.find((week) => week.week === weekNumber);
  const completedSetCount = getCompletedWeekSetCount({
    plan: normalizedPlan,
    weekNumber,
    completedDays,
  });
  const plannedSessionCount =
    targetWeek?.days?.filter((day) => day.status !== "skipped").length || 0;
  const normalizedSessionsPerWeek =
    Number.isFinite(Number.parseInt(sessionsPerWeek, 10)) &&
    Number.parseInt(sessionsPerWeek, 10) > 0
      ? Number.parseInt(sessionsPerWeek, 10)
      : plannedSessionCount || 1;
  const lowThreshold = normalizedSessionsPerWeek * 8;
  const normalThreshold = normalizedSessionsPerWeek * 12;
  const highThreshold = normalizedSessionsPerWeek * 16;

  if (completedSetCount <= 0) {
    return APP_LOGIC_SETTINGS_DEFAULTS.sportLoadLevel;
  }

  if (completedSetCount < lowThreshold) {
    return 1;
  }

  if (completedSetCount <= normalThreshold) {
    return 2;
  }

  if (completedSetCount <= highThreshold) {
    return 3;
  }

  return 4;
}

export function applySportLoadLevelToPlanWeek(
  plan = {},
  targetWeekNumber,
  targetLevel,
  {
    completedDays = [],
    skipCompletedDays = false,
  } = {}
) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const normalizedTargetLevel = normalizeSportLoadLevel(targetLevel);
  const targetMultiplier = getSportLoadMultiplier(normalizedTargetLevel);
  const completedDaySet = getCompletedDaySet(completedDays);

  return {
    ...normalizedPlan,
    weeks: normalizedPlan.weeks.map((week) => {
      if (week.week !== targetWeekNumber) {
        return week;
      }

      const baseWeek =
        week?.sportLoadBaseSnapshot && typeof week.sportLoadBaseSnapshot === "object"
          ? cloneValue(week.sportLoadBaseSnapshot)
          : cloneValue(stripSportLoadMetadata(week));

      return {
        ...week,
        sportLoadLevel: normalizedTargetLevel,
        sportLoadMultiplier: targetMultiplier,
        sportLoadBaseSnapshot: baseWeek,
        days: baseWeek.days.map((baseDay, dayIndex) => {
          const currentDay = week.days?.[dayIndex] || baseDay;
          const isCompleted =
            skipCompletedDays &&
            completedDaySet.has(getCompletedDayKey(targetWeekNumber, currentDay.day));

          return isCompleted
            ? currentDay
            : scaleDayVolume(baseDay, normalizedTargetLevel);
        }),
      };
    }),
  };
}
