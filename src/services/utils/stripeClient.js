// Stripe client-side payment handling
// All payment processing is handled server-side by Cloud Functions

import { Linking } from "react-native";

import { auth } from "../config/firebase.js";
import { onAuthStateChanged } from "../config/firebaseSdk.js";
import {
  STRIPE_CANCEL_CONSULTATION_BOOKING_ENDPOINT,
  STRIPE_CHECKOUT_ENDPOINT,
  STRIPE_CONSULTATION_CHECKOUT_ENDPOINT,
  STRIPE_LIST_CONSULTATION_AVAILABILITY_ENDPOINT,
  STRIPE_LIST_MY_CONSULTATION_BOOKINGS_ENDPOINT,
  STRIPE_LIST_SUBSCRIPTION_PLANS_ENDPOINT,
  STRIPE_PORTAL_ENDPOINT,
  STRIPE_REFRESH_SUBSCRIPTION_ENDPOINT,
  STRIPE_VERIFY_CONSULTATION_CHECKOUT_ENDPOINT,
  STRIPE_VERIFY_CHECKOUT_ENDPOINT,
} from "../config/apiConfig.js";
import {
  normalizeBoundedString,
  normalizeSafeReturnToPath,
  normalizeStripeCheckoutSessionId,
} from "./inputValidation.js";

const AUTH_WAIT_TIMEOUT_MS = 4000;
const INVALID_CHECKOUT_SESSION_MESSAGE =
  "Stripe returned an invalid checkout session. Please try checkout again.";
const TRUSTED_STRIPE_HOSTS = new Set([
  "billing.stripe.com",
  "checkout.stripe.com",
]);

