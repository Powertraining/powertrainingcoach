"use strict";

const STRIPE_CHECKOUT_SESSION_ID_TEMPLATE = "{CHECKOUT_SESSION_ID}";
const STRIPE_CHECKOUT_SESSION_ID_TOKEN = "__STRIPE_CHECKOUT_SESSION_ID__";

/**
 * @param {string} baseUrl
 * @param {object} params
 * @return {string}
 */
function appendQueryParams(baseUrl, params) {
  const url = new URL(baseUrl);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

/**
 * Stripe replaces this placeholder only when it reaches Stripe as literal
 * braces, so keep URLSearchParams encoding away from this one value.
 *
 * @param {string} baseUrl
 * @param {object} params
 * @return {string}
 */
function appendCheckoutSessionTemplate(baseUrl, params = {}) {
  const url = appendQueryParams(baseUrl, {
    ...params,
    session_id: STRIPE_CHECKOUT_SESSION_ID_TOKEN,
  });

  return url.replace(
      `session_id=${STRIPE_CHECKOUT_SESSION_ID_TOKEN}`,
      `session_id=${STRIPE_CHECKOUT_SESSION_ID_TEMPLATE}`,
  );
}

module.exports = {
  STRIPE_CHECKOUT_SESSION_ID_TEMPLATE,
  appendCheckoutSessionTemplate,
  appendQueryParams,
};
