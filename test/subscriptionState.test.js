import test from "node:test";
import assert from "node:assert/strict";

import { hasActiveSubscriptionEntitlement } from "../src/services/utils/subscriptionState.js";

test("cancelled subscription stays inactive even when its period end is future", () => {
  assert.equal(
    hasActiveSubscriptionEntitlement({
      active: false,
      endDate: "2099-12-31",
      now: new Date("2026-07-18T12:00:00Z"),
    }),
    false
  );
});

test("active subscription remains entitled through its end date", () => {
  assert.equal(
    hasActiveSubscriptionEntitlement({
      active: true,
      endDate: "2026-07-18",
      now: new Date("2026-07-18T12:00:00Z"),
    }),
    true
  );
});