export function normalizeTrustedStripeUrl(value) {
  const normalizedValue = normalizeBoundedString(value, 2048);

  if (!normalizedValue) {
    return "";
  }

  try {
    const url = new URL(normalizedValue);

    if (url.protocol !== "https:" || !TRUSTED_STRIPE_HOSTS.has(url.hostname)) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

export async function openTrustedStripeUrl(value) {
  const trustedUrl = normalizeTrustedStripeUrl(value);

  if (!trustedUrl) {
    throw new Error("The billing service returned an unexpected payment URL.");
  }

  await Linking.openURL(trustedUrl);
}

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

function getFriendlyServiceErrorMessage(response, data) {
  if (response.status === 503) {
    return (
      "The billing service is temporarily unavailable right now. " +
      "Please try again in 30 seconds."
    );
  }

  if (
    response.status >= 500 &&
    typeof data.rawText === "string" &&
    /<html[\s>]/i.test(data.rawText)
  ) {
    return (
      `The billing service is temporarily unavailable (HTTP ${response.status}). ` +
      "Please try again shortly."
    );
  }

  return "";
}

async function postStripeJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: await buildHeaders(),
    body: JSON.stringify(body),
  });

  const data = await readResponseData(response);

  if (!response.ok) {
    const friendlyServiceError = getFriendlyServiceErrorMessage(response, data);
    const errorMessage =
      friendlyServiceError ||
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
 * @param {string} lookupKey - The Stripe lookup key for the price (e.g., 'starter_plan_setup')
 * @param {string=} returnTo - In-app route to return to after checkout verification
 * @returns {Promise<object>} Returns a hosted Checkout URL and session metadata
 */
export async function createCheckoutSession(lookupKey, returnTo = "") {
  try {
    const data = await postStripeJson(STRIPE_CHECKOUT_ENDPOINT, {
      lookupKey: normalizeBoundedString(lookupKey, 80),
      returnTo: normalizeSafeReturnToPath(returnTo),
    });

    return {
      ...data,
      checkoutUrl: normalizeTrustedStripeUrl(data.checkoutUrl),
    };
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

/**
 * Returns upcoming coach consultation slots.
 * @param {object=} options - Optional slot filters
 * @returns {Promise<object>}
 */
export async function listConsultationAvailability(options = {}) {
  try {
    return await postStripeJson(STRIPE_LIST_CONSULTATION_AVAILABILITY_ENDPOINT, {
      startsAfter: normalizeBoundedString(options.startsAfter, 40),
      endsBefore: normalizeBoundedString(options.endsBefore, 40),
      coachUid: normalizeBoundedString(options.coachUid, 128),
      limit: options.limit,
    });
  } catch (error) {
    console.error("List consultation availability error:", error);
    throw error;
  }
}

/**
 * Starts Stripe Checkout for a consultation slot.
 * @param {string} slotId - Firestore consultation slot ID
 * @param {string=} returnTo - In-app route to return to after checkout
 * @returns {Promise<object>}
 */
export async function createConsultationCheckoutSession(slotId, returnTo = "") {
  try {
    const data = await postStripeJson(STRIPE_CONSULTATION_CHECKOUT_ENDPOINT, {
      slotId: normalizeBoundedString(slotId, 128),
      returnTo: normalizeSafeReturnToPath(returnTo),
    });

    return {
      ...data,
      checkoutUrl: normalizeTrustedStripeUrl(data.checkoutUrl),
    };
  } catch (error) {
    console.error("Consultation checkout error:", error);
    throw error;
  }
}

/**
 * Verifies a paid consultation Checkout Session.
 * @param {string} sessionId - Stripe Checkout Session ID
 * @returns {Promise<object>}
 */
export async function verifyConsultationCheckoutSession(sessionId) {
  try {
    const normalizedSessionId = normalizeStripeCheckoutSessionId(sessionId);

    if (!normalizedSessionId) {
      throw new Error(INVALID_CHECKOUT_SESSION_MESSAGE);
    }

    return await postStripeJson(STRIPE_VERIFY_CONSULTATION_CHECKOUT_ENDPOINT, {
      sessionId: normalizedSessionId,
    });
  } catch (error) {
    console.error("Consultation checkout verification error:", error);
    throw error;
  }
}

/**
 * Returns consultation bookings for the authenticated user.
 * @param {object=} options - Optional booking filters
 * @returns {Promise<object>}
 */
export async function listMyConsultationBookings(options = {}) {
  try {
    return await postStripeJson(STRIPE_LIST_MY_CONSULTATION_BOOKINGS_ENDPOINT, {
      upcomingOnly: options.upcomingOnly,
      limit: options.limit,
    });
  } catch (error) {
    console.error("List consultation bookings error:", error);
    throw error;
  }
}

/**
 * Cancels a consultation booking and lets the server apply refund policy.
 * @param {string} bookingId - Firestore consultation booking ID
 * @returns {Promise<object>}
 */
export async function cancelConsultationBooking(bookingId) {
  try {
    return await postStripeJson(STRIPE_CANCEL_CONSULTATION_BOOKING_ENDPOINT, {
      bookingId: normalizeBoundedString(bookingId, 128),
    });
  } catch (error) {
    console.error("Cancel consultation booking error:", error);
    throw error;
  }
}

/**
 * Returns the current subscription plans from Stripe.
 * @returns {Promise<object>}
 */
export async function listSubscriptionPlans() {
  try {
    return await postStripeJson(STRIPE_LIST_SUBSCRIPTION_PLANS_ENDPOINT, {});
  } catch (error) {
    console.error("List subscription plans error:", error);
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
    const normalizedSessionId = normalizeStripeCheckoutSessionId(sessionId);

    if (!normalizedSessionId) {
      throw new Error(INVALID_CHECKOUT_SESSION_MESSAGE);
    }

    return await postStripeJson(STRIPE_VERIFY_CHECKOUT_ENDPOINT, {
      sessionId: normalizedSessionId,
    });
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
 * @param {string|object} sessionOrOptions - The Checkout session ID or options
 * @returns {Promise<object>} Opens Stripe Billing Portal
 */
export async function createPortalSession(sessionOrOptions) {
  try {
    const payload = typeof sessionOrOptions === "string" ?
      { sessionId: normalizeStripeCheckoutSessionId(sessionOrOptions) } :
      (sessionOrOptions || {});
    const sanitizedPayload = {
      sessionId: normalizeStripeCheckoutSessionId(payload.sessionId),
    };

    const data = await postStripeJson(STRIPE_PORTAL_ENDPOINT, sanitizedPayload);

    if (!data.url) {
      throw new Error("No portal URL returned from server");
    }

    await openTrustedStripeUrl(data.url);
    return data;
  } catch (error) {
    console.error("Portal error:", error);
    throw error;
  }
}
