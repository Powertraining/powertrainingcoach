import {
  createDefaultForumProfile,
  normalizeForumProfile,
} from "../models/forumModel.js";
import { normalizeAppLogicSettings } from "../../constants/appLogicSettings.js";
import { createDefaultStrengthAssessmentState } from "./strengthAssessment.js";
import { createDefaultTrainingCheckInState } from "./trainingCheckIn.js";
import { createDefaultTrainingPerformanceState } from "./trainingPerformance.js";

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

export function isSameAuthenticatedUser(model, uid) {
  return Boolean(uid) && model?.user?.uid === uid;
}

export function buildClientPersistableUserData(model = {}) {
  return {
    questionnaire: model.questionnaire,
    primaryCombatSport: model.primaryCombatSport,
    sessionsPerWeek: model.sessionsPerWeek,
    trainingPlan: model.trainingPlan,
    trainingPlanHistory: Array.isArray(model.trainingPlanHistory)
      ? model.trainingPlanHistory
      : [],
    completedDays: Array.from(model.completedDays || []),
    trainingPlanBatch: model.trainingPlanBatch,
    completedWeeks: model.completedWeeks,
    trainingPerformanceState: model.trainingPerformanceState,
    strengthAssessmentState: model.strengthAssessmentState,
    trainingCheckInState: model.trainingCheckInState,
    activeSessionProgressByKey: model.activeSessionProgressByKey,
    completedSessionProgressByKey: model.completedSessionProgressByKey,
    forumProfile: normalizeForumProfile(model.forumProfile),
    forumPolicyAcceptedAt: model.forumPolicyAcceptedAt ?? null,
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
