// Stripe client-side payment handling
// All payment processing is handled server-side by Cloud Functions

import { Linking } from "react-native";

import { auth } from "../config/firebase.js";
import { STRIPE_CHECKOUT_ENDPOINT, STRIPE_PORTAL_ENDPOINT } from "../config/apiConfig.js";

async function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = await auth.currentUser?.getIdToken?.();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function postStripeJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

/**
 * Initiates a checkout session by calling the Cloud Function
 * @param {string} lookupKey - The Stripe lookup key for the price (e.g., 'starter_plan')
 * @returns {Promise<object>} Returns a native payment payload
 */
export async function createCheckoutSession(lookupKey) {
  try {
    return await postStripeJson(STRIPE_CHECKOUT_ENDPOINT, { lookupKey });
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

/**
 * Creates a billing portal session for managing subscriptions
 * @param {string|object} sessionOrOptions - The Checkout session ID or portal identifiers
 * @returns {Promise<object>} Opens Stripe Billing Portal
 */
export async function createPortalSession(sessionOrOptions) {
  try {
    const payload = typeof sessionOrOptions === "string" ?
      { sessionId: sessionOrOptions } :
      (sessionOrOptions || {});

    const data = await postStripeJson(STRIPE_PORTAL_ENDPOINT, payload);

    if (!data.url) {
      throw new Error("No portal URL returned from server");
    }

    await Linking.openURL(data.url);
    return data;
  } catch (error) {
    console.error("Portal error:", error);
    throw error;
  }
}
