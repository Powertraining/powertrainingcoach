import { useCallback, useEffect, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { GOOGLE_IOS_CLIENT_ID } from "../config/apiConfig.js";

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = GOOGLE_IOS_CLIENT_ID || "missing-google-ios-client-id";
const GOOGLE_NATIVE_REDIRECT_URI = makeRedirectUri({
  native: "com.powertraining.coach:/oauthredirect",
});
const MISSING_GOOGLE_CONFIG_ERROR =
  "Google sign-in is not configured for this iOS build. Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.";
const EXPO_GO_GOOGLE_ERROR =
  "Google sign-in cannot be tested in Expo Go. Use a native development build with `npm run ios`, or an EAS build.";

export function useGoogleIdTokenProvider() {
  const pendingRequestRef = useRef(null);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    redirectUri: GOOGLE_NATIVE_REDIRECT_URI,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response || !pendingRequestRef.current) {
      return;
    }

    const pendingRequest = pendingRequestRef.current;
    pendingRequestRef.current = null;

    if (response.type !== "success") {
      if (response.type === "cancel" || response.type === "dismiss") {
        pendingRequest.reject(new Error("Google sign-in was canceled."));
      } else {
        pendingRequest.reject(
          new Error("Google sign-in was interrupted. Please try again.")
        );
      }
      return;
    }

    const idToken = response.params?.id_token;

    if (!idToken) {
      pendingRequest.reject(
        new Error("Google sign-in did not return an ID token.")
      );
      return;
    }

    pendingRequest.resolve(idToken);
  }, [response]);

  useEffect(
    function cleanupPendingRequestACB() {
      return () => {
        if (pendingRequestRef.current) {
          pendingRequestRef.current.reject(
            new Error("Google sign-in did not finish.")
          );
          pendingRequestRef.current = null;
        }
      };
    },
    []
  );

  const requestGoogleIdToken = useCallback(
    async function requestGoogleIdTokenACB() {
      if (!GOOGLE_IOS_CLIENT_ID) {
        throw new Error(MISSING_GOOGLE_CONFIG_ERROR);
      }

      if (
        GOOGLE_NATIVE_REDIRECT_URI.startsWith("exp://") ||
        GOOGLE_NATIVE_REDIRECT_URI.startsWith("exps://")
      ) {
        throw new Error(EXPO_GO_GOOGLE_ERROR);
      }

      if (!request) {
        throw new Error("Google sign-in is still loading. Please try again.");
      }

      if (pendingRequestRef.current) {
        throw new Error("Google sign-in is already in progress.");
      }

      const pendingPromise = new Promise((resolve, reject) => {
        pendingRequestRef.current = { resolve, reject };
      });

      try {
        await promptAsync();
      } catch (error) {
        if (pendingRequestRef.current) {
          pendingRequestRef.current.reject(
            error instanceof Error ?
              error :
              new Error("Google sign-in could not be started.")
          );
          pendingRequestRef.current = null;
        }
      }

      return pendingPromise;
    },
    [promptAsync, request]
  );

  return {
    isGoogleConfigured: Boolean(GOOGLE_IOS_CLIENT_ID),
    requestGoogleIdToken,
  };
}

export async function clearGoogleCredentialState() {
  return undefined;
}
