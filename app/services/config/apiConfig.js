const getEnv = (key) => {
  // In browser/ESM context, use import.meta.env (Vite)
  if (import.meta && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // Fallback for environment variables
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  return undefined;
};

export const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
export const OPENAI_API_MODEL = "gpt-5-mini";
export const OPENAI_API_TEMPERATURE = 1;
export const OPENAI_API_KEY = getEnv('OPENAI_API_KEY');
export const STRIPE_PUBLIC_API_KEY = getEnv('STRIPE_PUBLIC_KEY');

// Stripe server-side payment endpoints
export const STRIPE_CHECKOUT_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createCheckoutSession";
export const STRIPE_PORTAL_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/createPortalSession";
export const STRIPE_WEBHOOK_ENDPOINT = "https://us-central1-powertrainingcoach.cloudfunctions.net/stripeWebhook";