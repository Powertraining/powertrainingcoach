const SAFE_FIRESTORE_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
export const STRIPE_CHECKOUT_SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9_]+$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g;
const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;
const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;
const PASSWORD_NUMBER_PATTERN = /\d/;
const PASSWORD_SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 4100;
export const PASSWORD_EXPECTATIONS_MESSAGE =
  "Password must be 8-4100 characters and include at least one lowercase letter, one uppercase letter, one number, and one special character.";

export function normalizeBoundedString(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(CONTROL_CHARACTER_PATTERN, "")
    .trim()
    .slice(0, maxLength);
}

export function getPasswordValidationError(value) {
  if (typeof value !== "string") {
    return PASSWORD_EXPECTATIONS_MESSAGE;
  }

  if (
    value.length < PASSWORD_MIN_LENGTH ||
    value.length > PASSWORD_MAX_LENGTH
  ) {
    return PASSWORD_EXPECTATIONS_MESSAGE;
  }

  if (
    !PASSWORD_LOWERCASE_PATTERN.test(value) ||
    !PASSWORD_UPPERCASE_PATTERN.test(value) ||
    !PASSWORD_NUMBER_PATTERN.test(value) ||
    !PASSWORD_SPECIAL_CHARACTER_PATTERN.test(value)
  ) {
    return PASSWORD_EXPECTATIONS_MESSAGE;
  }

  return "";
}

export function isPasswordWithinExpectations(value) {
  return !getPasswordValidationError(value);
}

export function assertSafeFirestoreDocumentId(value, fieldName = "id") {
  const normalizedValue = normalizeBoundedString(value, 128);

  if (!SAFE_FIRESTORE_DOCUMENT_ID_PATTERN.test(normalizedValue)) {
    throw new Error(`${fieldName} is invalid.`);
  }

  return normalizedValue;
}

export function normalizeInteger(value, { fallback = 0, min = 0, max = 1000 } = {}) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.floor(parsedValue), min), max);
}

export function normalizeHttpUrl(value, maxLength = 2048) {
  const normalizedValue = normalizeBoundedString(value, maxLength);

  if (!normalizedValue) {
    return "";
  }

  try {
    const url = new URL(normalizedValue);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

export function normalizeSafeReturnToPath(value) {
  const normalizedValue = normalizeBoundedString(value, 300);

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
  } catch {
    return "";
  }

  return normalizedValue;
}

export function normalizeStripeCheckoutSessionId(value) {
  const normalizedValue = normalizeBoundedString(value, 255);

  return STRIPE_CHECKOUT_SESSION_ID_PATTERN.test(normalizedValue) ?
    normalizedValue :
    "";
}
