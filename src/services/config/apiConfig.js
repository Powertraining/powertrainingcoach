const runtimeEnv = typeof process !== "undefined" ? process.env ?? {} : {};
const getEnv = (expoPublicValue, runtimeKey) =>
  expoPublicValue || runtimeEnv[runtimeKey];

export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_API_MODEL = "gpt-5-mini";
export const OPENAI_API_TEMPERATURE = 1;
export const OPENAI_API_KEY = getEnv(
  process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  "OPENAI_API_KEY"
);
export const STRIPE_PUBLIC_API_KEY = getEnv(
  process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY,
  "STRIPE_PUBLIC_KEY"
);
export const GOOGLE_ANDROID_CLIENT_ID = getEnv(
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  "GOOGLE_ANDROID_CLIENT_ID"
);
export const GOOGLE_IOS_CLIENT_ID = getEnv(
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  "GOOGLE_IOS_CLIENT_ID"
);

// Stripe server-side payment endpoints
export const STRIPE_CHECKOUT_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createCheckoutSession";
export const STRIPE_PORTAL_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createPortalSession";
export const STRIPE_WEBHOOK_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/stripeWebhook";
