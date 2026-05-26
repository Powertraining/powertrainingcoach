import test from "node:test";
import assert from "node:assert/strict";

import {
  SERVER_MANAGED_USER_DATA_FIELDS,
  buildClientPersistableUserData,
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
    forumProfile: { likedPostIds: ["post-a"] },
  });

  assert.equal(payload.primaryCombatSport, "Boxing");
  assert.deepEqual(payload.completedDays, ["1-1", "1-2"]);
  assert.deepEqual(payload.trainingPlan, { weeks: [] });

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
