import { NativeModules } from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "../config/apiConfig.js";

const googleModule = NativeModules.PowerTrainingGoogleAuth;
const MISSING_GOOGLE_CONFIG_ERROR =
  "Google sign-in is not configured for this Android build. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.";
const GOOGLE_NATIVE_MODULE_ERROR =
  "Google sign-in is unavailable in this Android build. Rebuild the app after installing the native Google sign-in dependencies.";

export function useGoogleIdTokenProvider() {
  async function requestGoogleIdToken({ mode = "signin" } = {}) {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error(MISSING_GOOGLE_CONFIG_ERROR);
    }

    if (!googleModule?.signIn) {
      throw new Error(GOOGLE_NATIVE_MODULE_ERROR);
    }

    const result = await googleModule.signIn({
      serverClientId: GOOGLE_WEB_CLIENT_ID,
      mode,
    });
    const idToken = result?.idToken;

    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token.");
    }

    return idToken;
  }

  return {
    isGoogleConfigured: Boolean(GOOGLE_WEB_CLIENT_ID),
    requestGoogleIdToken,
  };
}

export async function clearGoogleCredentialState() {
  if (!googleModule?.clearCredentialState) {
    return;
  }

  await googleModule.clearCredentialState();
}
