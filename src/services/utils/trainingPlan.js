import {
  getNormalizedWeekday,
  getWeekdayNameFromIndex,
} from "../../constants/weekdays.js";
import { normalizePerformanceTarget } from "./trainingPerformance.js";
import { normalizePercentagePrescription } from "./percentagePrescription.js";
import { normalizeStrengthAssessmentConfig } from "./strengthAssessment.js";

const SESSION_REGION_DEFINITIONS = Object.freeze([
  {
    value: "full_body",
    keywords: [
      "full body",
      "total body",
      "whole body",
      "clean",
      "snatch",
      "thruster",
      "carry",
      "swing",
      "complex",
    ],
  },
  {
    value: "lower_body",
    keywords: [
      "lower body",
      "leg",
      "legs",
      "hip",
      "glute",
      "quad",
      "hamstring",
      "calf",
      "squat",
      "deadlift",
      "hinge",
      "lunge",
      "split squat",
      "jump",
      "sprint",
      "sled",
      "step up",
    ],
  },
  {
    value: "upper_body",
    keywords: [
      "upper body",
      "chest",
      "back",
      "shoulder",
      "bench",
      "press",
      "row",
      "pull up",
      "chin up",
      "dip",
      "push up",
      "arm",
    ],
  },
  {
    value: "core",
    keywords: [
      "core",
      "trunk",
      "abs",
      "ab ",
      "plank",
      "anti rotation",
      "rotation",
      "brace",
    ],
  },
]);

const SESSION_QUALITY_DEFINITIONS = Object.freeze([
  {
    value: "force",
    keywords: ["force", "strength", "heavy", "max effort", "max", "grind"],
  },
  {
    value: "power",
    keywords: [
      "power",
      "explosive",
      "explosion",
      "jump",
      "plyo",
      "plyometric",
      "throw",
      "sprint",
      "clean",
      "snatch",
      "ballistic",
      "dynamic effort",
    ],
  },
  {
    value: "fatigue",
    keywords: [
      "fatigue",
      "conditioning",
      "capacity",
      "endurance",
      "interval",
      "circuit",
      "tempo",
      "emom",
      "amrap",
      "density",
      "aerobic",
      "anaerobic",
      "volume",
    ],
  },
  {
    value: "speed",
    keywords: ["speed", "quickness", "acceleration", "velocity"],
  },
  {
    value: "hypertrophy",
    keywords: ["hypertrophy", "muscle", "bodybuilding", "accessory"],
  },
  {
    value: "recovery",
    keywords: ["recovery", "mobility", "restore", "deload", "easy", "technique"],
  },
]);

const SESSION_STRESS_DEFINITIONS = Object.freeze([
  { value: "low", keywords: ["low", "easy", "recovery", "mobility", "deload"] },
  {
    value: "moderate",
    keywords: ["moderate", "medium", "controlled", "submax", "submaximal"],
  },
  { value: "high", keywords: ["high", "hard", "intense", "heavy", "max"] },
]);

const WEEKDAY_INDEX_LOOKUP = Object.freeze({
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
});

const DISALLOWED_TRAINING_PLAN_WRAPPER_KEYS = Object.freeze([
  "plan",
  "plans",
  "trainingPlan",
  "program",
  "planOptions",
  "options",
  "programs",
]);

function normalizeString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmedValue = value.trim();
  return trimmedValue || fallback;
}

