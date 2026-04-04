import {
  areAppLogicSettingsEqual,
  getAppLogicSettingsFormState,
  normalizeAppLogicSettings,
} from "./appLogicSettings.js";
import { getNormalizedWeekday } from "./weekdays.js";

export const PRIMARY_STYLE_OPTIONS = Object.freeze([
  { label: "Balanced (striking & grappling)", value: "balanced" },
  { label: "Striking-heavy", value: "striking" },
  { label: "Grappling-heavy", value: "grappling" },
  { label: "Clinching & throws", value: "clinching" },
]);

export const GOAL_OPTIONS = Object.freeze([
  { label: "Hypertrophy", value: "hypertrophy" },
  { label: "Strength", value: "strength" },
  { label: "Power / Speed", value: "power" },
]);

export const EXPERIENCE_OPTIONS = Object.freeze([
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
]);

export const TRAINING_PREFERENCES_DEFAULTS = Object.freeze({
  goal: "hypertrophy",
  experience: "beginner",
  daysPerWeek: 3,
  preferredWeekdays: [],
  weightClass: "",
  primaryStyle: "balanced",
  injuriesInput: "",
});

function isAllowedValue(value, options) {
  return options.some((option) => option.value === value);
}

function parseDaysPerWeek(value) {
  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : TRAINING_PREFERENCES_DEFAULTS.daysPerWeek;
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
  const daysPerWeek = parseDaysPerWeek(safeSource.daysPerWeek);

  return {
    goal: isAllowedValue(safeSource.goal, GOAL_OPTIONS)
      ? safeSource.goal
      : TRAINING_PREFERENCES_DEFAULTS.goal,
    experience: isAllowedValue(safeSource.experience, EXPERIENCE_OPTIONS)
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    weightClass:
      typeof safeSource.weightClass === "string"
        ? safeSource.weightClass
        : TRAINING_PREFERENCES_DEFAULTS.weightClass,
    primaryStyle: isAllowedValue(safeSource.primaryStyle, PRIMARY_STYLE_OPTIONS)
      ? safeSource.primaryStyle
      : TRAINING_PREFERENCES_DEFAULTS.primaryStyle,
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
  const daysPerWeek = parseDaysPerWeek(safeSource.daysPerWeek);

  return {
    goal: isAllowedValue(safeSource.goal, GOAL_OPTIONS)
      ? safeSource.goal
      : TRAINING_PREFERENCES_DEFAULTS.goal,
    experience: isAllowedValue(safeSource.experience, EXPERIENCE_OPTIONS)
      ? safeSource.experience
      : TRAINING_PREFERENCES_DEFAULTS.experience,
    daysPerWeek,
    preferredWeekdays: normalizePreferredWeekdays(safeSource, daysPerWeek),
    weightClass:
      typeof safeSource.weightClass === "string"
        ? safeSource.weightClass.trim()
        : TRAINING_PREFERENCES_DEFAULTS.weightClass,
    primaryStyle: isAllowedValue(safeSource.primaryStyle, PRIMARY_STYLE_OPTIONS)
      ? safeSource.primaryStyle
      : TRAINING_PREFERENCES_DEFAULTS.primaryStyle,
    injuries: normalizeInjuries(safeSource),
    ...normalizeAppLogicSettings(safeSource),
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
  const { injuriesInput: _injuriesInput, ...mergedWithoutHelperFields } = merged;

  return {
    ...mergedWithoutHelperFields,
    ...normalizeTrainingPreferences(merged),
  };
}

export function areTrainingPreferencesEqual(left, right) {
  const normalizedLeft = normalizeTrainingPreferences(left);
  const normalizedRight = normalizeTrainingPreferences(right);

  return (
    normalizedLeft.goal === normalizedRight.goal &&
    normalizedLeft.experience === normalizedRight.experience &&
    normalizedLeft.daysPerWeek === normalizedRight.daysPerWeek &&
    normalizedLeft.preferredWeekdays.length ===
      normalizedRight.preferredWeekdays.length &&
    normalizedLeft.preferredWeekdays.every(
      (value, index) => value === normalizedRight.preferredWeekdays[index]
    ) &&
    normalizedLeft.weightClass === normalizedRight.weightClass &&
    normalizedLeft.primaryStyle === normalizedRight.primaryStyle &&
    normalizedLeft.injuries.length === normalizedRight.injuries.length &&
    normalizedLeft.injuries.every(
      (value, index) => value === normalizedRight.injuries[index]
    ) &&
    areAppLogicSettingsEqual(normalizedLeft, normalizedRight)
  );
}
