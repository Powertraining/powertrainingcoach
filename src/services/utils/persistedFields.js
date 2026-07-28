import {
  createDefaultForumProfile,
  normalizeForumProfile,
} from "../models/forumModel.js";
import {
  createDefaultStrengthAssessmentState,
  normalizeStrengthAssessmentState,
} from "./strengthAssessment.js";
import {
  createDefaultTrainingCheckInState,
  normalizeTrainingCheckInState,
} from "./trainingCheckIn.js";
import {
  createDefaultTrainingPerformanceState,
  normalizeTrainingPerformanceState,
} from "./trainingPerformance.js";

function isPlainObjectValue(value) {
  return Boolean(value) && typeof value === "object";
}

// Fields on `combatModel/{uid}` that are client-owned and hydrated/saved/reset
// with nothing beyond a default value and an optional normalize step. Adding a
// new field like this only requires one new entry below - it is then picked
// up automatically by the default-data template (dbService.js), the read-side
// hydration and the debounced-save watch list (firebaseModel.js), and the
// write-side payload (userPersistence.js).
//
// Fields that need bespoke hydration logic (questionnaire, trainingPlan,
// trainingPlanHistory) and server-managed fields (subscription, Stripe ids,
// etc. - see SERVER_MANAGED_USER_DATA_FIELDS in userPersistence.js) stay
// hand-written at their call sites; they intentionally are not in this list.
export const SIMPLE_PERSISTED_FIELDS = [
  { key: "primaryCombatSport", createDefault: () => "" },
  { key: "sessionsPerWeek", createDefault: () => 3 },
  { key: "trainingPlanBatch", createDefault: () => 1 },
  { key: "completedWeeks", createDefault: () => 0 },
  {
    key: "completedDays",
    createDefault: () => [],
    serializeForWrite: (value) => Array.from(value || []),
  },
  {
    key: "trainingPerformanceState",
    createDefault: createDefaultTrainingPerformanceState,
    normalizeOnRead: normalizeTrainingPerformanceState,
  },
  {
    key: "strengthAssessmentState",
    createDefault: createDefaultStrengthAssessmentState,
    normalizeOnRead: normalizeStrengthAssessmentState,
  },
  {
    key: "trainingCheckInState",
    createDefault: createDefaultTrainingCheckInState,
    normalizeOnRead: normalizeTrainingCheckInState,
  },
  {
    key: "activeSessionProgressByKey",
    createDefault: () => ({}),
    normalizeOnRead: (value) => (isPlainObjectValue(value) ? value : {}),
  },
  {
    key: "completedSessionProgressByKey",
    createDefault: () => ({}),
    normalizeOnRead: (value) => (isPlainObjectValue(value) ? value : {}),
  },
  {
    key: "forumProfile",
    createDefault: createDefaultForumProfile,
    normalizeOnRead: normalizeForumProfile,
    serializeForWrite: normalizeForumProfile,
  },
  { key: "forumPolicyAcceptedAt", createDefault: () => null },
];

export const SIMPLE_PERSISTED_FIELD_KEYS = Object.freeze(
  SIMPLE_PERSISTED_FIELDS.map((field) => field.key)
);

export function buildDefaultSimplePersistedFields() {
  const defaults = {};

  for (const field of SIMPLE_PERSISTED_FIELDS) {
    defaults[field.key] = field.createDefault();
  }

  return defaults;
}

export function buildSimplePersistableFields(model = {}) {
  const data = {};

  for (const field of SIMPLE_PERSISTED_FIELDS) {
    const rawValue = model[field.key];
    data[field.key] = field.serializeForWrite ?
      field.serializeForWrite(rawValue) :
      rawValue;
  }

  return data;
}

export function applySimplePersistedFields(model, persistedData = {}) {
  for (const field of SIMPLE_PERSISTED_FIELDS) {
    const rawValue = persistedData[field.key] ?? field.createDefault();
    model[field.key] = field.normalizeOnRead ?
      field.normalizeOnRead(rawValue) :
      rawValue;
  }
}

export function resetSimplePersistedFields(model) {
  for (const field of SIMPLE_PERSISTED_FIELDS) {
    model[field.key] = field.createDefault();
  }
}

export function getSimplePersistedFieldValues(model = {}) {
  return SIMPLE_PERSISTED_FIELDS.map((field) => model[field.key]);
}