function toOptionId(name, fallback = "default") {
  const normalizedName = normalizeString(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalizedName || fallback;
}

function parsePositiveInteger(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function omitUndefinedObjectFields(value = {}) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}

function parseWeekRange(value) {
  const numericMatches = normalizeString(value).match(/\d+/g);

  if (!numericMatches || numericMatches.length === 0) {
    return {
      weekStart: null,
      weekEnd: null,
    };
  }

  const firstWeek = parsePositiveInteger(numericMatches[0]);
  const secondWeek = parsePositiveInteger(
    numericMatches[numericMatches.length > 1 ? 1 : 0]
  );

  if (!firstWeek || !secondWeek) {
    return {
      weekStart: null,
      weekEnd: null,
    };
  }

  return {
    weekStart: Math.min(firstWeek, secondWeek),
    weekEnd: Math.max(firstWeek, secondWeek),
  };
}

function normalizePlanPhase(phase = {}, phaseIndex = 0) {
  const safePhase = phase && typeof phase === "object" ? phase : {};
  const parsedRange = parseWeekRange(
    safePhase.weeks || safePhase.weekRange || safePhase.range
  );
  const candidateStart =
    parsePositiveInteger(safePhase.weekStart) ||
    parsePositiveInteger(safePhase.startWeek) ||
    parsedRange.weekStart ||
    phaseIndex + 1;
  const candidateEnd =
    parsePositiveInteger(safePhase.weekEnd) ||
    parsePositiveInteger(safePhase.endWeek) ||
    parsedRange.weekEnd ||
    candidateStart;

  return omitUndefinedObjectFields({
    ...safePhase,
    label: normalizeString(
      safePhase.label,
      normalizeString(safePhase.phase || safePhase.name, `Phase ${phaseIndex + 1}`)
    ),
    weekStart: Math.min(candidateStart, candidateEnd),
    weekEnd: Math.max(candidateStart, candidateEnd),
    focus: normalizeString(
      safePhase.focus,
      normalizeString(
        safePhase.rationale || safePhase.summary || safePhase.description
      )
    ),
  });
}

function resolveTrainingPlanPhaseOverview(plan = {}) {
  const safePlan = plan && typeof plan === "object" ? plan : {};
  const rawPhaseOverview = Array.isArray(safePlan.phaseOverview)
    ? safePlan.phaseOverview
    : Array.isArray(safePlan.phases)
      ? safePlan.phases
      : [];

  if (rawPhaseOverview.length > 0) {
    return rawPhaseOverview
      .map((phase, phaseIndex) => normalizePlanPhase(phase, phaseIndex))
      .filter(
        (phase) =>
          phase.label ||
          phase.focus ||
          Number.isFinite(phase.weekStart) ||
          Number.isFinite(phase.weekEnd)
      );
  }

  const summary = normalizeString(safePlan.summary);
  const resolvedWeeks = Array.isArray(safePlan.weeks)
    ? safePlan.weeks.map((week, weekIndex) =>
        Number.isFinite(week?.week) && week.week > 0 ? week.week : weekIndex + 1
      )
    : [];

  if (!summary || resolvedWeeks.length === 0) {
    return [];
  }

  return [
    {
      label: "Overall Program",
      weekStart: resolvedWeeks[0],
      weekEnd: resolvedWeeks[resolvedWeeks.length - 1],
      focus: summary,
    },
  ];
}

function resolveTrainingDayNumber(day = {}, dayIndex = 0) {
  return (
    parsePositiveInteger(day?.day) ||
    parsePositiveInteger(day?.session) ||
    parsePositiveInteger(day?.sessionNumber) ||
    parsePositiveInteger(day?.dayNumber) ||
    dayIndex + 1
  );
}

function resolvePreferredWeekday(day = {}) {
  const candidates = [
    day?.preferredWeekday,
    day?.preferredDay,
    day?.weekday,
    day?.dayOfWeek,
    typeof day?.day === "string" ? day.day : "",
  ];

  for (const candidate of candidates) {
    const normalizedCandidate =
      typeof candidate === "number"
        ? getWeekdayNameFromIndex(candidate)
        : getNormalizedWeekday(candidate);

    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }

  return "";
}

function buildSessionLabel(dayNumber) {
  return `Day ${dayNumber}`;
}

function toMatchableText(value) {
  if (typeof value !== "string") {
    return " ";
  }

  return ` ${value.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string");
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function dedupeStringList(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

function findCategoryMatches(values = [], definitions = []) {
  const combinedText = toMatchableText(values.filter(Boolean).join(" "));

  return definitions
    .filter(({ keywords = [] }) =>
      keywords.some((keyword) => combinedText.includes(toMatchableText(keyword)))
    )
    .map(({ value }) => value);
}

function normalizeStressLevel(value) {
  const [match] = findCategoryMatches([value], SESSION_STRESS_DEFINITIONS);
  return match || "";
}

function extractRepNumbers(value) {
  const matches = normalizeString(value).match(/\d+/g);
  return matches ? matches.map((entry) => Number.parseInt(entry, 10)) : [];
}

function inferSessionProfile(day = {}) {
  const exercises = Array.isArray(day?.exercises)
    ? day.exercises.map((exercise) => normalizeExercise(exercise))
    : [];
  const sessionText = [
    day?.sessionLabel,
    day?.notes,
    ...exercises.flatMap((exercise) => [exercise.name, exercise.notes]),
  ]
    .filter(Boolean)
    .join(" ");

  const regions = findCategoryMatches([sessionText], SESSION_REGION_DEFINITIONS);
  const qualities = findCategoryMatches([sessionText], SESSION_QUALITY_DEFINITIONS);

  exercises.forEach((exercise) => {
    const repNumbers = extractRepNumbers(exercise.reps);

    if (repNumbers.some((value) => value <= 5)) {
      qualities.push("force");
    }

    if (repNumbers.some((value) => value >= 10)) {
      qualities.push("fatigue");
    }
  });

  const dedupedRegions = dedupeStringList(regions);
  const dedupedQualities = dedupeStringList(qualities);

  if (
    dedupedRegions.includes("upper_body") &&
    dedupedRegions.includes("lower_body") &&
    !dedupedRegions.includes("full_body")
  ) {
    dedupedRegions.push("full_body");
  }

  if (
    dedupedQualities.length === 1 &&
    dedupedQualities[0] === "recovery"
  ) {
    return {
      regions: dedupedRegions,
      qualities: dedupedQualities,
      stressLevel: "low",
    };
  }

  let stressScore = 0;

  if (dedupedQualities.includes("force")) stressScore += 1;
  if (dedupedQualities.includes("power")) stressScore += 1;
  if (dedupedQualities.includes("fatigue")) stressScore += 1;
  if (exercises.length >= 5) stressScore += 0.5;

  exercises.forEach((exercise) => {
    const repNumbers = extractRepNumbers(exercise.reps);
    const exerciseText = toMatchableText(`${exercise.name} ${exercise.notes}`);

    if (repNumbers.some((value) => value <= 5)) {
      stressScore += 0.35;
    }

    if (repNumbers.some((value) => value >= 12)) {
      stressScore += 0.35;
    }

    if (
      exerciseText.includes(" heavy ") ||
      exerciseText.includes(" explosive ") ||
      exerciseText.includes(" sprint ") ||
      exerciseText.includes(" interval ") ||
      exerciseText.includes(" conditioning ")
    ) {
      stressScore += 0.4;
    }
  });

  return {
    regions: dedupedRegions,
    qualities: dedupedQualities,
    stressLevel:
      stressScore >= 2.4 ? "high" : stressScore >= 1 ? "moderate" : "low",
  };
}

function normalizeSessionProfile(day = {}) {
  const safeDay = day && typeof day === "object" ? day : {};
  const rawProfile =
    safeDay.sessionProfile && typeof safeDay.sessionProfile === "object"
      ? safeDay.sessionProfile
      : {};
  const inferredProfile = inferSessionProfile(safeDay);
  const normalizedRegions = dedupeStringList([
    ...findCategoryMatches(
      [
        ...toStringList(rawProfile.regions),
        ...toStringList(rawProfile.focusRegions),
        ...toStringList(safeDay.regions),
        ...toStringList(safeDay.focusRegions),
      ],
      SESSION_REGION_DEFINITIONS
    ),
    ...inferredProfile.regions,
  ]);
  const normalizedQualities = dedupeStringList([
    ...findCategoryMatches(
      [
        ...toStringList(rawProfile.qualities),
        ...toStringList(rawProfile.trainingQualities),
        ...toStringList(safeDay.qualities),
        ...toStringList(safeDay.trainingQualities),
      ],
      SESSION_QUALITY_DEFINITIONS
    ),
    ...inferredProfile.qualities,
  ]);

  if (
    normalizedRegions.includes("upper_body") &&
    normalizedRegions.includes("lower_body") &&
    !normalizedRegions.includes("full_body")
  ) {
    normalizedRegions.push("full_body");
  }

  return {
    regions: normalizedRegions,
    qualities: normalizedQualities,
    stressLevel:
      normalizeStressLevel(
        rawProfile.stressLevel ||
          rawProfile.sessionStress ||
          safeDay.stressLevel ||
          safeDay.sessionStress
      ) || inferredProfile.stressLevel,
  };
}

function getWeekdayIndex(day = {}) {
  const preferredWeekday = resolvePreferredWeekday(day);
  return preferredWeekday ? WEEKDAY_INDEX_LOOKUP[preferredWeekday] : null;
}

function getRegionSimilarity(leftRegions = [], rightRegions = []) {
  if (!leftRegions.length || !rightRegions.length) {
    return 0;
  }

  const leftRegionSet = new Set(leftRegions);
  const rightRegionSet = new Set(rightRegions);
  const sharedRegions = leftRegions.filter((value) => rightRegionSet.has(value));
  const sharedSpecificRegions = sharedRegions.filter(
    (value) => value !== "full_body"
  );

  if (sharedSpecificRegions.length > 0) {
    return 1;
  }

  if (leftRegionSet.has("full_body") || rightRegionSet.has("full_body")) {
    return 0.85;
  }

  return sharedRegions.includes("core") ? 0.55 : 0;
}

function getQualitySimilarity(leftQualities = [], rightQualities = []) {
  if (!leftQualities.length || !rightQualities.length) {
    return 0;
  }

  const rightQualitySet = new Set(rightQualities);
  const sharedQualities = leftQualities.filter((value) =>
    rightQualitySet.has(value)
  );

  if (sharedQualities.length === 0) {
    return 0;
  }

  let similarity =
    sharedQualities.length / Math.max(leftQualities.length, rightQualities.length);

  if (
    sharedQualities.some((value) =>
      ["force", "power", "fatigue"].includes(value)
    )
  ) {
    similarity += 0.25;
  }

  return Math.min(similarity, 1);
}

function getStressSimilarity(leftStressLevel = "", rightStressLevel = "") {
  if (!leftStressLevel || !rightStressLevel) {
    return 0;
  }

  if (leftStressLevel === rightStressLevel) {
    return leftStressLevel === "high"
      ? 1
      : leftStressLevel === "moderate"
        ? 0.75
        : 0.5;
  }

  const combinedStressLevels = new Set([leftStressLevel, rightStressLevel]);

  if (
    combinedStressLevels.has("high") &&
    combinedStressLevels.has("moderate")
  ) {
    return 0.6;
  }

  if (
    combinedStressLevels.has("moderate") &&
    combinedStressLevels.has("low")
  ) {
    return 0.35;
  }

  return 0.1;
}

function formatProfileValues(values = []) {
  return values.map((value) => value.replace(/_/g, " "));
}

function buildSpacingMessage(leftDay, rightDay, gapDays, similarityDetails = {}) {
  const leftLabel = getTrainingDayLabel(leftDay);
  const rightLabel = getTrainingDayLabel(rightDay);
  const leftProfile = similarityDetails.leftProfile || normalizeSessionProfile(leftDay);
  const rightProfile = similarityDetails.rightProfile || normalizeSessionProfile(rightDay);
  const sharedRegions = formatProfileValues(
    leftProfile.regions.filter((value) => rightProfile.regions.includes(value))
  );
  const sharedQualities = formatProfileValues(
    leftProfile.qualities.filter((value) => rightProfile.qualities.includes(value))
  );
  const sharedStressLevel =
    leftProfile.stressLevel &&
    leftProfile.stressLevel === rightProfile.stressLevel
      ? leftProfile.stressLevel
      : "";
  const overlapParts = [
    sharedRegions.length > 0 ? sharedRegions.join("/") : "",
    sharedQualities.length > 0 ? sharedQualities.join("/") : "",
    sharedStressLevel ? `${sharedStressLevel} stress` : "",
  ].filter(Boolean);
  const gapDescription =
    gapDays === 0 ? "on the same day" : `${gapDays * 24}h apart`;

  return `${leftLabel} and ${rightLabel} have overlapping ${
    overlapParts.join(" + ") || "training demands"
  } and are ${gapDescription} based on preferred weekdays. Try leaving about 48h when practical.`;
}

function normalizeExerciseOption(source = {}, fallbackExercise = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const normalizedOption = {
    name: normalizeString(safeSource.name, fallbackExercise.name || ""),
    sets: normalizeString(safeSource.sets, fallbackExercise.sets || ""),
    reps: normalizeString(safeSource.reps, fallbackExercise.reps || ""),
    notes: normalizeString(safeSource.notes, fallbackExercise.notes || ""),
  };

  return {
    ...normalizedOption,
    id: toOptionId(normalizedOption.name),
  };
}

function getRawSubstitutionOptions(exercise = {}) {
  if (Array.isArray(exercise.substitutionOptions)) {
    return exercise.substitutionOptions;
  }

  if (Array.isArray(exercise.substitutes)) {
    return exercise.substitutes;
  }

  if (Array.isArray(exercise.alternatives)) {
    return exercise.alternatives;
  }

  return [];
}

function dedupeExerciseOptions(options = []) {
  const seen = new Set();

  return options.filter((option) => {
    if (!option?.name) {
      return false;
    }

    if (seen.has(option.id)) {
      return false;
    }

    seen.add(option.id);
    return true;
  });
}

export function normalizeExercise(exercise = {}) {
  const safeExercise = exercise && typeof exercise === "object" ? exercise : {};
  const { videoUrl: _videoUrl, ...exerciseWithoutVideo } = safeExercise;
  const currentExercise = {
    name: normalizeString(exerciseWithoutVideo.name),
    sets: normalizeString(exerciseWithoutVideo.sets),
    reps: normalizeString(exerciseWithoutVideo.reps),
    notes: normalizeString(exerciseWithoutVideo.notes),
  };

  const normalizedOptions = dedupeExerciseOptions([
    normalizeExerciseOption(currentExercise),
    ...getRawSubstitutionOptions(safeExercise).map((option) =>
      normalizeExerciseOption(option, currentExercise)
    ),
  ]);

  const preferredSelectionId = normalizeString(
    safeExercise.selectedSubstitutionId,
    toOptionId(safeExercise.selectedSubstitutionName, "")
  );
  const selectedOption =
    normalizedOptions.find((option) => option.id === preferredSelectionId) ||
    normalizedOptions.find(
      (option) => option.id === toOptionId(currentExercise.name)
    ) ||
    normalizedOptions[0] ||
    normalizeExerciseOption(currentExercise);

  return {
    ...exerciseWithoutVideo,
    name: selectedOption.name,
    sets: selectedOption.sets,
    reps: selectedOption.reps,
    notes: selectedOption.notes,
    performanceTarget: normalizePerformanceTarget(
      safeExercise.performanceTarget,
      selectedOption.name,
      safeExercise
    ),
    percentagePrescription: normalizePercentagePrescription(
      safeExercise.percentagePrescription,
      selectedOption.name
    ),
    strengthAssessment: normalizeStrengthAssessmentConfig(
      safeExercise.strengthAssessment,
      selectedOption.name
    ),
    selectedSubstitutionId: selectedOption.id,
    substitutionOptions: normalizedOptions,
  };
}

function shouldKeepPercentageOnlyFields(questionnaire = {}) {
  return normalizeString(questionnaire?.liftIntensityMethod, "percentage") === "percentage";
}

function sanitizeExerciseForQuestionnaire(exercise = {}, questionnaire = {}) {
  if (shouldKeepPercentageOnlyFields(questionnaire)) {
    return normalizeExercise(exercise);
  }

  const safeExercise = exercise && typeof exercise === "object" ? exercise : {};
  const {
    percentagePrescription: _percentagePrescription,
    strengthAssessment: _strengthAssessment,
    ...exerciseWithoutPercentageFields
  } = safeExercise;

  return normalizeExercise(exerciseWithoutPercentageFields);
}

export function getExerciseSubstitutionOptions(exercise = {}) {
  return normalizeExercise(exercise).substitutionOptions;
}

export function getExerciseStrengthAssessment(exercise = {}) {
  return normalizeExercise(exercise).strengthAssessment;
}

export function getExercisePercentagePrescription(exercise = {}) {
  return normalizeExercise(exercise).percentagePrescription;
}

export function getExercisePerformanceTarget(exercise = {}) {
  return normalizeExercise(exercise).performanceTarget;
}

export function applyExerciseSubstitution(exercise = {}, substitutionId = "") {
  const normalizedExercise = normalizeExercise(exercise);
  const nextOption =
    normalizedExercise.substitutionOptions.find(
      (option) => option.id === substitutionId
    ) || normalizedExercise.substitutionOptions[0];

  if (!nextOption) {
    return normalizedExercise;
  }

  return {
    ...normalizedExercise,
    name: nextOption.name,
    sets: nextOption.sets,
    reps: nextOption.reps,
    notes: nextOption.notes,
    selectedSubstitutionId: nextOption.id,
  };
}

const TRAINING_DAY_STATUSES = Object.freeze({
  pending: "pending",
  skipped: "skipped",
  rescheduled: "rescheduled",
});

const MISSED_SESSION_REASONS = Object.freeze({
  schedule_travel: "schedule_travel",
  fatigue_readiness: "fatigue_readiness",
  illness_injury: "illness_injury",
});

const EXERCISE_PRIORITY_CATEGORIES = Object.freeze({
  power: "power",
  compound: "compound",
  primary_pull: "primary_pull",
  core: "core",
  accessory: "accessory",
});

function clonePlainValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createTrainingDayKey(weekNumber, dayNumber) {
  return `${weekNumber}-${dayNumber}`;
}

function getCompletedDaySet(completedDays = []) {
  return new Set(Array.isArray(completedDays) ? completedDays : []);
}

function normalizeTrainingDayStatus(value) {
  return Object.values(TRAINING_DAY_STATUSES).includes(value)
    ? value
    : TRAINING_DAY_STATUSES.pending;
}

function normalizeMissedSessionReason(value) {
  return Object.values(MISSED_SESSION_REASONS).includes(value)
    ? value
    : MISSED_SESSION_REASONS.schedule_travel;
}

function normalizeAdjustmentText(value) {
  return normalizeString(value);
}

function getOriginalDayNumber(day = {}, fallbackDayNumber = 1) {
  return parsePositiveInteger(day?.originalDayNumber) || fallbackDayNumber;
}

function isDaySkipped(day = {}) {
  return normalizeTrainingDayStatus(day?.status) === TRAINING_DAY_STATUSES.skipped;
}

function isDayCompleted(day = {}, weekNumber, completedDaySet = new Set()) {
  return completedDaySet.has(createTrainingDayKey(weekNumber, day.day));
}

function isDayResolved(day = {}, weekNumber, completedDaySet = new Set()) {
  return isDaySkipped(day) || isDayCompleted(day, weekNumber, completedDaySet);
}

function getWeekAdjustmentState(week = {}) {
  const safeState =
    week?.adjustmentState && typeof week.adjustmentState === "object"
      ? week.adjustmentState
      : {};
  const originalWeekSnapshot =
    safeState.originalWeekSnapshot && typeof safeState.originalWeekSnapshot === "object"
      ? safeState.originalWeekSnapshot
      : clonePlainValue({
          ...week,
          adjustmentState: undefined,
          days: Array.isArray(week.days) ? week.days : [],
        });

  return {
    missedSessionCount:
      parsePositiveInteger(safeState.missedSessionCount) || 0,
    originalPlannedSessions:
      parsePositiveInteger(safeState.originalPlannedSessions) ||
      (Array.isArray(week.days) ? week.days.length : 0),
    originalWeekSnapshot,
    lastMissedReason: normalizeString(safeState.lastMissedReason),
    lastAction: normalizeString(safeState.lastAction),
  };
}

function getAllWeekText(week = {}) {
  return (Array.isArray(week.days) ? week.days : [])
    .flatMap((day) => [
      day?.sessionLabel,
      day?.adjustmentSummary,
      ...(Array.isArray(day?.exercises) ?
        day.exercises.flatMap((exercise) => [exercise?.name, exercise?.notes]) :
        []),
    ])
    .filter(Boolean)
    .join(" ");
}

function parseCompetitionTimeline(value = "") {
  const parsedTime = Date.parse(value);
  return Number.isNaN(parsedTime) ? null : new Date(parsedTime);
}

export function getDaysUntilCompetition(value = "", fromDate = new Date()) {
  const competitionDate = parseCompetitionTimeline(value);

  if (!competitionDate) {
    return null;
  }

  const startOfToday = new Date(fromDate);
  startOfToday.setHours(0, 0, 0, 0);
  competitionDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (competitionDate - startOfToday) / (1000 * 60 * 60 * 24)
  );
}

function isDeloadWeek(week = {}) {
  const weekText = toMatchableText(getAllWeekText(week));

  return (
    (Number.isFinite(week?.week) && week.week > 0 && week.week % 4 === 0) ||
    weekText.includes(" deload ") ||
    weekText.includes(" lighter week ") ||
    weekText.includes(" recovery ")
  );
}

function isTaperWeek(plan = {}, week = {}, context = {}) {
  if (normalizeString(context.trainingPhase) !== "in_camp") {
    return false;
  }

  const competitionDate = parseCompetitionTimeline(context.competitionTimeline);

  if (competitionDate) {
    const today = new Date();
    const daysUntilCompetition = Math.ceil(
      (competitionDate - today) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilCompetition <= 14) {
      return true;
    }
  }

  const totalWeeks = Array.isArray(plan?.weeks) ? plan.weeks.length : 0;
  return totalWeeks > 0 && week.week >= totalWeeks - 1;
}

function getExercisePriorityCategory(exercise = {}) {
  const exerciseText = toMatchableText(`${exercise?.name || ""} ${exercise?.notes || ""}`);

  if (
    exerciseText.includes(" med ball ") ||
    exerciseText.includes(" medicine ball ") ||
    exerciseText.includes(" jump ") ||
    exerciseText.includes(" plyo ") ||
    exerciseText.includes(" throw ") ||
    exerciseText.includes(" sprint ") ||
    exerciseText.includes(" ballistic ") ||
    exerciseText.includes(" clean ") ||
    exerciseText.includes(" snatch ")
  ) {
    return EXERCISE_PRIORITY_CATEGORIES.power;
  }

  if (
    exerciseText.includes(" row ") ||
    exerciseText.includes(" pull up ") ||
    exerciseText.includes(" pullup ") ||
    exerciseText.includes(" chin up ") ||
    exerciseText.includes(" chinup ") ||
    exerciseText.includes(" lat pulldown ")
  ) {
    return EXERCISE_PRIORITY_CATEGORIES.primary_pull;
  }

  if (
    exerciseText.includes(" plank ") ||
    exerciseText.includes(" anti rotation ") ||
    exerciseText.includes(" rollout ") ||
    exerciseText.includes(" pallof ") ||
    exerciseText.includes(" hollow ") ||
    exerciseText.includes(" hanging knee raise ") ||
    exerciseText.includes(" hanging leg raise ") ||
    exerciseText.includes(" suitcase carry ") ||
    exerciseText.includes(" farmer carry ")
  ) {
    return EXERCISE_PRIORITY_CATEGORIES.core;
  }

  if (
    exerciseText.includes(" squat ") ||
    exerciseText.includes(" deadlift ") ||
    exerciseText.includes(" bench ") ||
    exerciseText.includes(" press ") ||
    exerciseText.includes(" split squat ") ||
    exerciseText.includes(" lunge ")
  ) {
    return EXERCISE_PRIORITY_CATEGORIES.compound;
  }

  return EXERCISE_PRIORITY_CATEGORIES.accessory;
}

function getExercisePriorityScore(exercise = {}) {
  const category = getExercisePriorityCategory(exercise);

  switch (category) {
    case EXERCISE_PRIORITY_CATEGORIES.power:
      return 5;
    case EXERCISE_PRIORITY_CATEGORIES.compound:
      return 4;
    case EXERCISE_PRIORITY_CATEGORIES.primary_pull:
      return 3;
    case EXERCISE_PRIORITY_CATEGORIES.core:
      return 2;
    default:
      return 1;
  }
}

function isTestingTrainingDay(day = {}) {
  const sessionText = toMatchableText(
    [
      day?.sessionLabel,
      ...(Array.isArray(day?.exercises) ?
        day.exercises.flatMap((exercise) => [exercise?.name, exercise?.notes, exercise?.reps]) :
        []),
    ]
      .filter(Boolean)
      .join(" ")
  );

  return (
    sessionText.includes(" 1rm ") ||
    sessionText.includes(" 2rm ") ||
    sessionText.includes(" 3rm ") ||
    sessionText.includes(" 4rm ") ||
    sessionText.includes(" 5rm ") ||
    sessionText.includes(" heavy single ") ||
    sessionText.includes(" max single ")
  );
}

function reduceSetPrescription(value = "", mode = "rescue") {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 1) {
    return value;
  }

  const reducedValue =
    mode === "primer" ?
      Math.max(1, parsedValue - 2) :
      Math.max(1, parsedValue - 1);

  return String(reducedValue);
}

function appendAdjustmentNote(baseNotes = "", appendedNote = "") {
  const normalizedBaseNotes = normalizeString(baseNotes);
  const normalizedAppendedNote = normalizeString(appendedNote);

  if (!normalizedAppendedNote) {
    return normalizedBaseNotes;
  }

  if (!normalizedBaseNotes) {
    return normalizedAppendedNote;
  }

  if (normalizedBaseNotes.includes(normalizedAppendedNote)) {
    return normalizedBaseNotes;
  }

  return `${normalizedBaseNotes} ${normalizedAppendedNote}`.trim();
}

function buildTrimmedExercises(day = {}, mode = "late_week_rescue") {
  const exercises = Array.isArray(day?.exercises)
    ? day.exercises.map((exercise) => normalizeExercise(exercise))
    : [];

  if (exercises.length <= 1) {
    return exercises;
  }

  const priorityOrder =
    mode === "taper_primer" || mode === "re_entry"
      ? [
          EXERCISE_PRIORITY_CATEGORIES.power,
          EXERCISE_PRIORITY_CATEGORIES.compound,
          EXERCISE_PRIORITY_CATEGORIES.primary_pull,
        ]
      : [
          EXERCISE_PRIORITY_CATEGORIES.power,
          EXERCISE_PRIORITY_CATEGORIES.compound,
          EXERCISE_PRIORITY_CATEGORIES.primary_pull,
          EXERCISE_PRIORITY_CATEGORIES.core,
        ];
  const keptIndices = new Set();

  priorityOrder.forEach((category) => {
    const matchingIndex = exercises.findIndex(
      (exercise, index) =>
        !keptIndices.has(index) &&
        getExercisePriorityCategory(exercise) === category
    );

    if (matchingIndex !== -1) {
      keptIndices.add(matchingIndex);
    }
  });

  if (keptIndices.size === 0) {
    keptIndices.add(0);
  }

  const minimumTarget =
    mode === "taper_primer" || mode === "re_entry" ? 2 : 3;
  const scoredExercises = exercises
    .map((exercise, index) => ({
      exercise,
      index,
      score: getExercisePriorityScore(exercise),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  scoredExercises.forEach(({ index }) => {
    if (keptIndices.size >= Math.min(minimumTarget, exercises.length)) {
      return;
    }

    keptIndices.add(index);
  });

  const noteSuffix =
    mode === "taper_primer" ?
      "Primer session. Stay sharp, fast, and well away from fatigue." :
    mode === "re_entry" ?
      "Re-entry session. Use the low end of the target RPE and prioritize movement quality." :
      "Rescue session. Keep the main stimulus and cut low-priority volume.";

  return exercises
    .filter((_, index) => keptIndices.has(index))
    .map((exercise) => ({
      ...exercise,
      sets: reduceSetPrescription(
        exercise.sets,
        mode === "taper_primer" ? "primer" : "rescue"
      ),
      notes: appendAdjustmentNote(exercise.notes, noteSuffix),
    }));
}

function getDayPriorityScore(day = {}, context = {}) {
  const profile = normalizeSessionProfile(day);
  let score = 0;

  if (profile.qualities.includes("power")) score += 5;
  if (profile.qualities.includes("force")) score += 4;
  if (profile.qualities.includes("speed")) score += 3;
  if (profile.qualities.includes("fatigue")) score -= 2;
  if (profile.qualities.includes("hypertrophy")) score -= 1;
  if (profile.qualities.includes("recovery")) score -= 2;

  if (profile.stressLevel === "high") score += 2;
  if (profile.stressLevel === "moderate") score += 1;

  if (profile.regions.includes("lower_body") || profile.regions.includes("full_body")) {
    score += 1;
  }

  if (Array.isArray(day?.exercises)) {
    day.exercises.forEach((exercise) => {
      score += getExercisePriorityScore(exercise) * 0.3;
    });
  }

  if (isTestingTrainingDay(day)) {
    score += 4;
  }

  if (context.isTaperWeek) {
    if (profile.qualities.includes("power") || profile.qualities.includes("speed")) {
      score += 3;
    }

    if (profile.qualities.includes("fatigue")) {
      score -= 5;
    }
  }

  return score;
}

function pickPrioritySession(days = [], context = {}) {
  return days
    .map((day, index) => ({
      day,
      index,
      score: getDayPriorityScore(day, context),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]
    ?.day || null;
}

function buildSkippedDay(day = {}, reason = "", summary = "") {
  const normalizedDay = normalizeTrainingDay(day);

  return {
    ...normalizedDay,
    status: TRAINING_DAY_STATUSES.skipped,
    rescueMode: "",
    adjustmentReason: reason,
    adjustmentSummary: summary,
    exercises: [],
  };
}

function buildAssignedDay(day = {}, slotTemplate = {}, options = {}) {
  const mode = normalizeString(options.mode);
  const shouldTrim =
    mode === "late_week_rescue" ||
    mode === "priority_rescue" ||
    mode === "re_entry" ||
    mode === "taper_primer";
  const normalizedSourceDay = normalizeTrainingDay(day);
  const adjustedExercises =
    shouldTrim ?
      buildTrimmedExercises(normalizedSourceDay, mode) :
      normalizedSourceDay.exercises;
  const assignedDay = normalizeTrainingDay(
    {
      ...normalizedSourceDay,
      day: slotTemplate.day,
      preferredWeekday: slotTemplate.preferredWeekday,
      status:
        mode && mode !== "shift_forward"
          ? TRAINING_DAY_STATUSES.rescheduled
          : TRAINING_DAY_STATUSES.pending,
      rescueMode: mode,
      adjustmentReason: options.reason || "",
      adjustmentSummary: options.summary || "",
      exercises: adjustedExercises,
    },
    (slotTemplate.day || 1) - 1
  );

  return {
    ...assignedDay,
    originalDayNumber: getOriginalDayNumber(
      normalizedSourceDay,
      normalizedSourceDay.day
    ),
  };
}

function resetWeekFromSnapshot(snapshotWeek = {}, nextWeekNumber = 1) {
  const normalizedSnapshotWeek =
    snapshotWeek && typeof snapshotWeek === "object" ?
      {
        ...snapshotWeek,
        week: nextWeekNumber,
        adjustmentState: undefined,
      } :
      { week: nextWeekNumber, days: [] };

  return {
    ...normalizedSnapshotWeek,
    week: nextWeekNumber,
    adjustmentState: {
      missedSessionCount: 0,
      originalPlannedSessions: Array.isArray(normalizedSnapshotWeek.days) ?
        normalizedSnapshotWeek.days.length :
        0,
      originalWeekSnapshot: clonePlainValue({
        ...normalizedSnapshotWeek,
        adjustmentState: undefined,
      }),
      lastMissedReason: "",
      lastAction: "repeat_week",
    },
    days: Array.isArray(normalizedSnapshotWeek.days)
      ? normalizedSnapshotWeek.days.map((day, dayIndex) =>
          normalizeTrainingDay(
            {
              ...day,
              day: resolveTrainingDayNumber(day, dayIndex),
              status: TRAINING_DAY_STATUSES.pending,
              rescueMode: "",
              adjustmentReason: "",
              adjustmentSummary: "",
            },
            dayIndex
          )
        )
      : [],
  };
}

function buildPlanWithRepeatedWeek(plan = {}, weekNumber, snapshotWeek = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const currentWeekIndex = normalizedPlan.weeks.findIndex(
    (week) => week.week === weekNumber
  );

  if (currentWeekIndex === -1) {
    return normalizedPlan;
  }

  const nextWeekIndex = currentWeekIndex + 1;

  if (nextWeekIndex < normalizedPlan.weeks.length) {
    return {
      ...normalizedPlan,
      weeks: normalizedPlan.weeks.map((week, index) =>
        index === nextWeekIndex ?
          resetWeekFromSnapshot(snapshotWeek, week.week) :
          week
      ),
    };
  }

  const lastWeekNumber =
    normalizedPlan.weeks[normalizedPlan.weeks.length - 1]?.week || weekNumber;

  return {
    ...normalizedPlan,
    weeks: [
      ...normalizedPlan.weeks,
      resetWeekFromSnapshot(snapshotWeek, lastWeekNumber + 1),
    ],
  };
}

function filterCompletedDaysForBlockRestart(completedDays = [], currentWeekNumber = 1) {
  return (Array.isArray(completedDays) ? completedDays : []).filter((key) => {
    const weekNumber = Number.parseInt(String(key).split("-")[0], 10);
    return !Number.isFinite(weekNumber) || weekNumber < currentWeekNumber;
  });
}

function restartCurrentBlock(plan = {}, weekNumber, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const currentWeekIndex = normalizedPlan.weeks.findIndex(
    (week) => week.week === weekNumber
  );

  if (currentWeekIndex === -1) {
    return {
      plan: normalizedPlan,
      completedDays: Array.isArray(completedDays) ? completedDays : [],
    };
  }

  const blockSize = normalizedPlan.weeks.length >= 4 ? 4 : normalizedPlan.weeks.length;
  const blockStartIndex = Math.floor(currentWeekIndex / blockSize) * blockSize;
  const blockWeeks = normalizedPlan.weeks.slice(
    blockStartIndex,
    Math.min(blockStartIndex + blockSize, normalizedPlan.weeks.length)
  );

  const rebuiltWeeks = normalizedPlan.weeks.map((week, index) => {
    if (index < currentWeekIndex) {
      return week;
    }

    const sourceWeek = blockWeeks[(index - currentWeekIndex) % blockWeeks.length];
    return resetWeekFromSnapshot(sourceWeek, week.week);
  });

  return {
    plan: {
      ...normalizedPlan,
      weeks: rebuiltWeeks,
    },
    completedDays: filterCompletedDaysForBlockRestart(completedDays, weekNumber),
  };
}

export function normalizeTrainingDay(day = {}, dayIndex = 0) {
  const safeDay = day && typeof day === "object" ? day : {};
  const resolvedDayNumber = resolveTrainingDayNumber(safeDay, dayIndex);
  const originalDayNumber = getOriginalDayNumber(safeDay, resolvedDayNumber);

  return {
    ...safeDay,
    day: resolvedDayNumber,
    originalDayNumber,
    sessionLabel: normalizeString(
      safeDay.sessionLabel,
      buildSessionLabel(originalDayNumber)
    ),
    preferredWeekday: resolvePreferredWeekday(safeDay),
    sessionProfile: normalizeSessionProfile(safeDay),
    status: normalizeTrainingDayStatus(safeDay.status),
    rescueMode: normalizeAdjustmentText(safeDay.rescueMode),
    adjustmentReason: normalizeAdjustmentText(safeDay.adjustmentReason),
    adjustmentSummary: normalizeAdjustmentText(safeDay.adjustmentSummary),
    exercises: Array.isArray(safeDay?.exercises)
      ? safeDay.exercises.map((exercise) => normalizeExercise(exercise))
      : [],
  };
}

export function sanitizeTrainingDayForQuestionnaire(
  day = {},
  questionnaire = {},
  dayIndex = 0
) {
  const safeDay = day && typeof day === "object" ? day : {};
  const resolvedDayNumber = resolveTrainingDayNumber(safeDay, dayIndex);
  const originalDayNumber = getOriginalDayNumber(safeDay, resolvedDayNumber);

  return {
    ...safeDay,
    day: resolvedDayNumber,
    originalDayNumber,
    sessionLabel: normalizeString(
      safeDay.sessionLabel,
      buildSessionLabel(originalDayNumber)
    ),
    preferredWeekday: resolvePreferredWeekday(safeDay),
    sessionProfile: normalizeSessionProfile(safeDay),
    status: normalizeTrainingDayStatus(safeDay.status),
    rescueMode: normalizeAdjustmentText(safeDay.rescueMode),
    adjustmentReason: normalizeAdjustmentText(safeDay.adjustmentReason),
    adjustmentSummary: normalizeAdjustmentText(safeDay.adjustmentSummary),
    exercises: Array.isArray(safeDay?.exercises)
      ? safeDay.exercises.map((exercise) =>
          sanitizeExerciseForQuestionnaire(exercise, questionnaire)
        )
      : [],
  };
}

function normalizeGeneratedPhase(phase = {}, phaseIndex = 0) {
  if (!isPlainObject(phase)) {
    throw new Error(
      `Training plan phase ${phaseIndex + 1} must be an object.`
    );
  }

  return normalizePlanPhase(
    {
      label: phase.label,
      phase: phase.phase,
      name: phase.name,
      weeks: phase.weeks,
      weekRange: phase.weekRange,
      range: phase.range,
      weekStart: phase.weekStart,
      startWeek: phase.startWeek,
      weekEnd: phase.weekEnd,
      endWeek: phase.endWeek,
      focus: phase.focus,
      rationale: phase.rationale,
      summary: phase.summary,
      description: phase.description,
    },
    phaseIndex
  );
}

function getStrictSubstitutionSource(exercise = {}) {
  const sourceFields = ["substitutionOptions", "substitutes", "alternatives"];

  for (const field of sourceFields) {
    if (!hasOwnProperty(exercise, field)) {
      continue;
    }

    if (!Array.isArray(exercise[field])) {
      throw new Error(
        `Training plan exercise field "${field}" must be an array when provided.`
      );
    }

    return exercise[field];
  }

  return [];
}

function normalizeGeneratedExercise(exercise = {}, exerciseIndex = 0) {
  if (!isPlainObject(exercise)) {
    throw new Error(
      `Training plan exercise ${exerciseIndex + 1} must be an object.`
    );
  }

  const fallbackExercise = {
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    notes: exercise.notes,
  };

  const substitutionOptions = getStrictSubstitutionSource(exercise).map(
    (option, optionIndex) => {
      if (!isPlainObject(option)) {
        throw new Error(
          `Training plan substitution option ${optionIndex + 1} must be an object.`
        );
      }

      return normalizeExerciseOption(option, fallbackExercise);
    }
  );

  return normalizeExercise({
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    notes: exercise.notes,
    performanceTarget: exercise.performanceTarget,
    percentagePrescription: exercise.percentagePrescription,
    strengthAssessment: exercise.strengthAssessment,
    selectedSubstitutionId: exercise.selectedSubstitutionId,
    ...(hasOwnProperty(exercise, "selectedSubstitutionName") ?
      { selectedSubstitutionName: exercise.selectedSubstitutionName } :
      {}),
    substitutionOptions,
  });
}

function normalizeGeneratedTrainingDay(day = {}, dayIndex = 0) {
  if (!isPlainObject(day)) {
    throw new Error(`Training plan day ${dayIndex + 1} must be an object.`);
  }

  if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
    throw new Error(
      `Training plan day ${dayIndex + 1} must include a non-empty exercises array.`
    );
  }

  if (
    hasOwnProperty(day, "sessionProfile") &&
    day.sessionProfile != null &&
    !isPlainObject(day.sessionProfile)
  ) {
    throw new Error(
      `Training plan day ${dayIndex + 1} has an invalid sessionProfile.`
    );
  }

  return normalizeTrainingDay(
    {
      day: day.day,
      originalDayNumber: day.originalDayNumber,
      sessionLabel: day.sessionLabel,
      preferredWeekday: day.preferredWeekday,
      sessionProfile: day.sessionProfile ?
        {
          regions: day.sessionProfile.regions,
          qualities: day.sessionProfile.qualities,
          focusRegions: day.sessionProfile.focusRegions,
          trainingQualities: day.sessionProfile.trainingQualities,
          stressLevel: day.sessionProfile.stressLevel,
          sessionStress: day.sessionProfile.sessionStress,
        } :
        undefined,
      status: day.status,
      rescueMode: day.rescueMode,
      adjustmentReason: day.adjustmentReason,
      adjustmentSummary: day.adjustmentSummary,
      exercises: day.exercises.map((exercise, exerciseIndex) =>
        normalizeGeneratedExercise(exercise, exerciseIndex)
      ),
    },
    dayIndex
  );
}

function normalizeGeneratedAdjustmentState(adjustmentState = {}, weekIndex = 0) {
  if (!isPlainObject(adjustmentState)) {
    throw new Error(
      `Training plan week ${weekIndex + 1} has an invalid adjustmentState.`
    );
  }

  return {
    missedSessionCount: adjustmentState.missedSessionCount,
    originalPlannedSessions: adjustmentState.originalPlannedSessions,
    originalWeekSnapshot: hasOwnProperty(adjustmentState, "originalWeekSnapshot") ?
      normalizeGeneratedTrainingWeek(
        adjustmentState.originalWeekSnapshot,
        weekIndex,
        { allowAdjustmentState: false, contextLabel: "originalWeekSnapshot" }
      ) :
      undefined,
    lastMissedReason: adjustmentState.lastMissedReason,
    lastAction: adjustmentState.lastAction,
  };
}

function normalizeGeneratedTrainingWeek(
  week = {},
  weekIndex = 0,
  options = {}
) {
  const {
    allowAdjustmentState = true,
    contextLabel = "week",
  } = options;

  if (!isPlainObject(week)) {
    throw new Error(`Training plan ${contextLabel} ${weekIndex + 1} must be an object.`);
  }

  if (!Array.isArray(week.days) || week.days.length === 0) {
    throw new Error(
      `Training plan ${contextLabel} ${weekIndex + 1} must include a non-empty days array.`
    );
  }

  const normalizedWeek = {
    week: week.week,
    days: week.days.map((day, dayIndex) =>
      normalizeGeneratedTrainingDay(day, dayIndex)
    ),
  };

  if (allowAdjustmentState && hasOwnProperty(week, "adjustmentState")) {
    normalizedWeek.adjustmentState =
      week.adjustmentState == null ?
        undefined :
        normalizeGeneratedAdjustmentState(week.adjustmentState, weekIndex);
  }

  return normalizedWeek;
}

function assertNoDisallowedTrainingPlanWrappers(plan = {}) {
  const disallowedKey = DISALLOWED_TRAINING_PLAN_WRAPPER_KEYS.find((key) =>
    hasOwnProperty(plan, key)
  );

  if (disallowedKey) {
    throw new Error(
      `Training plan response must be a direct plan object, not wrapped in "${disallowedKey}".`
    );
  }
}

export function parseGeneratedTrainingPlan(plan = {}) {
  if (!isPlainObject(plan)) {
    throw new Error("Training plan response must be a single JSON object.");
  }

  assertNoDisallowedTrainingPlanWrappers(plan);

  if (!Array.isArray(plan.weeks) || plan.weeks.length === 0) {
    throw new Error("Training plan response did not include any training weeks.");
  }

  if (hasOwnProperty(plan, "phaseOverview") && !Array.isArray(plan.phaseOverview)) {
    throw new Error("Training plan response has an invalid phaseOverview.");
  }

  if (hasOwnProperty(plan, "phases") && !Array.isArray(plan.phases)) {
    throw new Error("Training plan response has an invalid phases array.");
  }

  const phaseSource = Array.isArray(plan.phaseOverview) ?
    plan.phaseOverview :
    Array.isArray(plan.phases) ?
      plan.phases :
      [];
  const normalizedPlan = normalizeTrainingPlan({
    createdAt: plan.createdAt,
    generatedAt: plan.generatedAt,
    summary: plan.summary,
    phaseOverview: phaseSource.map((phase, phaseIndex) =>
      normalizeGeneratedPhase(phase, phaseIndex)
    ),
    weeks: plan.weeks.map((week, weekIndex) =>
      normalizeGeneratedTrainingWeek(week, weekIndex)
    ),
  });

  if (!normalizedPlan.weeks.some((week) => Array.isArray(week.days) && week.days.length > 0)) {
    throw new Error(
      "The generated response did not include a usable training plan."
    );
  }

  return normalizedPlan;
}

export function normalizeTrainingPlan(plan = {}) {
  const safePlan = plan && typeof plan === "object" ? plan : {};

  return {
    ...safePlan,
    summary: normalizeString(safePlan.summary),
    phaseOverview: resolveTrainingPlanPhaseOverview(safePlan),
    weeks: Array.isArray(safePlan.weeks)
      ? safePlan.weeks.map((week, weekIndex) => ({
          ...week,
          week:
            Number.isFinite(week?.week) && week.week > 0
              ? week.week
              : weekIndex + 1,
          adjustmentState: getWeekAdjustmentState(week),
          days: Array.isArray(week?.days)
            ? week.days.map((day, dayIndex) => normalizeTrainingDay(day, dayIndex))
            : [],
        }))
      : [],
  };
}

export function sanitizeTrainingPlanForQuestionnaire(plan = {}, questionnaire = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return {
    ...normalizedPlan,
    weeks: Array.isArray(normalizedPlan.weeks)
      ? normalizedPlan.weeks.map((week, weekIndex) => ({
          ...week,
          week:
            Number.isFinite(week?.week) && week.week > 0 ?
              week.week :
              weekIndex + 1,
          adjustmentState: getWeekAdjustmentState(week),
          days: Array.isArray(week?.days)
            ? week.days.map((day, dayIndex) =>
                sanitizeTrainingDayForQuestionnaire(day, questionnaire, dayIndex)
              )
            : [],
        }))
      : [],
  };
}

export function getTrainingPlanPhaseOverview(plan = {}) {
  return normalizeTrainingPlan(plan).phaseOverview;
}

export function getCurrentTrainingWeek(plan = {}, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  if (normalizedPlan.weeks.length === 0) {
    return null;
  }

  const currentDay = getCurrentTrainingDay(normalizedPlan, completedDays);

  if (!currentDay?.week) {
    return normalizedPlan.weeks[normalizedPlan.weeks.length - 1];
  }

  return (
    normalizedPlan.weeks.find((week) => week.week === currentDay.week) ||
    normalizedPlan.weeks[0]
  );
}

export function getCurrentTrainingPhase(plan = {}, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  if (normalizedPlan.phaseOverview.length === 0) {
    return null;
  }

  const currentWeek = getCurrentTrainingWeek(normalizedPlan, completedDays);
  const currentWeekNumber =
    currentWeek?.week ||
    normalizedPlan.weeks[0]?.week ||
    normalizedPlan.phaseOverview[0]?.weekStart ||
    1;

  return (
    normalizedPlan.phaseOverview.find(
      (phase) =>
        currentWeekNumber >= phase.weekStart && currentWeekNumber <= phase.weekEnd
    ) ||
    normalizedPlan.phaseOverview.find(
      (phase) => currentWeekNumber <= phase.weekEnd
    ) ||
    normalizedPlan.phaseOverview[normalizedPlan.phaseOverview.length - 1]
  );
}

export function getTrainingDayLabel(day = {}) {
  const safeDay = day && typeof day === "object" ? day : {};

  return normalizeString(
    safeDay.sessionLabel,
    buildSessionLabel(getOriginalDayNumber(safeDay, resolveTrainingDayNumber(safeDay)))
  );
}

export function getTrainingDayPreferredWeekday(day = {}) {
  return resolvePreferredWeekday(day);
}

export function getTrainingDaySessionProfile(day = {}) {
  return normalizeSessionProfile(day);
}

export function getTrainingDayStatus(day = {}) {
  return normalizeTrainingDayStatus(day?.status);
}

export function countTrackableTrainingDays(plan = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return normalizedPlan.weeks.reduce(
    (total, week) =>
      total +
      week.days.filter((day) => !isDaySkipped(day)).length,
    0
  );
}

export function getCurrentTrainingDay(plan = {}, completedDays = []) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const completedDaySet = getCompletedDaySet(completedDays);

  for (const week of normalizedPlan.weeks) {
    for (const day of week.days) {
      if (!isDayResolved(day, week.week, completedDaySet)) {
        return {
          week: week.week,
          day: day.day,
        };
      }
    }
  }

  return null;
}

export function getWeekSpacingAdvisories(week = {}) {
  const normalizedWeek =
    week && typeof week === "object"
      ? {
          ...week,
          days: Array.isArray(week.days)
            ? week.days.map((day) => ({
                ...day,
                sessionProfile: normalizeSessionProfile(day),
              }))
            : [],
        }
      : { week: 0, days: [] };
  const scheduledDays = normalizedWeek.days.filter(
    (day) => getWeekdayIndex(day) !== null
  );
  const advisories = [];

  for (let index = 0; index < scheduledDays.length; index += 1) {
    for (
      let comparisonIndex = index + 1;
      comparisonIndex < scheduledDays.length;
      comparisonIndex += 1
    ) {
      const leftDay = scheduledDays[index];
      const rightDay = scheduledDays[comparisonIndex];
      const leftWeekdayIndex = getWeekdayIndex(leftDay);
      const rightWeekdayIndex = getWeekdayIndex(rightDay);

      if (leftWeekdayIndex === null || rightWeekdayIndex === null) {
        continue;
      }

      const gapDays = Math.min(
        Math.abs(leftWeekdayIndex - rightWeekdayIndex),
        7 - Math.abs(leftWeekdayIndex - rightWeekdayIndex)
      );
      const leftProfile = normalizeSessionProfile(leftDay);
      const rightProfile = normalizeSessionProfile(rightDay);
      const similarityScore =
        getRegionSimilarity(leftProfile.regions, rightProfile.regions) * 0.45 +
        getQualitySimilarity(leftProfile.qualities, rightProfile.qualities) * 0.35 +
        getStressSimilarity(leftProfile.stressLevel, rightProfile.stressLevel) * 0.2;
      const shouldFlag =
        (gapDays === 0 && similarityScore >= 0.35) ||
        (gapDays < 2 && similarityScore >= 0.7);

      if (!shouldFlag) {
        continue;
      }

      advisories.push({
        key: `${normalizedWeek.week || 0}-${leftDay.day}-${rightDay.day}`,
        week: normalizedWeek.week || 0,
        leftDayNumber: leftDay.day,
        rightDayNumber: rightDay.day,
        gapDays,
        similarityScore,
        severity: gapDays === 0 || similarityScore >= 0.8 ? "high" : "moderate",
        message: buildSpacingMessage(leftDay, rightDay, gapDays, {
          leftProfile,
          rightProfile,
        }),
      });
    }
  }

  return advisories.sort((leftAdvisory, rightAdvisory) => {
    if (leftAdvisory.severity !== rightAdvisory.severity) {
      return leftAdvisory.severity === "high" ? -1 : 1;
    }

    return rightAdvisory.similarityScore - leftAdvisory.similarityScore;
  });
}

export function getTrainingPlanSpacingAdvisories(plan = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return normalizedPlan.weeks.flatMap((week) => getWeekSpacingAdvisories(week));
}

export function replaceTrainingPlanExercise(
  plan = {},
  weekNumber,
  dayNumber,
  exerciseIndex,
  substitutionId
) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return {
    ...normalizedPlan,
    weeks: normalizedPlan.weeks.map((week) => {
      if (week.week !== weekNumber) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day) => {
          if (day.day !== dayNumber) {
            return day;
          }

          return {
            ...day,
            exercises: day.exercises.map((exercise, index) =>
              index === exerciseIndex
                ? applyExerciseSubstitution(exercise, substitutionId)
                : exercise
            ),
          };
        }),
      };
    }),
  };
}

export function replaceTrainingPlanDay(
  plan = {},
  weekNumber,
  dayNumber,
  nextDay = {}
) {
  const normalizedPlan = normalizeTrainingPlan(plan);

  return {
    ...normalizedPlan,
    weeks: normalizedPlan.weeks.map((week) => {
      if (week.week !== weekNumber) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day, dayIndex) =>
          day.day === dayNumber ?
            normalizeTrainingDay(
              {
                ...nextDay,
                day: dayNumber,
                preferredWeekday:
                  normalizeString(nextDay?.preferredWeekday) || day.preferredWeekday,
                originalDayNumber:
                  getOriginalDayNumber(nextDay, getOriginalDayNumber(day, day.day)),
              },
              dayIndex
            ) :
            day
        ),
      };
    }),
  };
}

export function applyMissedSessionAdjustment(plan = {}, options = {}) {
  const normalizedPlan = normalizeTrainingPlan(plan);
  const completedDaySet = getCompletedDaySet(options.completedDays);
  const weekNumber = parsePositiveInteger(options.weekNumber);
  const dayNumber = parsePositiveInteger(options.dayNumber);

  if (!weekNumber || !dayNumber) {
    return {
      plan: normalizedPlan,
      completedDays: Array.from(completedDaySet),
      aiAdjustment: null,
    };
  }

  const targetWeekIndex = normalizedPlan.weeks.findIndex(
    (week) => week.week === weekNumber
  );

  if (targetWeekIndex === -1) {
    return {
      plan: normalizedPlan,
      completedDays: Array.from(completedDaySet),
      aiAdjustment: null,
    };
  }

  const targetWeek = normalizedPlan.weeks[targetWeekIndex];
  const sortedDays = targetWeek.days.slice().sort((left, right) => left.day - right.day);
  const currentDayIndex = sortedDays.findIndex((day) => day.day === dayNumber);

  if (currentDayIndex === -1) {
    return {
      plan: normalizedPlan,
      completedDays: Array.from(completedDaySet),
      aiAdjustment: null,
    };
  }

  const currentDay = sortedDays[currentDayIndex];

  if (isDayResolved(currentDay, targetWeek.week, completedDaySet)) {
    return {
      plan: normalizedPlan,
      completedDays: Array.from(completedDaySet),
      aiAdjustment: null,
    };
  }

  const normalizedReason = normalizeMissedSessionReason(options.reason);
  const daysUnavailable = Number.parseInt(options.daysUnavailable, 10);
  const longTermSickness =
    normalizedReason === MISSED_SESSION_REASONS.illness_injury &&
    Number.isFinite(daysUnavailable) &&
    daysUnavailable >= 7;

  if (longTermSickness) {
    const restartedBlock = restartCurrentBlock(
      normalizedPlan,
      targetWeek.week,
      options.completedDays
    );

    return {
      plan: restartedBlock.plan,
      completedDays: restartedBlock.completedDays,
      aiAdjustment: null,
      action: "restart_block",
    };
  }

  const adjustmentState = getWeekAdjustmentState(targetWeek);
  const nextMissedSessionCount = adjustmentState.missedSessionCount + 1;
  const futureSlots = sortedDays.slice(currentDayIndex + 1).filter(
    (day) => !isDayResolved(day, targetWeek.week, completedDaySet)
  );
  const unresolvedTail = sortedDays.slice(currentDayIndex).filter(
    (day) => !isDayResolved(day, targetWeek.week, completedDaySet)
  );
  const taperWeek = isTaperWeek(normalizedPlan, targetWeek, options);
  const deloadWeek = isDeloadWeek(targetWeek);
  const originalPlannedSessions = adjustmentState.originalPlannedSessions;
  let keptSessions = [];
  let primaryMode = "";
  let primarySummary = "";
  let repeatNextWeek = false;

  if (taperWeek) {
    if (futureSlots.length > 0) {
      const primerSession = pickPrioritySession(unresolvedTail, { isTaperWeek: true });

      if (primerSession) {
        keptSessions = [primerSession];
        primaryMode = "taper_primer";
        primarySummary =
          "Missed taper work was replaced with a short primer instead of catch-up volume.";
      }
    }
  } else if (normalizedReason === MISSED_SESSION_REASONS.illness_injury) {
    if (futureSlots.length > 0) {
      const reEntrySession = pickPrioritySession(unresolvedTail, { isTaperWeek: false });

      if (reEntrySession) {
        keptSessions = [reEntrySession];
        primaryMode = "re_entry";
        primarySummary =
          "Illness or injury flagged. Catch-up volume was removed and only a conservative re-entry session was kept.";
      }
    }

    repeatNextWeek = true;
  } else if (nextMissedSessionCount >= 3) {
    if (futureSlots.length > 0) {
      const reEntrySession = pickPrioritySession(unresolvedTail, { isTaperWeek: false });

      if (reEntrySession) {
        keptSessions = [reEntrySession];
        primaryMode = "re_entry";
        primarySummary =
          "Most of the week was disrupted, so the remaining slot was converted into a conservative re-entry session.";
      }
    }

    repeatNextWeek = true;
  } else if (nextMissedSessionCount === 2) {
    if (futureSlots.length > 0) {
      const prioritySession = pickPrioritySession(unresolvedTail, {
        isTaperWeek: taperWeek,
      });

      if (prioritySession) {
        keptSessions = [prioritySession];
        primaryMode = "priority_rescue";
        primarySummary =
          "Two sessions were missed, so only one priority rescue session was kept for the remainder of the week.";
      }
    }

    repeatNextWeek = true;
  } else if (futureSlots.length > 0) {
    keptSessions = unresolvedTail.slice(0, futureSlots.length);
    primaryMode =
      futureSlots.length === 1 || deloadWeek ?
        "late_week_rescue" :
        "shift_forward";
    primarySummary =
      primaryMode === "late_week_rescue" ?
        "The missed session was shortened into a rescue version and moved into the last viable slot of the week." :
        "The missed session was shifted forward inside the same training week to preserve the weekly order.";
    repeatNextWeek =
      originalPlannedSessions > 0 &&
      nextMissedSessionCount / originalPlannedSessions >= 0.5;
  } else {
    primarySummary =
      "The week ran out of room, so the missed session expired instead of rolling forward indefinitely.";
    repeatNextWeek =
      originalPlannedSessions > 0 &&
      nextMissedSessionCount / originalPlannedSessions >= 0.5;
  }

  if (
    isTestingTrainingDay(currentDay) &&
    futureSlots.length === 0 &&
    !primaryMode
  ) {
    primarySummary =
      "The testing session was skipped because there was no same-week slot left to reschedule it safely.";
  }

  const keptSessionIdentitySet = new Set(
    keptSessions.map((day) => getOriginalDayNumber(day, day.day))
  );
  const assignedDayNumbers = new Set();
  const futureAssignments = new Map();

  futureSlots.forEach((slot, index) => {
    if (index >= keptSessions.length) {
      return;
    }

    const assignedDay = buildAssignedDay(keptSessions[index], slot, {
      mode: index === 0 ? primaryMode : "shift_forward",
      reason: normalizedReason,
      summary:
        index === 0 ?
          primarySummary :
          "Shifted later in the same week after an earlier missed session.",
    });

    futureAssignments.set(slot.day, assignedDay);
    assignedDayNumbers.add(slot.day);
  });

  const rewrittenWeek = {
    ...targetWeek,
    adjustmentState: {
      ...adjustmentState,
      missedSessionCount: nextMissedSessionCount,
      originalPlannedSessions,
      originalWeekSnapshot: adjustmentState.originalWeekSnapshot,
      lastMissedReason: normalizedReason,
      lastAction:
        primaryMode || (repeatNextWeek ? "repeat_week" : "skip_session"),
    },
    days: sortedDays.map((day) => {
      if (day.day < dayNumber || isDayCompleted(day, targetWeek.week, completedDaySet)) {
        return day;
      }

      if (day.day === dayNumber) {
        return buildSkippedDay(
          day,
          normalizedReason,
          primarySummary || "The scheduled slot was missed."
        );
      }

      if (futureAssignments.has(day.day)) {
        return futureAssignments.get(day.day);
      }

      if (!isDaySkipped(day)) {
        const originalDayNumber = getOriginalDayNumber(day, day.day);
        const skippedSummary =
          keptSessionIdentitySet.has(originalDayNumber) && assignedDayNumbers.has(day.day) ?
            "Moved into a later slot of the same week." :
            "Dropped to protect the weekly structure after missed sessions.";

        return buildSkippedDay(day, normalizedReason, skippedSummary);
      }

      return day;
    }),
  };

  let nextPlan = {
    ...normalizedPlan,
    weeks: normalizedPlan.weeks.map((week, index) =>
      index === targetWeekIndex ? rewrittenWeek : week
    ),
  };

  if (repeatNextWeek) {
    nextPlan = buildPlanWithRepeatedWeek(
      nextPlan,
      targetWeek.week,
      adjustmentState.originalWeekSnapshot
    );
  }

  const firstAssignedDay = futureSlots[0];
  const shouldRequestAiAdjustment =
    firstAssignedDay &&
    [
      "late_week_rescue",
      "priority_rescue",
      "re_entry",
      "taper_primer",
    ].includes(primaryMode);

  return {
    plan: nextPlan,
    completedDays: Array.from(completedDaySet),
    aiAdjustment:
      shouldRequestAiAdjustment ?
        {
          weekNumber: targetWeek.week,
          dayNumber: firstAssignedDay.day,
          mode: primaryMode,
          missedSessionCount: nextMissedSessionCount,
          reason: normalizedReason,
          currentWeek: rewrittenWeek,
          sourceDay: currentDay,
          targetDay: futureAssignments.get(firstAssignedDay.day),
        } :
        null,
    action:
      repeatNextWeek ?
        "repeat_next_week" :
      primaryMode ?
        primaryMode :
        "skip_session",
  };
}
