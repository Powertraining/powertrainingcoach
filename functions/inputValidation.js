"use strict";

const SAFE_FIRESTORE_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const STRIPE_CHECKOUT_SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9_]+$/;
const STRIPE_CUSTOMER_ID_PATTERN = /^cus_[A-Za-z0-9]+$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g;

/**
 * @param {*} value
 * @return {boolean}
 */
function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

/**
 * @param {*} value
 * @param {object=} options
 * @param {boolean=} options.required
 * @param {number=} options.maxLength
 * @param {string=} options.fieldName
 * @param {RegExp=} options.pattern
 * @return {string}
 */
function normalizeBoundedString(value, options = {}) {
  const {
    required = false,
    maxLength = 500,
    fieldName = "value",
    pattern = null,
  } = options;

  if (typeof value !== "string") {
    if (required) {
      throw new Error(`${fieldName} must be a string`);
    }

    return "";
  }

  const normalizedValue = value
      .replace(CONTROL_CHARACTER_PATTERN, "")
      .trim()
      .slice(0, maxLength);

  if (required && !normalizedValue) {
    throw new Error(`${fieldName} is required`);
  }

  if (normalizedValue && pattern && !pattern.test(normalizedValue)) {
    throw new Error(`${fieldName} is invalid`);
  }

  return normalizedValue;
}

/**
 * @param {*} value
 * @param {string} fieldName
 * @return {string}
 */
function normalizeFirestoreDocumentId(value, fieldName) {
  return normalizeBoundedString(value, {
    required: true,
    maxLength: 128,
    fieldName,
    pattern: SAFE_FIRESTORE_DOCUMENT_ID_PATTERN,
  });
}

/**
 * @param {*} value
 * @param {object=} options
 * @param {string=} options.fieldName
 * @param {number=} options.fallback
 * @param {number=} options.min
 * @param {number=} options.max
 * @return {number}
 */
function normalizeInteger(value, options = {}) {
  const {
    fieldName = "value",
    fallback = null,
    min = Number.MIN_SAFE_INTEGER,
    max = Number.MAX_SAFE_INTEGER,
  } = options;
  const parsedValue =
    typeof value === "number" ? value : Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue)) {
    if (fallback !== null) {
      return fallback;
    }

    throw new Error(`${fieldName} must be an integer`);
  }

  const normalizedValue = Math.floor(parsedValue);

  if (normalizedValue < min || normalizedValue > max) {
    if (fallback !== null) {
      return fallback;
    }

    throw new Error(`${fieldName} is outside the allowed range`);
  }

  return normalizedValue;
}

/**
 * @param {*} value
 * @param {Array<string>|Set<string>} allowedValues
 * @param {string} fieldName
 * @return {string}
 */
function normalizeEnumValue(value, allowedValues, fieldName) {
  const normalizedValue = normalizeBoundedString(value, {
    required: true,
    maxLength: 80,
    fieldName,
  });
  const allowedSet = allowedValues instanceof Set ?
    allowedValues :
    new Set(allowedValues);

  if (!allowedSet.has(normalizedValue)) {
    throw new Error(`${fieldName} is not supported`);
  }

  return normalizedValue;
}

/**
 * @param {*} value
 * @param {string} fieldName
 * @return {string}
 */
function normalizeStripeCheckoutSessionId(value, fieldName = "sessionId") {
  return normalizeBoundedString(value, {
    required: true,
    maxLength: 255,
    fieldName,
    pattern: STRIPE_CHECKOUT_SESSION_ID_PATTERN,
  });
}

/**
 * @param {*} value
 * @param {string} fieldName
 * @return {string}
 */
function normalizeStripeCustomerId(value, fieldName = "customerId") {
  return normalizeBoundedString(value, {
    required: true,
    maxLength: 80,
    fieldName,
    pattern: STRIPE_CUSTOMER_ID_PATTERN,
  });
}

/**
 * @param {*} value
 * @return {string}
 */
function normalizeSafeReturnToPath(value) {
  const normalizedValue = normalizeBoundedString(value, {
    maxLength: 300,
    fieldName: "returnTo",
  });

  if (
    !normalizedValue ||
    !normalizedValue.startsWith("/") ||
    normalizedValue.startsWith("//") ||
    normalizedValue.includes("\\")
  ) {
    return "";
  }

  try {
    const decodedValue = decodeURIComponent(normalizedValue);

    if (
      decodedValue.startsWith("//") ||
      decodedValue.includes("\\") ||
      /^[a-z][a-z0-9+.-]*:/i.test(decodedValue)
    ) {
      return "";
    }
  } catch (error) {
    return "";
  }

  return normalizedValue;
}

/**
 * @param {*} value
 * @param {string} fieldName
 * @return {object}
 */
function requirePlainObject(value, fieldName) {
  if (!isPlainObject(value)) {
    throw new Error(`${fieldName} must be an object`);
  }

  return value;
}

module.exports = {
  SAFE_FIRESTORE_DOCUMENT_ID_PATTERN,
  STRIPE_CHECKOUT_SESSION_ID_PATTERN,
  STRIPE_CUSTOMER_ID_PATTERN,
  isPlainObject,
  normalizeBoundedString,
  normalizeEnumValue,
  normalizeFirestoreDocumentId,
  normalizeInteger,
  normalizeSafeReturnToPath,
  normalizeStripeCheckoutSessionId,
  normalizeStripeCustomerId,
  requirePlainObject,
};
