const runtimeEnv = typeof process !== "undefined" ? process.env ?? {} : {};
const getEnv = (expoPublicValue, runtimeKey) =>
  expoPublicValue || runtimeEnv[runtimeKey];
const FIREBASE_PROJECT_ID = getEnv(
  process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  "FIREBASE_PROJECT_ID"
) || "power-training-coach";
const STRIPE_FUNCTIONS_REGION = getEnv(
  process.env.EXPO_PUBLIC_STRIPE_FUNCTIONS_REGION,
  "STRIPE_FUNCTIONS_REGION"
) || "us-central1";
export const STRIPE_FUNCTIONS_BASE_URL = getEnv(
  process.env.EXPO_PUBLIC_STRIPE_FUNCTIONS_BASE_URL,
  "STRIPE_FUNCTIONS_BASE_URL"
) || `https://${STRIPE_FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

export const OPENAI_API_MODEL = getEnv(
  process.env.EXPO_PUBLIC_OPENAI_API_MODEL,
  "OPENAI_API_MODEL"
) || "gpt-5.4-mini";
export const OPENAI_API_TEMPERATURE = getEnv(
  process.env.EXPO_PUBLIC_OPENAI_API_TEMPERATURE,
  "OPENAI_API_TEMPERATURE"
) || 1;
export const STRIPE_PUBLIC_API_KEY = getEnv(
  process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY,
  "STRIPE_PUBLIC_KEY"
);
export const GOOGLE_ANDROID_CLIENT_ID = getEnv(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  "GOOGLE_ANDROID_CLIENT_ID"
);
export const GOOGLE_WEB_CLIENT_ID = getEnv(
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  "GOOGLE_WEB_CLIENT_ID"
);
export const GOOGLE_IOS_CLIENT_ID = getEnv(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  "GOOGLE_IOS_CLIENT_ID"
);

// Stripe server-side payment endpoints
export const STRIPE_CHECKOUT_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/createCheckoutSession`;
export const STRIPE_LIST_SUBSCRIPTION_PLANS_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/listSubscriptionPlans`;
export const STRIPE_VERIFY_CHECKOUT_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/verifyCheckoutSession`;
export const STRIPE_REFRESH_SUBSCRIPTION_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/refreshSubscriptionStatus`;
export const STRIPE_PORTAL_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/createPortalSession`;
export const STRIPE_WEBHOOK_ENDPOINT = `${STRIPE_FUNCTIONS_BASE_URL}/stripeWebhook`;
