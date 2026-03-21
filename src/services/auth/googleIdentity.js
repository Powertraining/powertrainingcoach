export function useGoogleIdTokenProvider() {
  async function requestGoogleIdToken() {
    throw new Error("Google sign-in is unsupported on this platform.");
  }

  return {
    isGoogleConfigured: false,
    requestGoogleIdToken,
  };
}

export async function clearGoogleCredentialState() {
  return undefined;
}
