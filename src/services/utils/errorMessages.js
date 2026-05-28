const FIREBASE_ERROR_MESSAGES = {
  "auth/email-already-in-use": "E-mail already in use.",
  "auth/invalid-credential": "Wrong e-mail or password.",
  "auth/invalid-email": "Invalid e-mail address.",
  "auth/invalid-login-credentials": "Wrong e-mail or password.",
  "auth/missing-password": "Enter your password.",
  "auth/missing-email": "Enter your e-mail address.",
  "auth/network-request-failed": "Connection failed.",
  "auth/operation-not-allowed": "Sign-in method unavailable.",
  "auth/popup-closed-by-user": "Google sign-in canceled.",
  "auth/requires-recent-login": "Please log in again.",
  "auth/too-many-requests": "Too many attempts. Try later.",
  "auth/user-disabled": "Account disabled.",
  "auth/user-not-found": "Account not found.",
  "auth/wrong-password": "Wrong password.",
  "permission-denied": "Permission denied.",
  "unavailable": "Service unavailable.",
  "deadline-exceeded": "Request timed out.",
  "not-found": "Not found.",
  "already-exists": "That item already exists.",
  "resource-exhausted": "Service busy. Try soon.",
  "failed-precondition": "Action unavailable.",
  "storage/unauthorized": "Upload not allowed.",
  "storage/unauthenticated": "Log in to upload.",
  "storage/canceled": "Upload canceled.",
  "storage/retry-limit-exceeded": "Upload timed out.",
  "storage/quota-exceeded": "Storage full. Try later.",
};

const TECHNICAL_FALLBACKS = [
  "FirebaseError",
  "Network request failed",
  "Missing or insufficient permissions",
  "Request failed",
  "TypeError",
  "SyntaxError",
  "Error:",
  "code:",
  "stack",
  "http",
  "{",
  "}",
  "internal",
  "unknown",
];

const ERROR_CODE_PATTERN = /\b(?:auth|storage)\/[a-z0-9-]+|\b(?:permission-denied|unavailable|deadline-exceeded|not-found|already-exists|resource-exhausted|failed-precondition)\b/i;

function getRawErrorMessage(error) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || error.code || "";
}

function getErrorCodeFromMessage(message) {
  const match = String(message || "").match(ERROR_CODE_PATTERN);

  return match ? match[0].toLowerCase() : "";
}

export function getFriendlyErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const code = typeof error === "object" && error ? error.code : "";

  if (code && FIREBASE_ERROR_MESSAGES[code]) {
    return FIREBASE_ERROR_MESSAGES[code];
  }

  const rawMessage = String(getRawErrorMessage(error)).trim();

  if (!rawMessage) {
    return fallback;
  }

  if (FIREBASE_ERROR_MESSAGES[rawMessage]) {
    return FIREBASE_ERROR_MESSAGES[rawMessage];
  }

  const embeddedCode = getErrorCodeFromMessage(rawMessage);

  if (embeddedCode && FIREBASE_ERROR_MESSAGES[embeddedCode]) {
    return FIREBASE_ERROR_MESSAGES[embeddedCode];
  }

  if (TECHNICAL_FALLBACKS.some((token) => rawMessage.toLowerCase().includes(token.toLowerCase()))) {
    return fallback;
  }

  return rawMessage;
}
