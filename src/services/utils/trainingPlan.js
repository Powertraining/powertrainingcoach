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

function normalizeExerciseOption(source = {}, fallbackExercise = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const normalizedOption = {
    name: normalizeString(safeSource.name, fallbackExercise.name || ""),
    sets: normalizeString(safeSource.sets, fallbackExercise.sets || ""),
    reps: normalizeString(safeSource.reps, fallbackExercise.reps || ""),
    notes: normalizeString(safeSource.notes, fallbackExercise.notes || ""),
    videoUrl: normalizeString(
      safeSource.videoUrl,
      fallbackExercise.videoUrl || ""
    ),
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
  const currentExercise = {
    name: normalizeString(safeExercise.name),
    sets: normalizeString(safeExercise.sets),
    reps: normalizeString(safeExercise.reps),
    notes: normalizeString(safeExercise.notes),
    videoUrl: normalizeString(safeExercise.videoUrl),
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
    ...safeExercise,
    name: selectedOption.name,
    sets: selectedOption.sets,
    reps: selectedOption.reps,
    notes: selectedOption.notes,
    videoUrl: selectedOption.videoUrl,
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
    videoUrl: nextOption.videoUrl,
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
            ? week.days.map((day, dayIndex) => ({
                ...day,
                day:
                  Number.isFinite(day?.day) && day.day > 0
                    ? day.day
                    : dayIndex + 1,
                exercises: Array.isArray(day?.exercises)
                  ? day.exercises.map((exercise) => normalizeExercise(exercise))
                  : [],
              }))
            : [],
        }))
      : [],
  };
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
