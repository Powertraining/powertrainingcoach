"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DEFAULT_BOOKING_WINDOW_DAYS,
  calculateCheckoutExpiryMs,
  calculateRefundableUntilMs,
  hasIntervalOverlap,
  normalizeCurrency,
  parsePositiveInteger,
  timeValueToMs,
} = require("./consultationBooking");

test("calculateCheckoutExpiryMs adds the configured hold duration", () => {
  const nowMs = Date.UTC(2026, 2, 23, 10, 0, 0);
  const holdMs = calculateCheckoutExpiryMs(nowMs, 30);

  assert.equal(holdMs, Date.UTC(2026, 2, 23, 10, 30, 0));
});

test("calculateRefundableUntilMs subtracts the cancellation window", () => {
  const startMs = Date.UTC(2026, 2, 28, 12, 0, 0);
  const refundableUntilMs = calculateRefundableUntilMs(startMs, 48);

  assert.equal(refundableUntilMs, Date.UTC(2026, 2, 26, 12, 0, 0));
});

test("hasIntervalOverlap detects overlapping slots", () => {
  assert.equal(
      hasIntervalOverlap(
          Date.UTC(2026, 2, 23, 10, 0, 0),
          Date.UTC(2026, 2, 23, 11, 0, 0),
          Date.UTC(2026, 2, 23, 10, 30, 0),
          Date.UTC(2026, 2, 23, 11, 30, 0),
      ),
      true,
  );
  assert.equal(
      hasIntervalOverlap(
          Date.UTC(2026, 2, 23, 10, 0, 0),
          Date.UTC(2026, 2, 23, 11, 0, 0),
          Date.UTC(2026, 2, 23, 11, 0, 0),
          Date.UTC(2026, 2, 23, 12, 0, 0),
      ),
      false,
  );
});

test("default booking window supports 30-day advance bookings", () => {
  assert.equal(DEFAULT_BOOKING_WINDOW_DAYS, 30);
});

test("normalizeCurrency lowercases currency codes", () => {
  assert.equal(normalizeCurrency(" EUR "), "eur");
  assert.equal(normalizeCurrency("usd;drop", "sek"), "sek");
});

test("parsePositiveInteger falls back for invalid values", () => {
  assert.equal(parsePositiveInteger("-4", 7), 7);
  assert.equal(parsePositiveInteger("14", 7), 14);
});

test("timeValueToMs converts supported values", () => {
  const dateValue = new Date("2026-03-23T12:00:00.000Z");

  assert.equal(timeValueToMs(dateValue), dateValue.getTime());
  assert.equal(
      timeValueToMs({seconds: Math.floor(dateValue.getTime() / 1000)}),
      dateValue.getTime(),
  );
});
