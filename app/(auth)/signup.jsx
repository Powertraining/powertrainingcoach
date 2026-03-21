import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SignUpView } from "../../src/screens/screens/SignUpView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);

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
    setIsSubmitting(true);

    try {
      await model.submitSignup(username, email, password);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const message = e.message || "Impossible to create an account.";
      setError(message);
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
      onUsernameChange={usernameChangeACB}
      onEmailChange={emailChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onLoginPress={handleLoginPress}
    />
  );
});

export default SignUpScreen;
