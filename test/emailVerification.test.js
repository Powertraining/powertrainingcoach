import test from "node:test";
import assert from "node:assert/strict";

import {
  getUserProviderIds,
  requiresEmailVerification,
} from "../src/services/utils/emailVerification.js";

test("requiresEmailVerification gates unverified password users", () => {
  assert.equal(
    requiresEmailVerification({
      email: "athlete@example.com",
      emailVerified: false,
      providerData: [{ providerId: "password" }],
    }),
    true
  );
});

test("requiresEmailVerification allows verified password users", () => {
  assert.equal(
    requiresEmailVerification({
      email: "athlete@example.com",
      emailVerified: true,
      providerData: [{ providerId: "password" }],
    }),
    false
  );
});

test("requiresEmailVerification trusts federated providers with verified e-mail", () => {
  assert.equal(
    requiresEmailVerification({
      email: "athlete@example.com",
      emailVerified: false,
      providerData: [{ providerId: "google.com" }],
    }),
    false
  );
});

test("getUserProviderIds ignores malformed provider entries", () => {
  assert.deepEqual(
    getUserProviderIds({
      providerData: [
        { providerId: "password" },
        { providerId: "" },
        null,
        { providerId: "google.com" },
      ],
    }),
    ["password", "google.com"]
  );
});
