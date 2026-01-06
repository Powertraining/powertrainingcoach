// Stripe client-side payment handling
// All payment processing is handled server-side by Cloud Functions

import { STRIPE_CHECKOUT_ENDPOINT, STRIPE_PORTAL_ENDPOINT } from "../config/apiConfig.js";

/**
 * Initiates a checkout session by calling the Cloud Function
 * @param {string} lookupKey - The Stripe lookup key for the price (e.g., 'starter_plan')
 * @returns {Promise<void>} Redirects to Stripe checkout
 */
export async function createCheckoutSession(lookupKey) {
  try {
    const response = await fetch(STRIPE_CHECKOUT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lookupKey: lookupKey }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create checkout session: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.url) {
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } else {
      throw new Error("No checkout URL returned from server");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    throw error;
  }
}

/**
 * Creates a billing portal session for managing subscriptions
 * @param {string} sessionId - The Checkout session ID
 * @returns {Promise<void>} Redirects to Stripe Billing Portal
 */
export async function createPortalSession(sessionId) {
  try {
    const response = await fetch(STRIPE_PORTAL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId: sessionId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create portal session: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.url) {
      // Redirect to Stripe Billing Portal
      window.location.href = data.url;
    } else {
      throw new Error("No portal URL returned from server");
    }
  } catch (error) {
    console.error("Portal error:", error);
    throw error;
  }
}
