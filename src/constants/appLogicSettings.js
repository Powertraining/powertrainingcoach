export const TRAINING_PHASE_OPTIONS = Object.freeze([
  {
    label: "Off-camp (No planned competition)",
    value: "off_camp",
    description: "Use longer-term development without a planned competition timeline.",
  },
  {
    label: "In Camp (Planned competition)",
    value: "in_camp",
    description: "Back-plan the training around an upcoming competition.",
  },
]);

export const COMBAT_TRAINING_INTENSITY_OPTIONS = Object.freeze([
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Intense", value: "intense" },
]);

export const COMPETENCY_AND_LIMITATION_OPTIONS = Object.freeze([
  { label: "Barbells", value: "barbells" },
  { label: "Machines", value: "machines" },
  { label: "Dumbbells", value: "dumbbells" },
  { label: "Olympic lifts", value: "olympic_lifts" },
  { label: "Ballistic training", value: "ballistic_training" },
]);

export const SPORT_LOAD_LEVEL_OPTIONS = Object.freeze([
  {
    label: "1 - Low",
    value: 1,
    multiplier: 1,
    shortDescription: "Technical or easy sport week.",
    description: "Lightest sport week, so strength volume can stay fully on plan.",
  },
  {
    label: "2 - Normal",
    value: 2,
    multiplier: 0.9,
    shortDescription: "Normal productive sport week.",
    description: "Slightly trim strength volume when sport practice is normal but meaningful.",
  },
  {
    label: "3 - High",
    value: 3,
    multiplier: 0.7,
    shortDescription: "Hard sport week.",
    description: "Cut strength volume clearly, especially accessories and back-off work.",
  },
  {
    label: "4 - Peak",
    value: 4,
    multiplier: 0.5,
    shortDescription: "Peak or fight-like sport week.",
    description: "Use a minimum-effective-dose strength week: keep intensity exposure, cut volume hard.",
  },
]);

export const LIFT_INTENSITY_METHOD_OPTIONS = Object.freeze([
  {
    label: "% logic",
    value: "percentage",
    description: "Use percentage-based loading when 1RM-style references are available.",
  },
  {
    label: "RPE",
    value: "rpe",
    description: "Use Rate of Perceived Exertion to autoregulate lift intensity.",
  },
]);

export const PERCENTAGE_REFERENCE_METHOD_OPTIONS = Object.freeze([
  {
    label: "1. True 1RM tests",
    value: "true_1rm",
    description:
      "Rare, most precise, and only suitable far from competition for experienced lifters.",
  },
  {
    label: "2. 2-5RM + Epley estimate",
    value: "multi_rm",
    description:
      "Use a hard set of 2-5 reps, then estimate 1RM with Epley's formula for future percentage work.",
  },
  {
    label: "3. Heavy single @RPE 8-9",
    value: "heavy_single",
    description:
      "Default option. Estimate 1RM from a heavy single using roughly 2.5% per RPE point with much less fatigue.",
  },
]);

export const DELOAD_STRATEGY_OPTIONS = Object.freeze([
  {
    label: "Maintain intensity, reduce volume 30-50%",
    value: "maintain_intensity_reduce_volume",
    description: "Keep loads relatively heavy while cutting total work.",
  },
  {
    label: "Maintain volume, reduce intensity",
    value: "maintain_volume_reduce_intensity",
    description: "Keep the amount of work similar while backing off the load.",
  },
]);

export const LOADING_STRATEGY_OPTIONS = Object.freeze([
  {
    label: "Flat Loading",
    value: "flat_loading",
    description: "Basic and repeatable. Recommended for beginners.",
  },
  {
    label: "Ascending pyramid",
    value: "ascending_pyramid",
    description:
      "Start with moderately intense and/or light-volume work, then progress to intense and voluminous work.",
  },
  {
    label: "Descending pyramid",
    value: "descending_pyramid",
    description:
      "Start with intense or high-volume work, then progress to less intense and less voluminous work.",
  },
  {
    label: "Double pyramid",
    value: "double_pyramid",
    description:
      "Both pyramids are performed back-to-back: high-to-low and low-to-high.",
  },
]);

export const APP_LOGIC_SETTINGS_DEFAULTS = Object.freeze({
  trainingPhase: "off_camp",
  competitionTimeline: "",
  combatTrainingIntensity: "moderate",
  sportLoadLevel: 2,
  competencyAndLimitations: [],
  liftIntensityMethod: "percentage",
  percentageReferenceMethod: "heavy_single",
  deloadStrategy: "maintain_intensity_reduce_volume",
  loadingStrategy: "flat_loading",
});

function isAllowedValue(value, options) {
  return options.some((option) => option.value === value);
}

export function normalizeSportLoadLevel(value) {
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  return isAllowedValue(parsedValue, SPORT_LOAD_LEVEL_OPTIONS)
    ? parsedValue
    : APP_LOGIC_SETTINGS_DEFAULTS.sportLoadLevel;
}

export function getSportLoadLevelOption(value) {
  const normalizedValue = normalizeSportLoadLevel(value);

  return (
    SPORT_LOAD_LEVEL_OPTIONS.find((option) => option.value === normalizedValue) ||
    SPORT_LOAD_LEVEL_OPTIONS[1]
  );
}

export function getSportLoadMultiplier(value) {
  return getSportLoadLevelOption(value).multiplier;
}

