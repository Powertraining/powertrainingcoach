const SAFE_FIRESTORE_DOCUMENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g;

export function normalizeBoundedString(value, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(CONTROL_CHARACTER_PATTERN, "")
    .trim()
    .slice(0, maxLength);
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
