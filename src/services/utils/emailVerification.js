const TRUSTED_EMAIL_PROVIDER_IDS = new Set([
  "google.com",
  "apple.com",
]);

export function getUserProviderIds(user) {
  if (!Array.isArray(user?.providerData)) {
    return [];
  }

  return user.providerData
    .map((provider) => provider?.providerId)
    .filter((providerId) => typeof providerId === "string" && providerId);
}

export function requiresEmailVerification(user) {
  if (!user?.email) {
    return false;
  }

  const providerIds = getUserProviderIds(user);
  const hasPasswordProvider =
    providerIds.length === 0 || providerIds.includes("password");
  const hasTrustedEmailProvider = providerIds.some((providerId) =>
    TRUSTED_EMAIL_PROVIDER_IDS.has(providerId)
  );

  return (
    hasPasswordProvider &&
    !hasTrustedEmailProvider &&
    user.emailVerified !== true
  );
}
