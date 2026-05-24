import test from "node:test";
import assert from "node:assert/strict";

import {
  PASSWORD_EXPECTATIONS_MESSAGE,
  getPasswordValidationError,
  isPasswordWithinExpectations,
} from "../src/services/utils/inputValidation.js";

test("password expectations require the configured length range", () => {
  assert.equal(
    getPasswordValidationError("Aa1!aaa"),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(
    getPasswordValidationError(`Aa1!${"a".repeat(4097)}`),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(getPasswordValidationError("Aa1!aaaa"), "");
});

test("password expectations require lower, upper, number, and special character", () => {
  assert.equal(
    getPasswordValidationError("AA1!AAAA"),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(
    getPasswordValidationError("aa1!aaaa"),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(
    getPasswordValidationError("Aaa!aaaa"),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(
    getPasswordValidationError("Aa11aaaa"),
    PASSWORD_EXPECTATIONS_MESSAGE
  );
  assert.equal(isPasswordWithinExpectations("Aa1!aaaa"), true);
});
