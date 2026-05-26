"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  appendCheckoutSessionTemplate,
  appendQueryParams,
} = require("./stripeCheckoutUrls");

const CHECKOUT_TEMPLATE_TEST =
  "appendCheckoutSessionTemplate keeps Stripe session placeholder literal";

test(CHECKOUT_TEMPLATE_TEST, () => {
  const url = appendCheckoutSessionTemplate(
      "https://example.web.app/checkout_redirect/success.html",
      {
        return_to: "/(tabs)/overview",
      },
  );

  assert.match(url, /[?&]session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.doesNotMatch(url, /%7BCHECKOUT_SESSION_ID%7D/i);
  assert.match(url, /return_to=%2F%28tabs%29%2Foverview/);
});

test("appendQueryParams omits empty optional values", () => {
  assert.equal(
      appendQueryParams("https://example.test/path", {
        canceled: "true",
        return_to: "",
      }),
      "https://example.test/path?canceled=true",
  );
});
