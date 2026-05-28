const FIREBASE_ERROR_MESSAGES = {
  "auth/email-already-in-use": "That e-mail is already in use. Try logging in instead.",
  "auth/invalid-email": "Enter a valid e-mail address.",
  "auth/missing-email": "Enter your e-mail address.",
  "auth/network-request-failed": "Network connection failed. Check your connection and try again.",
  "auth/requires-recent-login": "Please log in again before changing sensitive account details.",
  "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account was found for those login details.",
  "auth/wrong-password": "The password does not match this account.",
  "permission-denied": "You do not have permission to do that.",
  "storage/unauthorized": "You do not have permission to upload that file.",
  "storage/unauthenticated": "Log in before uploading files.",
};

const TECHNICAL_FALLBACKS = [
  "FirebaseError",
  "Network request failed",
  "internal",
  "unknown",
];

function getRawErrorMessage(error) {
  if (!error) {
    return "";
  }

  if (typeof error === "string") {
    return error;
  }

  return error.message || error.code || "";
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

  if (TECHNICAL_FALLBACKS.some((token) => rawMessage.toLowerCase().includes(token.toLowerCase()))) {
    return fallback;
  }

  return rawMessage;
}
