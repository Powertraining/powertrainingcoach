const getEnv = (key) => {
  if (typeof process !== "undefined" && process.env) {
    if (process.env[key]) {
      return process.env[key];
    }

    const expoPublicKey = `EXPO_PUBLIC_${key}`;
    if (process.env[expoPublicKey]) {
      return process.env[expoPublicKey];
    }
  }

  return undefined;
};

export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_API_MODEL = "gpt-5-mini";
export const OPENAI_API_TEMPERATURE = 1;
export const OPENAI_API_KEY = getEnv("OPENAI_API_KEY");
export const STRIPE_PUBLIC_API_KEY = getEnv("STRIPE_PUBLIC_KEY");
export const GOOGLE_ANDROID_CLIENT_ID = getEnv("GOOGLE_ANDROID_CLIENT_ID");
export const GOOGLE_IOS_CLIENT_ID = getEnv("GOOGLE_IOS_CLIENT_ID");

// Stripe server-side payment endpoints
export const STRIPE_CHECKOUT_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createCheckoutSession";
export const STRIPE_PORTAL_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createPortalSession";
export const STRIPE_WEBHOOK_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/stripeWebhook";
