import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoginView } from "../../src/screens/auth/LoginView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { useGoogleIdTokenProvider } from "../../src/services/auth/googleIdentity";
import { getFriendlyErrorMessage } from "../../src/services/utils/errorMessages.js";

function getParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeReturnToPath(params) {
  const rawReturnTo =
    getParamValue(params?.returnTo) || getParamValue(params?.return_to) || "";

  if (
    typeof rawReturnTo !== "string" ||
    !rawReturnTo.startsWith("/") ||
    rawReturnTo.startsWith("//")
  ) {
    return "";
  }

  return rawReturnTo;
}

const LoginScreen = observer(function LoginScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isGoogleConfigured, requestGoogleIdToken } = useGoogleIdTokenProvider();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState(null);
  const [resetPasswordSuccessMessage, setResetPasswordSuccessMessage] = useState(null);
  const [isResetPasswordSubmitting, setIsResetPasswordSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);
  const genericLoginError =
    "Unable to sign in. Check your details, verification status, or reset your password.";
  const resetPasswordSuccessText =
    "If that account exists, a password reset link is on its way.";

  function identifierChangeACB(value) {
    setIdentifier(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setVerificationMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitLogin(identifier, password);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      setError(genericLoginError);
      model.showError?.(genericLoginError);
      setIsSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    setError(null);
    setVerificationMessage(null);
    setIsSubmitting(true);

    try {
      const idToken = await requestGoogleIdToken({ mode: "signin" });
      await model.submitGoogle(idToken);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const message = getFriendlyErrorMessage(
        e,
        "Google sign-in could not be completed."
      );
      setError(message);
      model.showError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSignupPress() {
    router.push({
      pathname: "/(auth)/signup",
      params: returnTo ? { returnTo } : {},
    });
  }

  function handleForgotPasswordPress() {
    setResetPasswordEmail(identifier.trim());
    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
    setResetPasswordVisible(true);
  }

  function handleResetPasswordDismiss() {
    if (isResetPasswordSubmitting) {
      return;
    }

    setResetPasswordVisible(false);
  }

  function handleResetPasswordEmailChange(value) {
    setResetPasswordEmail(value);
    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
  }

  async function handleResetPasswordSubmit() {
    const normalizedEmail = resetPasswordEmail.trim();

    if (!normalizedEmail) {
      const message = "Enter the e-mail address for your account.";
      setResetPasswordError(message);
      model.showError?.(message);
      return;
    }

    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
    setIsResetPasswordSubmitting(true);

    try {
      await model.submitPasswordReset(normalizedEmail);
      setResetPasswordEmail(normalizedEmail);
      setResetPasswordSuccessMessage(resetPasswordSuccessText);
      model.showSuccess?.(resetPasswordSuccessText);
    } catch (resetError) {
      if (resetError?.message === "auth/user-not-found") {
        setResetPasswordEmail(normalizedEmail);
        setResetPasswordSuccessMessage(resetPasswordSuccessText);
        model.showSuccess?.(resetPasswordSuccessText);
        return;
      }

      const message = getFriendlyErrorMessage(
        resetError,
        "We could not send the reset link right now. Please try again."
      );
      setResetPasswordError(message);
      model.showError?.(message);
    } finally {
      setIsResetPasswordSubmitting(false);
    }
  }

  useEffect(() => {
    if (model.ready && model.user) {
      router.replace(returnTo || "/(tabs)");
    }
  }, [model.ready, model.user, returnTo, router]);

  return (
    <LoginView
      identifier={identifier}
      password={password}
      isSubmitting={isSubmitting}
      error={error}
      verificationMessage={verificationMessage}
      showGoogle={isGoogleConfigured}
      onIdentifierChange={identifierChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onSubmitGoogle={submitGoogleACB}
      onForgotPasswordPress={handleForgotPasswordPress}
      onSignupPress={handleSignupPress}
      resetPasswordVisible={resetPasswordVisible}
      resetPasswordEmail={resetPasswordEmail}
      resetPasswordError={resetPasswordError}
      resetPasswordSuccessMessage={resetPasswordSuccessMessage}
      isResetPasswordSubmitting={isResetPasswordSubmitting}
      onResetPasswordDismiss={handleResetPasswordDismiss}
      onResetPasswordEmailChange={handleResetPasswordEmailChange}
      onResetPasswordSubmit={handleResetPasswordSubmit}
    />
  );
});

export default LoginScreen;