function mapLegacyCompetitionPeriodToTrainingPhase(competitionPeriod) {
  if (competitionPeriod === "fight_camp" || competitionPeriod === "pre_season" || competitionPeriod === "in_season") {
    return "in_camp";
  }

  return APP_LOGIC_SETTINGS_DEFAULTS.trainingPhase;
}

function getNormalizedCompetencyAndLimitations(values) {
  const rawValues = Array.isArray(values) ? values : [];
  const selectedValues = new Set(rawValues);

  return COMPETENCY_AND_LIMITATION_OPTIONS
    .map((option) => option.value)
    .filter((value) => selectedValues.has(value));
}

function coerceAppLogicSettings(source = {}, { preserveCompetitionTimeline = false } = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const inferredTrainingPhase = isAllowedValue(
    safeSource.trainingPhase,
    TRAINING_PHASE_OPTIONS
  )
    ? safeSource.trainingPhase
    : mapLegacyCompetitionPeriodToTrainingPhase(safeSource.competitionPeriod);

  const competitionTimeline =
    typeof safeSource.competitionTimeline === "string"
      ? safeSource.competitionTimeline.trim()
      : typeof safeSource.competitionDate === "string"
        ? safeSource.competitionDate.trim()
        : "";

  return {
    trainingPhase: inferredTrainingPhase,
    competitionTimeline:
      preserveCompetitionTimeline || inferredTrainingPhase === "in_camp"
        ? competitionTimeline
        : "",
    combatTrainingIntensity: isAllowedValue(
      safeSource.combatTrainingIntensity,
      COMBAT_TRAINING_INTENSITY_OPTIONS
    )
      ? safeSource.combatTrainingIntensity
      : APP_LOGIC_SETTINGS_DEFAULTS.combatTrainingIntensity,
    sportLoadLevel: normalizeSportLoadLevel(safeSource.sportLoadLevel),
    competencyAndLimitations: getNormalizedCompetencyAndLimitations(
      safeSource.competencyAndLimitations
    ),
    liftIntensityMethod: isAllowedValue(
      safeSource.liftIntensityMethod,
      LIFT_INTENSITY_METHOD_OPTIONS
    )
      ? safeSource.liftIntensityMethod
      : APP_LOGIC_SETTINGS_DEFAULTS.liftIntensityMethod,
    percentageReferenceMethod: isAllowedValue(
      safeSource.percentageReferenceMethod,
      PERCENTAGE_REFERENCE_METHOD_OPTIONS
    )
      ? safeSource.percentageReferenceMethod
      : APP_LOGIC_SETTINGS_DEFAULTS.percentageReferenceMethod,
    deloadStrategy: isAllowedValue(
      safeSource.deloadStrategy,
      DELOAD_STRATEGY_OPTIONS
    )
      ? safeSource.deloadStrategy
      : APP_LOGIC_SETTINGS_DEFAULTS.deloadStrategy,
    loadingStrategy: isAllowedValue(
      safeSource.loadingStrategy,
      LOADING_STRATEGY_OPTIONS
    )
      ? safeSource.loadingStrategy
      : APP_LOGIC_SETTINGS_DEFAULTS.loadingStrategy,
  };
}

export function getAppLogicSettingsFormState(source = {}) {
  return {
    ...APP_LOGIC_SETTINGS_DEFAULTS,
    ...coerceAppLogicSettings(source, { preserveCompetitionTimeline: true }),
  };
}

export function normalizeAppLogicSettings(source = {}) {
  return {
    ...APP_LOGIC_SETTINGS_DEFAULTS,
    ...coerceAppLogicSettings(source, { preserveCompetitionTimeline: false }),
  };
}

export function mergeAppLogicSettings(questionnaire = {}, patch = {}) {
  const safeQuestionnaire =
    questionnaire && typeof questionnaire === "object" ? questionnaire : {};
  const safePatch = patch && typeof patch === "object" ? patch : {};
  const merged = {
    ...safeQuestionnaire,
    ...safePatch,
  };
  const {
    competencyAndLimitations: _competencyAndLimitations,
    ...mergedWithoutDeprecatedFields
  } = merged;

  return {
    ...mergedWithoutDeprecatedFields,
    ...normalizeAppLogicSettings(merged),
  };
}

export function areAppLogicSettingsEqual(left, right) {
  const normalizedLeft = normalizeAppLogicSettings(left);
  const normalizedRight = normalizeAppLogicSettings(right);

  return (
    normalizedLeft.trainingPhase === normalizedRight.trainingPhase &&
    normalizedLeft.competitionTimeline === normalizedRight.competitionTimeline &&
    normalizedLeft.combatTrainingIntensity ===
      normalizedRight.combatTrainingIntensity &&
    normalizedLeft.sportLoadLevel === normalizedRight.sportLoadLevel &&
    normalizedLeft.liftIntensityMethod ===
      normalizedRight.liftIntensityMethod &&
    normalizedLeft.percentageReferenceMethod ===
      normalizedRight.percentageReferenceMethod &&
    normalizedLeft.deloadStrategy === normalizedRight.deloadStrategy &&
    normalizedLeft.loadingStrategy === normalizedRight.loadingStrategy &&
    normalizedLeft.competencyAndLimitations.length ===
      normalizedRight.competencyAndLimitations.length &&
    normalizedLeft.competencyAndLimitations.every(
      (value, index) =>
        value === normalizedRight.competencyAndLimitations[index]
    )
  );
}
