import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SignUpView } from "../../src/screens/auth/SignUpView.jsx";
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

const SignUpScreen = observer(function SignUpScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const { requestGoogleIdToken } = useGoogleIdTokenProvider();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);
  const genericSignupMessage =
    "If this e-mail can be used for a new account, a verification e-mail will be sent. Check your inbox before logging in.";

  function usernameChangeACB(value) {
    setUsername(value);
  }

  function emailChangeACB(value) {
    setEmail(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await model.submitSignup(username, email, password);

      if (result?.requiresEmailVerification) {
        setPassword("");
        setMessage(genericSignupMessage);
        setIsSubmitting(false);
        return;
      }

      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const message =
        e.message === "auth/signup-unavailable"
          ? "Could not process sign-up right now. Please try again."
          : e.message || "Could not process sign-up right now. Please try again.";
      setError(message);
      setIsSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const idToken = await requestGoogleIdToken({ mode: "signup" });
      await model.submitGoogle(idToken);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      setError(e.message || "Google sign-in could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLoginPress() {
    router.push({
      pathname: "/(auth)/login",
      params: returnTo ? { returnTo } : {},
    });
  }

  useEffect(() => {
    if (model.ready && model.user) {
      router.replace(returnTo || "/(tabs)");
    }
  }, [model.ready, model.user, returnTo, router]);

  return (
    <SignUpView
      username={username}
      email={email}
      password={password}
      isSubmitting={isSubmitting}
      error={error}
      message={message}
      onUsernameChange={usernameChangeACB}
      onEmailChange={emailChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onSubmitGoogle={submitGoogleACB}
      onLoginPress={handleLoginPress}
    />
  );
});

export default SignUpScreen;
