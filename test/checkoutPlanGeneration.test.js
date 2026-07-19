import {
  hasCheckoutPlanGenerationIntent,
  QUESTIONNAIRE_CHECKOUT_RETURN_TO,
  shouldGeneratePlanAfterCheckout,
} from "../src/services/utils/checkoutPlanGeneration.js";

test("questionnaire checkout return path preserves plan-generation intent", () => {
  expect(hasCheckoutPlanGenerationIntent(QUESTIONNAIRE_CHECKOUT_RETURN_TO)).toBe(
    true
  );
});

test("checkout generates a missing plan from either persisted or return-path intent", () => {
  expect(
    shouldGeneratePlanAfterCheckout({
      questionnaire: { pendingPlanGeneration: true },
    })
  ).toBe(true);

  expect(
    shouldGeneratePlanAfterCheckout({
      questionnaire: {},
      returnTo: QUESTIONNAIRE_CHECKOUT_RETURN_TO,
    })
  ).toBe(true);
});

test("checkout does not replace an existing training plan", () => {
  expect(
    shouldGeneratePlanAfterCheckout({
      questionnaire: { pendingPlanGeneration: true },
      trainingPlan: { weeks: [] },
      returnTo: QUESTIONNAIRE_CHECKOUT_RETURN_TO,
    })
  ).toBe(false);
});
