import {
  areAppLogicSettingsEqual,
  getAppLogicSettingsFormState,
  normalizeAppLogicSettings,
} from "./appLogicSettings.js";
import { getNormalizedWeekday } from "./weekdays.js";

export const STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS = Object.freeze([
  {
    label: "Beginner - little or no lifting/conditioning experience",
    value: "beginner",
  },
  {
    label: "Intermediate - comfortable with basic lifting and conditioning",
    value: "intermediate",
  },
  {
    label: "Advanced - very experienced with lifting, power, and conditioning work",
    value: "advanced",
  },
]);

export const DESIRED_TRAINING_OPTIONS = Object.freeze([
  { label: "Strength/Power only", value: "strength_power" },
  { label: "Endurance only", value: "endurance" },
  {
    label: "Strength/Power and Endurance",
    value: "strength_power_endurance",
  },
]);

export const CAPABILITY_RATING_OPTIONS = Object.freeze([
  { label: "Yes", value: "yes" },
  { label: "Somewhat", value: "somewhat" },
  { label: "No", value: "no" },
]);

export const TRAINING_CAPABILITY_GROUPS = Object.freeze([
  {
    title: "Strength training",
    items: Object.freeze([
      {
        label: "Compound lifts",
        value: "compoundLifts",
        description: "Squat, deadlift, bench, row, overhead press",
      },
      {
        label: "Single-leg lifts",
        value: "singleLegLifts",
        description: "Split squat, lunge, step-up",
      },
      {
        label: "Pulling work",
        value: "pullingWork",
        description: "Pull-ups, chin-ups, rows",
      },
    ]),
  },
  {
    title: "Power training",
    items: Object.freeze([
      {
        label: "Olympic-lift variations",
        value: "olympicLiftVariations",
        description: "Power clean, hang clean, push press, split jerk",
      },
      {
        label: "Plyometrics",
        value: "plyometrics",
        description: "Jumps, bounds, hops, landing drills",
      },
      {
        label: "Ballistic training",
        value: "ballisticTraining",
        description: "Medicine-ball throws, jump squats, landmine punches",
      },
    ]),
  },
  {
    title: "Conditioning",
    items: Object.freeze([
      {
        label: "Running / sprinting",
        value: "runningSprinting",
      },
      {
        label: "Bike / rower / assault bike",
        value: "bikeRowerAssaultBike",
      },
      {
        label: "Circuit training",
        value: "circuitTraining",
      },
      {
        label: "Heavy bag",
        value: "heavyBag",
        description: "If striker",
      },
    ]),
  },
]);

export const SESSION_DURATION_OPTIONS = Object.freeze([
  { label: "15 min", value: "15_min" },
  { label: "30 min", value: "30_min" },
  { label: "45 min", value: "45_min" },
  { label: "60 min", value: "60_min" },
  { label: "75 min", value: "75_min" },
  { label: "90 min", value: "90_min" },
  { label: "No limit", value: "no_time_limit" },
]);

export const EQUIPMENT_OPTIONS = Object.freeze([
  { label: "Full gym", value: "full_gym" },
  { label: "Minimal equipment", value: "home_minimal" },
  { label: "Home kit only", value: "bodyweight_only" },
]);

const SESSION_DURATION_MINUTES = Object.freeze({
  "15_min": 15,
  "30_min": 30,
  "45_min": 45,
  "60_min": 60,
  "75_min": 75,
  "90_min": 90,
  no_time_limit: null,
});

export const TRAINING_PREFERENCES_DEFAULTS = Object.freeze({
  experience: "beginner",
  desiredTraining: "strength_power_endurance",
  trainingCapabilities: Object.freeze({}),
  eventPreparation: "",
  sessionDuration: "60_min",
  equipment: "full_gym",
  daysPerWeek: 3,
  preferredWeekdays: [],
  injuriesInput: "",
});

function isAllowedValue(value, options) {
  return options.some((option) => option.value === value);
}

function parsePositiveInteger(value) {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function parseDaysPerWeek(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};

  return (
    parsePositiveInteger(safeSource.daysPerWeek) ??
    parsePositiveInteger(safeSource.sessionsPerWeek) ??
    TRAINING_PREFERENCES_DEFAULTS.daysPerWeek
  );
}

function getTrainingCapabilityKeys() {
  return TRAINING_CAPABILITY_GROUPS.flatMap((group) =>
    group.items.map((item) => item.value)
  );
}

function normalizeCapabilityRating(value) {
  return isAllowedValue(value, CAPABILITY_RATING_OPTIONS) ? value : "somewhat";
}

