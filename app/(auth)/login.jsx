import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LoginView } from "../../src/screens/auth/LoginView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { useGoogleIdTokenProvider } from "../../src/services/auth/googleIdentity";

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
  const { requestGoogleIdToken } = useGoogleIdTokenProvider();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);

  function identifierChangeACB(value) {
    setIdentifier(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setVerificationMessage(null);
    setCanResendVerification(false);
    setIsSubmitting(true);

    try {
      await model.submitLogin(identifier, password);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const isUnverifiedEmail = e.message === "auth/email-not-verified";
      const message = isUnverifiedEmail
        ? "Please verify your e-mail address before logging in."
        : "E-Mail or password incorrect";
      setError(message);
      setCanResendVerification(isUnverifiedEmail);
      setIsSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    setError(null);
    setVerificationMessage(null);
    setCanResendVerification(false);
    setIsSubmitting(true);

    try {
      const idToken = await requestGoogleIdToken({ mode: "signin" });
      await model.submitGoogle(idToken);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      setError(e.message || "Google sign-in could not be completed.");
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
    const normalizedIdentifier = identifier.trim();
    const nextParams = {
      source: "login",
      ...(normalizedIdentifier ? { email: normalizedIdentifier } : {}),
      ...(returnTo ? { returnTo } : {}),
    };

    router.push({
      pathname: "/(auth)/reset-password",
      params: nextParams,
    });
  }

  async function handleResendVerificationPress() {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password) {
      setError("Enter your e-mail and password first.");
      return;
    }

    setError(null);
    setVerificationMessage(null);
    setIsResendingVerification(true);

    try {
      const result = await model.submitEmailVerificationResend(
        normalizedIdentifier,
        password
      );
      setVerificationMessage(
        result?.alreadyVerified
          ? "Your e-mail is already verified. You can log in now."
          : "Verification e-mail sent. Check your inbox before logging in."
      );
      setCanResendVerification(!result?.alreadyVerified);
    } catch (e) {
      console.error(e);
      setError("Could not resend the verification e-mail. Check your credentials and try again.");
    } finally {
      setIsResendingVerification(false);
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
      canResendVerification={canResendVerification}
      isResendingVerification={isResendingVerification}
      onIdentifierChange={identifierChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onSubmitGoogle={submitGoogleACB}
      onForgotPasswordPress={handleForgotPasswordPress}
      onResendVerificationPress={handleResendVerificationPress}
      onSignupPress={handleSignupPress}
    />
  );
});

export default LoginScreen;
