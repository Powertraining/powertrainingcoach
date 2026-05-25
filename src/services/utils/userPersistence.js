import { normalizeForumProfile } from "../models/forumModel.js";

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
    forumProfile: normalizeForumProfile(model.forumProfile),
  };
}
