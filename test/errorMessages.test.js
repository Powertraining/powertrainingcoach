import { getFriendlyErrorMessage } from "../src/services/utils/errorMessages.js";

test("maps Firebase auth codes embedded in verbose messages", () => {
  expect(
    getFriendlyErrorMessage(
      new Error("FirebaseError: Firebase: Error (auth/invalid-credential).")
    )
  ).toBe("Wrong e-mail or password.");
});

test("falls back for technical logs without exposing raw details", () => {
  expect(
    getFriendlyErrorMessage(
      new Error("TypeError: Cannot read properties of undefined at submitLogin"),
      "Could not sign in. Please try again."
    )
  ).toBe("Could not sign in. Please try again.");
});

test("keeps intentional user-facing messages", () => {
  expect(getFriendlyErrorMessage("Exercise name is required.")).toBe(
    "Exercise name is required."
  );
});

test("keeps unexpected long user-facing messages readable", () => {
  expect(
    getFriendlyErrorMessage(
      "This is a very long validation message that would be too slow to read in a short toast."
    )
  ).toBe(
    "This is a very long validation message that would be too slow to read in a short toast."
  );
});
