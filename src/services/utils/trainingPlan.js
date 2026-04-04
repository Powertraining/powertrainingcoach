import {
  getNormalizedWeekday,
  getWeekdayNameFromIndex,
} from "../../constants/weekdays.js";

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
    selectedSubstitutionId: selectedOption.id,
    substitutionOptions: normalizedOptions,
  };
}

export function getExerciseSubstitutionOptions(exercise = {}) {
  return normalizeExercise(exercise).substitutionOptions;
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

export function normalizeTrainingPlan(plan = {}) {
  const safePlan = plan && typeof plan === "object" ? plan : {};

  return {
    ...safePlan,
    summary: normalizeString(safePlan.summary),
    weeks: Array.isArray(safePlan.weeks)
      ? safePlan.weeks.map((week, weekIndex) => ({
          ...week,
          week:
            Number.isFinite(week?.week) && week.week > 0
              ? week.week
              : weekIndex + 1,
          days: Array.isArray(week?.days)
            ? week.days.map((day, dayIndex) => {
                const resolvedDayNumber = resolveTrainingDayNumber(day, dayIndex);

                return {
                  ...day,
                  day: resolvedDayNumber,
                  sessionLabel: buildSessionLabel(resolvedDayNumber),
                  preferredWeekday: resolvePreferredWeekday(day),
                  sessionProfile: normalizeSessionProfile(day),
                  exercises: Array.isArray(day?.exercises)
                    ? day.exercises.map((exercise) => normalizeExercise(exercise))
                    : [],
                };
              })
            : [],
        }))
      : [],
  };
}

export function getTrainingDayLabel(day = {}) {
  const safeDay = day && typeof day === "object" ? day : {};

  return normalizeString(
    safeDay.sessionLabel,
    buildSessionLabel(resolveTrainingDayNumber(safeDay))
  );
}

export function getTrainingDayPreferredWeekday(day = {}) {
  return resolvePreferredWeekday(day);
}

export function getTrainingDaySessionProfile(day = {}) {
  return normalizeSessionProfile(day);
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
