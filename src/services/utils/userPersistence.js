import { createDefaultForumProfile } from "../models/forumModel.js";
import { normalizeAppLogicSettings } from "../../constants/appLogicSettings.js";
import { createDefaultStrengthAssessmentState } from "./strengthAssessment.js";
import { createDefaultTrainingCheckInState } from "./trainingCheckIn.js";
import { createDefaultTrainingPerformanceState } from "./trainingPerformance.js";
import {
  buildSimplePersistableFields,
  SIMPLE_PERSISTED_FIELD_KEYS,
} from "./persistedFields.js";

export const SERVER_MANAGED_USER_DATA_FIELDS = Object.freeze([
  "subscription",
  "subscriptionEndDate",
  "subscriptionStartDate",
  "subscriptionType",
  "stripePriceLookupKey",
  "stripeSubscriptionId",
  "stripeCustomerId",
  "subscriptionStatus",
  "billingProvider",
  "planRegenerationUsage",
]);

// Guard against a future SIMPLE_PERSISTED_FIELDS entry accidentally reusing a
// server-managed field name, which would let the client overwrite a
// server/Stripe-owned value. This throws at import time, not per-call, so it
// fails loudly in tests/dev rather than silently weakening the write payload.
const overlappingFieldNames = SIMPLE_PERSISTED_FIELD_KEYS.filter((key) =>
  SERVER_MANAGED_USER_DATA_FIELDS.includes(key)
);

if (overlappingFieldNames.length > 0) {
  throw new Error(
    `Persisted field manifest conflicts with server-managed fields: ${overlappingFieldNames.join(", ")}`
  );
}

export function isSameAuthenticatedUser(model, uid) {
  return Boolean(uid) && model?.user?.uid === uid;
}

export function buildClientPersistableUserData(model = {}) {
  return {
    questionnaire: model.questionnaire,
    trainingPlan: model.trainingPlan,
    trainingPlanHistory: Array.isArray(model.trainingPlanHistory)
      ? model.trainingPlanHistory
      : [],
    // See SIMPLE_PERSISTED_FIELDS in persistedFields.js - adding a new
    // client-owned field there is picked up here automatically.
    ...buildSimplePersistableFields(model),
  };
}

export function createUserProgressResetData() {
  return {
    questionnaire: normalizeAppLogicSettings({}),
    primaryCombatSport: "",
    sessionsPerWeek: 3,
    trainingPlan: null,
    trainingPlanHistory: [],
    completedDays: [],
    trainingPlanBatch: 1,
    completedWeeks: 0,
    trainingPerformanceState: createDefaultTrainingPerformanceState(),
    strengthAssessmentState: createDefaultStrengthAssessmentState(),
    trainingCheckInState: createDefaultTrainingCheckInState(),
    activeSessionProgressByKey: {},
    completedSessionProgressByKey: {},
  };
}

export function createFullProfileResetData() {
  return {
    ...createUserProgressResetData(),
    subscription: false,
    subscriptionEndDate: null,
    subscriptionStartDate: null,
    subscriptionType: "",
    subscriptionStatus: "",
    stripePriceLookupKey: "",
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    billingProvider: "",
    planRegenerationUsage: null,
    forumProfile: createDefaultForumProfile(),
  };
}

export function applyUserProgressReset(model = {}) {
  const resetData = createUserProgressResetData();

  Object.assign(model, resetData);

  return resetData;
}

export function applyFullProfileReset(model = {}) {
  const resetData = createFullProfileResetData();

  Object.assign(model, resetData);
  model.resetForumRuntimeState?.();

  return resetData;
}
