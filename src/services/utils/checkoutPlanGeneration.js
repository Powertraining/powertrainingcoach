export const QUESTIONNAIRE_CHECKOUT_RETURN_TO =
  "/(tabs)?resume=input&generatePlan=true";

export function hasCheckoutPlanGenerationIntent(returnTo = "") {
  if (typeof returnTo !== "string" || !returnTo) {
    return false;
  }

  try {
    const url = new URL(returnTo, "https://powertrainingcoach.local");
    return url.searchParams.get("generatePlan") === "true";
  } catch {
    return false;
  }
}

export function shouldGeneratePlanAfterCheckout({
  questionnaire = {},
  trainingPlan = null,
  returnTo = "",
} = {}) {
  if (trainingPlan) {
    return false;
  }

  return (
    Boolean(questionnaire?.pendingPlanGeneration) ||
    hasCheckoutPlanGenerationIntent(returnTo)
  );
}
