// Stripe client-side payment handling
// All payment processing is handled server-side by Cloud Functions

import { Linking } from "react-native";

import { auth } from "../config/firebase.js";
import { onAuthStateChanged } from "../config/firebaseSdk.js";
import {
  STRIPE_CHECKOUT_ENDPOINT,
  STRIPE_PORTAL_ENDPOINT,
  STRIPE_REFRESH_SUBSCRIPTION_ENDPOINT,
  STRIPE_VERIFY_CHECKOUT_ENDPOINT,
} from "../config/apiConfig.js";

const AUTH_WAIT_TIMEOUT_MS = 4000;

function waitForAuthenticatedUser(timeoutMs = AUTH_WAIT_TIMEOUT_MS) {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve, reject) => {
    let timeoutId;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        return;
      }

      clearTimeout(timeoutId);
      unsubscribe();
      resolve(user);
    });

    timeoutId = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(
          "You must be signed in to start checkout. Please sign in again and try once more."
        )
      );
    }, timeoutMs);
  });
}

async function getRequiredIdToken() {
  const user = auth.currentUser || (await waitForAuthenticatedUser());
  const token = await user.getIdToken(true);

  if (!token) {
    throw new Error(
      "Could not retrieve your sign-in session. Please sign in again and try once more."
    );
  }

  return token;
}

async function buildHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = await getRequiredIdToken();
  headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function readResponseData(response) {
  const rawText = await response.text();

  if (!rawText) {
    return {};
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return { rawText };
  }
}

async function postStripeJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(body),
  });

  const data = await readResponseData(response);

  if (!response.ok) {
    const errorMessage =
      data.error ||
      data.message ||
      data.rawText ||
      (response.status === 401
        ? "You must be signed in to start checkout. Please sign in again and try once more."
        : `Request failed with status ${response.status}`);

    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Initiates a checkout session by calling the Cloud Function
 * @param {string} lookupKey - The Stripe lookup key for the price (e.g., 'starter_plan')
 * @param {string=} returnTo - In-app route to return to after checkout verification
 * @returns {Promise<object>} Returns a hosted Checkout URL and session metadata
 */
export async function createCheckoutSession(lookupKey, returnTo = "") {
  try {
    return await postStripeJson(STRIPE_CHECKOUT_ENDPOINT, {
      lookupKey,
      returnTo,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

/**
 * Verifies a completed Checkout Session on the server and returns the synced
 * subscription state for the authenticated user.
 * @param {string} sessionId - The Stripe Checkout Session ID
 * @returns {Promise<object>} Returns the verified subscription state
 */
export async function verifyCheckoutSession(sessionId) {
  try {
    return await postStripeJson(STRIPE_VERIFY_CHECKOUT_ENDPOINT, { sessionId });
  } catch (error) {
    console.error("Checkout verification error:", error);
    throw error;
  }
}

/**
 * Re-syncs the authenticated user's Stripe subscription from the server.
 * @returns {Promise<object>}
 */
export async function refreshSubscriptionStatus() {
  try {
    return await postStripeJson(STRIPE_REFRESH_SUBSCRIPTION_ENDPOINT, {});
  } catch (error) {
    console.error("Subscription refresh error:", error);
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