function normalizeTrainingCapabilities(source = {}) {
  const rawCapabilities =
    source.trainingCapabilities && typeof source.trainingCapabilities === "object"
      ? source.trainingCapabilities
      : {};
  const legacyCompetencyValues = Array.isArray(source.competencyAndLimitations)
    ? new Set(source.competencyAndLimitations)
    : new Set();
  const legacyOverrides = {
    compoundLifts: legacyCompetencyValues.has("barbells") ? "yes" : undefined,
    olympicLiftVariations: legacyCompetencyValues.has("olympic_lifts")
      ? "yes"
      : undefined,
    ballisticTraining: legacyCompetencyValues.has("ballistic_training")
      ? "yes"
      : undefined,
    plyometrics:
      source.plyometricsExperience === "none"
        ? "no"
        : source.plyometricsExperience === "beginner"
          ? "somewhat"
          : source.plyometricsExperience === "intermediate" ||
              source.plyometricsExperience === "advanced"
            ? "yes"
            : undefined,
  };

  return getTrainingCapabilityKeys().reduce((accumulator, key) => {
    accumulator[key] = normalizeCapabilityRating(
      rawCapabilities[key] ?? legacyOverrides[key]
    );
    return accumulator;
  }, {});
}

function normalizeDesiredTraining(source = {}) {
  if (isAllowedValue(source.desiredTraining, DESIRED_TRAINING_OPTIONS)) {
    return source.desiredTraining;
  }

  if (
    source.goal === "strength" ||
    source.goal === "power" ||
    source.goal === "hypertrophy"
  ) {
    return "strength_power";
  }

  return TRAINING_PREFERENCES_DEFAULTS.desiredTraining;
}

function getLegacyGoalFromDesiredTraining(desiredTraining) {
  switch (desiredTraining) {
    case "endurance":
      return "conditioning";
    case "strength_power":
      return "power";
    case "strength_power_endurance":
    default:
      return "general";
  }
}

function normalizeEventPreparation(source = {}) {
  if (typeof source.eventPreparation === "string") {
    return source.eventPreparation.trim();
  }

  if (Array.isArray(source.competitionEvents)) {
    return source.competitionEvents
      .map((event = {}) => {
        if (typeof event === "string") {
          return event.trim();
        }

        return [
          typeof event.date === "string" ? event.date.trim() : "",
          typeof event.targetPeakDate === "string"
            ? `peak ${event.targetPeakDate.trim()}`
            : "",
          typeof event.priority === "string" ? `${event.priority} priority` : "",
        ]
          .filter(Boolean)
          .join(" - ");
      })
      .filter(Boolean)
      .join("; ");
  }

  return (
    typeof source.competitionTimeline === "string"
      ? source.competitionTimeline.trim()
      : typeof source.competitionDate === "string"
        ? source.competitionDate.trim()
        : ""
  );
}

function normalizeSessionDuration(source = {}) {
  const rawValue = source.sessionDuration;
  if (isAllowedValue(rawValue, SESSION_DURATION_OPTIONS)) {
    return rawValue;
  }

  const parsedMinutes = Number.parseInt(
    rawValue ?? source.sessionDurationMinutes,
    10
  );
  const matchingOption = SESSION_DURATION_OPTIONS.find(
    (option) => SESSION_DURATION_MINUTES[option.value] === parsedMinutes
  );

  return matchingOption
    ? matchingOption.value
    : TRAINING_PREFERENCES_DEFAULTS.sessionDuration;
}

function normalizeEquipment(source = {}) {
  if (isAllowedValue(source.equipment, EQUIPMENT_OPTIONS)) {
    return source.equipment;
  }

  if (isAllowedValue(source.equipmentAccess, EQUIPMENT_OPTIONS)) {
    return source.equipmentAccess;
  }

  return TRAINING_PREFERENCES_DEFAULTS.equipment;
}

export function getSessionDurationMinutes(sessionDuration) {
  const normalizedSessionDuration = normalizeSessionDuration({
    sessionDuration,
  });

  return SESSION_DURATION_MINUTES[normalizedSessionDuration];
}

export function getNormalizedSessionDuration(source = {}) {
  return normalizeSessionDuration(source);
}

