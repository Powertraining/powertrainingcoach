import test from "node:test";
import assert from "node:assert/strict";

import {
  SERVER_MANAGED_USER_DATA_FIELDS,
  applyUserProgressReset,
  buildClientPersistableUserData,
  createUserProgressResetData,
  isSameAuthenticatedUser,
} from "../src/services/utils/userPersistence.js";

test("client persistence payload only includes user-owned training and questionnaire state", () => {
  const payload = buildClientPersistableUserData({
    questionnaire: { desiredTraining: "strength_power", sessionsPerWeek: 3 },
    primaryCombatSport: "Boxing",
    sessionsPerWeek: 3,
    subscription: true,
    subscriptionEndDate: "2026-12-31",
    subscriptionStartDate: "2026-01-01",
    subscriptionType: "pro",
    stripePriceLookupKey: "pro_monthly",
    trainingPlan: { weeks: [] },
    trainingPlanHistory: [{ plan: { weeks: [] } }],
    completedDays: new Set(["1-1", "1-2"]),
    trainingPlanBatch: 2,
    completedWeeks: 4,
    trainingPerformanceState: { sessions: {} },
    strengthAssessmentState: { sessions: {} },
    trainingCheckInState: { lastCompletedBlock: 1 },
    activeSessionProgressByKey: { "1-1": { exerciseIndex: 2 } },
    completedSessionProgressByKey: {
      "1-1": { completedStepKeys: ["0:0"] },
    },
    forumProfile: { likedPostIds: ["post-a"] },
  });

  assert.equal(payload.primaryCombatSport, "Boxing");
  assert.deepEqual(payload.completedDays, ["1-1", "1-2"]);
  assert.deepEqual(payload.trainingPlan, { weeks: [] });
  assert.deepEqual(payload.activeSessionProgressByKey, {
    "1-1": { exerciseIndex: 2 },
  });
  assert.deepEqual(payload.completedSessionProgressByKey, {
    "1-1": { completedStepKeys: ["0:0"] },
  });

  for (const field of SERVER_MANAGED_USER_DATA_FIELDS) {
    assert.equal(Object.hasOwn(payload, field), false);
  }
});

test("same authenticated user check rejects stale async writes", () => {
  assert.equal(
    isSameAuthenticatedUser({ user: { uid: "user-a" } }, "user-a"),
    true
  );
  assert.equal(
    isSameAuthenticatedUser({ user: { uid: "user-b" } }, "user-a"),
    false
  );
  assert.equal(isSameAuthenticatedUser({ user: null }, "user-a"), false);
});

test("testing reset clears questionnaire and progress while preserving account fields", () => {
  const model = {
    user: { uid: "user-a", displayName: "Tester" },
    subscription: true,
    subscriptionType: "pro",
    forumProfile: { likedPostIds: ["post-a"] },
    questionnaire: { desiredTraining: "strength_power" },
    primaryCombatSport: "Boxing",
    sessionsPerWeek: 5,
    trainingPlan: { weeks: [{ week: 1 }] },
    trainingPlanHistory: [{ plan: { weeks: [] } }],
    completedDays: ["1-1"],
    trainingPlanBatch: 3,
    completedWeeks: 8,
    trainingPerformanceState: { sessions: { "1-1": {} } },
    strengthAssessmentState: { sessions: { "1-1": {} } },
    trainingCheckInState: { lastCompletedBlock: 2 },
    activeSessionProgressByKey: { "1-1": { activeExerciseIndex: 1 } },
    completedSessionProgressByKey: { "1-1": { completedStepKeys: ["0:0"] } },
  };

  const resetData = applyUserProgressReset(model);
  const expectedResetData = createUserProgressResetData();

  assert.deepEqual(resetData, expectedResetData);
  assert.deepEqual(model.questionnaire, expectedResetData.questionnaire);
  assert.equal(model.primaryCombatSport, "");
  assert.equal(model.sessionsPerWeek, 3);
  assert.equal(model.trainingPlan, null);
  assert.deepEqual(model.completedDays, []);
  assert.deepEqual(model.activeSessionProgressByKey, {});
  assert.deepEqual(model.completedSessionProgressByKey, {});
  assert.deepEqual(model.user, { uid: "user-a", displayName: "Tester" });
  assert.equal(model.subscription, true);
  assert.equal(model.subscriptionType, "pro");
  assert.deepEqual(model.forumProfile, { likedPostIds: ["post-a"] });
});
