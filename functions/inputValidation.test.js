"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeBoundedString,
  normalizeEnumValue,
  normalizeFirestoreDocumentId,
  normalizeInteger,
  normalizeSafeReturnToPath,
  normalizeStripeCheckoutSessionId,
  requirePlainObject,
} = require("./inputValidation");

test("normalizeFirestoreDocumentId rejects unsafe IDs", () => {
  assert.equal(normalizeFirestoreDocumentId("abc_123-Z", "id"), "abc_123-Z");
  assert.throws(
      () => normalizeFirestoreDocumentId("../admin", "id"),
      /id is invalid/,
  );
  assert.throws(
      () => normalizeFirestoreDocumentId("nested/path", "id"),
      /id is invalid/,
  );
});

test("normalizeSafeReturnToPath only permits local relative paths", () => {
  assert.equal(normalizeSafeReturnToPath("/subscription"), "/subscription");
  assert.equal(normalizeSafeReturnToPath("//evil.example/path"), "");
  assert.equal(normalizeSafeReturnToPath("/%5C%5Cevil.example"), "");
  assert.equal(normalizeSafeReturnToPath("https://evil.example"), "");
});

test("normalizeStripeCheckoutSessionId accepts only checkout IDs", () => {
  assert.equal(
      normalizeStripeCheckoutSessionId("cs_test_a1B2_c3"),
      "cs_test_a1B2_c3",
  );
  assert.throws(
      () => normalizeStripeCheckoutSessionId("pi_test_123"),
      /sessionId is invalid/,
  );
});

test("normalizeBoundedString trims controls and enforces max length", () => {
  assert.equal(
      normalizeBoundedString("\u0000 hello world ", {maxLength: 5}),
      "hello",
  );
});

test("normalizeEnumValue allowlists expected values", () => {
  assert.equal(
      normalizeEnumValue(
          "starter_plan_setup",
          ["starter_plan_setup"],
          "lookupKey",
      ),
      "starter_plan_setup",
  );
  assert.throws(
      () => normalizeEnumValue(
          "hidden_price",
          ["starter_plan_setup"],
          "lookupKey",
      ),
      /lookupKey is not supported/,
  );
});

test("normalizeInteger clamps fallback and rejects out of range values", () => {
  assert.equal(
      normalizeInteger("25", {fieldName: "limit", min: 1, max: 50}),
      25,
  );
  assert.equal(
      normalizeInteger("nope", {fieldName: "limit", fallback: 10, min: 1}),
      10,
  );
  assert.throws(
      () => normalizeInteger("500", {fieldName: "limit", min: 1, max: 50}),
      /limit is outside the allowed range/,
  );
});

test("requirePlainObject rejects arrays and null bodies", () => {
  assert.deepEqual(requirePlainObject({ok: true}, "body"), {ok: true});
  assert.throws(
      () => requirePlainObject([], "body"),
      /body must be an object/,
  );
  assert.throws(
      () => requirePlainObject(null, "body"),
      /body must be an object/,
  );
});