function normalizeInjuries(source = {}) {
  const rawInput =
    typeof source.injuriesInput === "string"
      ? source.injuriesInput
      : Array.isArray(source.injuries)
        ? source.injuries.join(", ")
        : typeof source.injuries === "string"
          ? source.injuries
          : "";

  return rawInput
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getRawPreferredWeekdays(source = {}) {
  if (Array.isArray(source.preferredWeekdays)) {
    return source.preferredWeekdays;
  }

  if (Array.isArray(source.preferredTrainingDays)) {
    return source.preferredTrainingDays;
  }

  if (typeof source.preferredWeekdays === "string") {
    return source.preferredWeekdays.split(",");
  }

  return TRAINING_PREFERENCES_DEFAULTS.preferredWeekdays;
}

function normalizePreferredWeekdays(source = {}, daysPerWeek) {
  const rawPreferredWeekdays = getRawPreferredWeekdays(source);

  return Array.from({ length: daysPerWeek }, (_, index) =>
    getNormalizedWeekday(rawPreferredWeekdays[index])
  );
}

export function getTrainingPreferencesFormState(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const daysPerWeek = parseDaysPerWeek(safeSource);
  const desiredTraining = normalizeDesiredTraining(safeSource);
  const eventPreparation = normalizeEventPreparation(safeSource);
  const sessionDuration = normalizeSessionDuration(safeSource);
  const equipment = normalizeEquipment(safeSource);

  return {
    experience: isAllowedValue(
      safeSource.experience,
      STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS
    )
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    desiredTraining,
    trainingCapabilities: normalizeTrainingCapabilities(safeSource),
    eventPreparation,
    sessionDuration,
    equipment,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    injuriesInput: Array.isArray(safeSource.injuries)
      ? safeSource.injuries.join(", ")
      : typeof safeSource.injuriesInput === "string"
        ? safeSource.injuriesInput
        : typeof safeSource.injuries === "string"
          ? safeSource.injuries
          : TRAINING_PREFERENCES_DEFAULTS.injuriesInput,
    ...getAppLogicSettingsFormState(safeSource),
  };
}

export function normalizeTrainingPreferences(source = {}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const daysPerWeek = parseDaysPerWeek(safeSource);
  const desiredTraining = normalizeDesiredTraining(safeSource);
  const eventPreparation = normalizeEventPreparation(safeSource);
  const equipment = normalizeEquipment(safeSource);
  const appLogicSettings = normalizeAppLogicSettings({
    ...safeSource,
    competitionTimeline:
      eventPreparation ||
      safeSource.competitionTimeline ||
      "",
  });
  const sessionDuration = normalizeSessionDuration(safeSource);

  return {
    goal: getLegacyGoalFromDesiredTraining(desiredTraining),
    desiredTraining,
    experience: isAllowedValue(
      safeSource.experience,
      STRENGTH_CONDITIONING_EXPERIENCE_OPTIONS
    )
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    trainingCapabilities: normalizeTrainingCapabilities(safeSource),
    eventPreparation,
    sessionDuration,
    sessionDurationMinutes: SESSION_DURATION_MINUTES[sessionDuration],
    equipment,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    injuries: normalizeInjuries(safeSource),
    ...appLogicSettings,
  };
}

export function mergeTrainingPreferences(questionnaire = {}, patch = {}) {
  const safeQuestionnaire =
    questionnaire && typeof questionnaire === "object" ? questionnaire : {};
  const safePatch = patch && typeof patch === "object" ? patch : {};
  const merged = {
    ...safeQuestionnaire,
    ...safePatch,
  };
  const {
    injuriesInput: _injuriesInput,
    competencyAndLimitations: _competencyAndLimitations,
    competitionDate: _competitionDate,
    competitionEvents: _competitionEvents,
    equipmentAccess: _equipmentAccess,
    plyometricsExperience: _plyometricsExperience,
    primaryStyle: _primaryStyle,
    weightClass: _weightClass,
    ...mergedWithoutHelperFields
  } = merged;

  return {
    ...mergedWithoutHelperFields,
    ...normalizeTrainingPreferences(merged),
  };
}

export function areTrainingPreferencesEqual(left, right) {
  const normalizedLeft = normalizeTrainingPreferences(left);
  const normalizedRight = normalizeTrainingPreferences(right);

  return (
    normalizedLeft.desiredTraining === normalizedRight.desiredTraining &&
    normalizedLeft.experience === normalizedRight.experience &&
    getTrainingCapabilityKeys().every(
      (key) =>
        normalizedLeft.trainingCapabilities[key] ===
        normalizedRight.trainingCapabilities[key]
    ) &&
    normalizedLeft.eventPreparation === normalizedRight.eventPreparation &&
    normalizedLeft.sessionDuration === normalizedRight.sessionDuration &&
    normalizedLeft.equipment === normalizedRight.equipment &&
    normalizedLeft.daysPerWeek === normalizedRight.daysPerWeek &&
    normalizedLeft.preferredWeekdays.length ===
      normalizedRight.preferredWeekdays.length &&
    normalizedLeft.preferredWeekdays.every(
      (value, index) => value === normalizedRight.preferredWeekdays[index]
    ) &&
    normalizedLeft.injuries.length === normalizedRight.injuries.length &&
    normalizedLeft.injuries.every(
      (value, index) => value === normalizedRight.injuries[index]
    ) &&
    areAppLogicSettingsEqual(normalizedLeft, normalizedRight)
  );
}
