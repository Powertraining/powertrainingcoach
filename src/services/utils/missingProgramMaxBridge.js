function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toLiftKey(value) {
  return normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parsePositiveInteger(value, fallback = null) {
  const parsedValue = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseRpeTarget(exercise = {}) {
  const explicitTarget = Number(exercise?.performanceTarget?.targetRpe);
  if (Number.isFinite(explicitTarget) && explicitTarget >= 7 && explicitTarget <= 9) {
    return explicitTarget;
  }

  const notes = String(exercise?.notes || "");
  const targetMatch = notes.match(/\btarget\s*(?:RPE\s*)?(\d+(?:\.\d+)?)/i);
  const targetValue = Number(targetMatch?.[1]);
  if (Number.isFinite(targetValue) && targetValue >= 7 && targetValue <= 9) {
    return targetValue;
  }

  const notesMatch = notes.match(
    /(?:@\s*)?RPE\s*(\d+(?:\.\d+)?)/i
  );
  const notesTarget = Number(notesMatch?.[1]);
  return Number.isFinite(notesTarget) && notesTarget >= 7 && notesTarget <= 9
    ? notesTarget
    : 8;
}

function ensureRpeBridgeNotes(notes = "", targetRpe = 8) {
  const normalizedNotes = normalizeString(notes);
  if (/(?:@\s*)?RPE\s*\d/i.test(normalizedNotes)) {
    return normalizedNotes;
  }

  return [normalizedNotes, `Use RPE 7-9 (target ${targetRpe}).`]
    .filter(Boolean)
    .join(" ");
}

function getRpeBridgeReps(reps) {
  const parsedReps = parsePositiveInteger(reps);
  return parsedReps >= 3 && parsedReps <= 10 ? reps : "3-5";
}

function isLikelyMainLift(exercise = {}) {
  const name = normalizeString(exercise?.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

  if (
    /\b(?:pull ups?|chin ups?|lat pull downs?|lat pulldowns?|romanian deadlifts?|rdls?|rows?|split squats?|goblet squats?|jump squats?)\b/.test(
      name
    )
  ) {
    return false;
  }

  return /\b(?:squat|deadlift|trap bar|bench press|floor press|overhead press|shoulder press|military press|hip thrust|power clean|hang clean|clean pull|snatch)\b/.test(name);
}

function getKnownProgramMaxLiftKeys(summary = {}) {
  return new Set(
    (Array.isArray(summary?.latestByLift) ? summary.latestByLift : [])
      .filter((entry) => Number(entry?.trainingMaxKg) > 0)
      .map((entry) => toLiftKey(entry?.liftName))
      .filter(Boolean)
  );
}

export function applyMissingProgramMaxBridges(plan = {}, userInput = {}) {
  if (
    userInput?.liftIntensityMethod !== "percentage"
  ) {
    return plan;
  }

  const weeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  const firstWeekNumber = Math.min(
    ...weeks.map((week) => Number.parseInt(week?.week, 10)).filter(Number.isFinite)
  );
  const knownLiftKeys = getKnownProgramMaxLiftKeys(
    userInput?.strengthAssessmentSummary
  );
  const bridgedLiftKeys = new Set();

  return {
    ...plan,
    weeks: weeks.map((week) => ({
      ...week,
      days: (Array.isArray(week?.days) ? week.days : []).map((day) => ({
        ...day,
        exercises: (Array.isArray(day?.exercises) ? day.exercises : []).map((exercise) => {
          const liftName = normalizeString(exercise?.name);
          const liftKey = toLiftKey(liftName);
          const targetRpe = parseRpeTarget(exercise);
          const isRequiredLift =
            liftKey &&
            !exercise?.endurancePrescription &&
            isLikelyMainLift(exercise);

          if (isRequiredLift && knownLiftKeys.has(liftKey)) {
            const {
              strengthAssessment: _strengthAssessment,
              performanceTarget,
              ...exerciseWithoutAssessment
            } = exercise;

            return {
              ...exerciseWithoutAssessment,
              ...(performanceTarget?.strategy === "fixed_rpe"
                ? {}
                : { performanceTarget }),
              percentagePrescription:
                exercise?.percentagePrescription ||
                getFutureExposurePercentagePrescription(
                  exercise,
                  userInput?.loadingStrategy
                ),
            };
          }

          if (
            Number.parseInt(week?.week, 10) === firstWeekNumber &&
            isRequiredLift &&
            bridgedLiftKeys.has(liftKey)
          ) {
            const {
              percentagePrescription: _percentagePrescription,
              strengthAssessment: _strengthAssessment,
              ...exerciseWithoutMaxMetadata
            } = exercise;

            return {
              ...exerciseWithoutMaxMetadata,
              notes: ensureRpeBridgeNotes(exercise?.notes, targetRpe),
            };
          }

          const shouldBridge =
            Number.parseInt(week?.week, 10) === firstWeekNumber &&
            isRequiredLift &&
            !bridgedLiftKeys.has(liftKey);

          if (!shouldBridge) {
            return exercise;
          }

          bridgedLiftKeys.add(liftKey);
          return {
            ...exercise,
            notes: ensureRpeBridgeNotes(exercise?.notes, targetRpe),
            reps: getRpeBridgeReps(exercise?.reps),
            percentagePrescription: null,
            strengthAssessment: {
              method: "rpe_based_1rm",
              liftName,
              minimumRpe: targetRpe,
              prompt: `Log the load, reps, and RPE for ${liftName} so the app can estimate your Program Max.`,
            },
          };
        }),
      })),
    })),
  };
}

function getFutureExposurePercentagePrescription(exercise = {}, loadingStrategy) {
  const setCount = Math.min(parsePositiveInteger(exercise?.sets, 3), 6);
  const reps = Math.min(parsePositiveInteger(exercise?.reps, 5), 10);
  const targetRpe = parseRpeTarget(exercise);
  const repsInReserve = Math.max(1, Math.round(10 - targetRpe));
  const estimatedMaxReps = Math.min(reps + repsInReserve, 10);
  const estimatedPercent = Math.max(
    55,
    Math.round((100 / (1 + estimatedMaxReps / 30)) * 10) / 10
  );
  const strategy = [
    "flat_loading",
    "ascending_pyramid",
    "descending_pyramid",
    "double_pyramid",
  ].includes(loadingStrategy)
    ? loadingStrategy
    : "flat_loading";
  let workingSets;

  if (strategy === "flat_loading" || setCount === 1) {
    workingSets = [{ count: setCount, reps, percent1RM: estimatedPercent }];
  } else {
    const ascendingPercents = Array.from({ length: setCount }, (_, index) =>
      Math.max(50, estimatedPercent - (setCount - index - 1) * 2.5)
    );
    const percents =
      strategy === "descending_pyramid"
        ? ascendingPercents.slice().reverse()
        : strategy === "double_pyramid"
          ? ascendingPercents.map((percent, index) => {
              const midpoint = Math.floor((setCount - 1) / 2);
              return index <= midpoint
                ? percent
                : ascendingPercents[Math.max(0, setCount - index - 1)];
            })
          : ascendingPercents;
    workingSets = percents.map((percent1RM) => ({
      count: 1,
      reps,
      percent1RM,
    }));
  }

  return {
    referenceLiftName: normalizeString(exercise?.name),
    loadingStrategy: strategy,
    workingSets,
  };
}

export function applyProgramMaxToFutureExposures(
  plan = {},
  {
    liftName = "",
    afterWeekNumber = null,
    afterDayNumber = null,
    loadingStrategy = "flat_loading",
  } = {}
) {
  const targetLiftKey = toLiftKey(liftName);
  const sourceWeek = Number.parseInt(afterWeekNumber, 10);
  const sourceDay = Number.parseInt(afterDayNumber, 10);

  if (!targetLiftKey || !Number.isFinite(sourceWeek) || !Number.isFinite(sourceDay)) {
    return plan;
  }

  return {
    ...plan,
    weeks: (Array.isArray(plan?.weeks) ? plan.weeks : []).map((week) => ({
      ...week,
      days: (Array.isArray(week?.days) ? week.days : []).map((day) => ({
        ...day,
        exercises: (Array.isArray(day?.exercises) ? day.exercises : []).map(
          (exercise) => {
            const weekNumber = Number.parseInt(week?.week, 10);
            const dayNumber = Number.parseInt(day?.day, 10);
            const isFutureExposure =
              weekNumber > sourceWeek ||
              (weekNumber === sourceWeek && dayNumber > sourceDay);
            const referenceLiftKey = toLiftKey(
              exercise?.percentagePrescription?.referenceLiftName
            );
            const matchesLift =
              toLiftKey(exercise?.name) === targetLiftKey ||
              referenceLiftKey === targetLiftKey;

            if (!isFutureExposure || !matchesLift) {
              return exercise;
            }

            const {
              strengthAssessment: _strengthAssessment,
              performanceTarget,
              ...exerciseWithoutAssessment
            } = exercise;

            return {
              ...exerciseWithoutAssessment,
              ...(performanceTarget?.strategy === "fixed_rpe"
                ? {}
                : { performanceTarget }),
              percentagePrescription:
                exercise?.percentagePrescription ||
                getFutureExposurePercentagePrescription(
                  exercise,
                  loadingStrategy
                ),
            };
          }
        ),
      })),
    })),
  };
}
