"use strict";

const CONSULTATION_SLOT_COLLECTION = "consultationAvailability";
const CONSULTATION_BOOKING_COLLECTION = "consultationBookings";

const SLOT_STATUS = Object.freeze({
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  HELD: "held",
  BOOKED: "booked",
});

const BOOKING_STATUS = Object.freeze({
  CHECKOUT_PENDING: "checkout_pending",
  CONFIRMED: "confirmed",
  CANCELED: "canceled",
  EXPIRED: "expired",
});

const PAYMENT_STATUS = Object.freeze({
  CHECKOUT_PENDING: "checkout_pending",
  CAPTURED: "captured",
  RELEASED: "released",
  REFUNDED: "refunded",
  FAILED: "failed",
});

const NEXT_ACTION = Object.freeze({
  EXPIRE_CHECKOUT: "expire_checkout",
});

const DEFAULT_CANCELLATION_WINDOW_HOURS = 48;
const DEFAULT_CHECKOUT_HOLD_MINUTES = 30;
const DEFAULT_BOOKING_WINDOW_DAYS = 30;
const DEFAULT_CURRENCY = "sek";

/**
 * @param {*} value
 * @param {number} fallbackValue
 * @return {number}
 */
function parsePositiveInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

/**
 * @param {string|undefined|null} value
 * @param {string=} fallbackCurrency
 * @return {string}
 */
function normalizeCurrency(value, fallbackCurrency) {
  const resolvedFallback = fallbackCurrency || DEFAULT_CURRENCY;

  if (typeof value !== "string" || !value.trim()) {
    return resolvedFallback;
  }

  const normalizedCurrency = value.trim().toLowerCase();

  return /^[a-z]{3}$/.test(normalizedCurrency) ?
    normalizedCurrency :
    resolvedFallback;
}

/**
 * @param {*} value
 * @param {string} fieldName
 * @return {Date}
 */
function parseIsoDate(value, fieldName) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a valid ISO date string`);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`${fieldName} must be a valid ISO date string`);
  }

  return parsedDate;
}

/**
 * @param {Date} startsAt
 * @param {Date} endsAt
 */
function assertValidSlotWindow(startsAt, endsAt) {
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    throw new Error("startsAt must be a valid Date");
  }

  if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
    throw new Error("endsAt must be a valid Date");
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error("endsAt must be later than startsAt");
  }
}

/**
 * @param {number} nowMs
 * @param {number} holdMinutes
 * @return {number}
 */
function calculateCheckoutExpiryMs(nowMs, holdMinutes) {
  return nowMs + holdMinutes * 60 * 1000;
}

/**
 * @param {number} startMs
 * @param {number} cancellationWindowHours
 * @return {number}
 */
function calculateRefundableUntilMs(startMs, cancellationWindowHours) {
  return startMs - cancellationWindowHours * 60 * 60 * 1000;
}

/**
 * @param {number} firstStartMs
 * @param {number} firstEndMs
 * @param {number} secondStartMs
 * @param {number} secondEndMs
 * @return {boolean}
 */
function hasIntervalOverlap(
    firstStartMs,
    firstEndMs,
    secondStartMs,
    secondEndMs,
) {
  return firstStartMs < secondEndMs && firstEndMs > secondStartMs;
}

/**
 * @param {*} value
 * @return {number|null}
 */
function timeValueToMs(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsedValue = new Date(value).getTime();
    return Number.isNaN(parsedValue) ? null : parsedValue;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value.toDate === "function") {
    return value.toDate().getTime();
  }

  if (typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return null;
}

/**
 * @param {object} params
 * @param {number} params.cancellationWindowHours
 * @param {number} params.checkoutHoldMinutes
 * @param {number} params.maxBookingWindowDays
 * @return {object}
 */
function buildConsultationPolicy({
  cancellationWindowHours,
  checkoutHoldMinutes,
  maxBookingWindowDays,
}) {
  return {
    cancellationWindowHours,
    checkoutHoldMinutes,
    maxBookingWindowDays,
    paymentCollectionMode: "charge_now_refund_before_cutoff",
  };
}

module.exports = {
  BOOKING_STATUS,
  CONSULTATION_BOOKING_COLLECTION,
  CONSULTATION_SLOT_COLLECTION,
  DEFAULT_BOOKING_WINDOW_DAYS,
  DEFAULT_CANCELLATION_WINDOW_HOURS,
  DEFAULT_CHECKOUT_HOLD_MINUTES,
  DEFAULT_CURRENCY,
  NEXT_ACTION,
  PAYMENT_STATUS,
  SLOT_STATUS,
  assertValidSlotWindow,
  buildConsultationPolicy,
  calculateCheckoutExpiryMs,
  calculateRefundableUntilMs,
  hasIntervalOverlap,
  normalizeCurrency,
  parseIsoDate,
  parsePositiveInteger,
  timeValueToMs,
};
